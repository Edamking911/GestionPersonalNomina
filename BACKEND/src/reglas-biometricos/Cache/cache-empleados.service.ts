import { Injectable, Logger } from '@nestjs/common';
import { BiometricoService } from '../../biometrico/biometrico.service';

@Injectable()
export class CacheEmpleadosService {
  private readonly logger = new Logger(CacheEmpleadosService.name);

  private horaBiometricoCache: Date | null = null;
  private horaBiometricoCacheTime = 0;

  private empleadosActivosCache: Set<string> | null = null;
  private empleadosActivosCacheTime = 0;

  private readonly CACHE_TTL = 30000; // 30 segundos

  constructor(private readonly biometricoService: BiometricoService) {}

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
      const usuarios = await this.biometricoService.listUsers(
        '172.18.0.89',
        'admin',
        'Dtd2026*',
        true,
      );
      if (usuarios?.success && Array.isArray(usuarios.usuarios)) {
        usuarios.usuarios
          .filter((u: any) => u.activo !== false)
          .forEach((u: any) => set.add(String(u.employeeNo)));
      }
    } catch (error) {
      this.logger.warn('No se pudieron cargar los empleados activos', error);
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
      const usuarios = await this.biometricoService.listUsers(
        '172.18.0.89',
        'admin',
        'Dtd2026*',
        true,
      );
      if (usuarios?.success && Array.isArray(usuarios.usuarios)) {
        const empleado = usuarios.usuarios.find(
          (u: any) => String(u.employeeNo).trim() === String(employeeId).trim(),
        );

        if (!empleado) {
          return {
            activo: false,
            noExiste: true,
            mensaje: `El empleado con cédula ${employeeId} no existe en el biométrico.`,
          };
        }
        if (empleado.activo === false) {
          return {
            activo: false,
            nombre: empleado.name,
            mensaje: `El empleado ${empleado.name} (${employeeId}) está desactivado. Reactívalo primero.`,
          };
        }
        return { activo: true, nombre: empleado.name };
      }
    } catch (error) {
      this.logger.warn('No se pudo validar el estado del empleado', error);
    }
    return { activo: true };
  }

  async obtenerMapaNombres(): Promise<Map<string, string>> {
    const mapa = new Map<string, string>();
    try {
      const usuarios = await this.biometricoService.listUsers(
        '172.18.0.89',
        'admin',
        'Dtd2026*',
        true,
      );
      if (usuarios?.success && Array.isArray(usuarios.usuarios)) {
        usuarios.usuarios.forEach((u: any) => mapa.set(u.employeeNo, u.name));
      }
    } catch {}
    return mapa;
  }

  resolverNombre(
    employeeId: string,
    marcajes: any[],
    mapaNombres: Map<string, string>,
  ): string {
    if (mapaNombres.has(employeeId)) {
      return mapaNombres.get(employeeId)!;
    }

    const marcajeConNombre = marcajes.find(
      (m) => m.employeeId === employeeId && m.employeeName,
    );
    if (marcajeConNombre?.employeeName) {
      return marcajeConNombre.employeeName;
    }
    return 'DESCONOCIDO';
  }

  async obtenerNombreEmpleado(
    employeeId: string,
    marcajes: any[],
  ): Promise<string> {
    const marcajeConNombre = marcajes.find(
      (m) => m.employeeId === employeeId && m.employeeName,
    );
    if (marcajeConNombre?.employeeName) {
      return marcajeConNombre.employeeName;
    }
    try {
      const nombre = await this.biometricoService.getEmployeeName(employeeId);
      return nombre !== 'DESCONOCIDO' ? nombre : 'DESCONOCIDO';
    } catch {
      return 'DESCONOCIDO';
    }
  }
}