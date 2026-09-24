import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, In } from 'typeorm';
import { MarcajeBiometrico } from '../../Entitys/MarcajeBiometrico/MarcajeBiometrico.entity';
import { AttendanceRecord } from '../Interfaces/biometrico-device.interface';
import {normalizarCedula} from '../../utils/formato_horas.util'
import { Empleado } from 'src/Entitys/Empleados/Empleado.entity';

@Injectable()
export class MarcajesStorageService {
  private readonly logger = new Logger(MarcajesStorageService.name);

  constructor(
    @InjectRepository(MarcajeBiometrico)
    private readonly marcajeRepo: Repository<MarcajeBiometrico>,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
  ) {}

  async getSavedEvents(): Promise<AttendanceRecord[]> {
    const marcajes = await this.marcajeRepo.find({
      order: { fechaHora: 'ASC' },
    });
    return this.formatearRegistros(marcajes);
  }

  async obtenerMarcajesDelDia(fecha: Date): Promise<AttendanceRecord[]> {
    const inicio = new Date(
      fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0,
    );
    const fin = new Date(
      fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999,
    );

    const marcajes = await this.marcajeRepo.find({
      where: { fechaHora: Between(inicio, fin) },
      order: { fechaHora: 'ASC' },
    });
    return this.formatearRegistros(marcajes);
  }

  async obtenerMarcajesEnRango(desde: Date, hasta: Date): Promise<AttendanceRecord[]> {
    const marcajes = await this.marcajeRepo.find({
      where: { fechaHora: Between(desde, hasta) },
      order: { fechaHora: 'ASC' },
    });
    return this.formatearRegistros(marcajes);
  }

  // =========================================================
  // ✅ GUARDAR MARCAJES (solo de empleados ACTIVOS)
  // =========================================================
  async saveNewRecords(records: AttendanceRecord[]): Promise<number> {
    if (records.length === 0) return 0;

    // 1. Cédulas únicas normalizadas
    const cedulasUnicas = [
      ...new Set(records.map((r) => normalizarCedula(r.employeeId)).filter(Boolean)),
    ];

    if (cedulasUnicas.length === 0) return 0;

    // 2. Solo empleados ACTIVOS
    const empleadosActivos = await this.empleadoRepo.find({
      where: {
        cedula: In(cedulasUnicas),
        estado: 'ACTIVO',
      },
    });

    const cedulasActivas = new Set(
      empleadosActivos.map((e) => normalizarCedula(e.cedula)),
    );

    // 3. Procesar
    const nuevos: MarcajeBiometrico[] = [];
    const vistas = new Set<string>();
    let ignorados = 0;

    for (const r of records) {
      const cedula = normalizarCedula(r.employeeId);
      if (!cedula) continue;

      // ✅ Filtrar inactivos o que no están en BD
      if (!cedulasActivas.has(cedula)) {
        ignorados++;
        continue;
      }

      const fecha = new Date(r.timestamp);
      const key = `${cedula}_${fecha.toISOString()}_BIOMETRICO`;
      if (vistas.has(key)) continue;
      vistas.add(key);

      const nuevo = this.marcajeRepo.create({
        cedula,
        fechaHora: fecha,
        dispositivoId: r.deviceName || 'DS-K1A8503MF',
        tipoMarcaje: this.parseTipoMarcaje(r.rawType),
        nombreEmpleadoCache: r.employeeName || null,
        origen: 'BIOMETRICO',
      });
      nuevos.push(nuevo);
    }

    if (ignorados > 0) {
      this.logger.warn(
        `⚠️ ${ignorados} marcajes ignorados (empleado inactivo o no registrado en BD)`,
      );
    }

    if (nuevos.length === 0) return 0;

    const result = await this.marcajeRepo
      .createQueryBuilder()
      .insert()
      .into(MarcajeBiometrico)
      .values(nuevos)
      .orIgnore()
      .execute();

    const insertados = result.identifiers?.length ?? 0;
    if (insertados > 0) {
      this.logger.log(`📊 ${insertados} marcajes nuevos guardados en BD`);
    }
    return insertados;
  }

