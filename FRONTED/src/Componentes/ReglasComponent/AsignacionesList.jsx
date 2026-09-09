// src/Componentes/ReglasBiometricoComponent/AsignacionesList.jsx
import { useState, useEffect } from 'react';

export default function AsignacionesList({ asignaciones, onRefresh }) {
  const [semana, setSemana] = useState('');

  useEffect(() => {
    // Cargar la semana actual por defecto (domingo de la semana actual)
    const hoy = new Date();
    const dia = hoy.getDay(); // 0=domingo
    const domingo = new Date(hoy);
    domingo.setDate(hoy.getDate() - dia);
    const year = domingo.getFullYear();
    const month = String(domingo.getMonth() + 1).padStart(2, '0');
    const day = String(domingo.getDate()).padStart(2, '0');
    setSemana(`${year}-${month}-${day}`);
  }, []);

  const handleRefresh = () => {
    onRefresh(semana);
  };

  useEffect(() => {
    if (semana) onRefresh(semana);
  }, [semana]);

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#2d3748' }}>Asignaciones Semanales</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="date"
            value={semana}
            onChange={(e) => setSemana(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
          />
          <button
            onClick={handleRefresh}
            style={{ padding: '6px 14px', background: '#38a169', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
          >
            🔄 Refrescar
          </button>
        </div>
      </div>

      {asignaciones && asignaciones.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '10px 12px' }}>Empleado</th>
              <th style={{ padding: '10px 12px' }}>Horario</th>
              <th style={{ padding: '10px 12px' }}>Días Libres Fijos</th>
              <th style={{ padding: '10px 12px' }}>Días Libres Semana</th>
            </tr>
          </thead>
          <tbody>
            {asignaciones.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '10px 12px' }}>{item.employeeId}</td>
                <td style={{ padding: '10px 12px' }}>{item.horarioId}</td>
                <td style={{ padding: '10px 12px' }}>{item.diasLibresFijos?.join(', ') || 'Ninguno'}</td>
                <td style={{ padding: '10px 12px' }}>{item.diasLibresSemana?.join(', ') || 'Ninguno'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#a0aec0', textAlign: 'center', padding: '20px' }}>No hay asignaciones para esta semana.</p>
      )}
    </div>
  );
}