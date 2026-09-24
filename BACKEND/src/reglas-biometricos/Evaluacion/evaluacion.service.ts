import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { EvaluacionAsistencia, BreakInfo } from '../Interfaces/reglas.interface';
import { ReglasConfigService } from '../Configs/reglas-config.service';
import { CacheEmpleadosService } from '../Cache/cache-empleados.service';
import { MarcajesStorageService } from '../../biometrico/Storage/marcajes-storage.service';
import { NovedadesService } from '../Novedades/novedades.service';
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
    private readonly marcajesStorage: MarcajesStorageService,
    @Inject(forwardRef(() => NovedadesService))
    private readonly novedades: NovedadesService,
  ) {}

  async evaluarEmpleado(
    employeeId: string,
    fecha: Date,
    employeeName?: string,
    marcajesCache?: any[],
  ): Promise<EvaluacionAsistencia> {
    if (!marcajesCache) {
      const activos = await this.cache.obtenerSetEmpleadosActivos();
      if (activos.size > 0 && !activos.has(String(employeeId))) {
        throw new Error(
          `El empleado con cédula ${employeeId} está desactivado o no existe en el biométrico.`,
        );
      }
    }

    const marcajes =
      marcajesCache || (await this.marcajesStorage.obtenerMarcajesDelDia(fecha));

    const marcajesEmpleado = marcajes.filter((m) => m.employeeId === employeeId);
    const horario = this.config.obtenerHorarioAsignado(employeeId, fecha);
    const nombre =
      employeeName || (await this.cache.obtenerNombreEmpleado(employeeId, marcajes));

    // =========================================================
    // NOVEDAD
    // =========================================================
    const novedad = this.novedades.buscarPorEmpleadoYFecha(
      String(employeeId),
      fecha,
    );

    if (novedad) {
      return {
        ...this.armarVacio(
          employeeId,
          nombre,
          fecha,
          novedad.tipo as any,
          horario?.nombre || 'SIN ASIGNAR',
        ),
        novedad: {
          tipo: novedad.tipo,
          motivo: novedad.motivo || undefined,
          documento: novedad.documentoSoporte || undefined,
        },
      };
    }

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

    marcajesDia.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // =========================================================
    // FILTRO DOBLE LECTURA (>60 seg entre marcas)
    // =========================================================
    const SEGUNDOS_MINIMOS_ENTRE_MARCAS = 60;
    const marcajesFiltrados: any[] = [marcajesDia[0]];

    for (let i = 1; i < marcajesDia.length; i++) {
      const anterior = marcajesFiltrados[marcajesFiltrados.length - 1];
      const segundosDif =
        (new Date(marcajesDia[i].timestamp).getTime() -
          new Date(anterior.timestamp).getTime()) /
        1000;

      if (segundosDif > SEGUNDOS_MINIMOS_ENTRE_MARCAS) {
        marcajesFiltrados.push(marcajesDia[i]);
      }
    }

    // =========================================================
    // ✅ DETECCIÓN INTELIGENTE DE SALIDA REAL
    //
    // Reglas:
    //   1 marca  → PENDIENTE / NO_MARCO_SALIDA
    //   2 marcas → salida real SOLO si trabajó >= 60% del turno
    //              (si no, probablemente sea break y falta salida)
    //   3 marcas → salida real SOLO si trabajó >= 80% del turno
    //              (si no, la [2] es regreso de break y falta salida)
    //   4+ marcas → salida = última
    // =========================================================
    const entradaReal = marcajesFiltrados[0];
    const entradaMin = obtenerMinutosDeFecha(new Date(entradaReal.timestamp));
    const salidaEsperadaMin = horaAMinutos(horario.salida);
    const entradaEsperadaMin = horaAMinutos(horario.entrada);
    const jornadaEsperadaMin = salidaEsperadaMin - entradaEsperadaMin;

    const ahora = await this.cache.obtenerHoraCache();
    const esMismoDia = ahora.toDateString() === fecha.toDateString();

    let salidaReal: any = null;
    let faltaSalida = false;

    if (marcajesFiltrados.length === 1) {
      faltaSalida = true;
    } else if (marcajesFiltrados.length === 2) {
      // ✅ FIX: verificar si la 2da marca es realmente la salida final
      // o si fue una salida al break (sin volver a marcar)
      const segunda = marcajesFiltrados[1];
      const segundaMin = obtenerMinutosDeFecha(new Date(segunda.timestamp));
      const trabajadoMin = segundaMin - entradaMin;
      const ratio = trabajadoMin / jornadaEsperadaMin;

      if (ratio < 0.6) {
        // Trabajó menos del 60% → probablemente salió al break
        faltaSalida = true;
      } else {
        salidaReal = segunda;
      }
    } else if (marcajesFiltrados.length === 3) {
      // La [2] puede ser regreso de break o salida final
      const tercera = marcajesFiltrados[2];
      const terceraMin = obtenerMinutosDeFecha(new Date(tercera.timestamp));
      const trabajadoMin = terceraMin - entradaMin;
      const ratio = trabajadoMin / jornadaEsperadaMin;

      if (ratio >= 0.8) {
        // 80%+ → es la salida final
        salidaReal = tercera;
      } else {
        // <80% → es regreso de break, falta salida final
        faltaSalida = true;
      }
    } else {
      // 4+ marcas: la última es la salida final
      salidaReal = marcajesFiltrados[marcajesFiltrados.length - 1];
    }

    // =========================================================
    // ✅ SI FALTA SALIDA → PENDIENTE (hoy) o NO_MARCO_SALIDA (día pasado)
    // Se incluye el break si ya se detectó (informativo)
    // =========================================================
    if (faltaSalida) {
      const estado = esMismoDia ? 'PENDIENTE' : 'NO_MARCO_SALIDA';

      // Detectar break si ya salió/regresó (informativo)
      const breakInfoTmp = this.detectarBreak(
        marcajesFiltrados,
        horario.breakDuracionMin,
        horario.breakToleranciaMin,
      );

      return {
        ...this.armarVacio(employeeId, nombre, fecha, estado, horario.nombre),
        entradaReal: entradaReal.horaLocal,
        break: breakInfoTmp,
      };
    }

    // =========================================================
    // DÍA NO LABORABLE (descanso)
    // =========================================================
    if (!horario.diasLaborales.includes(diaSemana)) {
      return {
        ...this.armarVacio(employeeId, nombre, fecha, 'DESCANSO', horario.nombre),
        entradaReal: entradaReal.horaLocal,
        salidaReal: salidaReal.horaLocal,
      };
    }

    // =========================================================
    // DETECTAR BREAK
    // =========================================================
    const breakInfo = this.detectarBreak(
      marcajesFiltrados,
      horario.breakDuracionMin,
      horario.breakToleranciaMin,
    );

    // =========================================================
    // CÁLCULO DE HORAS
    // =========================================================
    const salidaMin = obtenerMinutosDeFecha(new Date(salidaReal.timestamp));
    const entradaEsperada = horaAMinutos(horario.entrada);
    const salidaEsperada = horaAMinutos(horario.salida);

    const minutosRetardo = Math.max(0, entradaMin - entradaEsperada - horario.toleranciaMin);
    const minutosSalidaTemprana = Math.max(0, salidaEsperada - salidaMin);

    const HORA_NOCTURNA_MIN = horaAMinutos(HORA_NOCTURNA);
    const duracionTurnoMin = salidaEsperada - entradaEsperada;
    const tiempoTrabajadoBrutoMin = salidaMin - entradaMin;

    const breakDescontadoMin = horario.breakDuracionMin || 0;
    const tiempoTrabajadoNetoMin = Math.max(
      0,
      tiempoTrabajadoBrutoMin - breakDescontadoMin,
    );

    let horasDiurnas = 0;
    let horasNocturnas = 0;
    let horasExtraDiurnas = 0;
    let horasExtraNocturnas = 0;

    const entradaHorarioMin = entradaEsperada;
    const salidaHorarioMin = salidaEsperada;

    if (salidaHorarioMin <= HORA_NOCTURNA_MIN) {
      horasDiurnas = Math.min(duracionTurnoMin - breakDescontadoMin, tiempoTrabajadoNetoMin) / 60;

      if (salidaMin > HORA_NOCTURNA_MIN) {
        horasExtraDiurnas = (HORA_NOCTURNA_MIN - salidaHorarioMin) / 60;
        horasExtraNocturnas = (salidaMin - HORA_NOCTURNA_MIN) / 60;
      } else if (salidaMin > salidaHorarioMin) {
        horasExtraDiurnas = (salidaMin - salidaHorarioMin) / 60;
      }
    } else {
      const parteDiurnaNormal = HORA_NOCTURNA_MIN - entradaHorarioMin;
      const totalNormalMin = duracionTurnoMin - breakDescontadoMin;

      horasDiurnas =
        tiempoTrabajadoNetoMin >= parteDiurnaNormal
          ? parteDiurnaNormal / 60
          : tiempoTrabajadoNetoMin / 60;

      horasNocturnas = Math.max(
        0,
        (Math.min(tiempoTrabajadoNetoMin, totalNormalMin) - parteDiurnaNormal) / 60,
      );

      if (tiempoTrabajadoNetoMin > totalNormalMin) {
        const extraMin = tiempoTrabajadoNetoMin - totalNormalMin;
        const extraAntesDeNoche = Math.max(0, HORA_NOCTURNA_MIN - salidaHorarioMin);
        horasExtraDiurnas = Math.min(extraMin, extraAntesDeNoche) / 60;
        horasExtraNocturnas = Math.max(0, extraMin - extraAntesDeNoche) / 60;
      }
    }

    horasDiurnas = Math.round(horasDiurnas * 10000) / 10000;
    horasNocturnas = Math.round(horasNocturnas * 10000) / 10000;
    horasExtraDiurnas = Math.round(horasExtraDiurnas * 10000) / 10000;
    horasExtraNocturnas = Math.round(horasExtraNocturnas * 10000) / 10000;

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
      break: breakInfo,
    };
  }

  // =========================================================
  // DETECTAR BREAK
  // ✅ FIX: -1 en lugar de -2 para incluir el par [1,2] con 3 marcas
  // =========================================================
  private detectarBreak(
    marcajesFiltrados: any[],
    breakDuracionMin: number,
    breakToleranciaMin: number,
  ): BreakInfo {
    if (marcajesFiltrados.length < 3) {
      return {
        horaSalida: null,
        horaEntrada: null,
        duracionMin: 0,
        duracionLegible: '0m',
        excesoMin: 0,
        diferenciaMin: 0,
        estado: 'NO_MARCO',
        diferenciaLegible: 'No marcó break',
      };
    }

    let mejorPar: { salida: any; entrada: any; duracion: number; diff: number } | null = null;

    for (let i = 1; i < marcajesFiltrados.length - 1; i++) {
      const salida = marcajesFiltrados[i];
      const entrada = marcajesFiltrados[i + 1];

      const salidaMin = obtenerMinutosDeFecha(new Date(salida.timestamp));
      const entradaMin = obtenerMinutosDeFecha(new Date(entrada.timestamp));
      const duracion = Math.max(0, entradaMin - salidaMin);
      const diff = Math.abs(duracion - breakDuracionMin);

      if (!mejorPar || diff < mejorPar.diff) {
        mejorPar = { salida, entrada, duracion, diff };
      }
    }

    if (!mejorPar) {
      return {
        horaSalida: null,
        horaEntrada: null,
        duracionMin: 0,
        duracionLegible: '0m',
        excesoMin: 0,
        diferenciaMin: 0,
        estado: 'NO_MARCO',
        diferenciaLegible: 'No marcó break',
      };
    }

    const duracionRealMin = mejorPar.duracion;
    const diferenciaMin = duracionRealMin - breakDuracionMin;

    let estado: BreakInfo['estado'] = 'CORRECTO';
    let diferenciaLegible = 'En tiempo';

    if (diferenciaMin > breakToleranciaMin) {
      estado = 'EXCESO';
      diferenciaLegible = `Exceso: ${formatearMinutos(diferenciaMin)}`;
    } else if (diferenciaMin < -breakToleranciaMin) {
      estado = 'CORTO';
      diferenciaLegible = `Corto: ${formatearMinutos(Math.abs(diferenciaMin))}`;
    }

    return {
      horaSalida: mejorPar.salida.horaLocal,
      horaEntrada: mejorPar.entrada.horaLocal,
      duracionMin: duracionRealMin,
      duracionLegible: formatearMinutos(duracionRealMin),
      excesoMin: Math.max(0, diferenciaMin),
      diferenciaMin,
      estado,
      diferenciaLegible,
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