// src/Componentes/UI/ReporteIndividualModal.jsx
import { useState, useEffect, useMemo } from 'react';
import Badge from './Badge';
import Button from './Button';
import Pagination from './Paginacion';
import TableSkeleton from './EsqueletoTable';
import { usePagination } from '../../Hoosk/PaginacionHoosk';
import { exportarReportePDF, imprimirReporte } from '../../utils/pdfExport';
import api from '../../servicio/Api';

// =========================================================
//  HELPERS
// =========================================================
const formatearFechaLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// 🔧 Helper: convierte minutos a "Xh Ym"
const formatearMinutos = (minutos) => {
  if (!minutos || minutos <= 0) return '0m';
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// 🔧 Helper: convierte horas decimales a "Xh Ym"
const formatearHoras = (horas) => {
  if (!horas || horas <= 0) return '0h';
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
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

// =========================================================
// 🚀 COMPONENTE
// =========================================================
export default function ReporteIndividualModal({
  isOpen,
  employeeId,
  nombre,
  onClose,
}) {
  const hoy = new Date();
  const hace30 = new Date(hoy);
  hace30.setDate(hoy.getDate() - 29);

  const [desde, setDesde] = useState(formatearFechaLocal(hace30));
  const [hasta, setHasta] = useState(formatearFechaLocal(hoy));
  const [loading, setLoading] = useState(false);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [error, setError] = useState(null);

  // 📄 Paginación
  const pagination = usePagination(evaluaciones, {
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 250],
    resetKeys: [desde, hasta, employeeId],
  });

  // 🔄 Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // 🚫 Bloquear scroll del body
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // =========================================================
  // 🔄 CARGAR EVALUACIONES (día por día)
  // =========================================================
  useEffect(() => {
    if (!isOpen || !employeeId) return;
    cargarEvaluaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employeeId, desde, hasta]);

  const cargarEvaluaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      // 📅 Generar lista de fechas
      const [y1, m1, d1] = desde.split('-').map(Number);
      const [y2, m2, d2] = hasta.split('-').map(Number);
      const cursor = new Date(y1, m1 - 1, d1);
      const fin = new Date(y2, m2 - 1, d2);
      const fechas = [];

      while (cursor <= fin) {
        fechas.push(formatearFechaLocal(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }

      // 🔄 Fetch paralelo (con catch individual)
      const resultados = await Promise.all(
        fechas.map(async (fecha) => {
          try {
            const res = await api.get(
              `/reglas/evaluar/${employeeId}/${fecha}`,
            );
            if (res.data?.success === false) return null;
            return res.data;
          } catch {
            return null;
          }
        }),
      );

      const validas = resultados.filter(Boolean);
      setEvaluaciones(validas);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el historial.');
      setEvaluaciones([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // 📊 STATS
  // =========================================================
  const stats = useMemo(() => {
    if (!evaluaciones.length) return null;
    const total = evaluaciones.length;
    const diasTrabajados = evaluaciones.filter((e) =>
      ['PUNTUAL', 'RETARDO', 'SALIDA_TEMPRANA', 'COMPLETO'].includes(e.estado),
    ).length;
    const ausentes = evaluaciones.filter((e) => e.estado === 'AUSENTE').length;
    const descansos = evaluaciones.filter((e) => e.estado === 'DESCANSO').length;
    const noMarcoSalida = evaluaciones.filter(
      (e) => e.estado === 'NO_MARCO_SALIDA',
    ).length;
    const totalMinutosRetardo = evaluaciones.reduce(
      (s, e) => s + (e.minutosRetardo || 0),
      0,
    );
    const totalHorasExtra = evaluaciones.reduce(
      (s, e) => s + (e.horasExtra || 0),
      0,
    );
    const totalHorasTrabajadas = evaluaciones.reduce(
      (s, e) =>
        s +
        (e.horasDiurnas || 0) +
        (e.horasNocturnas || 0) +
        (e.horasExtraDiurnas || 0) +
        (e.horasExtraNocturnas || 0),
      0,
    );
    const asistenciaPct =
      diasTrabajados + ausentes > 0
        ? Math.round((diasTrabajados / (diasTrabajados + ausentes)) * 100)
        : null;

    return {
      total,
      diasTrabajados,
      ausentes,
      descansos,
      noMarcoSalida,
      totalMinutosRetardo,
      totalHorasExtra: Math.round(totalHorasExtra * 100) / 100,
      totalHorasTrabajadas: Math.round(totalHorasTrabajadas * 100) / 100,
      asistenciaPct,
    };
  }, [evaluaciones]);

  // =========================================================
  // 📄 PDF / IMPRIMIR
  // =========================================================
  const prepararDatosPDF = () => {
    if (!evaluaciones.length) return null;

    const columnas = [
      { key: 'fecha', label: 'Fecha' },
      { key: 'entradaReal', label: 'Entrada' },
      { key: 'salidaReal', label: 'Salida' },
      { key: 'estado', label: 'Estado' },
      { key: 'retardoLegible', label: 'Retardo' },
      { key: 'salidaTempranaLegible', label: 'Sal. Temprana' },
      { key: 'horasDiurnasLegible', label: 'H. Diurnas', align: 'right' },
      { key: 'horasNocturnasLegible', label: 'H. Nocturnas', align: 'right' },
      { key: 'horasExtraDiurnasLegible', label: 'Extra Diur.', align: 'right' },
      { key: 'horasExtraNocturnasLegible', label: 'Extra Noct.', align: 'right' },
    ];

    const estadoTexto = (estado) =>
      ({
        PUNTUAL: 'Puntual',
        RETARDO: 'Retardo',
        SALIDA_TEMPRANA: 'Salida Temprana',
        COMPLETO: 'Completo',
        AUSENTE: 'Ausente',
        DESCANSO: 'Descanso',
        SIN_HORARIO: 'Sin Horario',
        PENDIENTE: 'Pendiente',
        NO_MARCO_SALIDA: 'Sin Salida',
      })[estado] || estado;

    const filas = evaluaciones.map((e) => ({
      fecha: e.fecha,
      entradaReal: e.entradaReal || '—',
      salidaReal: e.salidaReal || '—',
      estado: estadoTexto(e.estado),
      retardoLegible: e.retardoLegible || '0m',
      salidaTempranaLegible: e.salidaTempranaLegible || '0m',
      horasDiurnasLegible: e.horasDiurnasLegible || '0h',
      horasNocturnasLegible: e.horasNocturnasLegible || '0h',
      horasExtraDiurnasLegible: e.horasExtraDiurnasLegible || '0h',
      horasExtraNocturnasLegible: e.horasExtraNocturnasLegible || '0h',
    }));

    return {
      titulo: 'Reporte Individual de Asistencia',
      subtitulo: `${nombre || 'Empleado'} · Cédula ${employeeId}`,
      columnas,
      filas,
      nombreArchivo: `reporte_${employeeId}_${desde}_a_${hasta}`,
      metadata: {
        Empleado: nombre || '—',
        Cédula: employeeId,
        Período: `${desde} → ${hasta}`,
        'Días trabajados': stats?.diasTrabajados || 0,
        Asistencia: stats?.asistenciaPct !== null ? `${stats.asistenciaPct}%` : '—',
      },
    };
  };

  const handlePDF = () => {
    const datos = prepararDatosPDF();
    if (!datos) return alert('No hay datos para exportar.');
    exportarReportePDF(datos);
  };

  const handleImprimir = () => {
    const datos = prepararDatosPDF();
    if (!datos) return alert('No hay datos para imprimir.');
    imprimirReporte(datos);
  };

  // =========================================================
  // 🎨 ESTILOS
  // =========================================================
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

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes rimFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rimSlideDown {
          0% { opacity: 0; transform: translateY(-30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes rimSpin { to { transform: rotate(360deg); } }
        .rim-backdrop {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex; align-items: flex-start; justify-content: center;
          padding: 40px 20px 20px;
          animation: rimFadeIn 0.2s ease-out;
          overflow-y: auto;
        }
        .rim-modal {
          background: var(--bg-card);
          border-radius: 14px;
          max-width: 1200px; width: 100%;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          animation: rimSlideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex; flex-direction: column;
          max-height: calc(100vh - 60px);
        }
        .rim-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-light);
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }
        .rim-title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
          display: flex; align-items: center; gap: 10px;
        }
        .rim-subtitle {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: var(--text-muted);
          font-family: monospace;
        }
        .rim-close {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: var(--bg-hover);
          color: var(--text-secondary);
          border: none; cursor: pointer;
          font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .rim-close:hover {
          background: var(--card-danger-bg);
          color: var(--danger);
        }
        .rim-body {
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1;
        }
        .rim-range {
          display: flex; gap: 12px; align-items: flex-end;
          flex-wrap: wrap; margin-bottom: 20px;
        }
        .rim-preset-btn {
          padding: 6px 12px;
          background: var(--bg-hover);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .rim-preset-btn:hover {
          background: var(--primary-soft);
          color: var(--primary);
          border-color: var(--primary);
        }
        .rim-preset-btn.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }
        .rim-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }
        .rim-stat {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--border-light);
          background: var(--bg-hover);
        }
        .rim-stat-label {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.4px;
        }
        .rim-stat-value {
          margin: 4px 0 0 0;
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
        }
      `}</style>

      <div className="rim-backdrop" onClick={onClose}>
        <div className="rim-modal" onClick={(e) => e.stopPropagation()}>
          {/* HEADER */}
          <div className="rim-header">
            <div>
              <h2 className="rim-title">
                📄 Reporte Individual
              </h2>
              <p className="rim-subtitle">
                {nombre || 'Empleado'} · {employeeId}
              </p>
            </div>
            <button className="rim-close" onClick={onClose} title="Cerrar">
              ✕
            </button>
          </div>

          {/* BODY */}
          <div className="rim-body">
            {/* RANGO + PRESETS + BOTONES */}
            <div className="rim-range">
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '600',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Desde
                </label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  style={{
                    padding: '0 12px',
                    height: '38px',
                    border: '1px solid var(--input-border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--input-text)',
                    background: 'var(--input-bg)',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '600',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Hasta
                </label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  style={{
                    padding: '0 12px',
                    height: '38px',
                    border: '1px solid var(--input-border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--input-text)',
                    background: 'var(--input-bg)',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Presets rápidos */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  className="rim-preset-btn"
                  onClick={() => {
                    const h = new Date();
                    const d = new Date(h);
                    d.setDate(h.getDate() - 6);
                    setDesde(formatearFechaLocal(d));
                    setHasta(formatearFechaLocal(h));
                  }}
                >
                  7 días
                </button>
                <button
                  className="rim-preset-btn"
                  onClick={() => {
                    const h = new Date();
                    const d = new Date(h);
                    d.setDate(h.getDate() - 29);
                    setDesde(formatearFechaLocal(d));
                    setHasta(formatearFechaLocal(h));
                  }}
                >
                  30 días
                </button>
                <button
                  className="rim-preset-btn"
                  onClick={() => {
                    const h = new Date();
                    const inicioMes = new Date(h.getFullYear(), h.getMonth(), 1);
                    setDesde(formatearFechaLocal(inicioMes));
                    setHasta(formatearFechaLocal(h));
                  }}
                >
                  Este mes
                </button>
              </div>

              {/* Botones de exportar */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <Button
                  variant="danger"
                  size="md"
                  onClick={handlePDF}
                  disabled={loading || !evaluaciones.length}
                  iconLeft="📄"
                >
                  PDF
                </Button>
                <Button
                  variant="dark"
                  size="md"
                  onClick={handleImprimir}
                  disabled={loading || !evaluaciones.length}
                  iconLeft="🖨️"
                >
                  Imprimir
                </Button>
              </div>
            </div>

            {/* SKELETON */}
            {loading && <TableSkeleton columns={10} rows={8} />}

            {/* ERROR */}
            {!loading && error && (
              <p
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--danger)',
                  fontSize: '14px',
                }}
              >
                ⚠️ {error}
              </p>
            )}

            {/* RESULTADO */}
            {!loading && !error && evaluaciones.length > 0 && (
              <>
                {/* Stats */}
                {stats && (
                  <div className="rim-stats">
                    <div className="rim-stat">
                      <div className="rim-stat-label">Días trabajados</div>
                      <p
                        className="rim-stat-value"
                        style={{ color: 'var(--success)' }}
                      >
                        {stats.diasTrabajados}
                      </p>
                    </div>
                    <div className="rim-stat">
                      <div className="rim-stat-label">Ausencias</div>
                      <p
                        className="rim-stat-value"
                        style={{ color: 'var(--danger)' }}
                      >
                        {stats.ausentes}
                      </p>
                    </div>
                    <div className="rim-stat">
                      <div className="rim-stat-label">Descansos</div>
                      <p className="rim-stat-value">{stats.descansos}</p>
                    </div>
                    <div className="rim-stat">
                      <div className="rim-stat-label">Sin salida</div>
                      <p
                        className="rim-stat-value"
                        style={{ color: 'var(--warning)' }}
                      >
                        {stats.noMarcoSalida}
                      </p>
                    </div>
                    <div className="rim-stat">
                      <div className="rim-stat-label">Asistencia</div>
                      <p className="rim-stat-value">
                        {stats.asistenciaPct !== null
                          ? `${stats.asistenciaPct}%`
                          : '—'}
                      </p>
                    </div>
                    <div className="rim-stat">
                      <div className="rim-stat-label">Retardo acum.</div>
                      <p
                        className="rim-stat-value"
                        style={{ color: 'var(--warning)' }}
                      >
                        {formatearMinutos(stats.totalMinutosRetardo)}
                      </p>
                    </div>
                    <div className="rim-stat">
                      <div className="rim-stat-label">Horas totales</div>
                      <p className="rim-stat-value">
                        {formatearHoras(stats.totalHorasTrabajadas)}
                      </p>
                    </div>
                    <div className="rim-stat">
                      <div className="rim-stat-label">Horas extra</div>
                      <p
                        className="rim-stat-value"
                        style={{ color: 'var(--success)' }}
                      >
                        {formatearHoras(stats.totalHorasExtra)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tabla */}
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
                            'Fecha',
                            'Entrada',
                            'Salida',
                            'Estado',
                            'Retardo',
                            'Sal. Temprana',
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
                          const badge = getEstadoBadge(item.estado);
                          return (
                            <tr
                              key={`${item.fecha}-${idx}`}
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
                                  color: 'var(--text-primary)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.fecha}
                              </td>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  color: 'var(--table-row-text)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.entradaReal || '—'}
                              </td>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  color: 'var(--table-row-text)',
                                  whiteSpace: 'nowrap',
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
                                }}
                              >
                                {item.retardoLegible || '0m'}
                              </td>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  color: 'var(--table-row-text)',
                                }}
                              >
                                {item.salidaTempranaLegible || '0m'}
                              </td>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  color: 'var(--table-row-text)',
                                }}
                              >
                                {item.horasDiurnasLegible || '0h'}
                              </td>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  color: 'var(--table-row-text)',
                                }}
                              >
                                {item.horasNocturnasLegible || '0h'}
                              </td>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  color: 'var(--table-row-text)',
                                }}
                              >
                                {item.horasExtraDiurnasLegible || '0h'}
                              </td>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  color: 'var(--table-row-text)',
                                }}
                              >
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
              </>
            )}

            {/* VACÍO */}
            {!loading && !error && evaluaciones.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  No hay registros de este empleado en el período seleccionado.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}