import { Injectable, Logger, StreamableFile, Inject, forwardRef } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Workbook } from 'exceljs';
import { EvaluacionAsistencia } from '../Interfaces/reglas.interface';
import { ReglasConfigService } from '../Configs/reglas-config.service';
import { CacheEmpleadosService } from '../Cache/cache-empleados.service';
import { EvaluacionService } from '../Evaluacion/evaluacion.service';
import { MarcajesStorageService } from '../../biometrico/Storage/marcajes-storage.service';
import {
  formatearHoras,
  formatearMinutos,
  formatoFechaLocal,
} from '../Utils/tiempo.util';

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  private readonly REPORTE_CACHE_TTL = 5 * 60 * 1000;
  private reporteSemanalCache = new Map<string, { data: any; timestamp: number }>();
  private reporteMensualCache = new Map<string, { data: any; timestamp: number }>();

  constructor(
    private readonly config: ReglasConfigService,
    private readonly cache: CacheEmpleadosService,
    @Inject(forwardRef(() => EvaluacionService))
    private readonly evaluacion: EvaluacionService,
    private readonly marcajesStorage: MarcajesStorageService,
  ) {}

  limpiarCaches() {
    this.reporteSemanalCache.clear();
    this.reporteMensualCache.clear();
    this.logger.log('🧹 Caches de reportes limpiados');
  }

  // ============ REPORTE DIARIO ============
  async generarReporteDiario(fecha: Date, generarExcel = false) {
    const marcajes = await this.marcajesStorage.obtenerMarcajesDelDia(fecha);
    const mapaNombres = await this.cache.obtenerMapaNombres();
    const activos = await this.cache.obtenerSetEmpleadosActivos();

    const empleados: { employeeId: string; nombre: string }[] = [];
    for (const asignacion of this.config.getAsignaciones()) {
      if (activos.size > 0 && !activos.has(String(asignacion.employeeId))) continue;
      empleados.push({
        employeeId: asignacion.employeeId,
        nombre: this.cache.resolverNombre(asignacion.employeeId, marcajes, mapaNombres),
      });
    }

    const reporte: EvaluacionAsistencia[] = [];
    for (const emp of empleados) {
      const ev = await this.evaluacion.evaluarEmpleado(
        emp.employeeId,
        fecha,
        emp.nombre,
        marcajes,
      );
      reporte.push(ev);
    }

    if (generarExcel) {
      const columnas = [
        { header: 'Cédula', key: 'employeeId', width: 15 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Fecha', key: 'fecha', width: 20 },
        { header: 'Horario', key: 'horario', width: 25 },
        { header: 'Entrada Real', key: 'entradaReal', width: 25 },
        { header: 'Salida Real', key: 'salidaReal', width: 25 },
        { header: 'Estado', key: 'estado', width: 20 },
        { header: 'Novedad', key: 'novedadTipo', width: 20 },
        { header: 'Motivo Novedad', key: 'novedadMotivo', width: 30 },
        // ⬇️ NUEVOS BREAK
        { header: 'Break Salida', key: 'breakSalida', width: 22 },
        { header: 'Break Entrada', key: 'breakEntrada', width: 22 },
        { header: 'Duración Break', key: 'breakDuracion', width: 15 },
        { header: 'Estado Break', key: 'breakEstado', width: 20 },
        // ⬇️ RESTO
        { header: 'Retardo', key: 'retardoLegible', width: 15 },
        { header: 'Salida Temprana', key: 'salidaTempranaLegible', width: 18 },
        { header: 'Horas Extra', key: 'horasExtra', width: 12 },
        { header: 'Tipo Turno', key: 'tipoTurno', width: 15 },
        { header: 'Horas Diurnas', key: 'horasDiurnasLegible', width: 15 },
        { header: 'Horas Nocturnas', key: 'horasNocturnasLegible', width: 15 },
        { header: 'Extra Diurna', key: 'horasExtraDiurnasLegible', width: 15 },
        { header: 'Extra Nocturna', key: 'horasExtraNocturnasLegible', width: 15 },
      ];

      const filas = reporte.map((emp) => ({
        ...emp,
        entradaReal: emp.entradaReal || 'Sin marcar',
        salidaReal: emp.salidaReal || 'Sin marcar',
        tipoTurno: emp.tipoTurno || '',
        novedadTipo: emp.novedad?.tipo || '',
        novedadMotivo: emp.novedad?.motivo || '',
        // ⬇️ NUEVOS BREAK
        breakSalida: emp.break?.horaSalida || '',
        breakEntrada: emp.break?.horaEntrada || '',
        breakDuracion: emp.break?.duracionLegible || '',
        breakEstado: emp.break?.diferenciaLegible || '',
      }));

      const buffer = await this.generarExcelBuffer('Reporte Diario', columnas, filas);

      return new StreamableFile(buffer, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: `attachment; filename="reporte_diario_${fecha.toISOString().slice(0, 10)}.xlsx"`,
      });
    }

    return {
      fecha: fecha.toLocaleDateString('es-VE'),
      totalEmpleados: reporte.length,
      reporte,
    };
  }

  // ============ VALIDAR SALIDAS PENDIENTES ============
  async validarSalidasPendientes(fecha: Date, generarExcel = false) {
    const ahora = await this.cache.obtenerHoraCache();
    const esFechaPasada = fecha.toDateString() !== ahora.toDateString() && fecha < ahora;

    if (!esFechaPasada) {
      return { success: false, message: 'La fecha debe ser anterior a hoy para validar salidas' };
    }

    const marcajes = await this.marcajesStorage.obtenerMarcajesDelDia(fecha);
    const mapaNombres = await this.cache.obtenerMapaNombres();
    const activos = await this.cache.obtenerSetEmpleadosActivos();

    const resultados: EvaluacionAsistencia[] = [];

    for (const asignacion of this.config.getAsignaciones()) {
      const empId = asignacion.employeeId;
      if (activos.size > 0 && !activos.has(String(empId))) continue;

      const nombre = this.cache.resolverNombre(empId, marcajes, mapaNombres);
      const ev = await this.evaluacion.evaluarEmpleado(empId, fecha, nombre, marcajes);

      if (ev.estado === 'PENDIENTE' || ev.estado === 'NO_MARCO_SALIDA') {
        const final: EvaluacionAsistencia = { ...ev };
        if (ev.estado === 'PENDIENTE') {
          final.estado = 'NO_MARCO_SALIDA';
          final.salidaReal = null;
          final.minutosSalidaTemprana = 0;
          final.salidaTempranaLegible = '0m';
        }
        resultados.push(final);
      }
    }

    const validacionesPath = path.join(process.cwd(), 'validaciones_salida.json');
    fs.writeFileSync(validacionesPath, JSON.stringify(resultados, null, 2), 'utf-8');

    if (generarExcel) {
      const columnas = [
        { header: 'Cédula', key: 'employeeId', width: 15 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Fecha', key: 'fecha', width: 20 },
        { header: 'Horario', key: 'horario', width: 25 },
        { header: 'Entrada Real', key: 'entradaReal', width: 25 },
        { header: 'Estado', key: 'estado', width: 20 },
      ];

      const filas = resultados.map((emp) => ({
        employeeId: emp.employeeId,
        nombre: emp.nombre,
        fecha: emp.fecha,
        horario: emp.horario,
        entradaReal: emp.entradaReal || 'Sin marcar',
        estado: emp.estado,
      }));

      const buffer = await this.generarExcelBuffer('Salidas Pendientes', columnas, filas);

      return new StreamableFile(buffer, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: `attachment; filename="salidas_pendientes_${fecha.toISOString().slice(0, 10)}.xlsx"`,
      });
    }

    return {
      success: true,
      fecha: fecha.toLocaleDateString('es-VE'),
      totalValidados: resultados.length,
      resultados,
    };
  }

  // ============ REPORTE SEMANAL ============
  async generarReporteSemanal(desde: Date, hasta: Date, generarExcel = false) {
    if (desde > hasta) {
      return { success: false, message: 'La fecha "desde" no puede ser mayor a "hasta"' };
    }

    const diffDias = Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDias > 90) {
      return {
        success: false,
        message: `El rango no puede superar los 90 días (recibido: ${diffDias} días).`,
      };
    }

    const cacheKey = `${desde.toISOString().split('T')[0]}_${hasta.toISOString().split('T')[0]}`;
    if (!generarExcel) {
      const cached = this.reporteSemanalCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.REPORTE_CACHE_TTL) {
        this.logger.log(`⚡ Reporte semanal desde cache: ${cacheKey}`);
        return cached.data;
      }
    }

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    const limite = hasta > hoy ? hoy : hasta;

    const dias: Date[] = [];
    const cursor = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
    const fin = new Date(limite.getFullYear(), limite.getMonth(), limite.getDate());

    while (cursor <= fin) {
      dias.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    if (dias.length === 0) {
      return { success: false, message: 'El rango está en el futuro.' };
    }

    const marcajes = await this.marcajesStorage.obtenerMarcajesEnRango(desde, limite);
    const mapaNombres = await this.cache.obtenerMapaNombres();
    const activos = await this.cache.obtenerSetEmpleadosActivos();

    const empleados: { employeeId: string; nombre: string }[] = [];
    for (const asignacion of this.config.getAsignaciones()) {
      if (activos.size > 0 && !activos.has(String(asignacion.employeeId))) continue;
      empleados.push({
        employeeId: asignacion.employeeId,
        nombre: this.cache.resolverNombre(asignacion.employeeId, marcajes, mapaNombres),
      });
    }

    const consolidado: any[] = [];

    for (const emp of empleados) {
      const acc = {
        diasTrabajados: 0, ausentes: 0, descansos: 0, noMarcoSalida: 0, pendientes: 0,
        minutosRetardo: 0, minutosSalidaTemprana: 0,
        horasExtraDiurnas: 0, horasExtraNocturnas: 0,
        horasDiurnas: 0, horasNocturnas: 0,
        // NUEVOS - NOVEDADES
        diasVacaciones: 0,
        diasReposoMedico: 0,
        diasPermisoRemunerado: 0,
        diasPermisoNoRemunerado: 0,
        diasFaltaJustificada: 0,
        diasFaltaInjustificada: 0,
        // ⬇️ NUEVOS BREAK
        diasBreakCorrecto: 0,
        diasBreakExceso: 0,
        diasBreakCorto: 0,
        diasBreakNoMarco: 0,
        minutosBreakTotal: 0,
        minutosBreakExceso: 0,
      };

      for (const dia of dias) {
        const ev = await this.evaluacion.evaluarEmpleado(emp.employeeId, dia, emp.nombre, marcajes);
        switch (ev.estado) {
          case 'PUNTUAL':
          case 'RETARDO':
          case 'SALIDA_TEMPRANA':
          case 'COMPLETO':
            acc.diasTrabajados++; break;
          case 'AUSENTE': acc.ausentes++; break;
          case 'DESCANSO': acc.descansos++; break;
          case 'NO_MARCO_SALIDA': acc.noMarcoSalida++; break;
          case 'PENDIENTE': acc.pendientes++; break;
          // NUEVOS - NOVEDADES
          case 'VACACIONES': acc.diasVacaciones++; break;
          case 'REPOSO_MEDICO': acc.diasReposoMedico++; break;
          case 'PERMISO_REMUNERADO': acc.diasPermisoRemunerado++; break;
          case 'PERMISO_NO_REMUNERADO': acc.diasPermisoNoRemunerado++; break;
          case 'FALTA_JUSTIFICADA': acc.diasFaltaJustificada++; break;
          case 'FALTA_INJUSTIFICADA': acc.diasFaltaInjustificada++; break;
        }
        acc.minutosRetardo += ev.minutosRetardo;
        acc.minutosSalidaTemprana += ev.minutosSalidaTemprana;
        acc.horasExtraDiurnas += ev.horasExtraDiurnas;
        acc.horasExtraNocturnas += ev.horasExtraNocturnas;
        acc.horasDiurnas += ev.horasDiurnas;
        acc.horasNocturnas += ev.horasNocturnas;

        // ⬇️ ACUMULAR BREAK
        if (ev.break) {
          acc.minutosBreakTotal += ev.break.duracionMin;
          acc.minutosBreakExceso += ev.break.excesoMin;
          if (ev.break.estado === 'CORRECTO') acc.diasBreakCorrecto++;
          if (ev.break.estado === 'EXCESO') acc.diasBreakExceso++;
          if (ev.break.estado === 'CORTO') acc.diasBreakCorto++;
          if (ev.break.estado === 'NO_MARCO') acc.diasBreakNoMarco++;
        }
      }

      const totalHorasExtra = Math.round((acc.horasExtraDiurnas + acc.horasExtraNocturnas) * 100) / 100;
      const totalHorasTrabajadas = Math.round(
        (acc.horasDiurnas + acc.horasNocturnas + acc.horasExtraDiurnas + acc.horasExtraNocturnas) * 100,
      ) / 100;

      consolidado.push({
        employeeId: emp.employeeId,
        nombre: emp.nombre,
        diasTrabajados: acc.diasTrabajados,
        ausentes: acc.ausentes,
        descansos: acc.descansos,
        noMarcoSalida: acc.noMarcoSalida,
        pendientes: acc.pendientes,
        // NUEVOS - NOVEDADES
        diasVacaciones: acc.diasVacaciones,
        diasReposoMedico: acc.diasReposoMedico,
        diasPermisoRemunerado: acc.diasPermisoRemunerado,
        diasPermisoNoRemunerado: acc.diasPermisoNoRemunerado,
        diasFaltaJustificada: acc.diasFaltaJustificada,
        diasFaltaInjustificada: acc.diasFaltaInjustificada,
        // ⬇️ NUEVOS BREAK
        diasBreakCorrecto: acc.diasBreakCorrecto,
        diasBreakExceso: acc.diasBreakExceso,
        diasBreakCorto: acc.diasBreakCorto,
        diasBreakNoMarco: acc.diasBreakNoMarco,
        minutosBreakTotal: acc.minutosBreakTotal,
        breakTotalLegible: formatearMinutos(acc.minutosBreakTotal),
        minutosBreakExceso: acc.minutosBreakExceso,
        breakExcesoLegible: formatearMinutos(acc.minutosBreakExceso),
        // RESTO
        minutosRetardo: acc.minutosRetardo,
        retardoLegible: formatearMinutos(acc.minutosRetardo),
        minutosSalidaTemprana: acc.minutosSalidaTemprana,
        salidaTempranaLegible: formatearMinutos(acc.minutosSalidaTemprana),
        horasDiurnas: Math.round(acc.horasDiurnas * 100) / 100,
        horasNocturnas: Math.round(acc.horasNocturnas * 100) / 100,
        horasExtraDiurnas: Math.round(acc.horasExtraDiurnas * 100) / 100,
        horasExtraNocturnas: Math.round(acc.horasExtraNocturnas * 100) / 100,
        totalHorasExtra,
        totalHorasTrabajadas,
        horasDiurnasLegible: formatearHoras(acc.horasDiurnas),
        horasNocturnasLegible: formatearHoras(acc.horasNocturnas),
        horasExtraDiurnasLegible: formatearHoras(acc.horasExtraDiurnas),
        horasExtraNocturnasLegible: formatearHoras(acc.horasExtraNocturnas),
        totalHorasExtraLegible: formatearHoras(totalHorasExtra),
        totalHorasTrabajadasLegible: formatearHoras(totalHorasTrabajadas),
      });
    }

    consolidado.sort((a, b) => a.nombre.localeCompare(b.nombre));

    const rango = {
      desde: formatoFechaLocal(desde),
      hasta: formatoFechaLocal(fin),
      dias: dias.length,
      esRangoEnCurso: hasta > hoy,
    };

    if (generarExcel) {
      const columnas = [
        { header: 'Cédula', key: 'employeeId', width: 15 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Días Trabajados', key: 'diasTrabajados', width: 15 },
        { header: 'Ausentes', key: 'ausentes', width: 12 },
        { header: 'Descansos', key: 'descansos', width: 12 },
        { header: 'No Marco Salida', key: 'noMarcoSalida', width: 15 },
        { header: 'Pendientes', key: 'pendientes', width: 12 },
        { header: 'Vacaciones', key: 'diasVacaciones', width: 12 },
        { header: 'Reposo Médico', key: 'diasReposoMedico', width: 14 },
        { header: 'Permiso Remunerado', key: 'diasPermisoRemunerado', width: 18 },
        { header: 'Permiso No Remunerado', key: 'diasPermisoNoRemunerado', width: 20 },
        { header: 'Falta Justificada', key: 'diasFaltaJustificada', width: 16 },
        { header: 'Falta Injustificada', key: 'diasFaltaInjustificada', width: 18 },
        // ⬇️ NUEVOS BREAK
        { header: 'Break OK', key: 'diasBreakCorrecto', width: 12 },
        { header: 'Break Exceso', key: 'diasBreakExceso', width: 14 },
        { header: 'Break Corto', key: 'diasBreakCorto', width: 12 },
        { header: 'Sin Break', key: 'diasBreakNoMarco', width: 12 },
        { header: 'Exceso Break', key: 'breakExcesoLegible', width: 15 },
        // RESTO
        { header: 'Retardo Total', key: 'retardoLegible', width: 15 },
        { header: 'Salida Temprana Total', key: 'salidaTempranaLegible', width: 20 },
        { header: 'Horas Diurnas', key: 'horasDiurnasLegible', width: 15 },
        { header: 'Horas Nocturnas', key: 'horasNocturnasLegible', width: 15 },
        { header: 'Extra Diurna', key: 'horasExtraDiurnasLegible', width: 15 },
        { header: 'Extra Nocturna', key: 'horasExtraNocturnasLegible', width: 15 },
        { header: 'Total Horas Extra', key: 'totalHorasExtraLegible', width: 18 },
        { header: 'Total Horas Trabajadas', key: 'totalHorasTrabajadasLegible', width: 22 },
      ];

      const filas = consolidado.map((c) => ({
        employeeId: c.employeeId,
        nombre: c.nombre,
        diasTrabajados: c.diasTrabajados,
        ausentes: c.ausentes,
        descansos: c.descansos,
        noMarcoSalida: c.noMarcoSalida,
        pendientes: c.pendientes,
        diasVacaciones: c.diasVacaciones,
        diasReposoMedico: c.diasReposoMedico,
        diasPermisoRemunerado: c.diasPermisoRemunerado,
        diasPermisoNoRemunerado: c.diasPermisoNoRemunerado,
        diasFaltaJustificada: c.diasFaltaJustificada,
        diasFaltaInjustificada: c.diasFaltaInjustificada,
        // BREAK
        diasBreakCorrecto: c.diasBreakCorrecto,
        diasBreakExceso: c.diasBreakExceso,
        diasBreakCorto: c.diasBreakCorto,
        diasBreakNoMarco: c.diasBreakNoMarco,
        breakExcesoLegible: c.breakExcesoLegible,
        // RESTO
        retardoLegible: c.retardoLegible,
        salidaTempranaLegible: c.salidaTempranaLegible,
        horasDiurnasLegible: c.horasDiurnasLegible,
        horasNocturnasLegible: c.horasNocturnasLegible,
        horasExtraDiurnasLegible: c.horasExtraDiurnasLegible,
        horasExtraNocturnasLegible: c.horasExtraNocturnasLegible,
        totalHorasExtraLegible: c.totalHorasExtraLegible,
        totalHorasTrabajadasLegible: c.totalHorasTrabajadasLegible,
      }));

      const buffer = await this.generarExcelBuffer('Reporte Semanal', columnas, filas);
      return new StreamableFile(buffer, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: `attachment; filename="reporte_${rango.desde}_a_${rango.hasta}.xlsx"`,
      });
    }

    const resultado = { success: true, rango, totalEmpleados: consolidado.length, reporte: consolidado };

    if (!generarExcel) {
      this.reporteSemanalCache.set(cacheKey, { data: resultado, timestamp: Date.now() });
      if (this.reporteSemanalCache.size > 20) {
        const k = this.reporteSemanalCache.keys().next().value;
        if (k) this.reporteSemanalCache.delete(k);
      }
    }

    return resultado;
  }

  // ============ REPORTE MENSUAL ============
  async generarReporteMensualNomina(mes?: string, generarExcel = false) {
    const cacheKey = mes || new Date().toISOString().slice(0, 7);
    if (!generarExcel) {
      const cached = this.reporteMensualCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.REPORTE_CACHE_TTL) {
        this.logger.log(`⚡ Reporte mensual desde cache: ${cacheKey}`);
        return cached.data;
      }
    }

    let año: number;
    let mesNum: number;
    if (mes) {
      const [y, m] = mes.split('-').map(Number);
      año = y;
      mesNum = m - 1;
    } else {
      const hoy = new Date();
      año = hoy.getFullYear();
      mesNum = hoy.getMonth();
    }

    const desde = new Date(año, mesNum, 1);
    const hasta = new Date(año, mesNum + 1, 0);

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    if (desde > hoy) {
      return { success: false, message: 'No se puede generar reporte de un mes futuro' };
    }

    const limite = hasta > hoy ? hoy : hasta;

    const dias: Date[] = [];
    const cursor = new Date(año, mesNum, 1);
    while (cursor <= limite) {
      dias.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const nombreMes = desde.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });

    const marcajes = await this.marcajesStorage.obtenerMarcajesEnRango(desde, limite);
    const mapaNombres = await this.cache.obtenerMapaNombres();
    const activos = await this.cache.obtenerSetEmpleadosActivos();

    const empleados: { employeeId: string; nombre: string }[] = [];
    for (const asignacion of this.config.getAsignaciones()) {
      if (activos.size > 0 && !activos.has(String(asignacion.employeeId))) continue;
      empleados.push({
        employeeId: asignacion.employeeId,
        nombre: this.cache.resolverNombre(asignacion.employeeId, marcajes, mapaNombres),
      });
    }

    const consolidado: any[] = [];

    for (const emp of empleados) {
      const acc = {
        diasLaborables: 0, diasTrabajados: 0, ausentes: 0, descansos: 0,
        noMarcoSalida: 0, pendientes: 0, minutosRetardo: 0, minutosSalidaTemprana: 0,
        horasNormalesDiurnas: 0, horasNormalesNocturnas: 0,
        horasExtraDiurnas: 0, horasExtraNocturnas: 0,
        // NUEVOS - NOVEDADES
        diasVacaciones: 0,
        diasReposoMedico: 0,
        diasPermisoRemunerado: 0,
        diasPermisoNoRemunerado: 0,
        diasFaltaJustificada: 0,
        diasFaltaInjustificada: 0,
        // ⬇️ NUEVOS BREAK
        diasBreakCorrecto: 0,
        diasBreakExceso: 0,
        diasBreakCorto: 0,
        diasBreakNoMarco: 0,
        minutosBreakTotal: 0,
        minutosBreakExceso: 0,
      };

      for (const dia of dias) {
        const ev = await this.evaluacion.evaluarEmpleado(emp.employeeId, dia, emp.nombre, marcajes);
        switch (ev.estado) {
          case 'PUNTUAL':
          case 'RETARDO':
          case 'SALIDA_TEMPRANA':
          case 'COMPLETO':
            acc.diasTrabajados++;
            acc.diasLaborables++;
            break;
          case 'AUSENTE': acc.ausentes++; acc.diasLaborables++; break;
          case 'DESCANSO': acc.descansos++; break;
          case 'NO_MARCO_SALIDA': acc.noMarcoSalida++; acc.diasLaborables++; break;
          case 'PENDIENTE': acc.pendientes++; break;
          // NUEVOS - NOVEDADES
          case 'VACACIONES': acc.diasVacaciones++; acc.diasLaborables++; break;
          case 'REPOSO_MEDICO': acc.diasReposoMedico++; acc.diasLaborables++; break;
          case 'PERMISO_REMUNERADO': acc.diasPermisoRemunerado++; acc.diasLaborables++; break;
          case 'PERMISO_NO_REMUNERADO': acc.diasPermisoNoRemunerado++; acc.diasLaborables++; break;
          case 'FALTA_JUSTIFICADA': acc.diasFaltaJustificada++; acc.diasLaborables++; break;
          case 'FALTA_INJUSTIFICADA': acc.diasFaltaInjustificada++; acc.diasLaborables++; break;
        }
        acc.minutosRetardo += ev.minutosRetardo;
        acc.minutosSalidaTemprana += ev.minutosSalidaTemprana;
        acc.horasNormalesDiurnas += ev.horasDiurnas;
        acc.horasNormalesNocturnas += ev.horasNocturnas;
        acc.horasExtraDiurnas += ev.horasExtraDiurnas;
        acc.horasExtraNocturnas += ev.horasExtraNocturnas;

        // ⬇️ ACUMULAR BREAK
        if (ev.break) {
          acc.minutosBreakTotal += ev.break.duracionMin;
          acc.minutosBreakExceso += ev.break.excesoMin;
          if (ev.break.estado === 'CORRECTO') acc.diasBreakCorrecto++;
          if (ev.break.estado === 'EXCESO') acc.diasBreakExceso++;
          if (ev.break.estado === 'CORTO') acc.diasBreakCorto++;
          if (ev.break.estado === 'NO_MARCO') acc.diasBreakNoMarco++;
        }
      }

      const totalHorasNormales = Math.round((acc.horasNormalesDiurnas + acc.horasNormalesNocturnas) * 100) / 100;
      const totalHorasExtra = Math.round((acc.horasExtraDiurnas + acc.horasExtraNocturnas) * 100) / 100;
      const totalHoras = Math.round((totalHorasNormales + totalHorasExtra) * 100) / 100;

      consolidado.push({
        employeeId: emp.employeeId,
        nombre: emp.nombre,
        diasLaborables: acc.diasLaborables,
        diasTrabajados: acc.diasTrabajados,
        ausentes: acc.ausentes,
        descansos: acc.descansos,
        noMarcoSalida: acc.noMarcoSalida,
        pendientes: acc.pendientes,
        // NUEVOS - NOVEDADES
        diasVacaciones: acc.diasVacaciones,
        diasReposoMedico: acc.diasReposoMedico,
        diasPermisoRemunerado: acc.diasPermisoRemunerado,
        diasPermisoNoRemunerado: acc.diasPermisoNoRemunerado,
        diasFaltaJustificada: acc.diasFaltaJustificada,
        diasFaltaInjustificada: acc.diasFaltaInjustificada,
        // ⬇️ NUEVOS BREAK
        diasBreakCorrecto: acc.diasBreakCorrecto,
        diasBreakExceso: acc.diasBreakExceso,
        diasBreakCorto: acc.diasBreakCorto,
        diasBreakNoMarco: acc.diasBreakNoMarco,
        minutosBreakTotal: acc.minutosBreakTotal,
        breakTotalLegible: formatearMinutos(acc.minutosBreakTotal),
        minutosBreakExceso: acc.minutosBreakExceso,
        breakExcesoLegible: formatearMinutos(acc.minutosBreakExceso),
        // RESTO
        minutosRetardo: acc.minutosRetardo,
        retardoLegible: formatearMinutos(acc.minutosRetardo),
        minutosSalidaTemprana: acc.minutosSalidaTemprana,
        salidaTempranaLegible: formatearMinutos(acc.minutosSalidaTemprana),
        horasNormalesDiurnas: Math.round(acc.horasNormalesDiurnas * 100) / 100,
        horasNormalesNocturnas: Math.round(acc.horasNormalesNocturnas * 100) / 100,
        totalHorasNormales,
        horasNormalesDiurnasLegible: formatearHoras(acc.horasNormalesDiurnas),
        horasNormalesNocturnasLegible: formatearHoras(acc.horasNormalesNocturnas),
        totalHorasNormalesLegible: formatearHoras(totalHorasNormales),
        horasExtraDiurnas: Math.round(acc.horasExtraDiurnas * 100) / 100,
        horasExtraNocturnas: Math.round(acc.horasExtraNocturnas * 100) / 100,
        totalHorasExtra,
        horasExtraDiurnasLegible: formatearHoras(acc.horasExtraDiurnas),
        horasExtraNocturnasLegible: formatearHoras(acc.horasExtraNocturnas),
        totalHorasExtraLegible: formatearHoras(totalHorasExtra),
        totalHoras,
        totalHorasLegible: formatearHoras(totalHoras),
      });
    }

    consolidado.sort((a, b) => a.nombre.localeCompare(b.nombre));

    const rango = {
      mes: `${año}-${String(mesNum + 1).padStart(2, '0')}`,
      nombreMes,
      desde: formatoFechaLocal(desde),
      hasta: formatoFechaLocal(limite),
      totalDias: dias.length,
      esMesEnCurso: hasta > hoy,
    };

    if (generarExcel) {
      const columnas = [
        { header: 'Cédula', key: 'employeeId', width: 15 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Días Laborables', key: 'diasLaborables', width: 15 },
        { header: 'Días Trabajados', key: 'diasTrabajados', width: 15 },
        { header: 'Ausentes', key: 'ausentes', width: 12 },
        { header: 'Descansos', key: 'descansos', width: 12 },
        { header: 'No Marco Salida', key: 'noMarcoSalida', width: 15 },
        { header: 'Vacaciones', key: 'diasVacaciones', width: 12 },
        { header: 'Reposo Médico', key: 'diasReposoMedico', width: 14 },
        { header: 'Permiso Remunerado', key: 'diasPermisoRemunerado', width: 18 },
        { header: 'Permiso No Remunerado', key: 'diasPermisoNoRemunerado', width: 20 },
        { header: 'Falta Justificada', key: 'diasFaltaJustificada', width: 16 },
        { header: 'Falta Injustificada', key: 'diasFaltaInjustificada', width: 18 },
        // ⬇️ NUEVOS BREAK
        { header: 'Break OK', key: 'diasBreakCorrecto', width: 12 },
        { header: 'Break Exceso', key: 'diasBreakExceso', width: 14 },
        { header: 'Break Corto', key: 'diasBreakCorto', width: 12 },
        { header: 'Sin Break', key: 'diasBreakNoMarco', width: 12 },
        { header: 'Exceso Break', key: 'breakExcesoLegible', width: 15 },
        // RESTO
        { header: 'Horas Normales Diurnas', key: 'horasNormalesDiurnasLegible', width: 22 },
        { header: 'Horas Normales Nocturnas', key: 'horasNormalesNocturnasLegible', width: 22 },
        { header: 'Total Horas Normales', key: 'totalHorasNormalesLegible', width: 20 },
        { header: 'Horas Extra Diurnas', key: 'horasExtraDiurnasLegible', width: 20 },
        { header: 'Horas Extra Nocturnas', key: 'horasExtraNocturnasLegible', width: 20 },
        { header: 'Total Horas Extra', key: 'totalHorasExtraLegible', width: 18 },
        { header: 'Total Horas', key: 'totalHorasLegible', width: 15 },
        { header: 'Retardo Total', key: 'retardoLegible', width: 15 },
        { header: 'Salida Temprana Total', key: 'salidaTempranaLegible', width: 20 },
      ];

      const filas = consolidado.map((c) => ({
        employeeId: c.employeeId,
        nombre: c.nombre,
        diasLaborables: c.diasLaborables,
        diasTrabajados: c.diasTrabajados,
        ausentes: c.ausentes,
        descansos: c.descansos,
        noMarcoSalida: c.noMarcoSalida,
        diasVacaciones: c.diasVacaciones,
        diasReposoMedico: c.diasReposoMedico,
        diasPermisoRemunerado: c.diasPermisoRemunerado,
        diasPermisoNoRemunerado: c.diasPermisoNoRemunerado,
        diasFaltaJustificada: c.diasFaltaJustificada,
        diasFaltaInjustificada: c.diasFaltaInjustificada,
        // BREAK
        diasBreakCorrecto: c.diasBreakCorrecto,
        diasBreakExceso: c.diasBreakExceso,
        diasBreakCorto: c.diasBreakCorto,
        diasBreakNoMarco: c.diasBreakNoMarco,
        breakExcesoLegible: c.breakExcesoLegible,
        // RESTO
        horasNormalesDiurnasLegible: c.horasNormalesDiurnasLegible,
        horasNormalesNocturnasLegible: c.horasNormalesNocturnasLegible,
        totalHorasNormalesLegible: c.totalHorasNormalesLegible,
        horasExtraDiurnasLegible: c.horasExtraDiurnasLegible,
        horasExtraNocturnasLegible: c.horasExtraNocturnasLegible,
        totalHorasExtraLegible: c.totalHorasExtraLegible,
        totalHorasLegible: c.totalHorasLegible,
        retardoLegible: c.retardoLegible,
        salidaTempranaLegible: c.salidaTempranaLegible,
      }));

      const buffer = await this.generarExcelBuffer('Nómina Mensual', columnas, filas);
      return new StreamableFile(buffer, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: `attachment; filename="nomina_${rango.mes}.xlsx"`,
      });
    }

    const resultado = { success: true, rango, totalEmpleados: consolidado.length, reporte: consolidado };

    if (!generarExcel) {
      this.reporteMensualCache.set(cacheKey, { data: resultado, timestamp: Date.now() });
      if (this.reporteMensualCache.size > 20) {
        const k = this.reporteMensualCache.keys().next().value;
        if (k) this.reporteMensualCache.delete(k);
      }
    }

    return resultado;
  }

  // ============ EXCEL BUFFER ============
  private async generarExcelBuffer(
    nombreHoja: string,
    columnas: { header: string; key: string; width: number }[],
    filas: any[],
  ): Promise<Buffer> {
    const workbook: any = new Workbook();
    const worksheet: any = workbook.addWorksheet(nombreHoja);
    worksheet.columns = columnas;

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004080' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    for (const fila of filas) worksheet.addRow(fila);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
