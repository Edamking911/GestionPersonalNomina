// src/Componentes/ReglasComponent/ReporteDiario.jsx
import { useState } from 'react';

export default function ReporteDiario({ onGenerar, reporte }) {
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fecha) {
      alert('Selecciona una fecha.');
      return;
    }
    setLoading(true);
    try {
      await onGenerar(fecha);
    } catch (error) {
      // manejo en el hook
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'PRESENTE': '#38a169',
      'AUSENTE': '#e53e3e',
      'RETARDO': '#dd6b20',
      'SALIDA TEMPRANA': '#d69e2e',
      'PENDIENTE': '#3182ce',
      'NO_MARCO_SALIDA': '#e53e3e',
    };
    return colores[estado] || '#718096';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      'PRESENTE': '✅ Presente',
      'AUSENTE': '❌ Ausente',
      'RETARDO': '⏰ Retardo',
      'SALIDA TEMPRANA': '🏃 Salida temprana',
      'PENDIENTE': '⏳ Pendiente',
      'NO_MARCO_SALIDA': '⚠️ Sin salida',
    };
    return textos[estado] || estado;
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
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#2d3748' }}>📄 Reporte Diario de Asistencia</h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px' }}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#dd6b20',
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
          {loading ? 'Generando...' : '📄 Generar Reporte'}
        </button>
      </form>

      {reporte && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', color: '#2d3748' }}>
              Reporte del {reporte.fecha || 'día'}
            </h4>
            <span style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
              {reporte.totalEmpleados} empleados
            </span>
          </div>

          {reporte.reporte && reporte.reporte.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Empleado</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Horario</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Entrada</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Salida</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Estado</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Horas Diurnas</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Horas Nocturnas</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Extra Diurnas</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Extra Nocturnas</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.reporte.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '8px 10px', fontWeight: '500' }}>
                        {item.nombre} <span style={{ color: '#718096', fontSize: '11px' }}>({item.employeeId})</span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>{item.horario || 'N/A'}</td>
                      <td style={{ padding: '8px 10px' }}>{item.entradaReal || '—'}</td>
                      <td style={{ padding: '8px 10px' }}>{item.salidaReal || '—'}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          background: getEstadoColor(item.estado),
                          color: '#fff',
                          padding: '2px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}>
                          {getEstadoTexto(item.estado)}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>{item.horasDiurnasLegible || '0h'}</td>
                      <td style={{ padding: '8px 10px' }}>{item.horasNocturnasLegible || '0h'}</td>
                      <td style={{ padding: '8px 10px' }}>{item.horasExtraDiurnasLegible || '0h'}</td>
                      <td style={{ padding: '8px 10px' }}>{item.horasExtraNocturnasLegible || '0h'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#a0aec0', textAlign: 'center', padding: '20px' }}>No hay datos para mostrar.</p>
          )}
        </div>
      )}
    </div>
  );
}