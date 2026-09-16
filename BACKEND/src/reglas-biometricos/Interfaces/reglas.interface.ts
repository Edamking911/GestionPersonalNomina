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