  async cleanDuplicates() {
    const marcajes = await this.marcajeRepo.find({ order: { fechaHora: 'ASC' } });

    const unique = new Map<string, MarcajeBiometrico>();
    let removed = 0;
    const aEliminar: string[] = [];

    for (const m of marcajes) {
      const key = `${m.cedula}_${m.fechaHora.toISOString()}_${m.origen}`;
      if (!unique.has(key)) unique.set(key, m);
      else {
        aEliminar.push(m.id);
        removed++;
      }
    }

    if (aEliminar.length > 0) {
      await this.marcajeRepo.delete(aEliminar);
      this.logger.log(`🧹 ${removed} duplicados eliminados`);
    }

    return {
      removed,
      message: `Se eliminaron ${removed} duplicados. Total: ${unique.size}`,
    };
  }

  async exportDetailedJson() {
    const marcajes = await this.marcajeRepo.find({ order: { fechaHora: 'DESC' } });

    const detailed = marcajes.map((m) => ({
      empleadoId: m.cedula,
      nombreCompleto: m.nombreEmpleadoCache || 'DESCONOCIDO',
      metodoMarcaje: this.parseTipoMarcajeDisplay(m.tipoMarcaje),
      horaLocal: m.fechaHora.toLocaleString('es-VE', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      }),
      dispositivo: m.dispositivoId,
    }));

    return {
      success: true,
      message: `Total: ${detailed.length} marcajes en BD`,
      total: detailed.length,
      data: detailed,
    };
  }

  async checkExcelStatus() {
    const total = await this.marcajeRepo.count();
    return {
      success: true,
      message: `Excel descontinuado — Ahora se usa BD. Total: ${total} marcajes`,
      path: 'BD: marcajes_biometrico',
      totalFilas: total,
      descontinuado: true,
    };
  }

  async refreshEmployeeNames(
    nameResolver: (employeeId: string) => Promise<string>,
  ): Promise<{ actualizados: number; total: number; errores: string[] }> {
    const marcajes = await this.marcajeRepo.find();
    if (marcajes.length === 0) {
      return { actualizados: 0, total: 0, errores: [] };
    }

    const uniqueIds = [...new Set(marcajes.map((m) => m.cedula))];
    this.logger.log(`🔄 Refrescando nombres de ${uniqueIds.length} empleados...`);

    const nameMap = new Map<string, string>();
    const errores: string[] = [];

    for (const id of uniqueIds) {
      try {
        const name = await nameResolver(id);
        if (name && name !== 'DESCONOCIDO') nameMap.set(id, name);
      } catch (error: any) {
        errores.push(`${id}: ${error.message}`);
      }
    }

    let actualizados = 0;
    for (const marcaje of marcajes) {
      const nuevoNombre = nameMap.get(marcaje.cedula);
      if (nuevoNombre && marcaje.nombreEmpleadoCache !== nuevoNombre) {
        marcaje.nombreEmpleadoCache = nuevoNombre;
        await this.marcajeRepo.save(marcaje);
        actualizados++;
      }
    }

    this.logger.log(`✅ ${actualizados} nombres actualizados de ${marcajes.length}`);

    return { actualizados, total: marcajes.length, errores };
  }

  // =========================================================
  // HELPERS
  // =========================================================
  private formatearRegistros(marcajes: MarcajeBiometrico[]): AttendanceRecord[] {
    return marcajes.map((m) => ({
      employeeId: m.cedula,
      employeeName: m.nombreEmpleadoCache || undefined,
      timestamp: m.fechaHora,
      horaLocal: m.fechaHora.toLocaleString('es-VE', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      }),
      deviceName: m.dispositivoId || 'DS-K1A8503MF',
      rawType: m.tipoMarcaje,
    }));
  }

  private parseTipoMarcaje(rawType?: string): string {
    const mapa: Record<string, string> = {
      '1': 'TARJETA', '2': 'PIN', '38': 'HUELLA',
      '75': 'MANUAL', '155': 'HUELLA', '160': 'HUELLA',
    };
    if (!rawType) return 'HUELLA';
    return mapa[rawType] || 'HUELLA';
  }

  private parseTipoMarcajeDisplay(rawType: string): string {
    const mapa: Record<string, string> = {
      TARJETA: 'Tarjeta RFID', PIN: 'Contraseña/PIN',
      HUELLA: 'Huella Dactilar', MANUAL: 'Apertura por Software',
      FACIAL: 'Reconocimiento Facial',
    };
    return mapa[rawType] || 'Huella Dactilar';
  }
}