// src/Componentes/ReglasComponent/ValidarSalidas.jsx
import { useState } from 'react';

export default function ValidarSalidas({ onValidar, resultado }) {
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onValidar(fecha || undefined);
    } catch (error) {
      // manejo en el hook
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'NO_MARCO_SALIDA': '#e53e3e',
      'PRESENTE': '#38a169',
      'AUSENTE': '#e53e3e',
      'RETARDO': '#dd6b20',
      'SALIDA TEMPRANA': '#d69e2e',
      'PENDIENTE': '#3182ce',
    };
    return colores[estado] || '#718096';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      'NO_MARCO_SALIDA': '⚠️ Sin salida',
      'PRESENTE': '✅ Presente',
      'AUSENTE': '❌ Ausente',
      'RETARDO': '⏰ Retardo',
      'SALIDA TEMPRANA': '🏃 Salida temprana',
      'PENDIENTE': '⏳ Pendiente',
    };
    return textos[estado] || estado;
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '10px' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#2d3748' }}>✅ Validar Salidas Pendientes</h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>Fecha (opcional)</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#805ad5',
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
          {loading ? 'Validando...' : '✅ Validar'}
        </button>
      </form>

      {resultado && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', color: '#2d3748' }}>
              Resultados para {resultado.fecha || 'hoy'}
            </h4>
            <span style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
              {resultado.totalValidados} registros
            </span>
          </div>

          {resultado.resultados && resultado.resultados.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Empleado</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Horario</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Entrada Real</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Salida Real</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Estado</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Retardo</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.resultados.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '500' }}>
                        {item.nombre} <span style={{ color: '#718096', fontSize: '12px' }}>({item.employeeId})</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{item.horario || 'N/A'}</td>
                      <td style={{ padding: '10px 12px' }}>{item.entradaReal || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{item.salidaReal || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: getEstadoColor(item.estado),
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {getEstadoTexto(item.estado)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{item.retardoLegible || '0m'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#a0aec0', textAlign: 'center', padding: '20px' }}>No hay registros para validar.</p>
          )}
        </div>
      )}
    </div>
  );
}