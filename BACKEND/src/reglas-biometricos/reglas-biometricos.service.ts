import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { BiometricoService } from '../biometrico/biometrico.service';
import { Workbook } from 'exceljs';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface HorarioAsistencia {
  id: string;
  nombre: string;
  entrada: string;
  salida: string;
  toleranciaMin: number;
  diasLaborales: string[];
}

export interface ReglasConfig {
  horarios: HorarioAsistencia[];
}

export interface AsignacionTurno {
  employeeId: string;
  horarioId: string;
  diasLibresFijos?: string[];
}

export interface EvaluacionAsistencia {
  employeeId: string;
  nombre: string;
  fecha: string;
  horario: string;
  entradaReal: string | null;
  salidaReal: string | null;
  estado:
    | 'PUNTUAL'
    | 'RETARDO'
    | 'SALIDA_TEMPRANA'
    | 'COMPLETO'
    | 'AUSENTE'
    | 'DESCANSO'
    | 'SIN_HORARIO'
    | 'PENDIENTE'
    | 'NO_MARCO_SALIDA';
  minutosRetardo: number;
  minutosSalidaTemprana: number;
  horasExtra: number;
  retardoLegible: string;
  salidaTempranaLegible: string;
  tipoTurno?: 'DIURNO' | 'NOCTURNO';

  horasDiurnas: number;
  horasNocturnas: number;
  horasExtraDiurnas: number;
  horasExtraNocturnas: number;
  horasDiurnasLegible: string;
  horasNocturnasLegible: string;
  horasExtraDiurnasLegible: string;
  horasExtraNocturnasLegible: string;
}

@Injectable()
export class ReglasBiometricosService {
  private readonly logger = new Logger(ReglasBiometricosService.name);
  private reglasPath = path.join(process.cwd(), 'reglas_asistencia.json');
  private asignacionesPath = path.join(process.cwd(), 'asignaciones_turnos.json');
  private marcajesPath = path.join(process.cwd(), 'marcajes.json');
  private diasLibresPath = path.join(process.cwd(), 'dias_libres.json');

  private readonly HORA_NOCTURNA = '19:00';

  private reglas!: ReglasConfig;
  private asignaciones!: AsignacionTurno[];
  private diasLibres: Record<string, Record<string, string[]>> = {};

  private horaBiometricoCache: Date | null = null;
  private horaBiometricoCacheTime = 0;

  // 🔑 Cache de empleados activos (TTL: 30 segundos)
  private empleadosActivosCache: Set<string> | null = null;
  private empleadosActivosCacheTime = 0;

  // 🔑 Cache del reporte semanal (TTL: 5 minutos)
  private reporteSemanalCache = new Map<string, { data: any; timestamp: number }>();
  private readonly REPORTE_CACHE_TTL = 5 * 60 * 1000; // 5 min

  // 🔑 Cache del reporte mensual (TTL: 5 minutos)
  private reporteMensualCache = new Map<string, { data: any; timestamp: number }>();

  private readonly todosLosDias = [
    'domingo',
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
  ];

  constructor(private readonly biometricoService: BiometricoService) {
    this.inicializarReglas();
    this.inicializarAsignaciones();
    this.inicializarDiasLibres();
  }

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

  private guardarReglas() {
    fs.writeFileSync(this.reglasPath, JSON.stringify(this.reglas, null, 2), 'utf-8');
  }

  private guardarAsignaciones() {
    fs.writeFileSync(this.asignacionesPath, JSON.stringify(this.asignaciones, null, 2), 'utf-8');
  }

  private guardarDiasLibres() {
    fs.writeFileSync(this.diasLibresPath, JSON.stringify(this.diasLibres, null, 2), 'utf-8');
  }

  getReglas() {
    return this.reglas;
  }

