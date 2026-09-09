// src/Componentes/ReglasBiometricoComponent/DiasLibresConfig.jsx
import { useState } from 'react';

export default function DiasLibresConfig({ diasLibres, onRefresh, onAsignar }) {
  const [employeeId, setEmployeeId] = useState('');
  const [semana, setSemana] = useState('');
  const [diasLibresSemana, setDiasLibresSemana] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!employeeId || !semana || !diasLibresSemana) {
      setMensaje('Completa todos los campos.');
      return;
    }
    const diasArray = diasLibresSemana.split(',').map(s => s.trim());
    try {
      await onAsignar(employeeId, semana, diasArray);
      setMensaje('Días libres asignados correctamente.');
      setEmployeeId('');
      setSemana('');
      setDiasLibresSemana('');
      onRefresh();
    } catch (error) {
      setMensaje('Error al asignar días libres.');
    }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#2d3748' }}>Configuración de Días Libres</h3>

      {mensaje && (
        <div style={{ background: mensaje.includes('Error') ? '#fed7d7' : '#c6f6d5', padding: '12px', borderRadius: '6px', marginBottom: '16px', color: mensaje.includes('Error') ? '#9b2c2c' : '#22543d' }}>
          {mensaje}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '15px', color: '#2d3748', marginBottom: '8px' }}>Días Libres Fijos (Generales)</h4>
        {diasLibres && diasLibres.length > 0 ? (
          <ul style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', listStyle: 'none', padding: 0 }}>
            {diasLibres.map((dia, idx) => (
              <li key={idx} style={{ background: '#ebf8ff', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', color: '#2b6cb0' }}>
                {dia}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#a0aec0' }}>No hay días libres fijos configurados.</p>
        )}
        <button
          onClick={onRefresh}
          style={{ marginTop: '8px', padding: '6px 14px', background: '#718096', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
        >
          🔄 Refrescar
        </button>
      </div>

      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
        <h4 style={{ fontSize: '15px', color: '#2d3748', marginBottom: '16px' }}>Asignar Días Libres por Semana a un Empleado</h4>
        <form onSubmit={handleAsignar} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' }}>
          <input
            type="text"
            placeholder="Cédula del empleado"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px' }}
            required
          />
          <input
            type="date"
            value={semana}
            onChange={(e) => setSemana(e.target.value)}
            style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px' }}
            required
          />
          <input
            type="text"
            placeholder="Días libres (ej. Lunes, Miércoles)"
            value={diasLibresSemana}
            onChange={(e) => setDiasLibresSemana(e.target.value)}
            style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px' }}
            required
          />
          <button
            type="submit"
            style={{ padding: '10px 20px', background: '#dd6b20', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
          >
            Asignar Días Libres
          </button>
        </form>
      </div>
    </div>
  );
}