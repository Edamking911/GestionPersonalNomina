import { Injectable } from '@nestjs/common';
import { EvaluacionAsistencia } from '../Interfaces/reglas.interface';
import { ReglasConfigService } from '../Configs/reglas-config.service';
import { CacheEmpleadosService } from '../Cache/cache-empleados.service';
import { BiometricoService } from '../../biometrico/biometrico.service';
import {
  HORA_NOCTURNA,
  formatearHoras,
  formatearMinutos,
  horaAMinutos,
  obtenerDiaSemana,
  obtenerMinutosDeFecha,
} from '../Utils/tiempo.util';

@Injectable()
export class EvaluacionService {
  constructor(
    private readonly config: ReglasConfigService,
    private readonly cache: CacheEmpleadosService,
    private readonly biometricoService: BiometricoService,
  ) {}

  private leerMarcajes(): any[] {
    const marcajesPath = require('path').join(process.cwd(), 'marcajes.json');
    const fs = require('fs');
    if (!fs.existsSync(marcajesPath)) return [];
    const data = fs.readFileSync(marcajesPath, 'utf-8');
    return data ? JSON.parse(data) : [];
  }

  async evaluarEmpleado(
    employeeId: string,
    fecha: Date,
    employeeName?: string,
    marcajesCache?: any[],
  ): Promise<EvaluacionAsistencia> {
    // Solo valida activo si no hay caché de marcajes (llamada individual)
    if (!marcajesCache) {
      const activos = await this.cache.obtenerSetEmpleadosActivos();
      if (activos.size > 0 && !activos.has(String(employeeId))) {
        throw new Error(
          `El empleado con cédula ${employeeId} está desactivado o no existe en el biométrico.`,
        );
      }
    }

    const marcajes = marcajesCache || this.leerMarcajes();
    const marcajesEmpleado = marcajes.filter((m) => m.employeeId === employeeId);
    const horario = this.config.obtenerHorarioAsignado(employeeId, fecha);
    const nombre =
      employeeName || (await this.cache.obtenerNombreEmpleado(employeeId, marcajes));

    if (!horario) {
      return this.armarVacio(employeeId, nombre, fecha, 'SIN_HORARIO', 'SIN ASIGNAR');
    }

    const diaSemana = obtenerDiaSemana(fecha);

    const marcajesDia = marcajesEmpleado.filter((m) => {
      const d = new Date(m.timestamp);
      return d.toLocaleDateString('es-VE') === fecha.toLocaleDateString('es-VE');
    });

    if (marcajesDia.length === 0) {
      const estado = horario.diasLaborales.includes(diaSemana) ? 'AUSENTE' : 'DESCANSO';
      return this.armarVacio(employeeId, nombre, fecha, estado, horario.nombre);
    }

    marcajesDia.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const entradaReal = marcajesDia[0];
    const salidaReal = marcajesDia.length >= 2 ? marcajesDia[marcajesDia.length - 1] : null;

    if (!salidaReal) {
      const ahora = await this.cache.obtenerHoraCache();
      const esMismoDia = ahora.toDateString() === fecha.toDateString();
      const estado = esMismoDia ? 'PENDIENTE' : 'NO_MARCO_SALIDA';
      return {
        ...this.armarVacio(employeeId, nombre, fecha, estado, horario.nombre),
        entradaReal: entradaReal.horaLocal,
      };
    }

    if (!horario.diasLaborales.includes(diaSemana)) {
      return {
        ...this.armarVacio(employeeId, nombre, fecha, 'DESCANSO', horario.nombre),
        entradaReal: entradaReal.horaLocal,
        salidaReal: salidaReal.horaLocal,
      };
    }

    // CÁLCULO REAL
    const entradaMin = obtenerMinutosDeFecha(new Date(entradaReal.timestamp));
    const salidaMin = obtenerMinutosDeFecha(new Date(salidaReal.timestamp));
    const entradaEsperada = horaAMinutos(horario.entrada);
    const salidaEsperada = horaAMinutos(horario.salida);

    const minutosRetardo = Math.max(0, entradaMin - entradaEsperada - horario.toleranciaMin);
    const minutosSalidaTemprana = Math.max(0, salidaEsperada - salidaMin);

    const HORA_NOCTURNA_MIN = horaAMinutos(HORA_NOCTURNA);
    const duracionTurnoMin = salidaEsperada - entradaEsperada;
    const tiempoTrabajadoMin = salidaMin - entradaMin;

    let horasDiurnas = 0;
    let horasNocturnas = 0;
    let horasExtraDiurnas = 0;
    let horasExtraNocturnas = 0;

    const entradaHorarioMin = entradaEsperada;
    const salidaHorarioMin = salidaEsperada;

    if (salidaHorarioMin <= HORA_NOCTURNA_MIN) {
      horasDiurnas = Math.min(duracionTurnoMin, tiempoTrabajadoMin) / 60;

      if (salidaMin > HORA_NOCTURNA_MIN) {
        horasExtraDiurnas = (HORA_NOCTURNA_MIN - salidaHorarioMin) / 60;
        horasExtraNocturnas = (salidaMin - HORA_NOCTURNA_MIN) / 60;
      } else if (salidaMin > salidaHorarioMin) {
        horasExtraDiurnas = (salidaMin - salidaHorarioMin) / 60;
      }
    } else {
      const parteDiurnaNormal = HORA_NOCTURNA_MIN - entradaHorarioMin;
      const totalNormalMin = duracionTurnoMin;

      horasDiurnas =
        tiempoTrabajadoMin >= parteDiurnaNormal
          ? parteDiurnaNormal / 60
          : tiempoTrabajadoMin / 60;

      horasNocturnas = Math.max(
        0,
        (Math.min(tiempoTrabajadoMin, totalNormalMin) - parteDiurnaNormal) / 60,
      );

      if (tiempoTrabajadoMin > totalNormalMin) {
        const extraMin = tiempoTrabajadoMin - totalNormalMin;
        const extraAntesDeNoche = Math.max(0, HORA_NOCTURNA_MIN - salidaHorarioMin);
        horasExtraDiurnas = Math.min(extraMin, extraAntesDeNoche) / 60;
        horasExtraNocturnas = Math.max(0, extraMin - extraAntesDeNoche) / 60;
      }
    }

    horasDiurnas = Math.round(horasDiurnas * 100) / 100;
    horasNocturnas = Math.round(horasNocturnas * 100) / 100;
    horasExtraDiurnas = Math.round(horasExtraDiurnas * 100) / 100;
    horasExtraNocturnas = Math.round(horasExtraNocturnas * 100) / 100;

    const tipoTurno = salidaMin >= HORA_NOCTURNA_MIN ? 'NOCTURNO' : 'DIURNO';
    const horasExtra = Math.round((horasExtraDiurnas + horasExtraNocturnas) * 100) / 100;

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
      retardoLegible: formatearMinutos(minutosRetardo),
      salidaTempranaLegible: formatearMinutos(minutosSalidaTemprana),
      tipoTurno,
      horasDiurnas,
      horasNocturnas,
      horasExtraDiurnas,
      horasExtraNocturnas,
      horasDiurnasLegible: formatearHoras(horasDiurnas),
      horasNocturnasLegible: formatearHoras(horasNocturnas),
      horasExtraDiurnasLegible: formatearHoras(horasExtraDiurnas),
      horasExtraNocturnasLegible: formatearHoras(horasExtraNocturnas),
    };
  }

  private armarVacio(
    employeeId: string,
    nombre: string,
    fecha: Date,
    estado: EvaluacionAsistencia['estado'],
    horario: string,
  ): EvaluacionAsistencia {
    return {
      employeeId,
      nombre,
      fecha: fecha.toLocaleDateString('es-VE'),
      horario,
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
}