// src/Componentes/ReglasComponent/Dashboard.jsx
import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from '../UI/Card';
import Button from '../UI/Button';
import StatsSkeleton from '../UI/StatsEsqueleto';
import ChartSkeleton from '../UI/ChardEsqueleto';

// =========================================================
// 🎨 COLORES
// =========================================================
const COLORS = {
  primary: '#3182ce',
  success: '#38a169',
  warning: '#dd6b20',
  danger: '#e53e3e',
  info: '#805ad5',
  gray: '#718096',
};

const ESTADO_COLORS = {
  PUNTUAL: '#38a169',
  RETARDO: '#dd6b20',
  SALIDA_TEMPRANA: '#d69e2e',
  AUSENTE: '#e53e3e',
  DESCANSO: '#3182ce',
  NO_MARCO_SALIDA: '#9b2c2c',
  PENDIENTE: '#805ad5',
};

// =========================================================
// 🔧 HELPERS
// =========================================================
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

// =========================================================
// 🎨 ESTILOS COMPARTIDOS
// =========================================================
const inputDateStyle = {
  padding: '0 14px',
  height: '42px',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  background: 'var(--bg-input)',
  outline: 'none',
  fontFamily: 'inherit',
};

const inputDateStyleDisabled = {
  ...inputDateStyle,
  background: 'var(--bg-hover)',
  opacity: 0.6,
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: '600',
  fontSize: '13px',
  color: 'var(--text-secondary)',
};

const statLabelStyle = {
  fontSize: '11px',
  color: 'var(--stat-card-text-muted)',
  textTransform: 'uppercase',
  fontWeight: '600',
  letterSpacing: '0.5px',
};

const statValueStyle = {
  margin: '6px 0 0 0',
  fontSize: '26px',
  fontWeight: 'bold',
};

// =========================================================
// 🎨 TOOLTIP / GRID / TICKS
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

