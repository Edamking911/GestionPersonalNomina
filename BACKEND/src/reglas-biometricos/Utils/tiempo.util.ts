export const TODOS_LOS_DIAS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

export const HORA_NOCTURNA = '19:00';

export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function obtenerMinutosDeFecha(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function obtenerDiaSemana(fecha: Date): string {
  return TODOS_LOS_DIAS[fecha.getDay()];
}

export function formatearMinutos(minutos: number): string {
  if (minutos <= 0) return '0m';
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatearHoras(horas: number): string {
  if (horas <= 0) return '0h';
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function obtenerInicioSemana(fecha: Date): string {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const day = d.getDay();
  const diff = day === 0 ? 0 : -day;
  d.setDate(d.getDate() + diff);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
}

export function formatoFechaLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function normalizarDia(dia: string): string {
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