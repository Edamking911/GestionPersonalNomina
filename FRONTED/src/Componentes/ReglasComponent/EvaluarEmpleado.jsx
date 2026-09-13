// src/Componentes/ReglasComponent/EvaluarEmpleado.jsx
import { useState } from 'react';
import Card from '../UI/Card';
import Input from '../UI/Input';
import Button from '../UI/Button';
import Badge from '../UI/Badge';

export default function EvaluarEmpleado({ onEvaluar, evaluacion, onLimpiar, showToast }) {
  const [employeeId, setEmployeeId] = useState('');
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employeeId.trim() || !fecha) {
      showToast?.('Completa ambos campos.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await onEvaluar(employeeId.trim(), fecha);
    } catch (err) {
      console.log('Error manejado por Toast:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaBusqueda = () => {
    setEmployeeId('');
    setFecha('');
    if (onLimpiar) onLimpiar();
  };

  const getEstadoBadge = (estado) => {
    const map = {
      PUNTUAL: { variant: 'success', texto: '✅ PUNTUAL' },
      PRESENTE: { variant: 'success', texto: '✅ PRESENTE' },
      COMPLETO: { variant: 'success', texto: '✅ COMPLETO' },
      RETARDO: { variant: 'warning', texto: '⏰ RETARDO' },
      SALIDA_TEMPRANA: { variant: 'warning', texto: '🏃 SALIDA TEMPRANA' },
      AUSENTE: { variant: 'danger', texto: '❌ AUSENTE' },
      DESCANSO: { variant: 'info', texto: '💤 DESCANSO' },
      SIN_HORARIO: { variant: 'default', texto: '⚠️ SIN HORARIO' },
      PENDIENTE: { variant: 'info', texto: '⏳ PENDIENTE' },
      NO_MARCO_SALIDA: { variant: 'danger', texto: '⚠️ SIN SALIDA' },
    };
    return map[estado] || { variant: 'default', texto: estado };
  };

  return (
    <Card
      title="Evaluar Empleado en Fecha Específica"
      subtitle="Consulta el cumplimiento de un empleado en un día concreto"
      icon="🔍"
      variant="info"
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <div style={{ flex: '1 1 220px' }}>
          <Input
            label="Cédula del Empleado"
            placeholder="Cedula"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value.replace(/\D/g, ''))}
            icon="👤"
            required
          />
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '600',
              fontSize: '13px',
              color: '#4a5568',
            }}
          >
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{
              width: '100%',
              height: '42px',
              padding: '0 14px',
              border: '1px solid #cbd5e0',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#2d3748',
              background: '#fff',
              colorScheme: 'light',
              outline: 'none',
              fontFamily: 'inherit',
            }}
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          iconLeft="🔍"
          style={{ flexShrink: 0 }}
        >
          {loading ? 'Evaluando...' : 'Evaluar'}
        </Button>
      </form>

      {evaluacion && (
        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '20px', color: '#2d3748' }}>
                {evaluacion.nombre || 'Empleado'}
              </h4>
              <p style={{ margin: '4px 0 0 0', color: '#718096', fontSize: '13px' }}>
                Cédula: {evaluacion.employeeId} &nbsp;|&nbsp; Fecha: {evaluacion.fecha}
              </p>
            </div>
            {(() => {
              const badge = getEstadoBadge(evaluacion.estado);
              return <Badge variant={badge.variant} size="lg">{badge.texto}</Badge>;
            })()}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                Horario
              </span>
              <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '600', color: '#2d3748' }}>
                {evaluacion.horario || 'N/A'}
              </p>
            </div>

            <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                Entrada Real
              </span>
              <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '600', color: '#2d3748' }}>
                {evaluacion.entradaReal || '—'}
              </p>
            </div>

            <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                Salida Real
              </span>
              <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '600', color: '#2d3748' }}>
                {evaluacion.salidaReal || '—'}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div style={{ background: '#ebf8ff', padding: '14px', borderRadius: '10px', border: '1px solid #bee3f8' }}>
              <span style={{ fontSize: '11px', color: '#2b6cb0', textTransform: 'uppercase', fontWeight: '600' }}>
                Horas Diurnas
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#2b6cb0' }}>
                {evaluacion.horasDiurnasLegible || '0h'}
              </p>
            </div>

            <div style={{ background: '#fefcbf', padding: '14px', borderRadius: '10px', border: '1px solid #f6e05e' }}>
              <span style={{ fontSize: '11px', color: '#744210', textTransform: 'uppercase', fontWeight: '600' }}>
                Horas Nocturnas
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#744210' }}>
                {evaluacion.horasNocturnasLegible || '0h'}
              </p>
            </div>

            <div style={{ background: '#f0fff4', padding: '14px', borderRadius: '10px', border: '1px solid #c6f6d5' }}>
              <span style={{ fontSize: '11px', color: '#22543d', textTransform: 'uppercase', fontWeight: '600' }}>
                Extra Diurnas
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#22543d' }}>
                {evaluacion.horasExtraDiurnasLegible || '0h'}
              </p>
            </div>

            <div style={{ background: '#fed7d7', padding: '14px', borderRadius: '10px', border: '1px solid #feb2b2' }}>
              <span style={{ fontSize: '11px', color: '#9b2c2c', textTransform: 'uppercase', fontWeight: '600' }}>
                Extra Nocturnas
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#9b2c2c' }}>
                {evaluacion.horasExtraNocturnasLegible || '0h'}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            <div style={{ background: '#fff5f5', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fed7d7' }}>
              <span style={{ fontSize: '12px', color: '#9b2c2c', fontWeight: '600' }}>
                ⏰ Retardo
              </span>
              <p style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#e53e3e' }}>
                {evaluacion.retardoLegible || '0m'}
              </p>
            </div>

            <div style={{ background: '#fffbeb', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f6e05e' }}>
              <span style={{ fontSize: '12px', color: '#744210', fontWeight: '600' }}>
                🏃 Salida Temprana
              </span>
              <p style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#d69e2e' }}>
                {evaluacion.salidaTempranaLegible || '0m'}
              </p>
            </div>

            <div style={{ background: '#ebf8ff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bee3f8' }}>
              <span style={{ fontSize: '12px', color: '#2b6cb0', fontWeight: '600' }}>
                ⏱️ Minutos Retardo
              </span>
              <p style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#2b6cb0' }}>
                {evaluacion.minutosRetardo || 0}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="light" size="sm" onClick={handleNuevaBusqueda} iconLeft="🔄">
              Nueva Búsqueda
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}