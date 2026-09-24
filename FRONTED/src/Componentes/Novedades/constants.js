// src/Componentes/ReglasComponent/Novedades/constants.js

export const TIPOS_NOVEDAD = [
  { value: 'VACACIONES', label: '🏖️ Vacaciones', variant: 'info' },
  { value: 'REPOSO_MEDICO', label: '🏥 Reposo Médico', variant: 'danger' },
  { value: 'PERMISO_REMUNERADO', label: '📝 Permiso Remunerado', variant: 'success' },
  { value: 'PERMISO_NO_REMUNERADO', label: '📝 Permiso No Remunerado', variant: 'warning' },
  { value: 'FALTA_JUSTIFICADA', label: '⚠️ Falta Justificada', variant: 'warning' },
  { value: 'FALTA_INJUSTIFICADA', label: '❌ Falta Injustificada', variant: 'danger' },
];

export const getTipoInfo = (tipo) =>
  TIPOS_NOVEDAD.find((t) => t.value === tipo) || {
    value: tipo,
    label: tipo,
    variant: 'default',
  };

/** Formatea un ISO/Date a "DD/MM/YYYY" sin bug de timezone */
export const formatearFecha = (isoDate) => {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return String(isoDate);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${dd}/${m}/${y}`;
};

/** Convierte ISO/Date a "YYYY-MM-DD" para inputs type=date */
export const formatearFechaISO = (dateOrString) => {
  if (!dateOrString) return '';
  const d = new Date(dateOrString);
  if (isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

/** Cuenta los días inclusivos entre dos fechas */
export const calcularDias = (inicio, fin) => {
  if (!inicio || !fin) return 0;
  const i = new Date(inicio);
  const f = new Date(fin);
  const diff = Math.floor((f.getTime() - i.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
};