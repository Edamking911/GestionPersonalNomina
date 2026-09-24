import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BiometricoService } from '../../biometrico/biometrico.service';
import { Empleado } from '../../Entitys/Empleados/Empleado.entity';
import { normalizarCedula } from '../Utils/tiempo.util';

@Injectable()
export class EmpleadosSyncService {
  private readonly logger = new Logger(EmpleadosSyncService.name);

  /** Cédulas que se ignoran siempre (usuarios admin del equipo) */
  private readonly CEDULAS_IGNORADAS = new Set(['12345', '1', '0']);

  constructor(
    private readonly biometricoService: BiometricoService,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
  ) {}

  // =========================================================
  // SINCRONIZAR EMPLEADOS DEL BIOMÉTRICO A LA BD
  // =========================================================
  async Sincronizar_Empleados() {
    this.logger.log('🔄 Iniciando sincronización de empleados...');

    // 1. Traer usuarios del biométrico
    const usuarios = await this.biometricoService.listUsers(
      '172.18.0.89',
      'admin',
      'Dtd2026*',
      true, // incluir inactivos
    );

    if (!usuarios?.success || !Array.isArray(usuarios.usuarios)) {
      return {
        success: false,
        message: 'No se pudieron obtener usuarios del biométrico',
      };
    }

    // 2. Traer empleados existentes en BD
    const empleadosExistentes = await this.empleadoRepo.find();
    const mapaPorCedula = new Map(
      empleadosExistentes.map((e) => [normalizarCedula(e.cedula), e]),
    );

    // 3. Contadores
    const resultados = {
      totalBiometrico: usuarios.usuarios.length,
      nuevos: 0,
      actualizados: 0,
      sinCambios: 0,
      ignorados: 0,
      errores: [] as string[],
      detalles: [] as any[],
    };

    // 4. Recorrer cada usuario del biométrico
    for (const u of usuarios.usuarios) {
      const cedulaOriginal = String(u.employeeNo || '').trim();
      const cedulaNorm = normalizarCedula(cedulaOriginal);

      // ============ VALIDACIÓN 1: Cédula numérica válida ============
      if (!this.esCedulaValida(cedulaNorm)) {
        resultados.ignorados++;
        resultados.detalles.push({
          cedula: cedulaOriginal,
          nombre: u.name,
          accion: 'IGNORADO',
          motivo: 'Cédula inválida (debe tener 6-10 dígitos)',
        });
        continue;
      }

      // ============ VALIDACIÓN 2: Ignorar admin ============
      if (this.CEDULAS_IGNORADAS.has(cedulaNorm)) {
        resultados.ignorados++;
        resultados.detalles.push({
          cedula: cedulaOriginal,
          nombre: u.name,
          accion: 'IGNORADO',
          motivo: 'Usuario admin del biométrico',
        });
        continue;
      }

      // ============ VALIDACIÓN 3: Nombre válido ============
      const nombreLimpio = this.limpiarNombre(u.name);
      if (!nombreLimpio) {
        resultados.ignorados++;
        resultados.detalles.push({
          cedula: cedulaOriginal,
          nombre: u.name,
          accion: 'IGNORADO',
          motivo: 'Nombre vacío o inválido',
        });
        continue;
      }

      // ============ PROCESAR ============
      const { nombre, apellido } = this.separarNombre(nombreLimpio);

      try {
        const existente = mapaPorCedula.get(cedulaNorm);

        if (existente) {
          // ============ ACTUALIZAR SI HAY CAMBIOS ============
          const nombreCambio = existente.nombre !== nombre;
          const apellidoCambio = existente.apellido !== apellido;

          if (nombreCambio || apellidoCambio) {
            existente.nombre = nombre;
            existente.apellido = apellido;
            await this.empleadoRepo.save(existente);

            resultados.actualizados++;
            resultados.detalles.push({
              cedula: cedulaNorm,
              nombre,
              apellido,
              accion: 'ACTUALIZADO',
              cambios: {
                antes: `${existente.nombre} ${existente.apellido}`,
                despues: `${nombre} ${apellido}`,
              },
            });
          } else {
            resultados.sinCambios++;
          }
        } else {
          // ============ CREAR NUEVO ============
          const nuevo = this.empleadoRepo.create({
            cedula: cedulaNorm,
            nombre,
            apellido,
            estado: 'ACTIVO',
          });
          await this.empleadoRepo.save(nuevo);
          mapaPorCedula.set(cedulaNorm, nuevo);

          resultados.nuevos++;
          resultados.detalles.push({
            cedula: cedulaNorm,
            nombre,
            apellido,
            accion: 'NUEVO',
          });
        }
      } catch (error: any) {
        resultados.errores.push(`${cedulaNorm}: ${error.message}`);
        this.logger.error(`Error con ${cedulaNorm}: ${error.message}`);
      }
    }

    this.logger.log(
      `✅ Sync: ${resultados.nuevos} nuevos, ${resultados.actualizados} actualizados, ` +
        `${resultados.sinCambios} sin cambios, ${resultados.ignorados} ignorados`,
    );

    return {
      success: true,
      message: `Sincronización completa: ${resultados.nuevos} nuevos, ${resultados.actualizados} actualizados`,
      ...resultados,
    };
  }

  // =========================================================
  // VALIDACIONES
  // =========================================================

  /**
   * Cédula válida: solo dígitos, entre 6 y 10 caracteres.
   * Ejemplos válidos: 29789773, 30870941, 12345678
   */
  private esCedulaValida(cedula: string): boolean {
    if (!cedula) return false;
    if (!/^\d+$/.test(cedula)) return false;
    if (cedula.length < 6 || cedula.length > 10) return false;
    // Ignorar cédulas obviamente de prueba
    if (/^0+$/.test(cedula)) return false;
    return true;
  }

  /**
   * Limpia un nombre:
   * - Trim
   * - Colapsa espacios múltiples
   * - Quita caracteres raros
   * - Limita a 32 chars (límite Hikvision)
   */
  private limpiarNombre(nombre: string | undefined): string {
    if (!nombre) return '';
    return String(nombre)
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\p{L}\p{N}\s.\-']/gu, '')
      .slice(0, 100)
      .trim();
  }

  /**
   * Separa un nombre completo en nombre y apellido.
   * Heurística:
   *  - 1 palabra  → nombre: X, apellido: ''
   *  - 2 palabras → nombre: X, apellido: Y
   *  - 3 palabras → nombre: X Y, apellido: Z
   *  - 4 palabras → nombre: X Y, apellido: Z W
   *  - 5+         → nombre: mitad, apellido: mitad
   */
  private separarNombre(nombreCompleto: string): {
    nombre: string;
    apellido: string;
  } {
    const partes = nombreCompleto.split(' ').filter(Boolean);

    if (partes.length === 0) return { nombre: '', apellido: '' };
    if (partes.length === 1) return { nombre: partes[0], apellido: '' };
    if (partes.length === 2) {
      return { nombre: partes[0], apellido: partes[1] };
    }
    if (partes.length === 3) {
      return { nombre: partes.slice(0, 2).join(' '), apellido: partes[2] };
    }
    if (partes.length === 4) {
      return {
        nombre: partes.slice(0, 2).join(' '),
        apellido: partes.slice(2).join(' '),
      };
    }

    // 5+ palabras: dividir por la mitad
    const mitad = Math.ceil(partes.length / 2);
    return {
      nombre: partes.slice(0, mitad).join(' '),
      apellido: partes.slice(mitad).join(' '),
    };
  }
}