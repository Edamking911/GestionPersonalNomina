// src/Componentes/ReglasComponent/ReporteSemanal.jsx
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

export default function ReporteSemanal({ onGenerar, reporte }) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [soloConActividad, setSoloConActividad] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desde || !hasta) {
      alert('Selecciona ambas fechas.');
      return;
    }
    if (desde > hasta) {
      alert('La fecha "desde" no puede ser mayor a "hasta".');
      return;
    }
    setLoading(true);
    try {
      await onGenerar(desde, hasta);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarExcel = () => {
    if (!desde || !hasta) {
      alert('Selecciona ambas fechas primero.');
      return;
    }
    window.open(`http://localhost:3000/reglas/reporte-semanal?desde=${desde}&hasta=${hasta}&generarExcel=true`,'_blank');
  };

  const esIdDePrueba = (employeeId) => {
    const id = String(employeeId).trim();
    if (!/^\d+$/.test(id)) return true;
    if (id.length < 5) return true;
    return false;
  };

  const calcularAsistencia = (item) => {
    const diasLab = (item.diasTrabajados || 0) + (item.ausentes || 0) + (item.noMarcoSalida || 0);
    if (diasLab === 0) return null;
    return Math.round((item.diasTrabajados / diasLab) * 100);
  };

  const getBadgeColor = (p) => {
    if (p === null) return 'default';
    if (p >= 80) return 'success';
    if (p >= 50) return 'warning';
    return 'danger';
  };

  const reporteLimpio = (() => {
    if (!reporte?.reporte) return [];
    return reporte.reporte
      .filter((item) => !esIdDePrueba(item.employeeId))
      .filter((item) => {
        if (!soloConActividad) return true;
        return item.diasTrabajados > 0 || item.noMarcoSalida > 0 || item.ausentes > 0;
      })
      .filter((item) => {
        if (!filtroTexto) return true;
        const t = filtroTexto.toLowerCase();
        return (
          String(item.employeeId).includes(t) ||
          (item.nombre || '').toLowerCase().includes(t)
        );
      })
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  })();

  const stats = (() => {
    if (reporteLimpio.length === 0) return null;
    return {
      totalDiasTrabajados: reporteLimpio.reduce((s, i) => s + (i.diasTrabajados || 0), 0),
      totalAusentes: reporteLimpio.reduce((s, i) => s + (i.ausentes || 0), 0),
      totalSinSalida: reporteLimpio.reduce((s, i) => s + (i.noMarcoSalida || 0), 0),
      totalHorasExtra:
        Math.round(
          (reporteLimpio.reduce((s, i) => s + (i.horasExtraDiurnas || 0), 0) +
            reporteLimpio.reduce((s, i) => s + (i.horasExtraNocturnas || 0), 0)) *
            100
        ) / 100,
    };
  })();

  return (
    <Card
      title="Reporte Semanal Consolidado"
      subtitle="Análisis de asistencia y horas por rango de fechas"
      icon="📊"
      variant="info"
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
            Desde
          </label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
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

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#4a5568' }}>
            Hasta
          </label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
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

        <Button type="submit" variant="info" size="md" loading={loading} iconLeft="🔍">
          {loading ? 'Generando...' : 'Ver Reporte'}
        </Button>

        <Button
          variant="success"
          size="md"
          onClick={handleDescargarExcel}
          disabled={!desde || !hasta}
          iconLeft="📥"
        >
          Descargar Excel
        </Button>
      </form>

      {reporte?.rango?.esRangoEnCurso && (
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
          ⚠️ <strong>Rango en curso:</strong> Mostrando datos hasta hoy ({reporte.rango.hasta}).
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
              Reporte del {reporte.rango?.desde} al {reporte.rango?.hasta}
            </h4>
            <Badge variant="info" size="md">
              {reporteLimpio.length} empleados · {reporte.rango?.dias} días
            </Badge>
          </div>

          {stats && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div style={{ background: '#f0fff4', padding: '12px 16px', borderRadius: '10px', border: '1px solid #c6f6d5' }}>
                <span style={{ fontSize: '11px', color: '#22543d', textTransform: 'uppercase', fontWeight: '600' }}>Días Trabajados</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#22543d' }}>{stats.totalDiasTrabajados}</p>
              </div>
              <div style={{ background: '#fff5f5', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fed7d7' }}>
                <span style={{ fontSize: '11px', color: '#9b2c2c', textTransform: 'uppercase', fontWeight: '600' }}>Ausencias</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#9b2c2c' }}>{stats.totalAusentes}</p>
              </div>
              <div style={{ background: '#fffaf0', padding: '12px 16px', borderRadius: '10px', border: '1px solid #feebc8' }}>
                <span style={{ fontSize: '11px', color: '#744210', textTransform: 'uppercase', fontWeight: '600' }}>Sin Salida</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#744210' }}>{stats.totalSinSalida}</p>
              </div>
              <div style={{ background: '#ebf8ff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bee3f8' }}>
                <span style={{ fontSize: '11px', color: '#2b6cb0', textTransform: 'uppercase', fontWeight: '600' }}>Horas Extra</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#2b6cb0' }}>{stats.totalHorasExtra}h</p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o cédula..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                border: '1px solid #cbd5e0',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                color: '#2d3748',
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4a5568', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={soloConActividad}
                onChange={(e) => setSoloConActividad(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Solo con actividad
            </label>
          </div>

          {reporteLimpio.length > 0 ? (
            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Cédula', 'Nombre', 'Apellido', 'Trab.', 'Ause.', 'Libres', 'Sin Salida', 'Asist. %', 'Retardo', 'Sal. Temprana', 'H. Diurnas', 'H. Nocturnas', 'Extra Diur.', 'Extra Noct.', 'Total'].map((h, i) => (
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
                  {reporteLimpio.map((item, idx) => {
                    const asistencia = calcularAsistencia(item);
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
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {asistencia !== null ? (
                            <Badge variant={getBadgeColor(asistencia)} size="sm">
                              {asistencia}%
                            </Badge>
                          ) : (
                            <span style={{ color: '#a0aec0' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px' }}>{item.retardoLegible}</td>
                        <td style={{ padding: '8px 10px' }}>{item.salidaTempranaLegible}</td>
                        <td style={{ padding: '8px 10px' }}>{item.horasDiurnasLegible}</td>
                        <td style={{ padding: '8px 10px' }}>{item.horasNocturnasLegible}</td>
                        <td style={{ padding: '8px 10px' }}>{item.horasExtraDiurnasLegible}</td>
                        <td style={{ padding: '8px 10px' }}>{item.horasExtraNocturnasLegible}</td>
                        <td style={{ padding: '8px 10px', fontWeight: '700', color: '#2b6cb0' }}>
                          {item.totalHorasTrabajadasLegible}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#a0aec0', textAlign: 'center', padding: '20px' }}>
              No hay datos que coincidan con los filtros.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}