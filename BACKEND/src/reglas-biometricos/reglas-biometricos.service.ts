import { Injectable } from '@nestjs/common';
import { ReglasConfigService } from './Configs/reglas-config.service';
import { EvaluacionService } from './Evaluacion/evaluacion.service';
import { ReportesService } from './Reportes/reportes.service';
import { AsignacionesService } from './Asignaciones/asignaciones.service';
import { EmpleadosSyncService } from './empleados/empleados-sync.service';  
import { MigracionJsonService } from './Migracion/migracion-json.service';
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
    private readonly empleadosSync: EmpleadosSyncService,
     private readonly migracionJson: MigracionJsonService,  
  ) {}

  // ============ Config ============
  getReglas() { return this.config.getReglas(); }
  getDiasLibres() { return this.config.getDiasLibres(); }

  // ============ Evaluación ============
  evaluarEmpleado(employeeId: string, fecha: Date, employeeName?: string, marcajesCache?: any[]) {
    return this.evaluacion.evaluarEmpleado(employeeId, fecha, employeeName, marcajesCache);
  }

  // ============ Cache ============
  async recargar() {
    return await this.config.recargar();
  }

  limpiarCachesReportes() {
    this.reportes.limpiarCaches();
    return { success: true, message: 'Caches de reportes limpiados' };
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

  // ============ Empleados (NUEVO) ============
  sincronizarEmpleadosDesdeBiometrico() {
    return this.empleadosSync.Sincronizar_Empleados();
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

  // ============ Migración JSON → BD ============
  migrarAsignaciones() {
    return this.migracionJson.migrarAsignaciones();
  }

  migrarDiasLibres() {
    return this.migracionJson.migrarDiasLibres();
  }

  migrarTodo() {
    return this.migracionJson.migrarTodo();
  }

  estadoMigracion() {
    return this.migracionJson.estadoMigracion();
  }
}