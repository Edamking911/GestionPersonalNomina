import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { BiometricoService } from '../biometrico/biometrico.service';

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

  // Nuevos campos para el desglose de horas
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
  private asignacionesPath = path.join(
    process.cwd(),
    'asignaciones_turnos.json',
  );
  private marcajesPath = path.join(process.cwd(), 'marcajes.json');
  private diasLibresPath = path.join(process.cwd(), 'dias_libres.json');

  private readonly HORA_NOCTURNA = '19:00'; // 7:00 PM

  private reglas!: ReglasConfig;
  private asignaciones!: AsignacionTurno[];
  private diasLibres: Record<string, Record<string, string[]>> = {};

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
          {
            id: 'HORARIO_8_5',
            nombre: '8:00 AM - 5:00 PM',
            entrada: '08:00',
            salida: '17:00',
            toleranciaMin: 10,
            diasLaborales: [],
          },
          {
            id: 'HORARIO_8_5_30',
            nombre: '8:00 AM - 5:30 PM',
            entrada: '08:00',
            salida: '17:30',
            toleranciaMin: 10,
            diasLaborales: [],
          },
          {
            id: 'HORARIO_8_6_30',
            nombre: '8:00 AM - 6:30 PM',
            entrada: '08:00',
            salida: '18:30',
            toleranciaMin: 10,
            diasLaborales: [],
          },
          {
            id: 'HORARIO_8_7',
            nombre: '8:00 AM - 7:00 PM',
            entrada: '08:00',
            salida: '19:00',
            toleranciaMin: 10,
            diasLaborales: [],
          },
          {
            id: 'HORARIO_8_8',
            nombre: '8:00 AM - 8:00 PM',
            entrada: '08:00',
            salida: '20:00',
            toleranciaMin: 10,
            diasLaborales: [],
          },
        ],
      };
      this.guardarReglas();
    }
  }

  private inicializarAsignaciones() {
    if (fs.existsSync(this.asignacionesPath)) {
      this.asignaciones = JSON.parse(
        fs.readFileSync(this.asignacionesPath, 'utf-8'),
      );
    } else {
      this.asignaciones = [];
      this.guardarAsignaciones();
    }
  }

  private inicializarDiasLibres() {
    if (fs.existsSync(this.diasLibresPath)) {
      this.diasLibres = JSON.parse(
        fs.readFileSync(this.diasLibresPath, 'utf-8'),
      );
    } else {
      this.diasLibres = {};
      this.guardarDiasLibres();
    }
  }

  private guardarReglas() {
    fs.writeFileSync(
      this.reglasPath,
      JSON.stringify(this.reglas, null, 2),
      'utf-8',
    );
  }

  private guardarAsignaciones() {
    fs.writeFileSync(
      this.asignacionesPath,
      JSON.stringify(this.asignaciones, null, 2),
      'utf-8',
    );
  }

  private guardarDiasLibres() {
    fs.writeFileSync(
      this.diasLibresPath,
      JSON.stringify(this.diasLibres, null, 2),
      'utf-8',
    );
  }

  getReglas() {
    return this.reglas;
  }

  /**
   * Obtiene asignaciones con días libres fijos y rotativos de una semana.
   * La semana debe ser la fecha del domingo de esa semana (YYYY-MM-DD).
   */
  getAsignaciones(semana?: string) {
    const semanaClave = semana || this.obtenerInicioSemana(new Date());

    return this.asignaciones.map((a) => {
      const diasLibresRotativos =
        this.diasLibres[a.employeeId]?.[semanaClave] || [];
      return {
        ...a,
        diasLibresRotativos,
        diasLibresEfectivos:
          diasLibresRotativos.length > 0
            ? diasLibresRotativos
            : a.diasLibresFijos || [],
      };
    });
  }

  getDiasLibres() {
    return this.diasLibres;
  }

  asignarHorario(
    employeeId: string,
    horarioId: string,
    diasLibresFijos?: string[],
  ) {
    const horarioExiste = this.reglas.horarios.some((h) => h.id === horarioId);
    if (!horarioExiste) {
      return { success: false, message: 'Horario no válido' };
    }

    const existente = this.asignaciones.find(
      (a) => a.employeeId === employeeId,
    );
    if (existente) {
      existente.horarioId = horarioId;
      existente.diasLibresFijos = diasLibresFijos;
    } else {
      this.asignaciones.push({ employeeId, horarioId, diasLibresFijos });
    }
    this.guardarAsignaciones();
    return {
      success: true,
      message: `Horario ${horarioId} asignado al empleado ${employeeId}`,
    };
  }

  asignarDiasLibres(employeeId: string, semana: string, diasLibres: string[]) {
    if (!this.diasLibres[employeeId]) {
      this.diasLibres[employeeId] = {};
    }
    this.diasLibres[employeeId][semana] = diasLibres;
    this.guardarDiasLibres();
    return { success: true, message: 'Días libres asignados' };
  }

  private obtenerInicioSemana(fecha: Date): string {
    const d = new Date(fecha);
    const day = d.getDay(); // 0=domingo
    const diff = day === 0 ? 0 : -day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }

  private obtenerDiasLibresSemana(employeeId: string, fecha: Date): string[] {
    const semana = this.obtenerInicioSemana(fecha);
    return this.diasLibres[employeeId]?.[semana] || [];
  }

  private obtenerHorarioAsignado(
    employeeId: string,
    fecha?: Date,
  ): HorarioAsistencia | null {
    const asignacion = this.asignaciones.find(
      (a) => a.employeeId === employeeId,
    );
    if (asignacion) {
      const horario = this.reglas.horarios.find(
        (h) => h.id === asignacion.horarioId,
      );
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
  ): Promise<EvaluacionAsistencia> {
    const marcajes = this.leerMarcajes();
    const marcajesEmpleado = marcajes.filter(
      (m) => m.employeeId === employeeId,
    );
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
      return (
        d.toLocaleDateString('es-VE') === fecha.toLocaleDateString('es-VE')
      );
    });

    if (marcajesDia.length === 0) {
      const estado = horario.diasLaborales.includes(diaSemana)
        ? 'AUSENTE'
        : 'DESCANSO';
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
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const entradaReal = marcajesDia[0];
    const salidaReal =
      marcajesDia.length >= 2 ? marcajesDia[marcajesDia.length - 1] : null;

    // Sin salida
    if (!salidaReal) {
      const ahora = await this.biometricoService.obtenerHoraBiometrico();
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

    // Con salida
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

    const entradaMin = this.obtenerMinutosDeFecha(
      new Date(entradaReal.timestamp),
    );
    const salidaMin = this.obtenerMinutosDeFecha(
      new Date(salidaReal.timestamp),
    );
    const entradaEsperada = this.horaAMinutos(horario.entrada);
    const salidaEsperada = this.horaAMinutos(horario.salida);

    const minutosRetardo = Math.max(
      0,
      entradaMin - entradaEsperada - horario.toleranciaMin,
    );
    const minutosSalidaTemprana = Math.max(0, salidaEsperada - salidaMin);

    // =====================================================
    // Cálculo de horas diurnas/nocturnas normales y extras
    // =====================================================
    const HORA_NOCTURNA = this.horaAMinutos(this.HORA_NOCTURNA);
    const duracionTurnoMin =
      this.horaAMinutos(horario.salida) - this.horaAMinutos(horario.entrada);
    const tiempoTrabajadoMin = salidaMin - entradaMin;
    const totalHorasExtra = Math.max(
      0,
      (tiempoTrabajadoMin - duracionTurnoMin) / 60,
    );

    let horasDiurnas = 0;
    let horasNocturnas = 0;
    let horasExtraDiurnas = 0;
    let horasExtraNocturnas = 0;

    // Jornada normal diurna/nocturna
    if (entradaMin >= HORA_NOCTURNA) {
      // Toda la jornada normal es nocturna
      horasNocturnas = Math.min(duracionTurnoMin, tiempoTrabajadoMin) / 60;
    } else if (salidaMin <= HORA_NOCTURNA) {
      // Toda la jornada normal es diurna
      horasDiurnas = Math.min(duracionTurnoMin, tiempoTrabajadoMin) / 60;
    } else {
      // Cruza de diurno a nocturno
      horasDiurnas = (HORA_NOCTURNA - entradaMin) / 60;
      const jornadaRestanteMin =
        duracionTurnoMin - (HORA_NOCTURNA - entradaMin);
      horasNocturnas = Math.max(0, jornadaRestanteMin / 60);
    }

    // Horas extra
    if (totalHorasExtra > 0) {
      if (salidaMin <= HORA_NOCTURNA) {
        // Extra diurno
        horasExtraDiurnas = totalHorasExtra;
      } else {
        const salidaJornadaNormalMin = this.horaAMinutos(horario.salida);
        if (salidaJornadaNormalMin <= HORA_NOCTURNA) {
          // Extra mixto
          const extraDiurnoMin =
            Math.min(HORA_NOCTURNA, salidaMin) - salidaJornadaNormalMin;
          const extraNocturnoMin =
            salidaMin - Math.max(HORA_NOCTURNA, salidaJornadaNormalMin);
          horasExtraDiurnas = extraDiurnoMin / 60;
          horasExtraNocturnas = extraNocturnoMin / 60;
        } else {
          // Toda la extra es nocturna
          horasExtraNocturnas = totalHorasExtra;
        }
      }
    }

    // Redondear
    horasDiurnas = Math.round(horasDiurnas * 100) / 100;
    horasNocturnas = Math.round(horasNocturnas * 100) / 100;
    horasExtraDiurnas = Math.round(horasExtraDiurnas * 100) / 100;
    horasExtraNocturnas = Math.round(horasExtraNocturnas * 100) / 100;

    // Tipo de turno
    const tipoTurno = salidaMin >= HORA_NOCTURNA ? 'NOCTURNO' : 'DIURNO';

    // Horas extra totales (para compatibilidad)
    const horasExtra = Math.round(totalHorasExtra * 100) / 100;

    let estado: EvaluacionAsistencia['estado'] = 'PUNTUAL';
    if (minutosRetardo > 0 && minutosSalidaTemprana === 0) estado = 'RETARDO';
    if (minutosSalidaTemprana > 0 && minutosRetardo === 0)
      estado = 'SALIDA_TEMPRANA';
    if (minutosRetardo > 0 && minutosSalidaTemprana > 0)
      estado = 'SALIDA_TEMPRANA';

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

  async generarReporteDiario(fecha: Date) {
    const marcajes = this.leerMarcajes();
    const usuarios = await this.biometricoService.listUsers();

    const mapaUsuarios = new Map<string, string>();
    if (usuarios?.success && Array.isArray(usuarios.usuarios)) {
      usuarios.usuarios.forEach((u) => mapaUsuarios.set(u.employeeNo, u.name));
    }

    const empleados = this.asignaciones.map((a) => ({
      employeeId: a.employeeId,
      nombre: mapaUsuarios.get(a.employeeId) || 'DESCONOCIDO',
    }));

    const reporte: EvaluacionAsistencia[] = [];
    for (const emp of empleados) {
      const evaluacion = await this.evaluarEmpleado(
        emp.employeeId,
        fecha,
        emp.nombre,
      );
      reporte.push(evaluacion);
    }

    return {
      fecha: fecha.toLocaleDateString('es-VE'),
      totalEmpleados: reporte.length,
      reporte,
    };
  }

  async validarSalidasPendientes(fecha: Date) {
    const ahora = await this.biometricoService.obtenerHoraBiometrico();
    const esFechaPasada =
      fecha.toDateString() !== ahora.toDateString() && fecha < ahora;

    if (!esFechaPasada) {
      return {
        success: false,
        message: 'La fecha debe ser anterior a hoy para validar salidas',
      };
    }

    const usuarios = await this.biometricoService.listUsers();
    const mapaUsuarios = new Map<string, string>();
    if (usuarios?.success && Array.isArray(usuarios.usuarios)) {
      usuarios.usuarios.forEach((u) => mapaUsuarios.set(u.employeeNo, u.name));
    }

    const resultados: EvaluacionAsistencia[] = [];

    for (const asignacion of this.asignaciones) {
      const empId = asignacion.employeeId;
      const nombre = mapaUsuarios.get(empId) || 'DESCONOCIDO';
      const evaluacion = await this.evaluarEmpleado(empId, fecha, nombre);

      if (
        evaluacion.estado === 'PENDIENTE' ||
        evaluacion.estado === 'NO_MARCO_SALIDA'
      ) {
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

    const validacionesPath = path.join(
      process.cwd(),
      'validaciones_salida.json',
    );
    fs.writeFileSync(
      validacionesPath,
      JSON.stringify(resultados, null, 2),
      'utf-8',
    );

    return {
      success: true,
      fecha: fecha.toLocaleDateString('es-VE'),
      totalValidados: resultados.length,
      resultados,
    };
  }
}
