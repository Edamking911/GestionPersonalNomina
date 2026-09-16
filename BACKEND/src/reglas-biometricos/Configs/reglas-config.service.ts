import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  AsignacionTurno,
  HorarioAsistencia,
  ReglasConfig,
} from '../Interfaces/reglas.interface';
import { TODOS_LOS_DIAS, obtenerInicioSemana } from '../Utils/tiempo.util';

@Injectable()
export class ReglasConfigService {
  private readonly logger = new Logger(ReglasConfigService.name);
  private readonly reglasPath = path.join(process.cwd(), 'reglas_asistencia.json');
  private readonly asignacionesPath = path.join(process.cwd(), 'asignaciones_turnos.json');
  private readonly diasLibresPath = path.join(process.cwd(), 'dias_libres.json');

  private reglas!: ReglasConfig;
  private asignaciones!: AsignacionTurno[];
  private diasLibres: Record<string, Record<string, string[]>> = {};

  constructor() {
    this.inicializarReglas();
    this.inicializarAsignaciones();
    this.inicializarDiasLibres();
  }

  // ============ INICIALIZACIÓN ============
  private inicializarReglas() {
    if (fs.existsSync(this.reglasPath)) {
      this.reglas = JSON.parse(fs.readFileSync(this.reglasPath, 'utf-8'));
    } else {
      this.reglas = {
        horarios: [
          { id: 'HORARIO_8_5', nombre: '8:00 AM - 5:00 PM', entrada: '08:00', salida: '17:00', toleranciaMin: 10, diasLaborales: [] },
          { id: 'HORARIO_8_5_30', nombre: '8:00 AM - 5:30 PM', entrada: '08:00', salida: '17:30', toleranciaMin: 10, diasLaborales: [] },
          { id: 'HORARIO_8_6_30', nombre: '8:00 AM - 6:30 PM', entrada: '08:00', salida: '18:30', toleranciaMin: 10, diasLaborales: [] },
          { id: 'HORARIO_8_7', nombre: '8:00 AM - 7:00 PM', entrada: '08:00', salida: '19:00', toleranciaMin: 10, diasLaborales: [] },
          { id: 'HORARIO_8_8', nombre: '8:00 AM - 8:00 PM', entrada: '08:00', salida: '20:00', toleranciaMin: 10, diasLaborales: [] },
        ],
      };
      this.guardarReglas();
    }
  }

  private inicializarAsignaciones() {
    if (fs.existsSync(this.asignacionesPath)) {
      this.asignaciones = JSON.parse(fs.readFileSync(this.asignacionesPath, 'utf-8'));
    } else {
      this.asignaciones = [];
      this.guardarAsignaciones();
    }
  }

  private inicializarDiasLibres() {
    if (fs.existsSync(this.diasLibresPath)) {
      this.diasLibres = JSON.parse(fs.readFileSync(this.diasLibresPath, 'utf-8'));
    } else {
      this.diasLibres = {};
      this.guardarDiasLibres();
    }
  }

  // ============ PERSISTENCIA ============
  guardarReglas() {
    fs.writeFileSync(this.reglasPath, JSON.stringify(this.reglas, null, 2), 'utf-8');
  }

  guardarAsignaciones() {
    fs.writeFileSync(this.asignacionesPath, JSON.stringify(this.asignaciones, null, 2), 'utf-8');
  }

  guardarDiasLibres() {
    fs.writeFileSync(this.diasLibresPath, JSON.stringify(this.diasLibres, null, 2), 'utf-8');
  }

  // ============ GETTERS ============
  getReglas(): ReglasConfig {
    return this.reglas;
  }

  getAsignaciones(): AsignacionTurno[] {
    return this.asignaciones;
  }

  getDiasLibres() {
    return this.diasLibres;
  }

  getHorarioPorId(horarioId: string): HorarioAsistencia | undefined {
    return this.reglas.horarios.find((h) => h.id === horarioId);
  }

  // ============ ASIGNACIONES ============
  obtenerDiasLibresSemana(employeeId: string, fecha: Date): string[] {
    const semana = obtenerInicioSemana(fecha);
    return this.diasLibres[employeeId]?.[semana] || [];
  }

  obtenerHorarioAsignado(
    employeeId: string,
    fecha?: Date,
  ): HorarioAsistencia | null {
    const asignacion = this.asignaciones.find((a) => a.employeeId === employeeId);
    if (!asignacion) return null;

    const horario = this.reglas.horarios.find((h) => h.id === asignacion.horarioId);
    if (!horario) return null;

    if (!fecha) return horario;

    let diasLibres = this.obtenerDiasLibresSemana(employeeId, fecha);
    if (diasLibres.length === 0 && asignacion.diasLibresFijos?.length) {
      diasLibres = asignacion.diasLibresFijos;
    }

    const diasLaborales = TODOS_LOS_DIAS.filter((d) => !diasLibres.includes(d));
    return { ...horario, diasLaborales };
  }

  setAsignaciones(asignaciones: AsignacionTurno[]) {
    this.asignaciones = asignaciones;
  }

  setDiasLibres(dias: Record<string, Record<string, string[]>>) {
    this.diasLibres = dias;
  }

  // ============ SNAPSHOT (para backups) ============
  obtenerSnapshot() {
    return {
      asignaciones: this.asignaciones,
      diasLibres: this.diasLibres,
    };
  }

  restaurarSnapshot(datos: { asignaciones?: any[]; diasLibres?: any }) {
    this.asignaciones = datos.asignaciones || [];
    this.diasLibres = datos.diasLibres || {};
    this.guardarAsignaciones();
    this.guardarDiasLibres();
  }
}