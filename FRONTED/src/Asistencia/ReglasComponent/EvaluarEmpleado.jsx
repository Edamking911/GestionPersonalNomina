// src/Componentes/ReglasComponent/EvaluarEmpleado.jsx
import { useState } from 'react';
import Card from '../../Componentes/UI/Card';
import Input from '../../Componentes/UI/Input';
import Button from '../../Componentes/UI/Button';
import Badge from '../../Componentes/UI/Badge';

// 🎨 Info visual por tipo de novedad
const INFO_NOVEDAD = {
  VACACIONES: {
    color: '#3182ce',
    bg: 'var(--card-info-bg)',
    border: 'var(--card-info-border)',
    emoji: '🏖️',
    texto: 'Vacaciones',
  },
  REPOSO_MEDICO: {
    color: '#e53e3e',
    bg: 'var(--card-danger-bg)',
    border: 'var(--card-danger-border)',
    emoji: '🏥',
    texto: 'Reposo Médico',
  },
  PERMISO_REMUNERADO: {
    color: '#38a169',
    bg: 'var(--card-success-bg)',
    border: 'var(--card-success-border)',
    emoji: '📝',
    texto: 'Permiso Remunerado',
  },
  PERMISO_NO_REMUNERADO: {
    color: '#dd6b20',
    bg: 'var(--card-warning-bg)',
    border: 'var(--card-warning-border)',
    emoji: '📝',
    texto: 'Permiso No Remunerado',
  },
  FALTA_JUSTIFICADA: {
    color: '#d69e2e',
    bg: 'var(--card-warning-bg)',
    border: 'var(--card-warning-border)',
    emoji: '⚠️',
    texto: 'Falta Justificada',
  },
  FALTA_INJUSTIFICADA: {
    color: '#e53e3e',
    bg: 'var(--card-danger-bg)',
    border: 'var(--card-danger-border)',
    emoji: '❌',
    texto: 'Falta Injustificada',
  },
};

