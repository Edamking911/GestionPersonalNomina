// src/Componentes/ReglasComponent/ReporteDiario.jsx
import { useState } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';

// 🔧 Función auxiliar: separa nombre y apellido
function separarNombreApellido(nombreCompleto) {
  if (!nombreCompleto) return { nombre: '', apellido: 'N/A' };
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  const total = partes.length;
  if (total === 1) return { nombre: partes[0], apellido: 'N/A' };
  if (total === 2) return { nombre: partes[0], apellido: partes[1] };
  if (total === 3) return { nombre: partes[0], apellido: partes.slice(1).join(' ') };
  if (total === 4) {
    return { nombre: partes.slice(0, 2).join(' '), apellido: partes.slice(2).join(' ') };
  }
  const mitad = Math.ceil(total / 2);
  return { nombre: partes.slice(0, mitad).join(' '), apellido: partes.slice(mitad).join(' ') };
}

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarExcel = () => {
    if (!fecha) {
      alert('Selecciona una fecha primero.');
      return;
    }
    window.open(`http://localhost:3000/reglas/reporte/${fecha}?generarExcel=true`, '_blank');
  };

  const getEstadoBadge = (estado) => {
    const map = {
      PUNTUAL: { variant: 'success', texto: 'Puntual' },
      RETARDO: { variant: 'warning', texto: 'Retardo' },
      SALIDA_TEMPRANA: { variant: 'warning', texto: 'Salida Temprana' },
      COMPLETO: { variant: 'success', texto: 'Completo' },
      AUSENTE: { variant: 'danger', texto: 'Ausente' },
      DESCANSO: { variant: 'info', texto: 'Descanso' },
      SIN_HORARIO: { variant: 'default', texto: 'Sin Horario' },
      PENDIENTE: { variant: 'info', texto: 'Pendiente' },
      NO_MARCO_SALIDA: { variant: 'danger', texto: 'Sin Salida' },
    };
    return map[estado] || { variant: 'default', texto: estado };
  };

  return (
    <Card
      title="Reporte Diario de Asistencia"
      subtitle="Consulta los marcajes y horas trabajadas en un día"
      icon="📄"
      variant="warning"
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <div>
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
              padding: '0 14px',
              height: '42px',
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

        <Button type="submit" variant="warning" size="md" loading={loading} iconLeft="🔍">
          {loading ? 'Generando...' : 'Ver Reporte'}
        </Button>

        <Button
          variant="success"
          size="md"
          onClick={handleDescargarExcel}
          disabled={!fecha}
          iconLeft="📥"
        >
          Descargar Excel
        </Button>
      </form>

      {reporte && (
        <div style={{ marginTop: '16px' }}>
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
              Reporte del {reporte.fecha || 'día'}
            </h4>
            <Badge variant="info" size="md">
              {reporte.totalEmpleados} empleados
            </Badge>
          </div>

          {reporte.reporte && reporte.reporte.length > 0 ? (
            <div
              style={{
                overflowX: 'auto',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Cédula', 'Nombre', 'Apellido', 'Horario', 'Entrada', 'Salida', 'Estado', 'H. Diurnas', 'H. Nocturnas', 'Extra Diur.', 'Extra Noct.'].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          fontSize: '11px',
                          color: '#4a5568',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reporte.reporte.map((item, idx) => {
                    const { nombre, apellido } = separarNombreApellido(item.nombre || '');
                    const badge = getEstadoBadge(item.estado);
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #edf2f7',
                          background: idx % 2 === 0 ? '#fff' : '#fafbfc',
                        }}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: '600', color: '#2b6cb0', whiteSpace: 'nowrap' }}>
                          {item.employeeId}
                        </td>
                        <td style={{ padding: '10px 12px' }}>{nombre}</td>
                        <td style={{ padding: '10px 12px', color: '#4a5568' }}>{apellido}</td>
                        <td style={{ padding: '10px 12px', color: '#718096', whiteSpace: 'nowrap' }}>{item.horario}</td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{item.entradaReal || '—'}</td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{item.salidaReal || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <Badge variant={badge.variant} size="sm">
                            {badge.texto}
                          </Badge>
                        </td>
                        <td style={{ padding: '10px 12px' }}>{item.horasDiurnasLegible || '0h'}</td>
                        <td style={{ padding: '10px 12px' }}>{item.horasNocturnasLegible || '0h'}</td>
                        <td style={{ padding: '10px 12px' }}>{item.horasExtraDiurnasLegible || '0h'}</td>
                        <td style={{ padding: '10px 12px' }}>{item.horasExtraNocturnasLegible || '0h'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#a0aec0', textAlign: 'center', padding: '20px' }}>
              No hay datos para mostrar.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}