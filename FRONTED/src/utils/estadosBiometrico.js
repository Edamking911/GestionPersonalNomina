// src/utils/estadosBiometrico.js
// =========================================================
// 🎨 Mapeo centralizado de estados de asistencia + novedades
// =========================================================

/**
 * Devuelve el badge visual para un estado de asistencia o novedad
 */
export const getEstadoBadge = (estado) => {
  const map = {
    // ========== ASISTENCIA NORMAL ==========
    PUNTUAL: { variant: 'success', texto: 'Puntual' },
    RETARDO: { variant: 'warning', texto: 'Retardo' },
    SALIDA_TEMPRANA: { variant: 'warning', texto: 'Salida Temprana' },
    COMPLETO: { variant: 'success', texto: 'Completo' },
    AUSENTE: { variant: 'danger', texto: 'Ausente' },
    DESCANSO: { variant: 'info', texto: 'Descanso' },
    SIN_HORARIO: { variant: 'default', texto: 'Sin Horario' },
    PENDIENTE: { variant: 'info', texto: 'Pendiente' },
    NO_MARCO_SALIDA: { variant: 'danger', texto: 'Sin Salida' },

    // ========== 🆕 NOVEDADES ==========
    VACACIONES: { variant: 'info', texto: '🏖️ Vacaciones' },
    REPOSO_MEDICO: { variant: 'danger', texto: '🏥 Reposo Médico' },
    PERMISO_REMUNERADO: { variant: 'success', texto: '📝 Permiso Remun.' },
    PERMISO_NO_REMUNERADO: { variant: 'warning', texto: '📝 Permiso No Remun.' },
    FALTA_JUSTIFICADA: { variant: 'warning', texto: '⚠️ Falta Justif.' },
    FALTA_INJUSTIFICADA: { variant: 'danger', texto: '❌ Falta Injustif.' },
  };
  return map[estado] || { variant: 'default', texto: estado };
};

/**
 * Estados del break (descanso)
 */
export const getEstadoBreak = (estado) => {
  const map = {
    CORRECTO: { variant: 'success', texto: '✅ OK' },
    EXCESO: { variant: 'danger', texto: '⚠️ Exceso' },
    CORTO: { variant: 'warning', texto: '⏱️ Corto' },
    NO_MARCO: { variant: 'default', texto: '— Sin break' },
  };
  return map[estado] || { variant: 'default', texto: estado || '—' };
};

/**
 * Lista de tipos de novedad para selects
 */
export const TIPOS_NOVEDAD = [
  { value: 'VACACIONES', label: '🏖️ Vacaciones', color: '#3182ce' },
  { value: 'REPOSO_MEDICO', label: '🏥 Reposo Médico', color: '#e53e3e' },
  { value: 'PERMISO_REMUNERADO', label: '📝 Permiso Remunerado', color: '#38a169' },
  { value: 'PERMISO_NO_REMUNERADO', label: '📝 Permiso No Remunerado', color: '#dd6b20' },
  { value: 'FALTA_JUSTIFICADA', label: '⚠️ Falta Justificada', color: '#d69e2e' },
  { value: 'FALTA_INJUSTIFICADA', label: '❌ Falta Injustificada', color: '#9b2c2c' },
];

/**
 * Lista de estados de novedad (solo los strings)
 */
export const ESTADOS_NOVEDAD = TIPOS_NOVEDAD.map((t) => t.value);

/**
 * Verifica si un estado corresponde a una novedad
 */
export const esNovedad = (estado) => ESTADOS_NOVEDAD.includes(estado);

/**
 * Cuenta cuántos días tiene una novedad
 */
export const contarDiasNovedad = (fechaInicio, fechaFin) => {
  const i = new Date(fechaInicio);
  const f = new Date(fechaFin);
  const diff = Math.floor((f.getTime() - i.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
};

/**
 * Formatea fecha a DD/MM/YYYY
 */
export const formatearFechaNovedad = (fecha) => {
  if (!fecha) return '—';
  const d = new Date(fecha);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};