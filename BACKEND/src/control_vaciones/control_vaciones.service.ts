import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ControlVacaciones } from '../Entitys/Control_Vacaciones/ControlVacaciones.entity';
import { Empleado } from '../Entitys/Empleados/Empleado.entity';
import { DiaLibre } from '../Entitys/DiaLibre/DiaLibre.entity';
import { Feriado } from '../Entitys/Feriado/Feriado.entity';
import { NovedadNomina } from '../Entitys/Novedades/NovedadNomina.entity';
import { SolicitarVacacionesDto } from '../DTOS/Control_Vacaciones/SolicitarVacaciones.dto';
import { normalizarCedula } from '../reglas-biometricos/Utils/tiempo.util';
import { NovedadesService } from 'src/reglas-biometricos/Novedades/novedades.service';

@Injectable()
export class ControlVacionesService {


     private readonly logger = new Logger(ControlVacionesService.name);

  constructor(
    @InjectRepository(ControlVacaciones)
    private readonly controlVacRepo: Repository<ControlVacaciones>,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
    @InjectRepository(DiaLibre)
    private readonly diaLibreRepo: Repository<DiaLibre>,
    @InjectRepository(Feriado)
    private readonly feriadoRepo: Repository<Feriado>,
    @InjectRepository(NovedadNomina)
    private readonly novedadRepo: Repository<NovedadNomina>,
    private readonly novedadesService: NovedadesService, 
  ) {}

    // =========================================================
  // 🔍 CONSULTAS
  // =========================================================

  async saldoEmpleado(cedula: string) {
    const empleado = await this.buscarEmpleadoPorCedula(cedula);

    const periodos = await this.controlVacRepo.find({
      where: { empleadoId: empleado.id },
      order: { periodoAno: 'ASC' },
    });

    const totales = periodos.reduce(
      (acc, p) => {
        acc.disponibles += p.diasDisfruteDerecho - p.diasDisfrutados;
        acc.bonoPendiente += p.diasBonoDerecho - p.diasBonoPagados;
        return acc;
      },
      { disponibles: 0, bonoPendiente: 0 },
    );

    return {
      success: true,
      empleado: {
        cedula: empleado.cedula,
        nombre: `${empleado.nombre} ${empleado.apellido}`.trim(),
        fechaIngreso: empleado.fechaIngreso,
        estado: empleado.estado,
      },
      totalDiasDisponibles: totales.disponibles,
      totalBonoPendiente: totales.bonoPendiente,
      periodos,
    };
  }

  async vacacionesVencidas() {
    return this.controlVacRepo
      .createQueryBuilder('cv')
      .innerJoinAndSelect('cv.empleado', 'e')
      .where('cv.estado IN (:...estados)', { estados: ['PENDIENTE', 'VENCIDO'] })
      .andWhere('(cv.dias_disfrute_derecho - cv.dias_disfrutados) > 0')
      .andWhere('e.estado = :estado', { estado: 'ACTIVO' })
      .orderBy('cv.periodo_ano', 'ASC')
      .addOrderBy('e.apellido', 'ASC')
      .getMany();
  }

  async proximosAniversarios() {
    return this.empleadoRepo.query(`
      SELECT * FROM public.vw_proximos_aniversarios
    `);
  }

  async actualmenteDeVacaciones() {
    return this.empleadoRepo.query(`
      SELECT * FROM public.vw_empleados_de_vacaciones
    `);
  }

