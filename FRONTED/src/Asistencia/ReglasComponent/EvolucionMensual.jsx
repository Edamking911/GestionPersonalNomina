// src/Componentes/ReglasComponent/EvolucionMensual.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from '../../Componentes/UI/Card';
import ChartSkeleton from '../../Componentes/UI/ChardEsqueleto';
import api from '../../servicio/Api';

// =========================================================
// 🔧 HELPERS
// =========================================================
const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatearMinutos = (minutos) => {
  if (!minutos || minutos <= 0) return '0m';
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const formatearHoras = (horas) => {
  if (!horas || horas <= 0) return '0h';
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const generarMeses = (count) => {
  const hoy = new Date();
  const meses = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: MESES_CORTOS[d.getMonth()],
      labelLargo: MESES_LARGOS[d.getMonth()],
      anio: d.getFullYear(),
    });
  }
  return meses;
};

// =========================================================
// 🎨 TOOLTIP / GRID
// =========================================================
const tooltipStyle = {
  borderRadius: '8px',
  border: '1px solid var(--chart-tooltip-border)',
  background: 'var(--chart-tooltip-bg)',
  color: 'var(--text-primary)',
  boxShadow: 'var(--shadow-md)',
};

const tooltipItemStyle = { color: 'var(--text-primary)' };
const tooltipLabelStyle = { color: 'var(--text-primary)', fontWeight: 600 };
const axisTickStyle = { fill: 'var(--chart-text)', fontSize: 12 };

const COLORS = {
  trabajados: '#22c55e',
  ausentes: '#ef4444',
  retardos: '#f59e0b',
  extras: '#3b82f6',
  novedades: '#a855f7',
  breakExceso: '#f97316',
};

