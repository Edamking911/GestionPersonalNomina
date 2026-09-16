import { Injectable } from '@nestjs/common';
import { ReglasConfigService } from './Configs/reglas-config.service';
import { EvaluacionService } from './Evaluacion/evaluacion.service';
import { ReportesService } from './Reportes/reportes.service';
import { AsignacionesService } from './Asignaciones/asignaciones.service';
import { BackupsService } from './Backups/backups.service';

// Re-exportar tipos para no romper imports existentes
export type {
  HorarioAsistencia,
  ReglasConfig,
  AsignacionTurno,
  EvaluacionAsistencia,
} from './Interfaces/reglas.interface';

@Injectable()
export class ReglasBiometricosService {
  constructor(
    private readonly config: ReglasConfigService,
    private readonly evaluacion: EvaluacionService,
    private readonly reportes: ReportesService,
    private readonly asignaciones: AsignacionesService,
    private readonly backups: BackupsService,
  ) {}

  // ============ Config ============
  getReglas() { return this.config.getReglas(); }
  getDiasLibres() { return this.config.getDiasLibres(); }

  // ============ Evaluación ============
  evaluarEmpleado(employeeId: string, fecha: Date, employeeName?: string, marcajesCache?: any[]) {
    return this.evaluacion.evaluarEmpleado(employeeId, fecha, employeeName, marcajesCache);
  }

  // ============ Cache ============
  limpiarCachesReportes() {
    this.reportes.limpiarCaches();
    return {
      success: true,
      message: 'Caches de reportes limpiados',
    };
  }

  // ============ Asignaciones ============
  getAsignaciones(semana?: string, generarExcel = false) {
    return this.asignaciones.getAsignaciones(semana, generarExcel);
  }
  asignarHorario(employeeId: string, horarioId: string, diasLibresFijos?: string[]) {
    return this.asignaciones.asignarHorario(employeeId, horarioId, diasLibresFijos);
  }
  asignarDiasLibres(employeeId: string, semana: string, diasLibres: string[]) {
    return this.asignaciones.asignarDiasLibres(employeeId, semana, diasLibres);
  }
  validarExcelAsignaciones(buffer: Buffer) {
    return this.asignaciones.validarExcelAsignaciones(buffer);
  }
  importarExcelAsignaciones(buffer: Buffer) {
    return this.asignaciones.importarExcelAsignaciones(buffer);
  }
  generarPlantillaAsignaciones(mes?: string) {
    return this.asignaciones.generarPlantillaAsignaciones(mes);
  }

  // ============ Reportes ============
  generarReporteDiario(fecha: Date, generarExcel = false) {
    return this.reportes.generarReporteDiario(fecha, generarExcel);
  }
  generarReporteSemanal(desde: Date, hasta: Date, generarExcel = false) {
    return this.reportes.generarReporteSemanal(desde, hasta, generarExcel);
  }
  generarReporteMensualNomina(mes?: string, generarExcel = false) {
    return this.reportes.generarReporteMensualNomina(mes, generarExcel);
  }
  validarSalidasPendientes(fecha: Date, generarExcel = false) {
    return this.reportes.validarSalidasPendientes(fecha, generarExcel);
  }

  // ============ Backups ============
  listarBackups() { return this.backups.listarBackups(); }
  restaurarBackup(nombreArchivo: string) { return this.backups.restaurarBackup(nombreArchivo); }
  restaurarUltimoBackup() { return this.backups.restaurarUltimoBackup(); }
  limpiarBackupsViejos(diasAntiguedad = 30) { return this.backups.limpiarBackupsViejos(diasAntiguedad); }
}