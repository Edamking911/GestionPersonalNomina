// src/Components/ReglasComponent/AsignarHorario.jsx
import { useState } from 'react';

export default function AsignarHorario({ onAsignar }) {
  const [employeeId, setEmployeeId] = useState('');
  const [horarioId, setHorarioId] = useState('');
  const [diasLibresFijos, setDiasLibresFijos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId || !horarioId) {
      setMensaje('Por favor completa todos los campos obligatorios.');
      return;
    }
    setLoading(true);
    try {
      await onAsignar(employeeId, horarioId, diasLibresFijos);
      setMensaje('Horario asignado correctamente.');
      setEmployeeId('');
      setHorarioId('');
      setDiasLibresFijos([]);
    } catch (error) {
      setMensaje('Error al asignar horario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '10px', maxWidth: '600px' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#2d3748' }}>Asignar Horario a Empleado</h3>

      {mensaje && (
        <div style={{ background: mensaje.includes('Error') ? '#fed7d7' : '#c6f6d5', padding: '12px', borderRadius: '6px', marginBottom: '16px', color: mensaje.includes('Error') ? '#9b2c2c' : '#22543d' }}>
          {mensaje}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>Cédula del Empleado *</label>
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Ej. 29789773"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>ID del Horario *</label>
          <input
            type="text"
            value={horarioId}
            onChange={(e) => setHorarioId(e.target.value)}
            placeholder="Ej. HOR-001"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>Días Libres Fijos (separados por coma)</label>
          <input
            type="text"
            value={diasLibresFijos.join(', ')}
            onChange={(e) => setDiasLibresFijos(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="Ej. Lunes, Miércoles, Viernes"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#3182ce',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontSize: '14px'
          }}
        >
          {loading ? 'Asignando...' : 'Asignar Horario'}
        </button>
      </form>
    </div>
  );
}