// src/Componentes/ReglasComponent/EvaluarEmpleado.jsx
import { useState } from 'react';

export default function EvaluarEmpleado({ onEvaluar, evaluacion, onLimpiar }) {
  const [employeeId, setEmployeeId] = useState('');
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId || !fecha) {
      alert('Completa ambos campos.');
      return;
    }
    setLoading(true);
    try {
      await onEvaluar(employeeId, fecha);
    } catch (error) {
      // manejo en el hook
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaBusqueda = () => {
    // Limpiar inputs locales
    setEmployeeId('');
    setFecha('');
    // Resetear evaluación en el hook
    onLimpiar();
  };

  const getEstadoColor = (estado) => {
    const estados = {
      'PRESENTE': '#38a169',
      'AUSENTE': '#e53e3e',
      'RETARDO': '#dd6b20',
      'SALIDA TEMPRANA': '#d69e2e',
      'FALTA': '#e53e3e',
    };
    return estados[estado] || '#718096';
  };

  const formatearHoras = (minutos) => {
    if (!minutos && minutos !== 0) return '0h';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas === 0) return `${mins}m`;
    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}m`;
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '10px' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#2d3748' }}>🔍 Evaluar Empleado en Fecha Específica</h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>Cédula del empleado</label>
          <input
            type="text"
            placeholder="Ej. 29789773"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px' }}
            required
          />
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px' }}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#2b6cb0',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}
        >
          {loading ? 'Evaluando...' : '🔍 Evaluar'}
        </button>
      </form>

      {evaluacion && (
        <div style={{ marginTop: '20px' }}>
          {/* Encabezado con nombre y estado */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '20px', color: '#2d3748' }}>
                {evaluacion.nombre || 'Empleado'}
              </h4>
              <p style={{ margin: '4px 0 0 0', color: '#718096', fontSize: '14px' }}>
                Cédula: {evaluacion.employeeId} &nbsp;|&nbsp; Fecha: {evaluacion.fecha}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                background: getEstadoColor(evaluacion.estado),
                color: '#fff',
                padding: '6px 16px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '14px',
                textTransform: 'uppercase'
              }}>
                {evaluacion.estado || 'SIN EVALUAR'}
              </span>
            </div>
          </div>

          {/* Grid de tarjetas de métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Horario</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: '#2d3748' }}>
                {evaluacion.horario || 'N/A'}
              </p>
            </div>
            <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Entrada Real</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: '#2d3748' }}>
                {evaluacion.entradaReal || '—'}
              </p>
            </div>
            <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Salida Real</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: '#2d3748' }}>
                {evaluacion.salidaReal || '—'}
              </p>
            </div>
          </div>

          {/* Tarjetas de horas y extras */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#ebf8ff', padding: '14px', borderRadius: '8px', border: '1px solid #bee3f8' }}>
              <span style={{ fontSize: '11px', color: '#2b6cb0', textTransform: 'uppercase', fontWeight: '600' }}>Horas Diurnas</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#2b6cb0' }}>
                {formatearHoras(evaluacion.horasDiurnas)}
              </p>
            </div>
            <div style={{ background: '#fefcbf', padding: '14px', borderRadius: '8px', border: '1px solid #f6e05e' }}>
              <span style={{ fontSize: '11px', color: '#744210', textTransform: 'uppercase', fontWeight: '600' }}>Horas Nocturnas</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#744210' }}>
                {formatearHoras(evaluacion.horasNocturnas)}
              </p>
            </div>
            <div style={{ background: '#f0fff4', padding: '14px', borderRadius: '8px', border: '1px solid #c6f6d5' }}>
              <span style={{ fontSize: '11px', color: '#22543d', textTransform: 'uppercase', fontWeight: '600' }}>Horas Extra Diurnas</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#22543d' }}>
                {formatearHoras(evaluacion.horasExtraDiurnas)}
              </p>
            </div>
            <div style={{ background: '#fed7d7', padding: '14px', borderRadius: '8px', border: '1px solid #feb2b2' }}>
              <span style={{ fontSize: '11px', color: '#9b2c2c', textTransform: 'uppercase', fontWeight: '600' }}>Horas Extra Nocturnas</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#9b2c2c' }}>
                {formatearHoras(evaluacion.horasExtraNocturnas)}
              </p>
            </div>
          </div>

          {/* Retardos y salidas tempranas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ background: '#fff5f5', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fed7d7' }}>
              <span style={{ fontSize: '12px', color: '#9b2c2c', fontWeight: '600' }}>⏰ Retardo</span>
              <p style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#e53e3e' }}>
                {evaluacion.retardoLegible || '0m'}
              </p>
            </div>
            <div style={{ background: '#fffbeb', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f6e05e' }}>
              <span style={{ fontSize: '12px', color: '#744210', fontWeight: '600' }}>🏃 Salida Temprana</span>
              <p style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#d69e2e' }}>
                {evaluacion.salidaTempranaLegible || '0m'}
              </p>
            </div>
            <div style={{ background: '#ebf8ff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bee3f8' }}>
              <span style={{ fontSize: '12px', color: '#2b6cb0', fontWeight: '600' }}>⏱️ Minutos Retardo</span>
              <p style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#2b6cb0' }}>
                {evaluacion.minutosRetardo || 0}
              </p>
            </div>
          </div>

          {/* Botón para limpiar */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleNuevaBusqueda} // 👈 ahora llama a la función combinada
              style={{ padding: '6px 14px', background: '#718096', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              🔄 Nueva Búsqueda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}