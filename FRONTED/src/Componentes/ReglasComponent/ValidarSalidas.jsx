// src/Componentes/ReglasComponent/ValidarSalidas.jsx
import { useState } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';

export default function ValidarSalidas({ onValidar, resultado, showToast }) {
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onValidar(fecha || undefined);
    } catch (err) {
      console.log('Error manejado por Toast:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const map = {
      NO_MARCO_SALIDA: { variant: 'danger', texto: '⚠️ Sin salida' },
      PENDIENTE: { variant: 'info', texto: '⏳ Pendiente' },
      AUSENTE: { variant: 'danger', texto: '❌ Ausente' },
      PRESENTE: { variant: 'success', texto: '✅ Presente' },
      RETARDO: { variant: 'warning', texto: '⏰ Retardo' },
    };
    return map[estado] || { variant: 'default', texto: estado };
  };

  return (
    <Card
      title="Validar Salidas Pendientes"
      subtitle="Detecta empleados que no marcaron su salida"
      icon="✅"
      variant="info"
      style={{ maxWidth: '800px' }}
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
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '600',
              fontSize: '13px',
              color: '#4a5568',
            }}
          >
            Fecha (opcional)
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
          />
        </div>

        <Button
          type="submit"
          variant="info"
          size="lg"
          loading={loading}
          iconLeft="🔍"
          style={{ flexShrink: 0 }}
        >
          {loading ? 'Validando...' : 'Validar Salidas'}
        </Button>
      </form>

      {resultado && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '15px', color: '#2d3748' }}>
              Resultados para {resultado.fecha || 'hoy'}
            </h4>
            <Badge variant="info" size="md">
              {resultado.totalValidados || 0} registros
            </Badge>
          </div>

          {resultado.resultados && resultado.resultados.length > 0 ? (
            <div
              style={{
                overflowX: 'auto',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                      Empleado
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                      Horario
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                      Entrada Real
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.resultados.map((item, idx) => {
                    const badge = getEstadoBadge(item.estado);
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #edf2f7',
                          background: idx % 2 === 0 ? '#fff' : '#fafbfc',
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#2d3748' }}>
                          {item.nombre}
                          <span style={{ color: '#718096', fontSize: '11px', marginLeft: '6px' }}>
                            ({item.employeeId})
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4a5568' }}>
                          {item.horario || 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4a5568' }}>
                          {item.entradaReal || '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant={badge.variant} size="sm">
                            {badge.texto}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#f7fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
              <p style={{ margin: 0, color: '#38a169', fontSize: '14px', fontWeight: '600' }}>
                ¡Todos los empleados han marcado su salida!
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}