// =========================================================
// 🚀 COMPONENTE PRINCIPAL
// =========================================================
export default function Dashboard({ reporteSemanal, onGenerarSemanal }) {
  const hoy = new Date();
  const hace7dias = new Date(hoy);
  hace7dias.setDate(hoy.getDate() - 6);

  const formatFecha = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const [desde, setDesde] = useState(formatFecha(hace7dias));
  const [hasta, setHasta] = useState(formatFecha(hoy));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (onGenerarSemanal && !reporteSemanal) {
      cargarReporte();
    }
  }, []);

  const cargarReporte = async () => {
    setLoading(true);
    try {
      await onGenerarSemanal(desde, hasta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleActualizar = () => {
    cargarReporte();
  };

  // =========================================================
  // ESTADO: CARGANDO (con nuevos skeletons)
  // =========================================================
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Card
          title="Dashboard de Asistencia"
          subtitle="Calculando datos del período..."
          icon="📊"
          variant="info"
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <label style={labelStyle}>Desde</label>
              <input type="date" value={desde} disabled style={inputDateStyleDisabled} />
            </div>
            <div>
              <label style={labelStyle}>Hasta</label>
              <input type="date" value={hasta} disabled style={inputDateStyleDisabled} />
            </div>
            <Button variant="primary" size="md" loading={true} disabled>
              ⏳ Calculando...
            </Button>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'var(--info-soft)',
              border: '1px solid var(--card-info-border)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--card-info-title)',
            }}
          >
            💡 <strong>Sugerencia:</strong> Para 100+ empleados, un rango de 7-14 días
            tarda pocos segundos. Rangos de 30+ días pueden tardar más.
          </div>
        </Card>

        {/* 🦴 Stats skeleton (6 tarjetas) */}
        <StatsSkeleton count={6} />

        {/* 🦴 Gráfico grande */}
        <ChartSkeleton height={350} />

        {/* 🦴 2 gráficos medianos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '20px',
          }}
        >
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>

        {/* 🦴 1 gráfico más */}
        <ChartSkeleton height={300} />
      </div>
    );
  }

  // =========================================================
  // ESTADO: SIN DATOS
  // =========================================================
  if (!reporteSemanal?.reporte?.length) {
    return (
      <Card
        title="Dashboard de Asistencia"
        subtitle="Visualiza los datos consolidados del período"
        icon="📊"
        variant="info"
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
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
            />
          </div>
          <div>
            <label style={labelStyle}>Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              style={inputDateStyle}
            />
          </div>
          <Button
            variant="primary"
            size="md"
            loading={loading}
            onClick={handleActualizar}
            iconLeft="📊"
          >
            {loading ? 'Cargando...' : 'Generar Dashboard'}
          </Button>
        </div>

        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-muted)',
            fontSize: '14px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
          <p style={{ margin: 0 }}>
            Selecciona un rango de fechas y haz clic en "Generar Dashboard"
          </p>
        </div>
      </Card>
    );
  }

  const { rango, reporte } = reporteSemanal;

  const diasRango = rango?.dias || 0;
  const esRangoLargo = diasRango > 30;

  const resumen = {
    totalEmpleados: reporte.length,
    totalDiasTrabajados: reporte.reduce((s, r) => s + (r.diasTrabajados || 0), 0),
    totalAusentes: reporte.reduce((s, r) => s + (r.ausentes || 0), 0),
    totalRetardos: reporte.reduce((s, r) => s + (r.minutosRetardo || 0), 0),
    totalHorasTrabajadas:
      Math.round(
        reporte.reduce((s, r) => s + (r.totalHorasTrabajadas || 0), 0) * 100,
      ) / 100,
    totalHorasExtra:
      Math.round(
        reporte.reduce((s, r) => s + (r.totalHorasExtra || 0), 0) * 100,
      ) / 100,
  };

  const topEmpleados = [...reporte]
    .sort((a, b) => (b.diasTrabajados || 0) - (a.diasTrabajados || 0))
    .slice(0, 5)
    .map((r) => {
      const nombreCorto = (r.nombre || 'Desconocido').split(' ').slice(0, 2).join(' ');
      return {
        nombre: nombreCorto,
        diasTrabajados: r.diasTrabajados || 0,
        ausentes: r.ausentes || 0,
      };
    });

  const distribucionEstados = [
    {
      name: 'Puntuales',
      value: reporte.filter((r) => r.retardoLegible === '0m' && r.ausentes === 0).length,
      color: ESTADO_COLORS.PUNTUAL,
    },
    {
      name: 'Retardo',
      value: reporte.filter((r) => r.minutosRetardo > 0).length,
      color: ESTADO_COLORS.RETARDO,
    },
    {
      name: 'Ausencias',
      value: reporte.filter((r) => r.ausentes > 0).length,
      color: ESTADO_COLORS.AUSENTE,
    },
    {
      name: 'Sin salida',
      value: reporte.filter((r) => r.noMarcoSalida > 0).length,
      color: ESTADO_COLORS.NO_MARCO_SALIDA,
    },
  ].filter((d) => d.value > 0);

  const topHorasExtra = [...reporte]
    .filter((r) => (r.totalHorasExtra || 0) > 0)
    .sort((a, b) => (b.totalHorasExtra || 0) - (a.totalHorasExtra || 0))
    .slice(0, 5)
    .map((r) => ({
      nombre: (r.nombre || 'Desconocido').split(' ').slice(0, 2).join(' '),
      horasExtra: r.totalHorasExtra || 0,
    }));

  const topRetardos = [...reporte]
    .filter((r) => (r.minutosRetardo || 0) > 0)
    .sort((a, b) => (b.minutosRetardo || 0) - (a.minutosRetardo || 0))
    .slice(0, 5)
    .map((r) => ({
      nombre: (r.nombre || 'Desconocido').split(' ').slice(0, 2).join(' '),
      minutos: r.minutosRetardo || 0,
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ============ CONTROLES DE FECHA ============ */}
      <Card
        title="Dashboard de Asistencia"
        subtitle={`Período: ${rango?.desde} al ${rango?.hasta} (${rango?.dias} días)`}
        icon="📊"
        variant="info"
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <label style={labelStyle}>Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              style={inputDateStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              style={inputDateStyle}
            />
          </div>
          <Button
            variant="primary"
            size="md"
            loading={loading}
            onClick={handleActualizar}
            iconLeft="🔄"
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>
      </Card>

      {/* 🚨 Aviso de rango largo */}
      {esRangoLargo && (
        <div
          style={{
            background: 'var(--warning-soft)',
            border: '1px solid var(--card-warning-border)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--card-warning-title)',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span>
            <strong>Rango extenso:</strong> estás consultando {diasRango} días.
            Para rangos de más de 30 días, el cálculo puede tardar. Considera
            rangos más cortos para una experiencia más rápida.
          </span>
        </div>
      )}

      {/* ============ TARJETAS DE RESUMEN ============ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        <Card variant="default" padding="sm">
          <span style={statLabelStyle}>👥 Empleados</span>
          <p style={{ ...statValueStyle, color: COLORS.primary }}>
            {resumen.totalEmpleados}
          </p>
        </Card>

        <Card variant="success" padding="sm">
          <span style={statLabelStyle}>✅ Días Trabajados</span>
          <p style={{ ...statValueStyle, color: COLORS.success }}>
            {resumen.totalDiasTrabajados}
          </p>
        </Card>

        <Card variant="danger" padding="sm">
          <span style={statLabelStyle}>❌ Ausencias</span>
          <p style={{ ...statValueStyle, color: COLORS.danger }}>
            {resumen.totalAusentes}
          </p>
        </Card>

        <Card variant="warning" padding="sm">
          <span style={statLabelStyle}>⏰ Retardo Total</span>
          <p style={{ ...statValueStyle, color: COLORS.warning }}>
            {formatearMinutos(resumen.totalRetardos)}
          </p>
        </Card>

        <Card variant="info" padding="sm">
          <span style={statLabelStyle}>⏱️ Horas Totales</span>
          <p style={{ ...statValueStyle, color: COLORS.info }}>
            {formatearHoras(resumen.totalHorasTrabajadas)}
          </p>
        </Card>

        <Card variant="success" padding="sm">
          <span style={statLabelStyle}>💰 Horas Extra</span>
          <p style={{ ...statValueStyle, color: COLORS.success }}>
            {formatearHoras(resumen.totalHorasExtra)}
          </p>
        </Card>
      </div>

      {/* ============ GRÁFICO: TOP 5 EMPLEADOS ============ */}
      <Card
        title="Top 5 Empleados por Días Trabajados"
        subtitle="Los empleados con más días de asistencia en el período"
        icon="🏆"
        variant="default"
      >
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <BarChart
              data={topEmpleados}
              margin={{ top: 20, right: 40, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="nombre"
                angle={-30}
                textAnchor="end"
                interval={0}
                height={80}
                tick={axisTickStyle}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#38a169', fontSize: 12 }}
                label={{
                  value: 'Días Trabajados',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#38a169', fontSize: 12, fontWeight: 600 },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#e53e3e', fontSize: 12 }}
                label={{
                  value: 'Ausencias',
                  angle: 90,
                  position: 'insideRight',
                  style: { fill: '#e53e3e', fontSize: 12, fontWeight: 600 },
                }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
              />
              <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10, color: 'var(--text-secondary)' }} />
              <Bar
                yAxisId="left"
                dataKey="diasTrabajados"
                name="Días Trabajados"
                fill={COLORS.success}
                radius={[8, 8, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="ausentes"
                name="Ausencias"
                fill={COLORS.danger}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ============ GRÁFICO CIRCULAR + HORAS EXTRA ============ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px',
        }}
      >
        <Card
          title="Distribución de Estados"
          subtitle="Cómo se distribuyen los empleados según su desempeño"
          icon="🎯"
          variant="default"
        >
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={distribucionEstados}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: 'var(--chart-text)', strokeWidth: 1 }}
                >
                  {distribucionEstados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Top 5 Horas Extra"
          subtitle="Empleados con más horas extra en el período"
          icon="💰"
          variant="default"
        >
          {topHorasExtra.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={topHorasExtra}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis type="number" tick={axisTickStyle} />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    tick={axisTickStyle}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                    labelStyle={tooltipLabelStyle}
                    formatter={(value) => [formatearHoras(value), 'Horas Extra']}
                  />
                  <Bar
                    dataKey="horasExtra"
                    name="Horas Extra"
                    fill={COLORS.success}
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: 'var(--text-muted)',
                fontSize: '14px',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>✨</div>
              <p style={{ margin: 0 }}>No hay horas extra en este período</p>
            </div>
          )}
        </Card>
      </div>

      {/* ============ GRÁFICO: TOP 5 RETARDOS ============ */}
      <Card
        title="Top 5 Retardos Acumulados"
        subtitle="Empleados con más minutos de retardo en el período"
        icon="⏰"
        variant="warning"
      >
        {topRetardos.length > 0 ? (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={topRetardos}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="nombre"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={80}
                  tick={axisTickStyle}
                />
                <YAxis tick={axisTickStyle} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  formatter={(value) => [formatearMinutos(value), 'Retardo Total']}
                />
                <Bar
                  dataKey="minutos"
                  name="Minutos de Retardo"
                  fill={COLORS.warning}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
            <p style={{ margin: 0 }}>No hay retardos en este período</p>
          </div>
        )}
      </Card>
    </div>
  );
}