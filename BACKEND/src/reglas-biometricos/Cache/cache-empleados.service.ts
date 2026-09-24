import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BiometricoService } from '../../biometrico/biometrico.service';
import { Empleado } from '../../Entitys/Empleados/Empleado.entity';
import { normalizarCedula } from '../Utils/tiempo.util';

@Injectable()
export class CacheEmpleadosService {
  private readonly logger = new Logger(CacheEmpleadosService.name);

  private horaBiometricoCache: Date | null = null;
  private horaBiometricoCacheTime = 0;

  private empleadosActivosCache: Set<string> | null = null;
  private empleadosActivosCacheTime = 0;

  private mapaNombresCache: Map<string, string> | null = null;
  private mapaNombresCacheTime = 0;

  private readonly CACHE_TTL = 30000;

  constructor(
    private readonly biometricoService: BiometricoService,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
  ) {}

  async obtenerHoraCache(): Promise<Date> {
    const ahora = Date.now();
    if (this.horaBiometricoCache && ahora - this.horaBiometricoCacheTime < this.CACHE_TTL) {
      return this.horaBiometricoCache;
    }
    try {
      this.horaBiometricoCache = await this.biometricoService.obtenerHoraBiometrico();
      this.horaBiometricoCacheTime = ahora;
      return this.horaBiometricoCache;
    } catch {
      return new Date();
    }
  }

  async obtenerSetEmpleadosActivos(forceRefresh = false): Promise<Set<string>> {
    const ahora = Date.now();
    if (
      !forceRefresh &&
      this.empleadosActivosCache &&
      ahora - this.empleadosActivosCacheTime < this.CACHE_TTL
    ) {
      return this.empleadosActivosCache;
    }

    const set = new Set<string>();
    try {
      // ✅ Ahora consulta la BD en vez del biométrico
      const empleados = await this.empleadoRepo.find({
        where: { estado: 'ACTIVO' },
      });
      empleados.forEach((e) => set.add(normalizarCedula(e.cedula)));
      this.logger.debug(`📋 ${empleados.length} empleados activos desde BD`);
    } catch (error) {
      this.logger.warn('No se pudieron cargar empleados activos', error);
    }

    this.empleadosActivosCache = set;
    this.empleadosActivosCacheTime = ahora;
    return set;
  }

  async validarEmpleadoActivo(employeeId: string): Promise<{
    activo: boolean;
    nombre?: string;
    mensaje?: string;
    noExiste?: boolean;
  }> {
    try {
      const cedulaNorm = normalizarCedula(employeeId);
      const empleados = await this.empleadoRepo.find();
      const empleado = empleados.find(
        (e) => normalizarCedula(e.cedula) === cedulaNorm,
      );

      if (!empleado) {
        return {
          activo: false,
          noExiste: true,
          mensaje: `El empleado con cédula ${employeeId} no existe en la BD.`,
        };
      }

      if (empleado.estado !== 'ACTIVO') {
        return {
          activo: false,
          nombre: `${empleado.nombre} ${empleado.apellido}`.trim(),
          mensaje: `El empleado ${empleado.nombre} ${empleado.apellido} está ${empleado.estado}.`,
        };
      }

      return {
        activo: true,
        nombre: `${empleado.nombre} ${empleado.apellido}`.trim(),
      };
    } catch (error) {
      this.logger.warn('No se pudo validar empleado', error);
    }
    return { activo: true };
  }

  async obtenerMapaNombres(forceRefresh = false): Promise<Map<string, string>> {
    const ahora = Date.now();
    if (
      !forceRefresh &&
      this.mapaNombresCache &&
      ahora - this.mapaNombresCacheTime < this.CACHE_TTL
    ) {
      return this.mapaNombresCache;
    }

    const mapa = new Map<string, string>();

    // ✅ Ahora consulta la BD
    try {
      const empleados = await this.empleadoRepo.find();
      for (const emp of empleados) {
        const nombreCompleto = `${emp.nombre} ${emp.apellido}`.trim();
        const cedulaNorm = normalizarCedula(emp.cedula);
        mapa.set(cedulaNorm, nombreCompleto);
        mapa.set(emp.cedula, nombreCompleto);
      }
      this.logger.debug(`📋 ${empleados.length} nombres desde BD`);
    } catch (error) {
      this.logger.warn('Error cargando empleados desde BD', error);
    }

    this.mapaNombresCache = mapa;
    this.mapaNombresCacheTime = ahora;
    return mapa;
  }

  resolverNombre(
    employeeId: string,
    marcajes: any[],
    mapaNombres: Map<string, string>,
  ): string {
    const cedulaNorm = normalizarCedula(employeeId);

    if (mapaNombres.has(cedulaNorm)) {
      return mapaNombres.get(cedulaNorm)!;
    }
    if (mapaNombres.has(employeeId)) {
      return mapaNombres.get(employeeId)!;
    }

    const marcajeConNombre = marcajes.find(
      (m) => normalizarCedula(m.employeeId) === cedulaNorm && m.employeeName,
    );
    if (marcajeConNombre?.employeeName) {
      return marcajeConNombre.employeeName;
    }
    return 'DESCONOCIDO';
  }

  async obtenerNombreEmpleado(
    employeeId: string,
    marcajes: any[] = [],
  ): Promise<string> {
    const cedulaNorm = normalizarCedula(employeeId);

    try {
      const empleados = await this.empleadoRepo.find();
      const empleado = empleados.find(
        (e) => normalizarCedula(e.cedula) === cedulaNorm,
      );
      if (empleado) {
        return `${empleado.nombre} ${empleado.apellido}`.trim();
      }
    } catch {}

    const marcajeConNombre = marcajes.find(
      (m) => normalizarCedula(m.employeeId) === cedulaNorm && m.employeeName,
    );
    if (marcajeConNombre?.employeeName) {
      return marcajeConNombre.employeeName;
    }

    return 'DESCONOCIDO';
  }

  limpiarCache() {
    this.mapaNombresCache = null;
    this.mapaNombresCacheTime = 0;
    this.empleadosActivosCache = null;
    this.empleadosActivosCacheTime = 0;
    this.logger.log('🧹 Caché de empleados limpiado');
  }
}