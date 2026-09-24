// src/Componentes/ReglasComponent/ReporteDiario.jsx
import { useState } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import Pagination from '../UI/Paginacion';
import TableSkeleton from '../UI/EsqueletoTable';
import { usePagination } from '../../Hoosk/PaginacionHoosk';
import { exportarReportePDF, imprimirReporte } from '../../utils/pdfExport';
import { API_BASE } from '../../servicio/Api'; // ✅ NUEVO

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
    VACACIONES: { variant: 'info', texto: '🏖️ Vacaciones' },
    REPOSO_MEDICO: { variant: 'danger', texto: '🏥 Reposo' },
    PERMISO_REMUNERADO: { variant: 'success', texto: '📝 Permiso Rem.' },
    PERMISO_NO_REMUNERADO: { variant: 'warning', texto: '📝 Permiso No Rem.' },
    FALTA_JUSTIFICADA: { variant: 'warning', texto: '⚠️ Falta Just.' },
    FALTA_INJUSTIFICADA: { variant: 'danger', texto: '❌ Falta Injust.' },
  };
  return map[estado] || { variant: 'default', texto: estado };
};

const getEstadoBreakBadge = (estado) => {
  const map = {
    CORRECTO: { variant: 'success', texto: '✅ OK' },
    EXCESO: { variant: 'danger', texto: '⚠️ Exceso' },
    CORTO: { variant: 'warning', texto: '⏱️ Corto' },
    NO_MARCO: { variant: 'default', texto: '— Sin break' },
  };
  return map[estado] || { variant: 'default', texto: estado || '—' };
};

