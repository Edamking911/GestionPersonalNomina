// src/Componentes/ReglasComponent/ReporteMensual.jsx
import { useState } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';

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

export default function ReporteMensual({ onGenerar, reporte }) {
  const hoy = new Date();
  const mesActual = String(hoy.getMonth() + 1).padStart(2, '0');
  const anioActual = hoy.getFullYear();

  const [mesSeleccionado, setMesSeleccionado] = useState(mesActual);
  const [anioSeleccionado, setAnioSeleccionado] = useState(String(anioActual));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mesFormateado = `${anioSeleccionado}-${mesSeleccionado}`;
    setLoading(true);
    try {
      await onGenerar(mesFormateado);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarExcel = () => {
    const mesFormateado = `${anioSeleccionado}-${mesSeleccionado}`;
    window.open(`http://localhost:3000/reglas/reporte-mensual?mes=${mesFormateado}&generarExcel=true`,'_blank');
  };

  const selectStyle = {
    padding: '0 14px',
    height: '42px',
    border: '1px solid #cbd5e0',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
    color: '#2d3748',
    fontFamily: 'inherit',
    colorScheme: 'light',
  };

  return (
    <Card
      title="Reporte Mensual de Nómina"
      subtitle="Consolidado de asistencia y horas para el período"
      icon="💰"
      variant="success"
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#4a5568' }}>
            Mes
          </label>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            style={{ ...selectStyle, minWidth: '150px' }}
          >
            <option value="01">Enero</option>
            <option value="02">Febrero</option>
            <option value="03">Marzo</option>
            <option value="04">Abril</option>
            <option value="05">Mayo</option>
            <option value="06">Junio</option>
            <option value="07">Julio</option>
            <option value="08">Agosto</option>
            <option value="09">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#4a5568' }}>
            Año
          </label>
          <select
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(e.target.value)}
            style={{ ...selectStyle, minWidth: '110px' }}
          >
            {[anioActual - 1, anioActual, anioActual + 1].map((a) => (
              <option key={a} value={String(a)}>{a}</option>
            ))}
          </select>
        </div>

        <Button type="submit" variant="primary" size="md" loading={loading} iconLeft="🔍">
          {loading ? 'Generando...' : 'Ver Reporte'}
        </Button>

        <Button variant="success" size="md" onClick={handleDescargarExcel} iconLeft="📥">
          Descargar Excel
        </Button>
      </form>

      {reporte?.rango?.esMesEnCurso && (
        <div
          style={{
            background: '#fffaf0',
            border: '1px solid #feebc8',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            color: '#744210',
            fontSize: '13px',
          }}
        >
          ⚠️ <strong>Mes en curso:</strong> Mostrando datos desde {reporte.rango.desde} hasta hoy ({reporte.rango.hasta}).
        </div>
      )}

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
              📅 {reporte.rango?.nombreMes || 'Reporte Mensual'}
            </h4>
            <Badge variant="success" size="md">
              {reporte.totalEmpleados} empleados · {reporte.rango?.totalDias} días
            </Badge>
          </div>

          {reporte.reporte && reporte.reporte.length > 0 ? (
            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Cédula', 'Nombre', 'Apellido', 'Días Lab.', 'Trab.', 'Ause.', 'Libres', 'Sin Salida', 'H. Norm. Diur.', 'H. Norm. Noct.', 'Extra Diur.', 'Extra Noct.', 'Retardo', 'Sal. Temprana', 'Total Horas'].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: '8px 10px',
                          textAlign: 'left',
                          fontSize: '10px',
                          color: '#4a5568',
                          textTransform: 'uppercase',
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
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #edf2f7',
                          background: idx % 2 === 0 ? '#fff' : '#fafbfc',
                        }}
                      >
                        <td style={{ padding: '8px 10px', fontWeight: '600', color: '#2b6cb0' }}>{item.employeeId}</td>
                        <td style={{ padding: '8px 10px' }}>{nombre}</td>
                        <td style={{ padding: '8px 10px', color: '#4a5568' }}>{apellido}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.diasLaborables}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: item.diasTrabajados > 0 ? '#22543d' : 'inherit', fontWeight: '600' }}>
                          {item.diasTrabajados}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: item.ausentes > 0 ? '#e53e3e' : 'inherit', fontWeight: item.ausentes > 0 ? '600' : '400' }}>
                          {item.ausentes}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.descansos}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: item.noMarcoSalida > 0 ? '#dd6b20' : 'inherit' }}>
                          {item.noMarcoSalida}
                        </td>
                        <td style={{ padding: '8px 10px' }}>{item.horasNormalesDiurnasLegible}</td>
                        <td style={{ padding: '8px 10px' }}>{item.horasNormalesNocturnasLegible}</td>
                        <td style={{ padding: '8px 10px' }}>{item.horasExtraDiurnasLegible}</td>
                        <td style={{ padding: '8px 10px' }}>{item.horasExtraNocturnasLegible}</td>
                        <td style={{ padding: '8px 10px' }}>{item.retardoLegible}</td>
                        <td style={{ padding: '8px 10px' }}>{item.salidaTempranaLegible}</td>
                        <td style={{ padding: '8px 10px', fontWeight: '700', color: '#2b6cb0', background: '#f0f9ff' }}>
                          {item.totalHorasLegible}
                        </td>
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