  private async obtenerHoraCache(): Promise<Date> {
    const ahora = Date.now();
    if (this.horaBiometricoCache && ahora - this.horaBiometricoCacheTime < 30000) {
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

  /**
   * 🔑 Cache de empleados activos (evita golpear el biométrico en cada evaluación)
   */
  private async obtenerSetEmpleadosActivos(forceRefresh = false): Promise<Set<string>> {
    const ahora = Date.now();

    if (
      !forceRefresh &&
      this.empleadosActivosCache &&
      ahora - this.empleadosActivosCacheTime < 30000
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

  /**
   * 🔑 Validar si un empleado está activo
   */
  private async validarEmpleadoActivo(employeeId: string): Promise<{
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

  /**
   * 🔑 Limpiar caches de reportes (cuando se modifica algo)
   */
  private limpiarCachesReportes() {
    this.reporteSemanalCache.clear();
    this.reporteMensualCache.clear();
    this.logger.log('🧹 Caches de reportes limpiados');
  }

  async getAsignaciones(semana?: string, generarExcel = false) {
    let semanaClave: string;
    if (semana) {
      const [year, month, day] = semana.split('-').map(Number);
      const fecha = new Date(year, month - 1, day);
      semanaClave = this.obtenerInicioSemana(fecha);
    } else {
      semanaClave = this.obtenerInicioSemana(new Date());
    }

    const marcajes = this.leerMarcajes();
    const resultado: any[] = [];
    const mapaNombres = await this.obtenerMapaNombres();

    const activos = await this.obtenerSetEmpleadosActivos();

    for (const a of this.asignaciones) {
      if (activos.size > 0 && !activos.has(String(a.employeeId))) {
        continue;
      }

      const diasLibresRotativos = this.diasLibres[a.employeeId]?.[semanaClave] || [];
      const nombre = this.resolverNombre(a.employeeId, marcajes, mapaNombres);
      const horario = this.reglas.horarios.find((h) => h.id === a.horarioId);

      resultado.push({
        employeeId: a.employeeId,
        nombre,
        horarioId: a.horarioId,
        horarioNombre: horario?.nombre || 'SIN HORARIO',
        entrada: horario?.entrada || '',
        salida: horario?.salida || '',
        diasLibresFijos: a.diasLibresFijos || [],
        diasLibresRotativos,
        diasLibresEfectivos:
          diasLibresRotativos.length > 0
            ? diasLibresRotativos
            : a.diasLibresFijos || [],
        semana: semanaClave,
      });
    }

    if (generarExcel) {
      const columnas = [
        { header: 'Cédula', key: 'employeeId', width: 15 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Horario', key: 'horarioNombre', width: 25 },
        { header: 'Entrada', key: 'entrada', width: 12 },
        { header: 'Salida', key: 'salida', width: 12 },
        { header: 'Días Libres Fijos', key: 'diasLibresFijos', width: 25 },
        { header: 'Días Libres Rotativos', key: 'diasLibresRotativos', width: 25 },
        { header: 'Días Libres Efectivos', key: 'diasLibresEfectivos', width: 25 },
        { header: 'Semana', key: 'semana', width: 18 },
      ];

      const filas = resultado.map((r) => ({
        employeeId: r.employeeId,
        nombre: r.nombre,
        horarioNombre: r.horarioNombre,
        entrada: r.entrada,
        salida: r.salida,
        diasLibresFijos: r.diasLibresFijos.join(', '),
        diasLibresRotativos: r.diasLibresRotativos.join(', '),
        diasLibresEfectivos: r.diasLibresEfectivos.join(', '),
        semana: r.semana,
      }));

      const buffer = await this.generarExcelBuffer('Asignaciones', columnas, filas);

      return new StreamableFile(buffer, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: `attachment; filename="asignaciones_${semanaClave}.xlsx"`,
      });
    }

    return {
      semana: semanaClave,
      total: resultado.length,
      asignaciones: resultado,
    };
  }

  getDiasLibres() {
    return this.diasLibres;
  }

  async asignarHorario(
    employeeId: string,
    horarioId: string,
    diasLibresFijos?: string[],
  ) {
    const horarioExiste = this.reglas.horarios.some((h) => h.id === horarioId);
    if (!horarioExiste) {
      return { success: false, message: 'Horario no válido' };
    }

    const validacion = await this.validarEmpleadoActivo(employeeId);
    if (!validacion.activo) {
      return {
        success: false,
        message: validacion.mensaje || 'El empleado no está activo.',
      };
    }

    const existente = this.asignaciones.find((a) => a.employeeId === employeeId);
    if (existente) {
      existente.horarioId = horarioId;
      existente.diasLibresFijos = diasLibresFijos;
    } else {
      this.asignaciones.push({ employeeId, horarioId, diasLibresFijos });
    }
    this.guardarAsignaciones();
    this.limpiarCachesReportes();

    return {
      success: true,
      message: `Horario ${horarioId} asignado al empleado ${employeeId}`,
    };
  }

  async asignarDiasLibres(employeeId: string, semana: string, diasLibres: string[]) {
    const validacion = await this.validarEmpleadoActivo(employeeId);
    if (!validacion.activo) {
      return {
        success: false,
        message: validacion.mensaje || 'El empleado no está activo.',
      };
    }

    const [year, month, day] = semana.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    const semanaClave = this.obtenerInicioSemana(fecha);

    if (!this.diasLibres[employeeId]) {
      this.diasLibres[employeeId] = {};
    }
    this.diasLibres[employeeId][semanaClave] = diasLibres;
    this.guardarDiasLibres();
    this.limpiarCachesReportes();
    return { success: true, message: 'Días libres asignados' };
  }

  private obtenerInicioSemana(fecha: Date): string {
    const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const day = d.getDay();
    const diff = day === 0 ? 0 : -day;
    d.setDate(d.getDate() + diff);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${dayStr}`;
  }

  private obtenerDiasLibresSemana(employeeId: string, fecha: Date): string[] {
    const semana = this.obtenerInicioSemana(fecha);
    return this.diasLibres[employeeId]?.[semana] || [];
  }

  private obtenerHorarioAsignado(
    employeeId: string,
    fecha?: Date,
  ): HorarioAsistencia | null {
    const asignacion = this.asignaciones.find((a) => a.employeeId === employeeId);
    if (asignacion) {
      const horario = this.reglas.horarios.find((h) => h.id === asignacion.horarioId);
      if (horario) {
        if (fecha) {
          let diasLibres = this.obtenerDiasLibresSemana(employeeId, fecha);

          if (diasLibres.length === 0 && asignacion.diasLibresFijos?.length) {
            diasLibres = asignacion.diasLibresFijos;
          }

          const diasLaborales = this.todosLosDias.filter(
            (d) => !diasLibres.includes(d),
          );
          return { ...horario, diasLaborales };
        }
        return horario;
      }
    }
    return null;
  }

  private horaAMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  private obtenerMinutosDeFecha(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
  }

  private obtenerDiaSemana(fecha: Date): string {
    const dias = [
      'domingo',
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
    ];
    return dias[fecha.getDay()];
  }

  private leerMarcajes(): any[] {
    if (!fs.existsSync(this.marcajesPath)) return [];
    const data = fs.readFileSync(this.marcajesPath, 'utf-8');
    return data ? JSON.parse(data) : [];
  }

  private async obtenerMapaNombres(): Promise<Map<string, string>> {
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

  private resolverNombre(
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

  private async obtenerNombreEmpleado(
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

  private formatearMinutos(minutos: number): string {
    if (minutos <= 0) return '0m';
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  }

  private formatearHoras(horas: number): string {
    if (horas <= 0) return '0h';
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  async evaluarEmpleado(
    employeeId: string,
    fecha: Date,
    employeeName?: string,
    marcajesCache?: any[],
  ): Promise<EvaluacionAsistencia> {
    if (!marcajesCache) {
      const activos = await this.obtenerSetEmpleadosActivos();
      if (activos.size > 0 && !activos.has(String(employeeId))) {
        throw new Error(
          `El empleado con cédula ${employeeId} está desactivado o no existe en el biométrico.`,
        );
      }
    }

    const marcajes = marcajesCache || this.leerMarcajes();
    const marcajesEmpleado = marcajes.filter((m) => m.employeeId === employeeId);
    const horario = this.obtenerHorarioAsignado(employeeId, fecha);
    const nombre =
      employeeName || (await this.obtenerNombreEmpleado(employeeId, marcajes));

    if (!horario) {
      return {
        employeeId,
        nombre,
        fecha: fecha.toLocaleDateString('es-VE'),
        horario: 'SIN ASIGNAR',
        entradaReal: null,
        salidaReal: null,
        estado: 'SIN_HORARIO',
        minutosRetardo: 0,
        minutosSalidaTemprana: 0,
        horasExtra: 0,
        retardoLegible: '0m',
        salidaTempranaLegible: '0m',
        horasDiurnas: 0,
        horasNocturnas: 0,
        horasExtraDiurnas: 0,
        horasExtraNocturnas: 0,
        horasDiurnasLegible: '0h',
        horasNocturnasLegible: '0h',
        horasExtraDiurnasLegible: '0h',
        horasExtraNocturnasLegible: '0h',
      };
    }

    const diaSemana = this.obtenerDiaSemana(fecha);

    const marcajesDia = marcajesEmpleado.filter((m) => {
      const d = new Date(m.timestamp);
      return d.toLocaleDateString('es-VE') === fecha.toLocaleDateString('es-VE');
    });

    if (marcajesDia.length === 0) {
      const estado = horario.diasLaborales.includes(diaSemana) ? 'AUSENTE' : 'DESCANSO';
      return {
        employeeId,
        nombre,
        fecha: fecha.toLocaleDateString('es-VE'),
        horario: horario.nombre,
        entradaReal: null,
        salidaReal: null,
        estado,
        minutosRetardo: 0,
        minutosSalidaTemprana: 0,
        horasExtra: 0,
        retardoLegible: '0m',
        salidaTempranaLegible: '0m',
        horasDiurnas: 0,
        horasNocturnas: 0,
        horasExtraDiurnas: 0,
        horasExtraNocturnas: 0,
        horasDiurnasLegible: '0h',
        horasNocturnasLegible: '0h',
        horasExtraDiurnasLegible: '0h',
        horasExtraNocturnasLegible: '0h',
      };
    }

    marcajesDia.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const entradaReal = marcajesDia[0];
    const salidaReal = marcajesDia.length >= 2 ? marcajesDia[marcajesDia.length - 1] : null;

    if (!salidaReal) {
      const ahora = await this.obtenerHoraCache();
      const esMismoDia = ahora.toDateString() === fecha.toDateString();

      if (!esMismoDia) {
        return {
          employeeId,
          nombre,
          fecha: fecha.toLocaleDateString('es-VE'),
          horario: horario.nombre,
          entradaReal: entradaReal.horaLocal,
          salidaReal: null,
          estado: 'NO_MARCO_SALIDA',
          minutosRetardo: 0,
          minutosSalidaTemprana: 0,
          horasExtra: 0,
          retardoLegible: '0m',
          salidaTempranaLegible: '0m',
          horasDiurnas: 0,
          horasNocturnas: 0,
          horasExtraDiurnas: 0,
          horasExtraNocturnas: 0,
          horasDiurnasLegible: '0h',
          horasNocturnasLegible: '0h',
          horasExtraDiurnasLegible: '0h',
          horasExtraNocturnasLegible: '0h',
        };
      } else {
        return {
          employeeId,
          nombre,
          fecha: fecha.toLocaleDateString('es-VE'),
          horario: horario.nombre,
          entradaReal: entradaReal.horaLocal,
          salidaReal: null,
          estado: 'PENDIENTE',
          minutosRetardo: 0,
          minutosSalidaTemprana: 0,
          horasExtra: 0,
          retardoLegible: '0m',
          salidaTempranaLegible: '0m',
          horasDiurnas: 0,
          horasNocturnas: 0,
          horasExtraDiurnas: 0,
          horasExtraNocturnas: 0,
          horasDiurnasLegible: '0h',
          horasNocturnasLegible: '0h',
          horasExtraDiurnasLegible: '0h',
          horasExtraNocturnasLegible: '0h',
        };
      }
    }

    if (!horario.diasLaborales.includes(diaSemana)) {
      return {
        employeeId,
        nombre,
        fecha: fecha.toLocaleDateString('es-VE'),
        horario: horario.nombre,
        entradaReal: entradaReal.horaLocal,
        salidaReal: salidaReal.horaLocal,
        estado: 'DESCANSO',
        minutosRetardo: 0,
        minutosSalidaTemprana: 0,
        horasExtra: 0,
        retardoLegible: '0m',
        salidaTempranaLegible: '0m',
        horasDiurnas: 0,
        horasNocturnas: 0,
        horasExtraDiurnas: 0,
        horasExtraNocturnas: 0,
        horasDiurnasLegible: '0h',
        horasNocturnasLegible: '0h',
        horasExtraDiurnasLegible: '0h',
        horasExtraNocturnasLegible: '0h',
      };
    }

    const entradaMin = this.obtenerMinutosDeFecha(new Date(entradaReal.timestamp));
    const salidaMin = this.obtenerMinutosDeFecha(new Date(salidaReal.timestamp));
    const entradaEsperada = this.horaAMinutos(horario.entrada);
    const salidaEsperada = this.horaAMinutos(horario.salida);

    const minutosRetardo = Math.max(0, entradaMin - entradaEsperada - horario.toleranciaMin);
    const minutosSalidaTemprana = Math.max(0, salidaEsperada - salidaMin);

    const HORA_NOCTURNA = this.horaAMinutos(this.HORA_NOCTURNA);
    const duracionTurnoMin =
      this.horaAMinutos(horario.salida) - this.horaAMinutos(horario.entrada);
    const tiempoTrabajadoMin = salidaMin - entradaMin;

    let horasDiurnas = 0;
    let horasNocturnas = 0;
    let horasExtraDiurnas = 0;
    let horasExtraNocturnas = 0;

    const entradaHorarioMin = this.horaAMinutos(horario.entrada);
    const salidaHorarioMin = this.horaAMinutos(horario.salida);

    if (salidaHorarioMin <= HORA_NOCTURNA) {
      horasDiurnas = Math.min(duracionTurnoMin, tiempoTrabajadoMin) / 60;

      if (salidaMin > HORA_NOCTURNA) {
        horasExtraDiurnas = (HORA_NOCTURNA - salidaHorarioMin) / 60;
        horasExtraNocturnas = (salidaMin - HORA_NOCTURNA) / 60;
      } else if (salidaMin > salidaHorarioMin) {
        horasExtraDiurnas = (salidaMin - salidaHorarioMin) / 60;
      }
    } else {
      const parteDiurnaNormal = HORA_NOCTURNA - entradaHorarioMin;
      const totalNormalMin = duracionTurnoMin;

      if (tiempoTrabajadoMin >= parteDiurnaNormal) {
        horasDiurnas = parteDiurnaNormal / 60;
      } else {
        horasDiurnas = tiempoTrabajadoMin / 60;
      }

      horasNocturnas = Math.max(
        0,
        (Math.min(tiempoTrabajadoMin, totalNormalMin) - parteDiurnaNormal) / 60,
      );

      if (tiempoTrabajadoMin > totalNormalMin) {
        const extraMin = tiempoTrabajadoMin - totalNormalMin;
        const extraAntesDeNoche = Math.max(0, HORA_NOCTURNA - salidaHorarioMin);
        horasExtraDiurnas = Math.min(extraMin, extraAntesDeNoche) / 60;
        horasExtraNocturnas = Math.max(0, extraMin - extraAntesDeNoche) / 60;
      }
    }

    horasDiurnas = Math.round(horasDiurnas * 100) / 100;
    horasNocturnas = Math.round(horasNocturnas * 100) / 100;
    horasExtraDiurnas = Math.round(horasExtraDiurnas * 100) / 100;
    horasExtraNocturnas = Math.round(horasExtraNocturnas * 100) / 100;

    const tipoTurno = salidaMin >= HORA_NOCTURNA ? 'NOCTURNO' : 'DIURNO';
    const horasExtra =
      Math.round((horasExtraDiurnas + horasExtraNocturnas) * 100) / 100;

    let estado: EvaluacionAsistencia['estado'] = 'PUNTUAL';
    if (minutosRetardo > 0 && minutosSalidaTemprana === 0) estado = 'RETARDO';
    if (minutosSalidaTemprana > 0 && minutosRetardo === 0) estado = 'SALIDA_TEMPRANA';
    if (minutosRetardo > 0 && minutosSalidaTemprana > 0) estado = 'SALIDA_TEMPRANA';

    return {
      employeeId,
      nombre,
      fecha: fecha.toLocaleDateString('es-VE'),
      horario: horario.nombre,
      entradaReal: entradaReal.horaLocal,
      salidaReal: salidaReal.horaLocal,
      estado,
      minutosRetardo,
      minutosSalidaTemprana,
      horasExtra,
      retardoLegible: this.formatearMinutos(minutosRetardo),
      salidaTempranaLegible: this.formatearMinutos(minutosSalidaTemprana),
      tipoTurno,
      horasDiurnas,
      horasNocturnas,
      horasExtraDiurnas,
      horasExtraNocturnas,
      horasDiurnasLegible: this.formatearHoras(horasDiurnas),
      horasNocturnasLegible: this.formatearHoras(horasNocturnas),
      horasExtraDiurnasLegible: this.formatearHoras(horasExtraDiurnas),
      horasExtraNocturnasLegible: this.formatearHoras(horasExtraNocturnas),
    };
  }

  async generarReporteDiario(fecha: Date, generarExcel = false) {
    const marcajes = this.leerMarcajes();
    const mapaNombres = await this.obtenerMapaNombres();

    const activos = await this.obtenerSetEmpleadosActivos();

    const empleados: { employeeId: string; nombre: string }[] = [];
    for (const asignacion of this.asignaciones) {
      if (activos.size > 0 && !activos.has(String(asignacion.employeeId))) {
        continue;
      }

      empleados.push({
        employeeId: asignacion.employeeId,
        nombre: this.resolverNombre(asignacion.employeeId, marcajes, mapaNombres),
      });
    }

    const reporte: EvaluacionAsistencia[] = [];
    for (const emp of empleados) {
      const evaluacion = await this.evaluarEmpleado(
        emp.employeeId,
        fecha,
        emp.nombre,
        marcajes,
      );
      reporte.push(evaluacion);
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
        employeeId: emp.employeeId,
        nombre: emp.nombre,
        fecha: emp.fecha,
        horario: emp.horario,
        entradaReal: emp.entradaReal || 'Sin marcar',
        salidaReal: emp.salidaReal || 'Sin marcar',
        estado: emp.estado,
        retardoLegible: emp.retardoLegible,
        salidaTempranaLegible: emp.salidaTempranaLegible,
        horasExtra: emp.horasExtra,
        tipoTurno: emp.tipoTurno || '',
        horasDiurnasLegible: emp.horasDiurnasLegible,
        horasNocturnasLegible: emp.horasNocturnasLegible,
        horasExtraDiurnasLegible: emp.horasExtraDiurnasLegible,
        horasExtraNocturnasLegible: emp.horasExtraNocturnasLegible,
      }));

      const buffer = await this.generarExcelBuffer('Reporte Diario', columnas, filas);

      return new StreamableFile(buffer, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: `attachment; filename="reporte_diario_${fecha
          .toISOString()
          .slice(0, 10)}.xlsx"`,
      });
    }

    return {
      fecha: fecha.toLocaleDateString('es-VE'),
      totalEmpleados: reporte.length,
      reporte,
    };
  }

  async validarSalidasPendientes(fecha: Date, generarExcel = false) {
    const ahora = await this.obtenerHoraCache();
    const esFechaPasada =
      fecha.toDateString() !== ahora.toDateString() && fecha < ahora;

    if (!esFechaPasada) {
      return {
        success: false,
        message: 'La fecha debe ser anterior a hoy para validar salidas',
      };
    }

    const marcajes = this.leerMarcajes();
    const mapaNombres = await this.obtenerMapaNombres();

    const activos = await this.obtenerSetEmpleadosActivos();

    const resultados: EvaluacionAsistencia[] = [];

    for (const asignacion of this.asignaciones) {
      const empId = asignacion.employeeId;

      if (activos.size > 0 && !activos.has(String(empId))) {
        continue;
      }

      const nombre = this.resolverNombre(empId, marcajes, mapaNombres);
      const evaluacion = await this.evaluarEmpleado(empId, fecha, nombre, marcajes);

      if (evaluacion.estado === 'PENDIENTE' || evaluacion.estado === 'NO_MARCO_SALIDA') {
        let evaluacionFinal: EvaluacionAsistencia = { ...evaluacion };

        if (evaluacion.estado === 'PENDIENTE') {
          evaluacionFinal = {
            ...evaluacionFinal,
            estado: 'NO_MARCO_SALIDA',
            salidaReal: null,
            minutosSalidaTemprana: 0,
            salidaTempranaLegible: '0m',
          };
        }

        resultados.push(evaluacionFinal);
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
        disposition: `attachment; filename="salidas_pendientes_${fecha
          .toISOString()
          .slice(0, 10)}.xlsx"`,
      });
    }

    return {
      success: true,
      fecha: fecha.toLocaleDateString('es-VE'),
      totalValidados: resultados.length,
      resultados,
    };
  }

