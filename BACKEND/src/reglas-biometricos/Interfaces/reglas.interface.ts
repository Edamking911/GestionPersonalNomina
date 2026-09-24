export interface HorarioAsistencia {
  id: string;
  nombre: string;
  entrada: string;
  salida: string;
  toleranciaMin: number;
  breakDuracionMin: number;
  breakToleranciaMin: number;
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

export interface BreakInfo {
  horaSalida: string | null;
  horaEntrada: string | null;
  duracionMin: number;
  duracionLegible: string;
  excesoMin: number;
  diferenciaMin: number; // + exceso, - corto
  estado: 'CORRECTO' | 'EXCESO' | 'CORTO' | 'NO_MARCO';
  diferenciaLegible: string;
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
    | 'AUSENTE'
    | 'DESCANSO'
    | 'PENDIENTE'
    | 'NO_MARCO_SALIDA'
    | 'SIN_HORARIO'
    | 'COMPLETO'
    | 'VACACIONES'
    | 'REPOSO_MEDICO'
    | 'PERMISO_REMUNERADO'
    | 'PERMISO_NO_REMUNERADO'
    | 'FALTA_JUSTIFICADA'
    | 'FALTA_INJUSTIFICADA';

  minutosRetardo: number;
  minutosSalidaTemprana: number;
  horasExtra: number;
  retardoLegible: string;
  salidaTempranaLegible: string;
  tipoTurno?: string;
  horasDiurnas: number;
  horasNocturnas: number;
  horasExtraDiurnas: number;
  horasExtraNocturnas: number;
  horasDiurnasLegible: string;
  horasNocturnasLegible: string;
  horasExtraDiurnasLegible: string;
  horasExtraNocturnasLegible: string;
  break?: BreakInfo;
  // ⬇️ NUEVO
  novedad?: {
    tipo: string;
    motivo?: string;
    documento?: string;
  };
}