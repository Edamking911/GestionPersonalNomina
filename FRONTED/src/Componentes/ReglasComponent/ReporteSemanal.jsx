// src/Componentes/ReglasComponent/ReporteSemanal.jsx
import { useState } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import Pagination from '../UI/Paginacion';
import TableSkeleton from '../UI/EsqueletoTable';
import StatsSkeleton from '../UI/StatsEsqueleto';
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

export default function ReporteSemanal({ onGenerar, reporte }) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [soloConActividad, setSoloConActividad] = useState(false);
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);

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

  // ✅ FIX: usa API_BASE
  const handleDescargarExcel = () => {
    if (!desde || !hasta) {
      alert('Selecciona ambas fechas primero.');
      return;
    }
    window.open(
      `${API_BASE}/reglas/reporte-semanal?desde=${desde}&hasta=${hasta}&generarExcel=true`,
      '_blank'
    );
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

  const pagination = usePagination(reporteLimpio, {
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 250, 500],
    resetKeys: [
      reporte?.rango?.desde,
      reporte?.rango?.hasta,
      filtroTexto,
      soloConActividad,
    ],
  });

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
      totalVacaciones: reporteLimpio.reduce((s, i) => s + (i.diasVacaciones || 0), 0),
      totalReposo: reporteLimpio.reduce((s, i) => s + (i.diasReposoMedico || 0), 0),
      totalFaltas: reporteLimpio.reduce((s, i) => s + (i.diasFaltaJustificada || 0) + (i.diasFaltaInjustificada || 0), 0),
    };
  })();

  const prepararDatosReporte = () => {
    if (!reporteLimpio.length) return null;

    const columnasBase = [
      { key: 'employeeId', label: 'Cédula', width: 18 },
      { key: 'nombre', label: 'Nombre' },
      { key: 'apellido', label: 'Apellido' },
      { key: 'diasTrabajados', label: 'Trab.', align: 'center' },
      { key: 'ausentes', label: 'Ause.', align: 'center' },
      { key: 'descansos', label: 'Libres', align: 'center' },
      { key: 'noMarcoSalida', label: 'Sin Sal.', align: 'center' },
      { key: 'asistenciaPct', label: 'Asist. %', align: 'center' },
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
      { key: 'retardoLegible', label: 'Retardo' },
      { key: 'salidaTempranaLegible', label: 'Sal. Temprana' },
      { key: 'horasDiurnasLegible', label: 'H. Diurnas', align: 'right' },
      { key: 'horasNocturnasLegible', label: 'H. Nocturnas', align: 'right' },
      { key: 'horasExtraDiurnasLegible', label: 'Extra Diur.', align: 'right' },
      { key: 'horasExtraNocturnasLegible', label: 'Extra Noct.', align: 'right' },
      { key: 'totalHorasTrabajadasLegible', label: 'Total', align: 'right' },
    ];

    const columnas = mostrarAvanzado
      ? [...columnasBase, ...columnasAvanzadas, ...columnasResto]
      : [...columnasBase, ...columnasResto];

    const filas = reporteLimpio.map((item) => {
      const asistencia = calcularAsistencia(item);
      const { nombre, apellido } = separarNombreApellido(item.nombre || '');

      const base = {
        employeeId: item.employeeId,
        nombre,
        apellido,
        diasTrabajados: item.diasTrabajados ?? 0,
        ausentes: item.ausentes ?? 0,
        descansos: item.descansos ?? 0,
        noMarcoSalida: item.noMarcoSalida ?? 0,
        asistenciaPct: asistencia !== null ? `${asistencia}%` : '—',
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
        retardoLegible: item.retardoLegible || '0m',
        salidaTempranaLegible: item.salidaTempranaLegible || '0m',
        horasDiurnasLegible: item.horasDiurnasLegible || '0h',
        horasNocturnasLegible: item.horasNocturnasLegible || '0h',
        horasExtraDiurnasLegible: item.horasExtraDiurnasLegible || '0h',
        horasExtraNocturnasLegible: item.horasExtraNocturnasLegible || '0h',
        totalHorasTrabajadasLegible: item.totalHorasTrabajadasLegible || '0h',
      };

      return { ...base, ...avanzado, ...resto };
    });

    return {
      titulo: 'Reporte Semanal Consolidado',
      subtitulo: `Análisis de asistencia del ${reporte.rango?.desde} al ${reporte.rango?.hasta}`,
      columnas,
      filas,
      nombreArchivo: `reporte_semanal_${reporte.rango?.desde}_a_${reporte.rango?.hasta}`,
      metadata: {
        Período: `${reporte.rango?.desde} → ${reporte.rango?.hasta}`,
        Días: reporte.rango?.dias || '—',
        Empleados: reporteLimpio.length,
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
    padding: '8px 10px',
    textAlign: 'left',
    fontSize: '10px',
    color: 'var(--table-header-text)',
    textTransform: 'uppercase',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  };

  const headersBase = ['Cédula', 'Nombre', 'Apellido', 'Trab.', 'Ause.', 'Libres', 'Sin Salida', 'Asist. %'];
  const headersAvanzado = ['Vacac.', 'Reposo', 'P. Rem.', 'P. No Rem.', 'F. Just.', 'F. Injust.', 'Break OK', 'Break Exc.', 'Break Corto', 'Exceso Break'];
  const headersResto = ['Retardo', 'Sal. Temprana', 'H. Diurnas', 'H. Nocturnas', 'Extra Diur.', 'Extra Noct.', 'Total'];
  const headers = mostrarAvanzado
    ? [...headersBase, ...headersAvanzado, ...headersResto]
    : [...headersBase, ...headersResto];

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
          <label style={labelStyle}>Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            style={inputDateStyle}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            style={inputDateStyle}
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
          Excel
        </Button>

        <Button
          variant="danger"
          size="md"
          onClick={handleDescargarPDF}
          disabled={!reporteLimpio.length}
          iconLeft="📄"
        >
          PDF
        </Button>

        <Button
          variant="dark"
          size="md"
          onClick={handleImprimir}
          disabled={!reporteLimpio.length}
          iconLeft="🖨️"
        >
          Imprimir
        </Button>
      </form>

      {reporte?.rango?.esRangoEnCurso && !loading && (
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
          ⚠️ <strong>Rango en curso:</strong> Mostrando datos hasta hoy ({reporte.rango.hasta}).
        </div>
      )}

      {loading && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <StatsSkeleton count={4} />
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
              <StatMini
                label="Días Trabajados"
                value={stats.totalDiasTrabajados}
                bg="var(--card-success-bg)"
                border="var(--card-success-border)"
                color="var(--card-success-title)"
              />
              <StatMini
                label="Ausencias"
                value={stats.totalAusentes}
                bg="var(--card-danger-bg)"
                border="var(--card-danger-border)"
                color="var(--card-danger-title)"
              />
              <StatMini
                label="Sin Salida"
                value={stats.totalSinSalida}
                bg="var(--card-warning-bg)"
                border="var(--card-warning-border)"
                color="var(--card-warning-title)"
              />
              <StatMini
                label="Horas Extra"
                value={`${stats.totalHorasExtra}h`}
                bg="var(--card-info-bg)"
                border="var(--card-info-border)"
                color="var(--card-info-title)"
              />
              <StatMini
                label="🏖️ Vacaciones"
                value={stats.totalVacaciones}
                bg="var(--card-info-bg)"
                border="var(--card-info-border)"
                color="var(--card-info-title)"
              />
              <StatMini
                label="🏥 Reposos"
                value={stats.totalReposo}
                bg="var(--card-danger-bg)"
                border="var(--card-danger-border)"
                color="var(--card-danger-title)"
              />
              <StatMini
                label="⚠️ Faltas"
                value={stats.totalFaltas}
                bg="var(--card-warning-bg)"
                border="var(--card-warning-border)"
                color="var(--card-warning-title)"
              />
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o cédula..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                border: '1px solid var(--input-border)',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                color: 'var(--input-text)',
                background: 'var(--input-bg)',
              }}
            />
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={soloConActividad}
                onChange={(e) => setSoloConActividad(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Solo con actividad
            </label>
            <label
              style={{
                display: 'flex',
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

          {reporteLimpio.length > 0 ? (
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
                      const asistencia = calcularAsistencia(item);
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
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: item.diasTrabajados > 0 ? 'var(--success)' : 'var(--table-row-text)', fontWeight: '600' }}>
                            {item.diasTrabajados}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: item.ausentes > 0 ? 'var(--danger)' : 'var(--table-row-text)', fontWeight: item.ausentes > 0 ? '600' : '400' }}>
                            {item.ausentes}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--table-row-text)' }}>{item.descansos}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: item.noMarcoSalida > 0 ? 'var(--warning)' : 'var(--table-row-text)' }}>
                            {item.noMarcoSalida}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            {asistencia !== null ? (
                              <Badge variant={getBadgeColor(asistencia)} size="sm">
                                {asistencia}%
                              </Badge>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
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

                          <td style={{ padding: '8px 10px', color: 'var(--table-row-text)' }}>{item.retardoLegible}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--table-row-text)' }}>{item.salidaTempranaLegible}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--table-row-text)' }}>{item.horasDiurnasLegible}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--table-row-text)' }}>{item.horasNocturnasLegible}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--table-row-text)' }}>{item.horasExtraDiurnasLegible}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--table-row-text)' }}>{item.horasExtraNocturnasLegible}</td>
                          <td style={{ padding: '8px 10px', fontWeight: '700', color: 'var(--primary)' }}>
                            {item.totalHorasTrabajadasLegible}
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
              No hay datos que coincidan con los filtros.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

const StatMini = ({ label, value, bg, border, color }) => (
  <div
    style={{
      background: bg,
      padding: '12px 16px',
      borderRadius: '10px',
      border: `1px solid ${border}`,
    }}
  >
    <span style={{ fontSize: '11px', color, textTransform: 'uppercase', fontWeight: '600' }}>
      {label}
    </span>
    <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color }}>{value}</p>
  </div>
);