  // =========================================================
  // 🎯 PROCESAR SOLICITUD DE VACACIONES
  // =========================================================
  async solicitarVacaciones(dto: SolicitarVacacionesDto) {
    // 1. Validar empleado
    const empleado = await this.buscarEmpleadoPorCedula(dto.cedula);

    if (empleado.estado !== 'ACTIVO') {
      throw new BadRequestException(
        `El empleado ${empleado.nombre} ${empleado.apellido} está ${empleado.estado}`,
      );
    }

    // 2. Validar fecha de inicio
    const [y, m, d] = dto.fechaInicio.split('-').map(Number);
    const fechaInicio = new Date(y, m - 1, d);

    if (isNaN(fechaInicio.getTime())) {
      throw new BadRequestException('Fecha de inicio inválida');
    }

    // 3. Buscar período con saldo (más antiguo primero)
    const periodo = await this.controlVacRepo.findOne({
      where: { empleadoId: empleado.id, estado: 'PENDIENTE' },
      order: { periodoAno: 'ASC' },
    });

    if (!periodo) {
      throw new BadRequestException(
        `El empleado no posee días de vacaciones acumulados. Requiere al menos 1 año de servicio.`,
      );
    }

    const diasDisponibles = periodo.diasDisfruteDerecho - periodo.diasDisfrutados;

    if (diasDisponibles <= 0) {
      throw new BadRequestException(
        `El empleado no tiene saldo pendiente en el período ${periodo.periodoAno}`,
      );
    }

    // 4. Cuántos días tomar
    const diasSolicitados = dto.diasSolicitados ?? diasDisponibles;

    if (diasSolicitados > diasDisponibles) {
      throw new BadRequestException(
        `Solicitó ${diasSolicitados} días pero solo tiene ${diasDisponibles} disponibles`,
      );
    }

    // 5. Validar solapamiento
    await this.validarSolapamiento(empleado.id, fechaInicio, diasSolicitados);

    // 6. Precargar datos
    const { diasLibresFijos, diasLibresRotativos, feriadosSet } =
      await this.precargarDatos(empleado.id, fechaInicio, diasSolicitados);

    // 7. Bucle calcular fecha fin
    const fechaActual = new Date(fechaInicio);
    let diasContados = 0;
    let diasCalendario = 0;

    while (diasContados < diasSolicitados) {
      const diaSemana = fechaActual.getDay();
      const fechaISO = this.aFechaISO(fechaActual);

      let esLibre = diasLibresFijos.has(diaSemana);

      if (!esLibre) {
        const semanaClave = this.obtenerDomingoSemana(fechaActual);
        esLibre = diasLibresRotativos.has(`${semanaClave}_${diaSemana}`);
      }

      const esFeriado = feriadosSet.has(fechaISO);

      if (!esLibre && !esFeriado) {
        diasContados++;
      }

      if (diasContados < diasSolicitados) {
        fechaActual.setDate(fechaActual.getDate() + 1);
        diasCalendario++;
      }
    }

    const fechaFin = new Date(fechaActual);
    diasCalendario++;

    // 8. Crear novedad
    const novedad = this.novedadRepo.create({
      empleadoId: empleado.id,
      cedula: empleado.cedula,
      tipo: 'VACACIONES',
      fechaInicio,
      fechaFin,
      motivo: dto.motivo || `Vacaciones período ${periodo.periodoAno}`,
      activo: true,
    });
    await this.novedadRepo.save(novedad);

    // ✅ FIX: Recargar el caché de novedades
    await this.novedadesService.cargarCache();

    // 9. Actualizar saldo
    const nuevosDisfrutados = periodo.diasDisfrutados + diasSolicitados;
    periodo.diasDisfrutados = nuevosDisfrutados;
    periodo.estado = nuevosDisfrutados >= periodo.diasDisfruteDerecho
      ? 'DISFRUTADO'
      : 'PENDIENTE';
    await this.controlVacRepo.save(periodo);

    this.logger.log(
      `🎉 Vacaciones: ${empleado.cedula} ${diasSolicitados} días (${this.fmt(fechaInicio)} → ${this.fmt(fechaFin)})`,
    );

    return {
      success: true,
      message: `Vacaciones registradas: ${diasSolicitados} días hábiles`,
      empleado: {
        cedula: empleado.cedula,
        nombre: `${empleado.nombre} ${empleado.apellido}`.trim(),
      },
      periodo: {
        ano: periodo.periodoAno,
        diasTomados: diasSolicitados,
        diasRestantes: periodo.diasDisfruteDerecho - nuevosDisfrutados,
      },
      calendario: {
        fechaInicio: this.fmt(fechaInicio),
        fechaFin: this.fmt(fechaFin),
        diasCalendarioTotales: diasCalendario,
        diasHabiles: diasSolicitados,
      },
      novedadId: novedad.id,
    };
  }

