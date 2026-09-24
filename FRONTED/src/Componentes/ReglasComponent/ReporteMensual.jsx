// src/Componentes/ReglasComponent/ReporteMensual.jsx
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

export default function ReporteMensual({ onGenerar, reporte }) {
  const hoy = new Date();
  const mesActual = String(hoy.getMonth() + 1).padStart(2, '0');
  const anioActual = hoy.getFullYear();

  const [mesSeleccionado, setMesSeleccionado] = useState(mesActual);
  const [anioSeleccionado, setAnioSeleccionado] = useState(String(anioActual));
  const [loading, setLoading] = useState(false);
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);

  const pagination = usePagination(reporte?.reporte || [], {
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 250, 500],
    resetKeys: [reporte?.rango?.mes, reporte?.totalEmpleados],
  });

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

  // ✅ FIX: usa API_BASE
  const handleDescargarExcel = () => {
    const mesFormateado = `${anioSeleccionado}-${mesSeleccionado}`;
    window.open(
      `${API_BASE}/reglas/reporte-mensual?mes=${mesFormateado}&generarExcel=true`,
      '_blank'
    );
  };

  const prepararDatosReporte = () => {
    if (!reporte?.reporte?.length) return null;

    const columnasBase = [
      { key: 'employeeId', label: 'Cédula', width: 18 },
      { key: 'nombre', label: 'Nombre' },
      { key: 'apellido', label: 'Apellido' },
      { key: 'diasLaborables', label: 'D. Lab.', align: 'center' },
      { key: 'diasTrabajados', label: 'Trab.', align: 'center' },
      { key: 'ausentes', label: 'Ause.', align: 'center' },
      { key: 'descansos', label: 'Libres', align: 'center' },
      { key: 'noMarcoSalida', label: 'Sin Sal.', align: 'center' },
    ];

    const columnasAvanzadas = [
      { key: 'diasVacaciones', label: 'Vacac.', align: 'center' },
      { key: 'diasReposoMedico', label: 'Reposo', align: 'center' },
      { key: 'diasPermisoRemunerado', label: 'P. Rem.', align: 'center' },
      { key: 'diasPermisoNoRemunerado', label: 'P. No Rem.', align: 'center' },
      { key: 'diasFaltaJustificada', label: 'F. Just.', align: 'center' },
      { key: 'diasFaltaInjustificada', label: 'F. Injust.', align: 'center' },
      { key: 'diasBreakCorrecto', label: 'Break OK', align: 'center' },
      { key: 'diasBreakExceso', label: 'Break Exc.', align: 'center' },
      { key: 'diasBreakCorto', label: 'Break Corto', align: 'center' },
      { key: 'breakExcesoLegible', label: 'Exceso Break' },
    ];

    const columnasResto = [
      { key: 'horasNormalesDiurnasLegible', label: 'H.N. Diur.', align: 'right' },
      { key: 'horasNormalesNocturnasLegible', label: 'H.N. Noct.', align: 'right' },
      { key: 'horasExtraDiurnasLegible', label: 'Extra Diur.', align: 'right' },
      { key: 'horasExtraNocturnasLegible', label: 'Extra Noct.', align: 'right' },
      { key: 'retardoLegible', label: 'Retardo' },
      { key: 'salidaTempranaLegible', label: 'Sal. Temprana' },
      { key: 'totalHorasLegible', label: 'Total Horas', align: 'right' },
    ];

    const columnas = mostrarAvanzado
      ? [...columnasBase, ...columnasAvanzadas, ...columnasResto]
      : [...columnasBase, ...columnasResto];

    const filas = reporte.reporte.map((item) => {
      const { nombre, apellido } = separarNombreApellido(item.nombre || '');

      const base = {
        employeeId: item.employeeId,
        nombre,
        apellido,
        diasLaborables: item.diasLaborables ?? 0,
        diasTrabajados: item.diasTrabajados ?? 0,
        ausentes: item.ausentes ?? 0,
        descansos: item.descansos ?? 0,
        noMarcoSalida: item.noMarcoSalida ?? 0,
      };

      const avanzado = mostrarAvanzado
        ? {
            diasVacaciones: item.diasVacaciones ?? 0,
            diasReposoMedico: item.diasReposoMedico ?? 0,
            diasPermisoRemunerado: item.diasPermisoRemunerado ?? 0,
            diasPermisoNoRemunerado: item.diasPermisoNoRemunerado ?? 0,
            diasFaltaJustificada: item.diasFaltaJustificada ?? 0,
            diasFaltaInjustificada: item.diasFaltaInjustificada ?? 0,
            diasBreakCorrecto: item.diasBreakCorrecto ?? 0,
            diasBreakExceso: item.diasBreakExceso ?? 0,
            diasBreakCorto: item.diasBreakCorto ?? 0,
            breakExcesoLegible: item.breakExcesoLegible || '0m',
          }
        : {};

      const resto = {
        horasNormalesDiurnasLegible: item.horasNormalesDiurnasLegible || '0h',
        horasNormalesNocturnasLegible: item.horasNormalesNocturnasLegible || '0h',
        horasExtraDiurnasLegible: item.horasExtraDiurnasLegible || '0h',
        horasExtraNocturnasLegible: item.horasExtraNocturnasLegible || '0h',
        retardoLegible: item.retardoLegible || '0m',
        salidaTempranaLegible: item.salidaTempranaLegible || '0m',
        totalHorasLegible: item.totalHorasLegible || '0h',
      };

      return { ...base, ...avanzado, ...resto };
    });

    return {
      titulo: 'Reporte Mensual de Nómina',
      subtitulo: `Consolidado de asistencia y horas del mes ${reporte.rango?.nombreMes || ''}`,
      columnas,
      filas,
      nombreArchivo: `nomina_${reporte.rango?.mes || 'mensual'}`,
      metadata: {
        Mes: reporte.rango?.nombreMes || '—',
        Período: `${reporte.rango?.desde} → ${reporte.rango?.hasta}`,
        Días: reporte.rango?.totalDias || '—',
        Empleados: reporte.totalEmpleados || filas.length,
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

  const selectStyle = {
    padding: '0 14px',
    height: '42px',
    border: '1px solid var(--input-border)',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'var(--input-bg)',
    cursor: 'pointer',
    outline: 'none',
    color: 'var(--input-text)',
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
    padding: '8px 10px',
    textAlign: 'left',
    fontSize: '10px',
    color: 'var(--table-header-text)',
    textTransform: 'uppercase',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  };

  const headersBase = ['Cédula', 'Nombre', 'Apellido', 'D. Lab.', 'Trab.', 'Ause.', 'Libres', 'Sin Salida'];
  const headersAvanzado = ['Vacac.', 'Reposo', 'P. Rem.', 'P. No Rem.', 'F. Just.', 'F. Injust.', 'Break OK', 'Break Exc.', 'Break Corto', 'Exceso Break'];
  const headersResto = ['H.N. Diur.', 'H.N. Noct.', 'Extra Diur.', 'Extra Noct.', 'Retardo', 'Sal. Temprana', 'Total Horas'];
  const headers = mostrarAvanzado
    ? [...headersBase, ...headersAvanzado, ...headersResto]
    : [...headersBase, ...headersResto];

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
          <label style={labelStyle}>Mes</label>
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
          <label style={labelStyle}>Año</label>
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

      {reporte?.rango?.esMesEnCurso && !loading && (
        <div
          style={{
            background: 'var(--warning-soft)',
            border: '1px solid var(--card-warning-border)',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            color: 'var(--card-warning-title)',
            fontSize: '13px',
          }}
        >
          ⚠️ <strong>Mes en curso:</strong> Mostrando datos desde {reporte.rango.desde} hasta hoy ({reporte.rango.hasta}).
        </div>
      )}

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
              📅 {reporte.rango?.nombreMes || 'Reporte Mensual'}
            </h4>
            <Badge variant="success" size="md">
              {reporte.totalEmpleados} empleados · {reporte.rango?.totalDias} días
            </Badge>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '6px 12px',
                background: mostrarAvanzado ? 'var(--primary-soft)' : 'var(--bg-hover)',
                border: `1px solid ${mostrarAvanzado ? 'var(--primary)' : 'var(--border-color)'}`,
                borderRadius: '8px',
                fontWeight: '600',
              }}
            >
              <input
                type="checkbox"
                checked={mostrarAvanzado}
                onChange={(e) => setMostrarAvanzado(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              📊 Mostrar novedades y break
            </label>
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
                    fontSize: '12px',
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
                      {headers.map((h, i) => (
                        <th key={i} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.paginatedItems.map((item, idx) => {
                      const { nombre, apellido } = separarNombreApellido(item.nombre || '');
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
                          <td style={{ padding: '8px 10px', fontWeight: '600', color: 'var(--primary)' }}>
                            {item.employeeId}
                          </td>
                          <td style={{ padding: '8px 10px', color: 'var(--table-row-text)' }}>{nombre}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{apellido}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--table-row-text)' }}>
                            {item.diasLaborables}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: item.diasTrabajados > 0 ? 'var(--success)' : 'var(--table-row-text)', fontWeight: '600' }}>
                            {item.diasTrabajados}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: item.ausentes > 0 ? 'var(--danger)' : 'var(--table-row-text)', fontWeight: item.ausentes > 0 ? '600' : '400' }}>
                            {item.ausentes}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--table-row-text)' }}>
                            {item.descansos}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: item.noMarcoSalida > 0 ? 'var(--warning)' : 'var(--table-row-text)' }}>
                            {item.noMarcoSalida}
                          </td>

                          {mostrarAvanzado && (
                            <>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: item.diasVacaciones > 0 ? 'var(--info)' : 'var(--text-muted)' }}>
                                {item.diasVacaciones || 0}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: item.diasReposoMedico > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                {item.diasReposoMedico || 0}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--table-row-text)' }}>
                                {item.diasPermisoRemunerado || 0}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--table-row-text)' }}>
                                {item.diasPermisoNoRemunerado || 0}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: item.diasFaltaJustificada > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                                {item.diasFaltaJustificada || 0}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: item.diasFaltaInjustificada > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                {item.diasFaltaInjustificada || 0}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--success)' }}>
                                {item.diasBreakCorrecto || 0}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: item.diasBreakExceso > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                {item.diasBreakExceso || 0}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: item.diasBreakCorto > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                                {item.diasBreakCorto || 0}
                              </td>
                              <td style={{ padding: '8px 10px', color: item.breakExcesoLegible && item.breakExcesoLegible !== '0m' ? 'var(--danger)' : 'var(--text-muted)' }}>
                                {item.breakExcesoLegible || '0m'}
                              </td>
                            </>
                          )}

                          <td style={{ padding: '8px 10px', color: 'var(--table-row-text)' }}>{item.horasNormalesDiurnasLegible}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--table-row-text)' }}>{item.horasNormalesNocturnasLegible}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--table-row-text)' }}>{item.horasExtraDiurnasLegible}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--table-row-text)' }}>{item.horasExtraNocturnasLegible}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--table-row-text)' }}>{item.retardoLegible}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--table-row-text)' }}>{item.salidaTempranaLegible}</td>
                          <td style={{ padding: '8px 10px', fontWeight: '700', color: 'var(--primary)', background: 'var(--primary-soft)' }}>
                            {item.totalHorasLegible}
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