export const TIEMPO_CONFIG = {
  /** Día inicio de semana: 0=Dom, 1=Lun, ..., 6=Sáb */
  DIA_INICIO_SEMANA: 0,

  /** Nombres de días alineados con el índice */
  NOMBRES_DIAS: [
    'domingo',
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
  ] as const,

  /** Franja nocturna (LOTTT: 7 PM - 5 AM) */
  HORA_INICIO_NOCTURNA: 19,
  HORA_FIN_NOCTURNA: 5,

  /** Zona horaria */
  TIMEZONE: 'America/Caracas',
} as const;