  private async generarExcelBuffer(
    nombreHoja: string,
    columnas: { header: string; key: string; width: number }[],
    filas: any[],
  ): Promise<Buffer> {
    const workbook: any = new (Workbook as any)();
    const worksheet: any = workbook.addWorksheet(nombreHoja);

    worksheet.columns = columnas;

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '004080' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    for (const fila of filas) {
      worksheet.addRow(fila);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generarPlantillaAsignaciones(mes?: string): Promise<StreamableFile> {
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

    const domingos: Date[] = [];
    const ultimoDia = new Date(año, mesNum + 1, 0).getDate();
    for (let d = 1; d <= ultimoDia; d++) {
      const fecha = new Date(año, mesNum, d);
      if (fecha.getDay() === 0) {
        domingos.push(fecha);
      }
    }

    const formatoFecha = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

    const nombreMes = new Date(año, mesNum, 1).toLocaleDateString('es-VE', {
      month: 'long',
      year: 'numeric',
    });

    const workbook: any = new (Workbook as any)();

    const marcajes = this.leerMarcajes();
    const mapaNombres = new Map<string, string>();

    let empleadosBiometrico: any[] = [];
    try {
      const usuarios = await this.biometricoService.listUsers(
        '172.18.0.89',
        'admin',
        'Dtd2026*',
        true,
      );
      if (usuarios?.success && Array.isArray(usuarios.usuarios)) {
        empleadosBiometrico = usuarios.usuarios;
        empleadosBiometrico.forEach((u: any) => mapaNombres.set(u.employeeNo, u.name));
      }
    } catch {}

    const idsAsignados = new Set(this.asignaciones.map((a) => a.employeeId));

    const listaEmpleados: { employeeId: string; nombre: string }[] = [];

    empleadosBiometrico
      .filter((u: any) => u.activo !== false)
      .forEach((u: any) => {
        listaEmpleados.push({
          employeeId: u.employeeNo,
          nombre: u.name,
        });
      });

    for (const id of idsAsignados) {
      if (!listaEmpleados.some((e) => e.employeeId === id)) {
        const empleadoBio = empleadosBiometrico.find((u: any) => u.employeeNo === id);
        if (empleadoBio && empleadoBio.activo === false) {
          continue;
        }

        const nombre =
          mapaNombres.get(id) || (await this.obtenerNombreEmpleado(id, marcajes));
        listaEmpleados.push({ employeeId: id, nombre });
      }
    }

    listaEmpleados.sort((a, b) => a.nombre.localeCompare(b.nombre));

    const hojaAsignaciones: any = workbook.addWorksheet('Asignaciones');

    const columnasFijas = [
      { header: 'Cédula', key: 'employeeId', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Horario', key: 'horarioId', width: 18 },
      { header: 'Días Libres Fijos', key: 'diasLibresFijos', width: 22 },
    ];

    const columnasSemanas = domingos.map((dom, idx) => ({
      header: `Libres Sem ${idx + 1} (${formatoFecha(dom)})`,
      key: `sem${idx + 1}`,
      width: 22,
    }));

    hojaAsignaciones.columns = [...columnasFijas, ...columnasSemanas];

    const headerAsignaciones = hojaAsignaciones.getRow(1);
    headerAsignaciones.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerAsignaciones.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '004080' },
    };
    headerAsignaciones.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    headerAsignaciones.height = 32;

    for (const emp of listaEmpleados) {
      const asignacion = this.asignaciones.find((a) => a.employeeId === emp.employeeId);

      const fila: any = {
        employeeId: emp.employeeId,
        nombre: emp.nombre,
        horarioId: asignacion?.horarioId || '',
        diasLibresFijos: asignacion?.diasLibresFijos?.join(', ') || '',
      };

      domingos.forEach((dom, idx) => {
        const semanaClave = formatoFecha(dom);
        const diasRotativos = this.diasLibres[emp.employeeId]?.[semanaClave] || [];

        const diasEfectivos =
          diasRotativos.length > 0
            ? diasRotativos
            : asignacion?.diasLibresFijos || [];

        fila[`sem${idx + 1}`] = diasEfectivos.join(', ');
      });

      const nuevaFila = hojaAsignaciones.addRow(fila);

      const colorFondo = asignacion ? 'E2EFDA' : 'FFF2CC';

      nuevaFila.eachCell((cell: any) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colorFondo },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'D0D0D0' } },
          left: { style: 'thin', color: { argb: 'D0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
          right: { style: 'thin', color: { argb: 'D0D0D0' } },
        };
      });
    }

    const hojaLeyenda: any = workbook.addWorksheet('Leyenda');
    hojaLeyenda.columns = [
      { header: 'Color', key: 'color', width: 15 },
      { header: 'Significado', key: 'significado', width: 60 },
    ];

    const headerLeyenda = hojaLeyenda.getRow(1);
    headerLeyenda.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerLeyenda.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '004080' },
    };
    headerLeyenda.alignment = { vertical: 'middle', horizontal: 'center' };

    const filaVerde = hojaLeyenda.addRow({
      color: 'Verde',
      significado: 'Empleado CON asignación de horario',
    });
    filaVerde.eachCell((cell: any) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } };
    });

    const filaAmarilla = hojaLeyenda.addRow({
      color: 'Amarillo',
      significado: 'Empleado SIN asignación - completar',
    });
    filaAmarilla.eachCell((cell: any) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
    });

    hojaLeyenda.addRow({ color: '', significado: '' });
    hojaLeyenda.addRow({
      color: 'Nota 1',
      significado:
        'Las columnas de semana muestran los días libres EFECTIVOS (rotativos si existen, si no los fijos).',
    });
    hojaLeyenda.addRow({
      color: 'Nota 2',
      significado:
        'Los días rotativos SOBREESCRIBEN a los fijos. Si una celda de semana queda vacía, se usa la columna "Días Libres Fijos".',
    });

    const hojaInstrucciones: any = workbook.addWorksheet('Instrucciones');
    hojaInstrucciones.columns = [
      { header: 'Campo', key: 'campo', width: 35 },
      { header: 'Descripción', key: 'descripcion', width: 90 },
    ];

    const headerInstrucciones = hojaInstrucciones.getRow(1);
    headerInstrucciones.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerInstrucciones.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '004080' },
    };
    headerInstrucciones.alignment = { vertical: 'middle', horizontal: 'center' };

    hojaInstrucciones.addRows([
      { campo: `📅 Mes: ${nombreMes}`, descripcion: `Semanas incluidas: ${domingos.length}` },
      { campo: '', descripcion: '' },
      { campo: 'Cédula', descripcion: 'Solo números. Debe existir en el biométrico.' },
      { campo: 'Nombre', descripcion: 'Referencia. El sistema toma el nombre del biométrico.' },
      { campo: 'Horario', descripcion: 'ID del horario. Ver hoja "Horarios Válidos". Aplica todo el mes.' },
      { campo: 'Días Libres Fijos', descripcion: 'Se repiten TODAS las semanas. Ej: sábado, domingo.' },
      {
        campo: 'Libres Sem N (fecha)',
        descripcion:
          'Días libres rotativos SOLO para esa semana. Si lo dejas vacío o repites los fijos, se usan los fijos.',
      },
      { campo: '', descripcion: '' },
      { campo: '🎨 Colores', descripcion: '' },
      { campo: '🟢 Verde', descripcion: 'Empleado con asignación actual.' },
      { campo: '🟡 Amarillo', descripcion: 'Empleado sin asignación - completar datos.' },
      { campo: '', descripcion: '' },
      { campo: '✅ Reglas', descripcion: '' },
      { campo: '1', descripcion: 'Una fila por empleado.' },
      { campo: '2', descripcion: 'Rotativos SOBREESCRIBEN a fijos.' },
      { campo: '3', descripcion: 'Días válidos: lunes, martes, miércoles, jueves, viernes, sábado, domingo.' },
      { campo: '4', descripcion: 'La semana inicia DOMINGO y termina SÁBADO.' },
      { campo: '5', descripcion: 'Si no cambias nada en una semana, se usan los días fijos.' },
    ]);

    const hojaHorarios: any = workbook.addWorksheet('Horarios Válidos');
    hojaHorarios.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Entrada', key: 'entrada', width: 12 },
      { header: 'Salida', key: 'salida', width: 12 },
    ];

    const headerHorarios = hojaHorarios.getRow(1);
    headerHorarios.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerHorarios.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '004080' },
    };
    headerHorarios.alignment = { vertical: 'middle', horizontal: 'center' };

    for (const h of this.reglas.horarios) {
      hojaHorarios.addRow({
        id: h.id,
        nombre: h.nombre,
        entrada: h.entrada,
        salida: h.salida,
      });
    }

    const hojaEmpleados: any = workbook.addWorksheet('Empleados Activos');
    hojaEmpleados.columns = [
      { header: 'Cédula', key: 'employeeId', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 35 },
    ];

    const headerEmpleados = hojaEmpleados.getRow(1);
    headerEmpleados.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerEmpleados.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '004080' },
    };
    headerEmpleados.alignment = { vertical: 'middle', horizontal: 'center' };

    empleadosBiometrico
      .filter((u: any) => u.activo !== false)
      .forEach((u: any) => {
        hojaEmpleados.addRow({
          employeeId: u.employeeNo,
          nombre: u.name,
        });
      });

    const buffer = await workbook.xlsx.writeBuffer();

    return new StreamableFile(Buffer.from(buffer), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="plantilla_asignaciones_${año}-${String(
        mesNum + 1,
      ).padStart(2, '0')}.xlsx"`,
    });
  }

  private normalizarDia(dia: string): string {
    const limpio = dia.trim().toLowerCase();

    const mapa: Record<string, string> = {
      lunes: 'lunes',
      martes: 'martes',
      miercoles: 'miércoles',
      miércoles: 'miércoles',
      jueves: 'jueves',
      viernes: 'viernes',
      sabado: 'sábado',
      sábado: 'sábado',
      domingo: 'domingo',
    };

    return mapa[limpio] || limpio;
  }

  private async parsearExcelAsignaciones(buffer: Buffer): Promise<{
    filas: any[];
    errores: string[];
    domingos: string[];
  }> {
    const workbook: any = new (Workbook as any)();
    await workbook.xlsx.load(buffer);

    const hoja: any = workbook.getWorksheet('Asignaciones');
    if (!hoja) {
      return { filas: [], errores: ['No se encontró la hoja "Asignaciones"'], domingos: [] };
    }

    const headerRow = hoja.getRow(1);
    const domingos: string[] = [];
    const columnasSemanas: { colIndex: number; semana: string }[] = [];

    headerRow.eachCell((cell: any, colNumber: number) => {
      const valor = String(cell.value || '');
      const match = valor.match(/\((\d{4}-\d{2}-\d{2})\)/);
      if (match) {
        columnasSemanas.push({ colIndex: colNumber, semana: match[1] });
        domingos.push(match[1]);
      }
    });

    const filas: any[] = [];

    hoja.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) return;

      const cedulaRaw = String(row.getCell(1).value || '').trim();
      const nombre = String(row.getCell(2).value || '').trim();
      const horarioId = String(row.getCell(3).value || '').trim();
      const diasLibresFijosRaw = String(row.getCell(4).value || '').trim();

      if (!cedulaRaw) return;

      if (cedulaRaw === '12345678' && nombre.toLowerCase().includes('ejemplo')) return;

      const cedulaLimpia = cedulaRaw.replace(/[^0-9]/g, '');
      if (!cedulaLimpia) return;

      const diasLibresFijos = diasLibresFijosRaw
        ? diasLibresFijosRaw
            .split(',')
            .map((d: string) => this.normalizarDia(d))
            .filter(Boolean)
        : [];

      const semanas: { semana: string; dias: string[] }[] = [];
      for (const col of columnasSemanas) {
        const valor = String(row.getCell(col.colIndex).value || '').trim();
        const sinAsterisco = valor.replace(/\*/g, '').trim();

        const dias = sinAsterisco
          ? sinAsterisco
              .split(',')
              .map((d: string) => this.normalizarDia(d))
              .filter(Boolean)
          : [];

        semanas.push({ semana: col.semana, dias });
      }

      filas.push({
        fila: rowNumber,
        employeeId: cedulaLimpia,
        nombreReferencia: nombre,
        horarioId,
        diasLibresFijos,
        semanas,
      });
    });

    return { filas, errores: [], domingos };
  }

  async validarExcelAsignaciones(buffer: Buffer) {
    const { filas } = await this.parsearExcelAsignaciones(buffer);

    const errores: any[] = [];
    const preview: any[] = [];

    let empleadosBiometrico: any[] = [];
    try {
      const usuarios = await this.biometricoService.listUsers(
        '172.18.0.89',
        'admin',
        'Dtd2026*',
        true,
      );
      if (usuarios?.success && Array.isArray(usuarios.usuarios)) {
        empleadosBiometrico = usuarios.usuarios;
      }
    } catch {}

    const idsValidos = new Set(empleadosBiometrico.map((u) => String(u.employeeNo)));
    const horariosValidos = new Set(this.reglas.horarios.map((h) => h.id));
    const diasValidos = new Set(this.todosLosDias);

    const cedulasVistas = new Set<string>();

    for (const fila of filas) {
      if (cedulasVistas.has(fila.employeeId)) {
        errores.push({
          fila: fila.fila,
          error: `Cédula ${fila.employeeId} duplicada en el Excel`,
        });
        continue;
      }
      cedulasVistas.add(fila.employeeId);

      if (!idsValidos.has(fila.employeeId)) {
        errores.push({
          fila: fila.fila,
          error: `Cédula ${fila.employeeId} no existe en el biométrico`,
        });
        continue;
      }

      const empleado = empleadosBiometrico.find(
        (u: any) => String(u.employeeNo) === String(fila.employeeId),
      );
      if (empleado && empleado.activo === false) {
        errores.push({
          fila: fila.fila,
          error: `Empleado ${empleado.name} (${fila.employeeId}) está desactivado. Reactívalo primero.`,
        });
        continue;
      }

      if (fila.horarioId && !horariosValidos.has(fila.horarioId)) {
        errores.push({
          fila: fila.fila,
          error: `Horario "${fila.horarioId}" no existe`,
        });
        continue;
      }

      const diasFijosInvalidos = fila.diasLibresFijos.filter(
        (d: string) => !diasValidos.has(d),
      );
      if (diasFijosInvalidos.length > 0) {
        errores.push({
          fila: fila.fila,
          error: `Días libres fijos inválidos: ${diasFijosInvalidos.join(', ')}`,
        });
        continue;
      }

      let errorSemana = false;
      for (const semana of fila.semanas) {
        const invalidos = semana.dias.filter((d: string) => !diasValidos.has(d));
        if (invalidos.length > 0) {
          errores.push({
            fila: fila.fila,
            error: `Semana ${semana.semana}: días inválidos "${invalidos.join(', ')}"`,
          });
          errorSemana = true;
        }
      }
      if (errorSemana) continue;

      const asignacionActual = this.asignaciones.find(
        (a) => a.employeeId === fila.employeeId,
      );
      const estadoActual = {
        horarioId: asignacionActual?.horarioId || null,
        diasLibresFijos: asignacionActual?.diasLibresFijos || [],
      };

      const cambios: string[] = [];

      if (fila.horarioId && fila.horarioId !== estadoActual.horarioId) {
        cambios.push(
          `Horario: ${estadoActual.horarioId || 'ninguno'} → ${fila.horarioId}`,
        );
      }

      const fijosActualesSorted = [...(estadoActual.diasLibresFijos || [])].sort();
      const fijosNuevosSorted = [...fila.diasLibresFijos].sort();
      if (JSON.stringify(fijosActualesSorted) !== JSON.stringify(fijosNuevosSorted)) {
        cambios.push(
          `Días fijos: ${
            (estadoActual.diasLibresFijos || []).join(', ') || 'ninguno'
          } → ${fila.diasLibresFijos.join(', ') || 'ninguno'}`,
        );
      }

      for (const semana of fila.semanas) {
        const actuales = this.diasLibres[fila.employeeId]?.[semana.semana] || [];

        const sonIgualesALosFijos =
          JSON.stringify([...semana.dias].sort()) ===
          JSON.stringify([...fila.diasLibresFijos].sort());

        if (sonIgualesALosFijos) {
          if (actuales.length > 0) {
            cambios.push(`Semana ${semana.semana}: se quitan rotativos (usa fijos)`);
          }
          continue;
        }

        if (
          JSON.stringify([...actuales].sort()) !==
          JSON.stringify([...semana.dias].sort())
        ) {
          cambios.push(
            `Semana ${semana.semana}: ${actuales.join(', ') || 'ninguno'} → ${
              semana.dias.join(', ') || 'ninguno'
            }`,
          );
        }
      }

      preview.push({
        fila: fila.fila,
        employeeId: fila.employeeId,
        nombre: fila.nombreReferencia,
        cambios: cambios.length > 0 ? cambios : ['Sin cambios'],
      });
    }

    return {
      success: true,
      totalFilas: filas.length,
      filasValidas: filas.length - errores.length,
      filasConError: errores.length,
      errores,
      preview,
    };
  }

  async importarExcelAsignaciones(buffer: Buffer) {
    const validacion = await this.validarExcelAsignaciones(buffer);

    if (validacion.filasConError > 0) {
      return {
        success: false,
        message: 'Hay errores en el Excel. Corrígelos y vuelve a intentar.',
        errores: validacion.errores,
      };
    }

    const backupDir = path.join(process.cwd(), 'backups_asignaciones');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup_${timestamp}.json`);
    fs.writeFileSync(
      backupPath,
      JSON.stringify(
        {
          asignaciones: this.asignaciones,
          diasLibres: this.diasLibres,
        },
        null,
        2,
      ),
      'utf-8',
    );

    const { filas } = await this.parsearExcelAsignaciones(buffer);

    const activos = await this.obtenerSetEmpleadosActivos(true);
    const inactivosEnExcel = filas.filter(
      (f) => activos.size > 0 && !activos.has(String(f.employeeId)),
    );

    if (inactivosEnExcel.length > 0) {
      return {
        success: false,
        message: `No se puede importar: ${inactivosEnExcel.length} empleado(s) están desactivados. Reactívalos primero.`,
        empleadosInactivos: inactivosEnExcel.map((f) => ({
          fila: f.fila,
          employeeId: f.employeeId,
          nombre: f.nombreReferencia,
        })),
      };
    }

    let horariosActualizados = 0;
    let diasLibresActualizados = 0;
    let diasLibresEliminados = 0;

    for (const fila of filas) {
      if (fila.horarioId) {
        const existente = this.asignaciones.find(
          (a) => a.employeeId === fila.employeeId,
        );

        if (existente) {
          existente.horarioId = fila.horarioId;
          existente.diasLibresFijos =
            fila.diasLibresFijos.length > 0 ? fila.diasLibresFijos : undefined;
        } else {
          this.asignaciones.push({
            employeeId: fila.employeeId,
            horarioId: fila.horarioId,
            diasLibresFijos:
              fila.diasLibresFijos.length > 0 ? fila.diasLibresFijos : undefined,
          });
        }
        horariosActualizados++;
      }

      for (const semana of fila.semanas) {
        const sonIgualesALosFijos =
          JSON.stringify([...semana.dias].sort()) ===
          JSON.stringify([...fila.diasLibresFijos].sort());

        if (sonIgualesALosFijos) {
          if (this.diasLibres[fila.employeeId]?.[semana.semana]) {
            delete this.diasLibres[fila.employeeId][semana.semana];
            diasLibresEliminados++;
          }
          continue;
        }

        if (semana.dias.length > 0) {
          if (!this.diasLibres[fila.employeeId]) {
            this.diasLibres[fila.employeeId] = {};
          }
          this.diasLibres[fila.employeeId][semana.semana] = semana.dias;
          diasLibresActualizados++;
        } else {
          if (this.diasLibres[fila.employeeId]?.[semana.semana]) {
            delete this.diasLibres[fila.employeeId][semana.semana];
            diasLibresEliminados++;
          }
        }
      }
    }

    for (const empId of Object.keys(this.diasLibres)) {
      if (Object.keys(this.diasLibres[empId]).length === 0) {
        delete this.diasLibres[empId];
      }
    }

    this.guardarAsignaciones();
    this.guardarDiasLibres();
    this.limpiarCachesReportes();

    return {
      success: true,
      message: 'Excel importado correctamente',
      horariosActualizados,
      diasLibresActualizados,
      diasLibresEliminados,
      backupPath,
    };
  }

  listarBackups() {
    const backupDir = path.join(process.cwd(), 'backups_asignaciones');

    if (!fs.existsSync(backupDir)) {
      return {
        success: true,
        total: 0,
        backups: [],
      };
    }

    const archivos = fs.readdirSync(backupDir).filter((f) => f.endsWith('.json'));

    const backups = archivos
      .map((nombre) => {
        const ruta = path.join(backupDir, nombre);
        const stats = fs.statSync(ruta);
        return {
          nombre,
          ruta,
          fecha: stats.mtime,
          tamanoKB: (stats.size / 1024).toFixed(2),
        };
      })
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    return {
      success: true,
      total: backups.length,
      backups,
    };
  }

  restaurarBackup(nombreArchivo: string) {
    const backupDir = path.join(process.cwd(), 'backups_asignaciones');
    const backupPath = path.join(backupDir, nombreArchivo);

    if (!fs.existsSync(backupPath)) {
      return {
        success: false,
        message: `No se encontró el backup "${nombreArchivo}"`,
      };
    }

    try {
      const contenido = fs.readFileSync(backupPath, 'utf-8');
      const datos = JSON.parse(contenido);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupActualPath = path.join(
        backupDir,
        `backup_ANTES_DE_ROLLBACK_${timestamp}.json`,
      );
      fs.writeFileSync(
        backupActualPath,
        JSON.stringify(
          {
            asignaciones: this.asignaciones,
            diasLibres: this.diasLibres,
          },
          null,
          2,
        ),
        'utf-8',
      );

      this.asignaciones = datos.asignaciones || [];
      this.diasLibres = datos.diasLibres || {};

      this.guardarAsignaciones();
      this.guardarDiasLibres();
      this.limpiarCachesReportes();

      return {
        success: true,
        message: 'Backup restaurado correctamente',
        backupRestaurado: nombreArchivo,
        backupDelEstadoAnterior: backupActualPath,
        totalAsignaciones: this.asignaciones.length,
        totalDiasLibres: Object.keys(this.diasLibres).length,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error al restaurar el backup',
        error: error.message,
      };
    }
  }

  restaurarUltimoBackup() {
    const lista = this.listarBackups();

    if (!lista.success || lista.total === 0) {
      return {
        success: false,
        message: 'No hay backups disponibles para restaurar',
      };
    }

    const backupReal = lista.backups.find(
      (b) => !b.nombre.startsWith('backup_ANTES_DE_ROLLBACK_'),
    );

    if (!backupReal) {
      return {
        success: false,
        message: 'No hay backups válidos para restaurar',
      };
    }

    return this.restaurarBackup(backupReal.nombre);
  }

  /**
   * 📊 Reporte semanal optimizado + cache + fix de días futuros
   */
  async generarReporteSemanal(
    desde: Date,
    hasta: Date,
    generarExcel = false,
  ) {
    if (desde > hasta) {
      return {
        success: false,
        message: 'La fecha "desde" no puede ser mayor a "hasta"',
      };
    }

    // 🔒 Validar rango máximo (90 días)
    const diffDias = Math.ceil(
      (hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDias > 90) {
      return {
        success: false,
        message: `El rango no puede superar los 90 días (recibido: ${diffDias} días). Divídelo en períodos más cortos.`,
      };
    }

    // 🔑 Verificar cache (solo si no es para Excel)
    const cacheKey = `${desde.toISOString().split('T')[0]}_${
      hasta.toISOString().split('T')[0]
    }`;

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
      return {
        success: false,
        message: 'El rango de fechas está en el futuro. No hay datos que mostrar.',
      };
    }

    const marcajes = this.leerMarcajes();
    const mapaNombres = await this.obtenerMapaNombres();

    const activos = await this.obtenerSetEmpleadosActivos();

    const empleados: { employeeId: string; nombre: string }[] = [];

    for (const asignacion of this.asignaciones) {
      if (activos.size > 0 && !activos.has(String(asignacion.employeeId))) {
        continue;
      }

      empleados.push({
        employeeId: asignacion.employeeId,
        nombre: this.resolverNombre(asignacion.employeeId, marcajes, mapaNombres),
      });
    }

    const consolidado: any[] = [];

    for (const emp of empleados) {
      let totalDiasTrabajados = 0;
      let totalAusentes = 0;
      let totalDescansos = 0;
      let totalNoMarcoSalida = 0;
      let totalPendientes = 0;
      let totalMinutosRetardo = 0;
      let totalMinutosSalidaTemprana = 0;
      let totalHorasExtraDiurnas = 0;
      let totalHorasExtraNocturnas = 0;
      let totalHorasDiurnas = 0;
      let totalHorasNocturnas = 0;

      for (const dia of dias) {
        const evaluacion = await this.evaluarEmpleado(
          emp.employeeId,
          dia,
          emp.nombre,
          marcajes,
        );

        switch (evaluacion.estado) {
          case 'PUNTUAL':
          case 'RETARDO':
          case 'SALIDA_TEMPRANA':
          case 'COMPLETO':
            totalDiasTrabajados++;
            break;
          case 'AUSENTE':
            totalAusentes++;
            break;
          case 'DESCANSO':
            totalDescansos++;
            break;
          case 'NO_MARCO_SALIDA':
            totalNoMarcoSalida++;
            break;
          case 'PENDIENTE':
            totalPendientes++;
            break;
        }

        totalMinutosRetardo += evaluacion.minutosRetardo;
        totalMinutosSalidaTemprana += evaluacion.minutosSalidaTemprana;
        totalHorasExtraDiurnas += evaluacion.horasExtraDiurnas;
        totalHorasExtraNocturnas += evaluacion.horasExtraNocturnas;
        totalHorasDiurnas += evaluacion.horasDiurnas;
        totalHorasNocturnas += evaluacion.horasNocturnas;
      }

      const totalHorasExtra =
        Math.round((totalHorasExtraDiurnas + totalHorasExtraNocturnas) * 100) / 100;
      const totalHorasTrabajadas =
        Math.round(
          (totalHorasDiurnas +
            totalHorasNocturnas +
            totalHorasExtraDiurnas +
            totalHorasExtraNocturnas) *
            100,
        ) / 100;

      consolidado.push({
        employeeId: emp.employeeId,
        nombre: emp.nombre,
        diasTrabajados: totalDiasTrabajados,
        ausentes: totalAusentes,
        descansos: totalDescansos,
        noMarcoSalida: totalNoMarcoSalida,
        pendientes: totalPendientes,
        minutosRetardo: totalMinutosRetardo,
        retardoLegible: this.formatearMinutos(totalMinutosRetardo),
        minutosSalidaTemprana: totalMinutosSalidaTemprana,
        salidaTempranaLegible: this.formatearMinutos(totalMinutosSalidaTemprana),
        horasDiurnas: Math.round(totalHorasDiurnas * 100) / 100,
        horasNocturnas: Math.round(totalHorasNocturnas * 100) / 100,
        horasExtraDiurnas: Math.round(totalHorasExtraDiurnas * 100) / 100,
        horasExtraNocturnas: Math.round(totalHorasExtraNocturnas * 100) / 100,
        totalHorasExtra,
        totalHorasTrabajadas,
        horasDiurnasLegible: this.formatearHoras(totalHorasDiurnas),
        horasNocturnasLegible: this.formatearHoras(totalHorasNocturnas),
        horasExtraDiurnasLegible: this.formatearHoras(totalHorasExtraDiurnas),
        horasExtraNocturnasLegible: this.formatearHoras(totalHorasExtraNocturnas),
        totalHorasExtraLegible: this.formatearHoras(totalHorasExtra),
        totalHorasTrabajadasLegible: this.formatearHoras(totalHorasTrabajadas),
      });
    }

    consolidado.sort((a, b) => a.nombre.localeCompare(b.nombre));

    const formatoFechaLocal = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

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

    const resultado = {
      success: true,
      rango,
      totalEmpleados: consolidado.length,
      reporte: consolidado,
    };

    // 🔑 Guardar en cache (solo si no es Excel)
    if (!generarExcel) {
      this.reporteSemanalCache.set(cacheKey, {
        data: resultado,
        timestamp: Date.now(),
      });

      // 🧹 Limpiar cache viejo (más de 20 entradas)
      if (this.reporteSemanalCache.size > 20) {
        const primeraKey = this.reporteSemanalCache.keys().next().value;
        if (primeraKey) {
          this.reporteSemanalCache.delete(primeraKey);
        }
      }
    }

    return resultado;
  }

  limpiarBackupsViejos(diasAntiguedad = 30) {
    const backupDir = path.join(process.cwd(), 'backups_asignaciones');

    if (!fs.existsSync(backupDir)) {
      return {
        success: true,
        message: 'No hay backups para limpiar',
        eliminados: 0,
      };
    }

    const ahora = Date.now();
    const milisegundosPorDia = 24 * 60 * 60 * 1000;
    const limite = ahora - diasAntiguedad * milisegundosPorDia;

    const archivos = fs.readdirSync(backupDir).filter((f) => f.endsWith('.json'));

    const eliminados: string[] = [];
    const conservados: string[] = [];

    for (const archivo of archivos) {
      const ruta = path.join(backupDir, archivo);
      const stats = fs.statSync(ruta);

      if (stats.mtime.getTime() < limite) {
        try {
          fs.unlinkSync(ruta);
          eliminados.push(archivo);
        } catch (error: any) {
          this.logger.warn(`No se pudo eliminar ${archivo}: ${error.message}`);
        }
      } else {
        conservados.push(archivo);
      }
    }

    return {
      success: true,
      message: `Limpieza completada: ${eliminados.length} eliminados, ${conservados.length} conservados`,
      diasAntiguedad,
      eliminados: eliminados.length,
      conservados: conservados.length,
      archivosEliminados: eliminados,
    };
  }

  @Cron('0 3 * * *')
  async cronLimpiarBackups() {
    try {
      const resultado = this.limpiarBackupsViejos(30);

      if (resultado.eliminados > 0) {
        this.logger.log(
          `🧹 Limpieza de backups: ${resultado.eliminados} eliminados, ${resultado.conservados} conservados`,
        );
      } else {
        this.logger.debug(
          `🧹 Limpieza de backups: nada por eliminar (${resultado.conservados} conservados)`,
        );
      }
    } catch (error: any) {
      this.logger.error(`Error en limpieza de backups: ${error.message}`);
    }
  }

  /**
   * 💰 Reporte mensual nómina optimizado + cache + fix de días futuros
   */
  async generarReporteMensualNomina(mes?: string, generarExcel = false) {
    // 🔑 Cache por mes
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
      return {
        success: false,
        message: 'No se puede generar reporte de un mes futuro',
      };
    }

    const limite = hasta > hoy ? hoy : hasta;

    const dias: Date[] = [];
    const cursor = new Date(año, mesNum, 1);
    while (cursor <= limite) {
      dias.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const nombreMes = desde.toLocaleDateString('es-VE', {
      month: 'long',
      year: 'numeric',
    });

    const marcajes = this.leerMarcajes();
    const mapaNombres = await this.obtenerMapaNombres();

    const activos = await this.obtenerSetEmpleadosActivos();

    const empleados: { employeeId: string; nombre: string }[] = [];

    for (const asignacion of this.asignaciones) {
      if (activos.size > 0 && !activos.has(String(asignacion.employeeId))) {
        continue;
      }

      empleados.push({
        employeeId: asignacion.employeeId,
        nombre: this.resolverNombre(asignacion.employeeId, marcajes, mapaNombres),
      });
    }

    const consolidado: any[] = [];

    for (const emp of empleados) {
      let diasLaborables = 0;
      let diasTrabajados = 0;
      let ausentes = 0;
      let descansos = 0;
      let noMarcoSalida = 0;
      let pendientes = 0;
      let minutosRetardo = 0;
      let minutosSalidaTemprana = 0;
      let horasNormalesDiurnas = 0;
      let horasNormalesNocturnas = 0;
      let horasExtraDiurnas = 0;
      let horasExtraNocturnas = 0;

      for (const dia of dias) {
        const evaluacion = await this.evaluarEmpleado(
          emp.employeeId,
          dia,
          emp.nombre,
          marcajes,
        );

        switch (evaluacion.estado) {
          case 'PUNTUAL':
          case 'RETARDO':
          case 'SALIDA_TEMPRANA':
          case 'COMPLETO':
            diasTrabajados++;
            diasLaborables++;
            break;
          case 'AUSENTE':
            ausentes++;
            diasLaborables++;
            break;
          case 'DESCANSO':
            descansos++;
            break;
          case 'NO_MARCO_SALIDA':
            noMarcoSalida++;
            diasLaborables++;
            break;
          case 'PENDIENTE':
            pendientes++;
            break;
        }

        minutosRetardo += evaluacion.minutosRetardo;
        minutosSalidaTemprana += evaluacion.minutosSalidaTemprana;
        horasNormalesDiurnas += evaluacion.horasDiurnas;
        horasNormalesNocturnas += evaluacion.horasNocturnas;
        horasExtraDiurnas += evaluacion.horasExtraDiurnas;
        horasExtraNocturnas += evaluacion.horasExtraNocturnas;
      }

      const totalHorasNormales =
        Math.round((horasNormalesDiurnas + horasNormalesNocturnas) * 100) / 100;
      const totalHorasExtra =
        Math.round((horasExtraDiurnas + horasExtraNocturnas) * 100) / 100;
      const totalHoras =
        Math.round((totalHorasNormales + totalHorasExtra) * 100) / 100;

      consolidado.push({
        employeeId: emp.employeeId,
        nombre: emp.nombre,
        diasLaborables,
        diasTrabajados,
        ausentes,
        descansos,
        noMarcoSalida,
        pendientes,
        minutosRetardo,
        retardoLegible: this.formatearMinutos(minutosRetardo),
        minutosSalidaTemprana,
        salidaTempranaLegible: this.formatearMinutos(minutosSalidaTemprana),
        horasNormalesDiurnas: Math.round(horasNormalesDiurnas * 100) / 100,
        horasNormalesNocturnas: Math.round(horasNormalesNocturnas * 100) / 100,
        totalHorasNormales,
        horasNormalesDiurnasLegible: this.formatearHoras(horasNormalesDiurnas),
        horasNormalesNocturnasLegible: this.formatearHoras(horasNormalesNocturnas),
        totalHorasNormalesLegible: this.formatearHoras(totalHorasNormales),
        horasExtraDiurnas: Math.round(horasExtraDiurnas * 100) / 100,
        horasExtraNocturnas: Math.round(horasExtraNocturnas * 100) / 100,
        totalHorasExtra,
        horasExtraDiurnasLegible: this.formatearHoras(horasExtraDiurnas),
        horasExtraNocturnasLegible: this.formatearHoras(horasExtraNocturnas),
        totalHorasExtraLegible: this.formatearHoras(totalHorasExtra),
        totalHoras,
        totalHorasLegible: this.formatearHoras(totalHoras),
      });
    }

    consolidado.sort((a, b) => a.nombre.localeCompare(b.nombre));

    const formatoFechaLocal = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

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

    const resultado = {
      success: true,
      rango,
      totalEmpleados: consolidado.length,
      reporte: consolidado,
    };

    // 🔑 Guardar en cache (solo si no es Excel)
    if (!generarExcel) {
      this.reporteMensualCache.set(cacheKey, {
        data: resultado,
        timestamp: Date.now(),
      });

      if (this.reporteMensualCache.size > 20) {
        const primeraKey = this.reporteMensualCache.keys().next().value;
        if (primeraKey) {
          this.reporteMensualCache.delete(primeraKey);
        }
      }
    }

    return resultado;
  }
}