export default function ReporteDiario({ onGenerar, reporte }) {
  const [fecha, setFecha] = useState('');
  const [loading, setLoading] = useState(false);

  const pagination = usePagination(reporte?.reporte || [], {
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 250, 500],
    resetKeys: [reporte?.fecha, reporte?.totalEmpleados],
  });

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

  // ✅ FIX: usa API_BASE
  const handleDescargarExcel = () => {
    if (!fecha) {
      alert('Selecciona una fecha primero.');
      return;
    }
    window.open(`${API_BASE}/reglas/reporte/${fecha}?generarExcel=true`, '_blank');
  };

  const prepararDatosReporte = () => {
    if (!reporte?.reporte?.length) return null;

    const columnas = [
      { key: 'employeeId', label: 'Cédula', width: 18 },
      { key: 'nombre', label: 'Nombre' },
      { key: 'apellido', label: 'Apellido' },
      { key: 'horario', label: 'Horario' },
      { key: 'entradaReal', label: 'Entrada' },
      { key: 'salidaReal', label: 'Salida' },
      { key: 'estado', label: 'Estado' },
      { key: 'breakSalida', label: 'Break Sale' },
      { key: 'breakEntrada', label: 'Break Entra' },
      { key: 'breakDuracion', label: 'Dur. Break' },
      { key: 'breakEstado', label: 'Est. Break' },
      { key: 'horasDiurnasLegible', label: 'H. Diurnas', align: 'right' },
      { key: 'horasNocturnasLegible', label: 'H. Nocturnas', align: 'right' },
      { key: 'horasExtraDiurnasLegible', label: 'Extra Diur.', align: 'right' },
      { key: 'horasExtraNocturnasLegible', label: 'Extra Noct.', align: 'right' },
    ];

    const filas = reporte.reporte.map((item) => {
      const { nombre, apellido } = separarNombreApellido(item.nombre || '');
      const badge = getEstadoBadge(item.estado);

      return {
        employeeId: item.employeeId,
        nombre,
        apellido,
        horario: item.horario || '—',
        entradaReal: item.entradaReal || '—',
        salidaReal: item.salidaReal || '—',
        estado: badge.texto,
        breakSalida: item.break?.horaSalida || '—',
        breakEntrada: item.break?.horaEntrada || '—',
        breakDuracion: item.break?.duracionLegible || '—',
        breakEstado: item.break?.diferenciaLegible || '—',
        horasDiurnasLegible: item.horasDiurnasLegible || '0h',
        horasNocturnasLegible: item.horasNocturnasLegible || '0h',
        horasExtraDiurnasLegible: item.horasExtraDiurnasLegible || '0h',
        horasExtraNocturnasLegible: item.horasExtraNocturnasLegible || '0h',
      };
    });

    return {
      titulo: 'Reporte Diario de Asistencia',
      subtitulo: `Marcajes y horas trabajadas del día ${reporte.fecha || fecha}`,
      columnas,
      filas,
      nombreArchivo: `reporte_diario_${reporte.fecha || fecha}`,
      metadata: {
        Fecha: reporte.fecha || fecha,
        'Total Empleados': reporte.totalEmpleados || filas.length,
      },
    };
  };

  const handleDescargarPDF = () => {
    const datos = prepararDatosReporte();
    if (!datos) {
      alert('Genera el reporte primero.');
      return;
    }
    exportarReportePDF(datos);
  };

  const handleImprimir = () => {
    const datos = prepararDatosReporte();
    if (!datos) {
      alert('Genera el reporte primero.');
      return;
    }
    imprimirReporte(datos);
  };

  const inputDateStyle = {
    padding: '0 14px',
    height: '42px',
    border: '1px solid var(--input-border)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--input-text)',
    background: 'var(--input-bg)',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  };

  const thStyle = {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '11px',
    color: 'var(--table-header-text)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  };

  const inputDateStyle = {
    padding: '0 14px',
    height: '42px',
    border: '1px solid var(--input-border)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--input-text)',
    background: 'var(--input-bg)',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  };

  const thStyle = {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '11px',
    color: 'var(--table-header-text)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
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
          <label style={labelStyle}>Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={inputDateStyle}
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
          Excel
        </Button>

        <Button
          variant="danger"
          size="md"
          onClick={handleDescargarPDF}
          disabled={!reporte?.reporte?.length}
          iconLeft="📄"
        >
          PDF
        </Button>

        <Button
          variant="dark"
          size="md"
          onClick={handleImprimir}
          disabled={!reporte?.reporte?.length}
          iconLeft="🖨️"
        >
          Imprimir
        </Button>
      </form>

      {loading && (
        <div style={{ marginTop: '16px' }}>
          <TableSkeleton columns={15} rows={10} />
        </div>
      )}

      {!loading && reporte && (
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
            <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>
              Reporte del {reporte.fecha || 'día'}
            </h4>
            <Badge variant="info" size="md">
              {reporte.totalEmpleados} empleados
            </Badge>
          </div>

          {reporte.reporte && reporte.reporte.length > 0 ? (
            <div
              style={{
                borderRadius: '10px',
                border: '1px solid var(--table-row-border)',
                overflow: 'hidden',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                    background: 'var(--table-row-bg)',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: 'var(--table-header-bg)',
                        borderBottom: '2px solid var(--table-header-border)',
                      }}
                    >
                      {[
                        'Cédula',
                        'Nombre',
                        'Apellido',
                        'Horario',
                        'Entrada',
                        'Salida',
                        'Estado',
                        'Break Sale',
                        'Break Entra',
                        'Dur. Break',
                        'Est. Break',
                        'H. Diurnas',
                        'H. Nocturnas',
                        'Extra Diur.',
                        'Extra Noct.',
                      ].map((h, i) => (
                        <th key={i} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.paginatedItems.map((item, idx) => {
                      const { nombre, apellido } = separarNombreApellido(item.nombre || '');
                      const badge = getEstadoBadge(item.estado);
                      const breakBadge = getEstadoBreakBadge(item.break?.estado);

                      return (
                        <tr
                          key={`${item.employeeId}-${idx}`}
                          style={{
                            borderBottom: '1px solid var(--table-row-border)',
                            background:
                              idx % 2 === 0
                                ? 'var(--table-row-bg)'
                                : 'var(--table-row-bg-alt)',
                          }}
                        >
                          <td
                            style={{
                              padding: '10px 12px',
                              fontWeight: '600',
                              color: 'var(--primary)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.employeeId}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--table-row-text)' }}>
                            {nombre}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                            {apellido}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.horario}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              whiteSpace: 'nowrap',
                              color: 'var(--table-row-text)',
                            }}
                          >
                            {item.entradaReal || '—'}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              whiteSpace: 'nowrap',
                              color: 'var(--table-row-text)',
                            }}
                          >
                            {item.salidaReal || '—'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <Badge variant={badge.variant} size="sm">
                              {badge.texto}
                            </Badge>
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              color: 'var(--table-row-text)',
                              fontSize: '12px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.break?.horaSalida || '—'}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              color: 'var(--table-row-text)',
                              fontSize: '12px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.break?.horaEntrada || '—'}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              color: 'var(--table-row-text)',
                              fontSize: '12px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.break?.duracionLegible || '—'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {item.break?.estado ? (
                              <Badge variant={breakBadge.variant} size="sm">
                                {breakBadge.texto}
                              </Badge>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--table-row-text)' }}>
                            {item.horasDiurnasLegible || '0h'}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--table-row-text)' }}>
                            {item.horasNocturnasLegible || '0h'}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--table-row-text)' }}>
                            {item.horasExtraDiurnasLegible || '0h'}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--table-row-text)' }}>
                            {item.horasExtraNocturnasLegible || '0h'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination {...pagination} />
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              No hay datos para mostrar.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}