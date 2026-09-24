import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AsignacionTurno,
  HorarioAsistencia,
  ReglasConfig,
} from '../Interfaces/reglas.interface';
import { TODOS_LOS_DIAS, obtenerInicioSemana, diaANombre, normalizarCedula, fechaDateAString } from '../Utils/tiempo.util';
import { HorarioAsistencia as HorarioEntity } from '../../Entitys/HorariosAsistencia/HorarioAsistencia.entity';
import { AsignacionHorario } from '../../Entitys/AsignacionHorario/AsignacionHorario.entity';
import { DiaLibre } from '../../Entitys/DiaLibre/DiaLibre.entity';
import { Empleado } from '../../Entitys/Empleados/Empleado.entity';

@Injectable()
export class ReglasConfigService implements OnModuleInit {
  private readonly logger = new Logger(ReglasConfigService.name);

  private reglas: ReglasConfig = { horarios: [] };
  private asignaciones: AsignacionTurno[] = [];
  private diasLibres: Record<string, Record<string, string[]>> = {};

  constructor(
    @InjectRepository(HorarioEntity)
    private readonly horarioRepo: Repository<HorarioEntity>,
    @InjectRepository(AsignacionHorario)
    private readonly asignacionRepo: Repository<AsignacionHorario>,
    @InjectRepository(DiaLibre)
    private readonly diaLibreRepo: Repository<DiaLibre>,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
  ) {}

  async onModuleInit() {
    await this.recargar();
  }

  // =========================================================
  // RECARGA COMPLETA DESDE BD
  // =========================================================
  async recargar() {
    await Promise.all([
      this.cargarReglas(),
      this.cargarAsignaciones(),
      this.cargarDiasLibres(),
    ]);
    this.logger.log(
      `🔄 Reglas recargadas: ${this.reglas.horarios.length} horarios, ${this.asignaciones.length} asignaciones`,
    );
  }

  private async cargarReglas() {
    const horarios = await this.horarioRepo.find({ where: { activo: true } });

    this.reglas = {
      horarios: horarios.map((h) => ({
        id: h.codigo,
        nombre: h.nombre,
        entrada: h.horaEntrada.slice(0, 5),
        salida: h.horaSalida.slice(0, 5),
        toleranciaMin: h.toleranciaMin,
        diasLaborales: [],
        // ⬇️ NUEVOS
        breakDuracionMin: h.breakDuracionMin ?? 60,
        breakToleranciaMin: h.breakToleranciaMin ?? 5,
      })),
    };
  }

  private async cargarAsignaciones() {
    try {
      // 1. Traer asignaciones SIN relations (para evitar bugs)
      const asignaciones = await this.asignacionRepo.find({
        where: { activo: true },
      });

      this.logger.debug(`📊 Asignaciones en BD: ${asignaciones.length}`);

      if (asignaciones.length === 0) {
        this.asignaciones = [];
        return;
      }

      // 2. Traer empleados y horarios por separado
      const empleados = await this.empleadoRepo.find();
      const horarios = await this.horarioRepo.find();

      const empleadoMap = new Map(empleados.map((e) => [e.id, e]));
      const horarioMap = new Map(horarios.map((h) => [h.id, h]));

      // 3. JOIN manual
      const resultado: AsignacionTurno[] = [];
      for (const a of asignaciones) {
        const empleado = empleadoMap.get(a.empleadoId);
        const horario = horarioMap.get(a.horarioId);

        if (!empleado) {
          this.logger.warn(`Empleado ${a.empleadoId} no encontrado`);
          continue;
        }
        if (!horario) {
          this.logger.warn(`Horario ${a.horarioId} no encontrado`);
          continue;
        }

        resultado.push({
          employeeId: normalizarCedula(empleado.cedula),
          horarioId: horario.codigo,
        });
      }

      this.asignaciones = resultado;
      this.logger.log(`✅ ${resultado.length} asignaciones cargadas desde BD`);
    } catch (error: any) {
      this.logger.error(`❌ Error cargando asignaciones: ${error.message}`);
      this.asignaciones = [];
    }
  }
  private async cargarDiasLibres() {
    const todos = await this.diaLibreRepo.find();
    const empleados = await this.empleadoRepo.find();

    const cedulaPorId = new Map(
      empleados.map((e) => [e.id, normalizarCedula(e.cedula)]),
    );
    const diasLibres: Record<string, Record<string, string[]>> = {};

    for (const d of todos) {
      const cedula = cedulaPorId.get(d.empleadoId);
      if (!cedula) continue;

      if (!diasLibres[cedula]) diasLibres[cedula] = {};

      if (d.tipo === 'FIJO') {
        if (!diasLibres[cedula]['_fijos']) diasLibres[cedula]['_fijos'] = [];
        diasLibres[cedula]['_fijos'].push(diaANombre(d.diaSemana));
      } else if (d.tipo === 'ROTATIVO' && d.semanaInicio) {
        // ✅ FIX timezone: usar toISOString
        const semanaClave = fechaDateAString(d.semanaInicio);

        if (!diasLibres[cedula][semanaClave]) {
          diasLibres[cedula][semanaClave] = [];
        }
        diasLibres[cedula][semanaClave].push(diaANombre(d.diaSemana));
      }
    }

    this.diasLibres = diasLibres;
  }

  // =========================================================
  // GETTERS
  // =========================================================
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

  // =========================================================
  // LÓGICA
  // =========================================================
  obtenerDiasLibresSemana(employeeId: string, fecha: Date): string[] {
    const semana = obtenerInicioSemana(fecha);
    const cedulaNorm = normalizarCedula(employeeId);

    const rotativos = this.diasLibres[cedulaNorm]?.[semana] || [];
    const fijos = this.diasLibres[cedulaNorm]?.['_fijos'] || [];

    return rotativos.length > 0 ? rotativos : fijos;
  }

  obtenerHorarioAsignado(
    employeeId: string,
    fecha?: Date,
  ): HorarioAsistencia | null {
    const cedulaNorm = normalizarCedula(employeeId);
    const asignacion = this.asignaciones.find(
      (a) => a.employeeId === cedulaNorm,
    );
    if (!asignacion) return null;

    const horario = this.reglas.horarios.find(
      (h) => h.id === asignacion.horarioId,
    );
    if (!horario) return null;

    if (!fecha) return horario;

    const diasLibres = this.obtenerDiasLibresSemana(cedulaNorm, fecha);
    const diasLaborales = TODOS_LOS_DIAS.filter((d) => !diasLibres.includes(d));
    return { ...horario, diasLaborales };
  }

  // =========================================================
  // SETTERS (compatibilidad)
  // =========================================================
  setAsignaciones(asignaciones: AsignacionTurno[]) {
    this.asignaciones = asignaciones;
  }

  setDiasLibres(dias: Record<string, Record<string, string[]>>) {
    this.diasLibres = dias;
  }

  obtenerSnapshot() {
    return {
      asignaciones: this.asignaciones,
      diasLibres: this.diasLibres,
    };
  }

  async restaurarSnapshot(_datos: { asignaciones?: any[]; diasLibres?: any }) {
    await this.recargar();
  }
}