// =========================================================
// 🚀 COMPONENTE
// =========================================================
export default function EvolucionMensual() {
  const [mesesCount, setMesesCount] = useState(6);
  const [empleadoFiltro, setEmpleadoFiltro] = useState('todos');
  const [empleados, setEmpleados] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState({
    trabajados: true,
    ausentes: true,
    retardos: true,
    extras: true,
    novedades: true,
    breakExceso: false,
  });

  // 🔄 Cargar lista de empleados (desde BD vía asignaciones)
  useEffect(() => {
    const cargarEmpleados = async () => {
      try {
        const res = await api.get('/reglas/asignaciones');
        const lista = res.data?.asignaciones || [];
        const activos = lista
          .map((a) => ({
            id: String(a.employeeId),
            nombre: a.nombre || 'Sin nombre',
          }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        setEmpleados(activos);
      } catch (err) {
        console.error('Error cargando empleados:', err);
      }
    };
    cargarEmpleados();
  }, []);

  // 🔄 Cargar datos
  useEffect(() => {
    cargarEvolucion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesesCount, empleadoFiltro]);

  const cargarEvolucion = async () => {
    setLoading(true);
    try {
      const meses = generarMeses(mesesCount);

      const resultados = await Promise.all(
        meses.map(async (m) => {
          try {
            const res = await api.get('/reglas/reporte-mensual', {
              params: { mes: m.key },
            });
            return { mes: m, data: res.data };
          } catch {
            return { mes: m, data: null };
          }
        }),
      );

      const agregados = resultados.map(({ mes, data: resp }) => {
        if (!resp?.reporte) {
          return {
            mesKey: mes.key,
            mes: mes.label,
            mesLargo: `${mes.labelLargo} ${mes.anio}`,
            trabajados: 0,
            ausentes: 0,
            retardos: 0,
            extras: 0,
            novedades: 0,
            breakExceso: 0,
            horasTrabajadas: 0,
            empleadosContados: 0,
          };
        }

        const lista =
          empleadoFiltro === 'todos'
            ? resp.reporte
            : resp.reporte.filter(
                (r) => String(r.employeeId) === String(empleadoFiltro),
              );

        const totalNovedades = lista.reduce(
          (s, r) =>
            s +
            (r.diasVacaciones || 0) +
            (r.diasReposoMedico || 0) +
            (r.diasPermisoRemunerado || 0) +
            (r.diasPermisoNoRemunerado || 0) +
            (r.diasFaltaJustificada || 0) +
            (r.diasFaltaInjustificada || 0),
          0,
        );

        const totalBreakExceso = lista.reduce(
          (s, r) => s + (r.minutosBreakExceso || 0),
          0,
        );

        return {
          mesKey: mes.key,
          mes: mes.label,
          mesLargo: `${mes.labelLargo} ${mes.anio}`,
          trabajados: lista.reduce((s, r) => s + (r.diasTrabajados || 0), 0),
          ausentes: lista.reduce((s, r) => s + (r.ausentes || 0), 0),
          retardos: lista.reduce((s, r) => s + (r.minutosRetardo || 0), 0),
          extras:
            Math.round(
              lista.reduce(
                (s, r) =>
                  s + (r.horasExtraDiurnas || 0) + (r.horasExtraNocturnas || 0),
                0,
              ) * 100,
            ) / 100,
          novedades: totalNovedades,
          breakExceso: totalBreakExceso,
          horasTrabajadas:
            Math.round(
              lista.reduce((s, r) => s + (r.totalHoras || 0), 0) * 100,
            ) / 100,
          empleadosContados: lista.length,
        };
      });

      setData(agregados);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // 📊 Resumen
  const resumen = useMemo(() => {
    if (!data.length) return null;
    const mesesConDatos = data.filter((d) => d.empleadosContados > 0);
    if (!mesesConDatos.length) return null;

    const mejores = [...mesesConDatos].sort(
      (a, b) => b.trabajados - a.trabajados,
    )[0];
    const peores = [...mesesConDatos].sort(
      (a, b) => a.trabajados - b.trabajados,
    )[0];

    const promedioTrabajados = Math.round(
      mesesConDatos.reduce((s, d) => s + d.trabajados, 0) / mesesConDatos.length,
    );
    const promedioRetardos = Math.round(
      mesesConDatos.reduce((s, d) => s + d.retardos, 0) / mesesConDatos.length,
    );
    const promedioNovedades = Math.round(
      mesesConDatos.reduce((s, d) => s + d.novedades, 0) / mesesConDatos.length,
    );

    return {
      mejorMes: mejores,
      peorMes: peores,
      promedioTrabajados,
      promedioRetardos,
      promedioNovedades,
    };
  }, [data]);

  const toggleSerie = (key) => {
    setSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card
        title="Evolución Mensual de Asistencia"
        subtitle="Analiza la tendencia mes a mes del equipo o de un empleado"
        icon="📈"
        variant="info"
      >
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
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
              Rango
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[3, 6, 12].map((n) => (
                <button
                  key={n}
                  onClick={() => setMesesCount(n)}
                  style={{
                    padding: '8px 14px',
                    background:
                      mesesCount === n ? 'var(--primary)' : 'var(--bg-hover)',
                    color: mesesCount === n ? '#fff' : 'var(--text-secondary)',
                    border:
                      mesesCount === n
                        ? '1px solid var(--primary)'
                        : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {n} meses
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: '1 1 260px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '600',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              Empleado
            </label>
            <select
              value={empleadoFiltro}
              onChange={(e) => setEmpleadoFiltro(e.target.value)}
              style={{
                width: '100%',
                padding: '0 14px',
                height: '40px',
                border: '1px solid var(--input-border)',
                borderRadius: '8px',
                fontSize: '13px',
                background: 'var(--input-bg)',
                color: 'var(--input-text)',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            >
              <option value="todos">👥 Todos los empleados</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} · {emp.id}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <ChartSkeleton height={320} />
          <ChartSkeleton height={280} />
        </div>
      )}

      {!loading && data.length > 0 && (
        <>
          {resumen && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              <Card variant="success" padding="sm">
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--card-success-subtitle)',
                    textTransform: 'uppercase',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                  }}
                >
                  🏆 Mejor mes
                </span>
                <p
                  style={{
                    margin: '6px 0 0 0',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'var(--card-success-title)',
                  }}
                >
                  {resumen.mejorMes.mesLargo}
                </p>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '12px',
                    color: 'var(--card-success-subtitle)',
                  }}
                >
                  {resumen.mejorMes.trabajados} días trabajados
                </p>
              </Card>

              <Card variant="danger" padding="sm">
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--card-danger-subtitle)',
                    textTransform: 'uppercase',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                  }}
                >
                  📉 Mes más bajo
                </span>
                <p
                  style={{
                    margin: '6px 0 0 0',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'var(--card-danger-title)',
                  }}
                >
                  {resumen.peorMes.mesLargo}
                </p>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '12px',
                    color: 'var(--card-danger-subtitle)',
                  }}
                >
                  {resumen.peorMes.trabajados} días trabajados
                </p>
              </Card>

              <Card variant="info" padding="sm">
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--card-info-subtitle)',
                    textTransform: 'uppercase',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                  }}
                >
                  📊 Promedio trabajados
                </span>
                <p
                  style={{
                    margin: '6px 0 0 0',
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: 'var(--card-info-title)',
                  }}
                >
                  {resumen.promedioTrabajados}
                </p>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '12px',
                    color: 'var(--card-info-subtitle)',
                  }}
                >
                  días/mes
                </p>
              </Card>

              <Card variant="warning" padding="sm">
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--card-warning-subtitle)',
                    textTransform: 'uppercase',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                  }}
                >
                  ⏰ Retardo promedio
                </span>
                <p
                  style={{
                    margin: '6px 0 0 0',
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: 'var(--card-warning-title)',
                  }}
                >
                  {formatearMinutos(resumen.promedioRetardos)}
                </p>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '12px',
                    color: 'var(--card-warning-subtitle)',
                  }}
                >
                  por mes
                </p>
              </Card>

              <Card variant="info" padding="sm">
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--card-info-subtitle)',
                    textTransform: 'uppercase',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                  }}
                >
                  📅 Novedades promedio
                </span>
                <p
                  style={{
                    margin: '6px 0 0 0',
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: 'var(--card-info-title)',
                  }}
                >
                  {resumen.promedioNovedades}
                </p>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '12px',
                    color: 'var(--card-info-subtitle)',
                  }}
                >
                  días/mes
                </p>
              </Card>
            </div>
          )}

          {/* Gráfico de líneas */}
          <Card
            title="Tendencia por mes"
            subtitle="Haz clic en la leyenda para mostrar u ocultar series"
            icon="📈"
            variant="default"
          >
            <div style={{ width: '100%', height: 380 }}>
              <ResponsiveContainer>
                <LineChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="mes" tick={axisTickStyle} />
                  <YAxis yAxisId="left" tick={axisTickStyle} />
                  <YAxis yAxisId="right" orientation="right" tick={axisTickStyle} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                    labelStyle={tooltipLabelStyle}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.mesLargo || label
                    }
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 13, paddingTop: 10 }}
                    onClick={(e) => toggleSerie(e.dataKey)}
                    cursor="pointer"
                  />

                  {series.trabajados && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="trabajados"
                      name="Días Trabajados"
                      stroke={COLORS.trabajados}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                    />
                  )}
                  {series.ausentes && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="ausentes"
                      name="Ausencias"
                      stroke={COLORS.ausentes}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                    />
                  )}
                  {series.novedades && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="novedades"
                      name="Novedades"
                      stroke={COLORS.novedades}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                    />
                  )}
                  {series.retardos && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="retardos"
                      name="Retardo (min)"
                      stroke={COLORS.retardos}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                    />
                  )}
                  {series.extras && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="extras"
                      name="Horas Extra"
                      stroke={COLORS.extras}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                    />
                  )}
                  {series.breakExceso && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="breakExceso"
                      name="Exceso Break (min)"
                      stroke={COLORS.breakExceso}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Gráfico de barras */}
          <Card
            title="Comparativa de retardos, ausencias y novedades"
            subtitle="Barras agrupadas por mes"
            icon="📊"
            variant="default"
          >
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="mes" tick={axisTickStyle} />
                  <YAxis yAxisId="left" tick={axisTickStyle} />
                  <YAxis yAxisId="right" orientation="right" tick={axisTickStyle} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                    labelStyle={tooltipLabelStyle}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.mesLargo || label
                    }
                    formatter={(value, name) => {
                      if (name === 'Retardo (min)') {
                        return [formatearMinutos(value), 'Retardo'];
                      }
                      if (name === 'Horas Extra') {
                        return [formatearHoras(value), 'Horas Extra'];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />

                  <Bar
                    yAxisId="left"
                    dataKey="ausentes"
                    name="Ausencias"
                    fill={COLORS.ausentes}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="novedades"
                    name="Novedades"
                    fill={COLORS.novedades}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="retardos"
                    name="Retardo (min)"
                    fill={COLORS.retardos}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {!loading && data.length === 0 && (
        <Card variant="default">
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📈</div>
            <p style={{ margin: 0, fontSize: '14px' }}>
              No hay datos suficientes para mostrar la evolución.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}