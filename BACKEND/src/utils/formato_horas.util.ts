// =========================================================
// CÉDULAS
// =========================================================

/**
 * Normaliza una cédula para comparar sin importar el formato.
 * Acepta: 'V-20111222', 'v-20111222', '20111222', 'V 20111222', 'V.20111222'
 * Devuelve: '20111222'
 */
export function normalizarCedula(cedula: string | number | undefined): string {
  if (!cedula) return '';
  return String(cedula)
    .trim()
    .toUpperCase()
    .replace(/^[VEJPG]-?\s*/i, '')
    .replace(/[^0-9]/g, '');
}

// =========================================================
// DÍAS DE LA SEMANA
// =========================================================

export const TODOS_LOS_DIAS = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
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

export function nombreADia(nombre: string): number {
  const normalizado = nombre.trim().toLowerCase();
  const idx = TODOS_LOS_DIAS.indexOf(normalizado);
  if (idx !== -1) return idx;
  const mapaSinTilde: Record<string, number> = { miercoles: 3, sabado: 6 };
  return mapaSinTilde[normalizado] ?? -1;
}

export function diaANombre(dia: number): string {
  return TODOS_LOS_DIAS[dia] ?? 'desconocido';
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

export function formatoFechaLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function formatearFechaLocal(d: Date): string {
  return formatoFechaLocal(d);
}

export function fechaDateAString(fecha: Date | string): string {
  const d = new Date(fecha);
  return d.toISOString().split('T')[0];
}

export function stringFechaADate(fechaStr: string): Date {
  const [y, m, d] = fechaStr.split('-').map(Number);
  return new Date(y, m - 1, d);
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

export function normalizarDia(dia: string): string {
  const limpio = dia.trim().toLowerCase();
  const mapa: Record<string, string> = {
    lunes: 'lunes', martes: 'martes',
    miercoles: 'miércoles', miércoles: 'miércoles',
    jueves: 'jueves', viernes: 'viernes',
    sabado: 'sábado', sábado: 'sábado', domingo: 'domingo',
  };
  return mapa[limpio] || limpio;
}