  // =========================================================
  // 🔒 VALIDACIONES
  // =========================================================
  private async validarSolapamiento(
    empleadoId: string,
    fechaInicio: Date,
    diasSolicitados: number,
  ) {
    const fechaFinEstimada = new Date(fechaInicio);
    fechaFinEstimada.setDate(fechaFinEstimada.getDate() + diasSolicitados * 2 + 10);

    const existentes = await this.novedadRepo.find({
      where: {
        empleadoId,
        activo: true,
      },
    });

    const fechaInicioISO = this.aFechaISO(fechaInicio);
    const fechaFinISO = this.aFechaISO(fechaFinEstimada);

    for (const n of existentes) {
      const inicioN = this.aFechaISO(new Date(n.fechaInicio));
      const finN = this.aFechaISO(new Date(n.fechaFin));

      if (fechaInicioISO <= finN && inicioN <= fechaFinISO) {
        throw new ConflictException(
          `El empleado ya tiene una novedad activa (${n.tipo}) del ${inicioN} al ${finN}. No se puede solapar.`,
        );
      }
    }
  }

  // =========================================================
  // 📦 PRECARGA DE DATOS
  // =========================================================
  private async precargarDatos(
    empleadoId: string,
    fechaInicio: Date,
    diasSolicitados: number,
  ) {
    const fechaLimite = new Date(fechaInicio);
    fechaLimite.setDate(fechaLimite.getDate() + diasSolicitados * 2 + 30);

    // 1. Días libres fijos
    const diasFijos = await this.diaLibreRepo.find({
      where: { empleadoId, tipo: 'FIJO' },
    });
    const diasLibresFijos = new Set(diasFijos.map((d) => d.diaSemana));

    // ✅ FIX: Si no tiene días libres configurados, asumir Sábado(6) + Domingo(0)
    if (diasLibresFijos.size === 0) {
      diasLibresFijos.add(0);  // Domingo
      diasLibresFijos.add(6);  // Sábado
    }

    // 2. Días libres rotativos
    const diasRotativos = await this.diaLibreRepo.find({
      where: {
        empleadoId,
        tipo: 'ROTATIVO',
        semanaInicio: Between(
          this.obtenerFechaDomingo(fechaInicio),
          this.obtenerFechaDomingo(fechaLimite),
        ),
      },
    });
    const diasLibresRotativos = new Set(
      diasRotativos.map((d) => {
        const semana = this.aFechaISO(new Date(d.semanaInicio!));
        return `${semana}_${d.diaSemana}`;
      }),
    );

    // 3. Feriados del rango
    const feriados = await this.feriadoRepo.find({
      where: {
        fecha: Between(fechaInicio, fechaLimite),
      },
    });
    const feriadosSet = new Set(
      feriados.map((f) => this.aFechaISO(new Date(f.fecha))),
    );

    return { diasLibresFijos, diasLibresRotativos, feriadosSet };
  }

  // =========================================================
  // 🛠️ HELPERS
  // =========================================================
  private async buscarEmpleadoPorCedula(cedula: string): Promise<Empleado> {
    const cedulaNorm = normalizarCedula(cedula);
    const empleado = await this.empleadoRepo.findOne({
      where: { cedula: cedulaNorm },
    });

    if (!empleado) {
      throw new NotFoundException(`Empleado con cédula ${cedula} no encontrado`);
    }

    return empleado;
  }

  private aFechaISO(fecha: Date): string {
    const d = new Date(fecha);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  private obtenerDomingoSemana(fecha: Date): string {
    const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const diff = -d.getDay();
    d.setDate(d.getDate() + diff);
    return this.aFechaISO(d);
  }

  private obtenerFechaDomingo(fecha: Date): Date {
    const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  private fmt(fecha: Date): string {
    return fecha.toLocaleDateString('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}