export default function EvaluarEmpleado({
  onEvaluar,
  evaluacion,
  onLimpiar,
  showToast,
}) {
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
      VACACIONES: { variant: 'info', texto: '🏖️ VACACIONES' },
      REPOSO_MEDICO: { variant: 'danger', texto: '🏥 REPOSO MÉDICO' },
      PERMISO_REMUNERADO: { variant: 'success', texto: '📝 PERMISO REM.' },
      PERMISO_NO_REMUNERADO: { variant: 'warning', texto: '📝 PERMISO NO REM.' },
      FALTA_JUSTIFICADA: { variant: 'warning', texto: '⚠️ FALTA JUST.' },
      FALTA_INJUSTIFICADA: { variant: 'danger', texto: '❌ FALTA INJUST.' },
    };
    return map[estado] || { variant: 'default', texto: estado };
  };

  // 🆕 Info visual de la novedad si existe
  const novedadInfo = evaluacion?.novedad
    ? INFO_NOVEDAD[evaluacion.novedad.tipo] || {
        color: 'var(--text-primary)',
        bg: 'var(--bg-hover)',
        border: 'var(--border-light)',
        emoji: '📌',
        texto: evaluacion.novedad.tipo,
      }
    : null;

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
              color: 'var(--text-secondary)',
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
              border: '1px solid var(--input-border)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--input-text)',
              background: 'var(--input-bg)',
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
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '20px',
                  color: 'var(--text-primary)',
                }}
              >
                {evaluacion.nombre || 'Empleado'}
              </h4>
              <p
                style={{
                  margin: '4px 0 0 0',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                Cédula: {evaluacion.employeeId} &nbsp;|&nbsp; Fecha: {evaluacion.fecha}
              </p>
            </div>
            {(() => {
              const badge = getEstadoBadge(evaluacion.estado);
              return (
                <Badge variant={badge.variant} size="lg">
                  {badge.texto}
                </Badge>
              );
            })()}
          </div>

          {/* 🆕 BLOQUE DE NOVEDAD (destacado) */}
          {novedadInfo && (
            <div
              style={{
                background: novedadInfo.bg,
                border: `2px solid ${novedadInfo.border}`,
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '34px',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              >
                {novedadInfo.emoji}
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    color: novedadInfo.color,
                    textTransform: 'uppercase',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                  }}
                >
                  Novedad registrada
                </p>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: novedadInfo.color,
                  }}
                >
                  {novedadInfo.texto}
                </p>
                {evaluacion.novedad.motivo && (
                  <p
                    style={{
                      margin: '6px 0 0 0',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    📌 {evaluacion.novedad.motivo}
                  </p>
                )}
                {evaluacion.novedad.documento && (
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    📎 {evaluacion.novedad.documento}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Cuando hay novedad, no mostrar los detalles de marcaje (no aplican) */}
          {!novedadInfo && (
            <>
              {/* Fila 1: Horario, Entrada, Salida */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <InfoCard label="Horario" value={evaluacion.horario || 'N/A'} />
                <InfoCard label="Entrada Real" value={evaluacion.entradaReal || '—'} />
                <InfoCard label="Salida Real" value={evaluacion.salidaReal || '—'} />
              </div>

              {/* Fila 2: Horas */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <HourCard
                  label="Horas Diurnas"
                  value={evaluacion.horasDiurnasLegible || '0h'}
                  bg="var(--card-info-bg)"
                  border="var(--card-info-border)"
                  titleColor="var(--card-info-title)"
                  valueColor="var(--card-info-title)"
                />
                <HourCard
                  label="Horas Nocturnas"
                  value={evaluacion.horasNocturnasLegible || '0h'}
                  bg="var(--accent-yellow-light)"
                  border="var(--card-warning-border)"
                  titleColor="var(--card-warning-title)"
                  valueColor="var(--card-warning-title)"
                />
                <HourCard
                  label="Extra Diurnas"
                  value={evaluacion.horasExtraDiurnasLegible || '0h'}
                  bg="var(--card-success-bg)"
                  border="var(--card-success-border)"
                  titleColor="var(--card-success-title)"
                  valueColor="var(--card-success-title)"
                />
                <HourCard
                  label="Extra Nocturnas"
                  value={evaluacion.horasExtraNocturnasLegible || '0h'}
                  bg="var(--card-danger-bg)"
                  border="var(--card-danger-border)"
                  titleColor="var(--card-danger-title)"
                  valueColor="var(--card-danger-title)"
                />
              </div>

              {/* Fila 3: Retardo, Salida temprana, Minutos */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                <HourCard
                  label="⏰ Retardo"
                  value={evaluacion.retardoLegible || '0m'}
                  bg="var(--card-danger-bg)"
                  border="var(--card-danger-border)"
                  titleColor="var(--card-danger-title)"
                  valueColor="var(--danger)"
                />
                <HourCard
                  label="🏃 Salida Temprana"
                  value={evaluacion.salidaTempranaLegible || '0m'}
                  bg="var(--accent-yellow-light)"
                  border="var(--card-warning-border)"
                  titleColor="var(--card-warning-title)"
                  valueColor="var(--warning)"
                />
                <HourCard
                  label="⏱️ Minutos Retardo"
                  value={evaluacion.minutosRetardo || 0}
                  bg="var(--card-info-bg)"
                  border="var(--card-info-border)"
                  titleColor="var(--card-info-title)"
                  valueColor="var(--card-info-title)"
                />
              </div>
            </>
          )}

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

// 🔧 Sub-componentes auxiliares
const InfoCard = ({ label, value }) => (
  <div
    style={{
      background: 'var(--bg-hover)',
      padding: '16px',
      borderRadius: '10px',
      border: '1px solid var(--border-light)',
    }}
  >
    <span
      style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: '0.5px',
      }}
    >
      {label}
    </span>
    <p
      style={{
        margin: '6px 0 0 0',
        fontSize: '15px',
        fontWeight: '600',
        color: 'var(--text-primary)',
      }}
    >
      {value}
    </p>
  </div>
);

const HourCard = ({ label, value, bg, border, titleColor, valueColor }) => (
  <div
    style={{
      background: bg,
      padding: '14px',
      borderRadius: '10px',
      border: `1px solid ${border}`,
    }}
  >
    <span
      style={{
        fontSize: '11px',
        color: titleColor,
        textTransform: 'uppercase',
        fontWeight: '600',
      }}
    >
      {label}
    </span>
    <p
      style={{
        margin: '4px 0 0 0',
        fontSize: '20px',
        fontWeight: 'bold',
        color: valueColor,
      }}
    >
      {value}
    </p>
  </div>
);