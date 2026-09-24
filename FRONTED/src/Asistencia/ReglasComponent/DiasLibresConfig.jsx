// src/Componentes/ReglasComponent/DiasLibresConfig.jsx
import { useState, useMemo } from 'react';
import Card from '../../Componentes/UI/Card';
import Input from '../../Componentes/UI/Input';
import Button from '../../Componentes/UI/Button';
import Badge from '../../Componentes/UI/Badge';       
import Table from '../../Componentes/UI/Table';       
import { formatearFecha, calcularDias } from '../../Componentes/Novedades/constants'; 

// =========================================================
// 🔧 HELPERS
// =========================================================
const separarNombreApellido = (nombreCompleto) => {
  if (!nombreCompleto) return { nombre: '', apellido: 'N/A' };
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  const total = partes.length;
  if (total === 1) return { nombre: partes[0], apellido: 'N/A' };
  if (total === 2) return { nombre: partes[0], apellido: partes[1] };
  if (total === 3) return { nombre: partes[0], apellido: partes.slice(1).join(' ') };
  if (total === 4) {
    return {
      nombre: partes.slice(0, 2).join(' '),
      apellido: partes.slice(2).join(' '),
    };
  }
  const mitad = Math.ceil(total / 2);
  return {
    nombre: partes.slice(0, mitad).join(' '),
    apellido: partes.slice(mitad).join(' '),
  };
};

const fechaISOaString = (fechaStr) => {
  if (!fechaStr) return '';
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const obtenerDomingoActual = () => {
  const hoy = new Date();
  const dia = hoy.getDay();
  const domingo = new Date(hoy);
  domingo.setDate(hoy.getDate() - dia);
  const y = domingo.getFullYear();
  const m = String(domingo.getMonth() + 1).padStart(2, '0');
  const d = String(domingo.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const novedadAplicaEnSemana = (novedad, semanaInicioISO) => {
  if (!novedad || !semanaInicioISO) return false;
  const inicioNov = fechaISOaString(novedad.fechaInicio);
  const finNov = fechaISOaString(novedad.fechaFin);
  if (!inicioNov || !finNov) return false;

  const [y, m, d] = semanaInicioISO.split('-').map(Number);
  const finSemanaDate = new Date(Date.UTC(y, m - 1, d));
  finSemanaDate.setUTCDate(finSemanaDate.getUTCDate() + 6);
  const finSemana = `${finSemanaDate.getUTCFullYear()}-${String(
    finSemanaDate.getUTCMonth() + 1,
  ).padStart(2, '0')}-${String(finSemanaDate.getUTCDate()).padStart(2, '0')}`;

  return inicioNov <= finSemana && finNov >= semanaInicioISO;
};

// =========================================================
// 🎨 COLORES POR TIPO
// =========================================================
const COLORES_TIPO = {
  VACACIONES: { color: '#3182ce', emoji: '🏖️', texto: 'Vacaciones' },
  REPOSO_MEDICO: { color: '#e53e3e', emoji: '🏥', texto: 'Reposo Médico' },
  PERMISO_REMUNERADO: { color: '#38a169', emoji: '📝', texto: 'Permiso Remunerado' },
  PERMISO_NO_REMUNERADO: { color: '#dd6b20', emoji: '📝', texto: 'Permiso No Rem.' },
  FALTA_JUSTIFICADA: { color: '#d69e2e', emoji: '⚠️', texto: 'Falta Justificada' },
  FALTA_INJUSTIFICADA: { color: '#e53e3e', emoji: '❌', texto: 'Falta Injustificada' },
};

function TextoNovedades({ novedades }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {novedades.map((n, i) => {
        const info = COLORES_TIPO[n.tipo] || {
          color: 'var(--text-primary)',
          emoji: '📌',
          texto: n.tipo,
        };
        const dias = calcularDias(n.fechaInicio, n.fechaFin);
        const tooltip = `${info.texto}: ${formatearFecha(n.fechaInicio)} → ${formatearFecha(n.fechaFin)} (${dias} día${dias !== 1 ? 's' : ''})${n.motivo ? `\nMotivo: ${n.motivo}` : ''}`;

        return (
          <span
            key={`${n.id}-${i}`}
            title={tooltip}
            style={{
              cursor: 'help',
              color: info.color,
              fontSize: '13px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
          >
            {info.emoji} {info.texto}
          </span>
        );
      })}
    </div>
  );
}

// =========================================================
// 🚀 COMPONENTE
// =========================================================
export default function DiasLibresConfig({
  diasLibres,
  onRefresh,
  onAsignar,
  showToast,
  asignaciones = [],
  novedades = [],
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [semana, setSemana] = useState('');
  const [diasLibresSemana, setDiasLibresSemana] = useState('');
  const [loading, setLoading] = useState(false);
  const [semanaTabla, setSemanaTabla] = useState(obtenerDomingoActual());

  const handleAsignar = async (e) => {
    e.preventDefault();

    if (!employeeId.trim() || !semana || !diasLibresSemana.trim()) {
      showToast?.('Completa todos los campos.', 'warning');
      return;
    }

    const diasArray = diasLibresSemana
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (diasArray.length === 0) {
      showToast?.('Debes indicar al menos un día libre.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await onAsignar(employeeId.trim(), semana, diasArray);
      setEmployeeId('');
      setSemana('');
      setDiasLibresSemana('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.log('Error manejado por Toast:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Mapa: cédula → novedades activas en la semana
  const novedadesPorEmpleado = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(novedades) || novedades.length === 0) return map;

    for (const n of novedades) {
      if (!n.activo) continue;
      if (!novedadAplicaEnSemana(n, semanaTabla)) continue;

      const cedula = String(n.cedula || '').trim();
      if (!cedula) continue;

      if (!map.has(cedula)) map.set(cedula, []);
      map.get(cedula).push(n);
    }
    return map;
  }, [novedades, semanaTabla]);

  // 🆕 Mapa: cédula → asignación
  const asignacionesPorCedula = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(asignaciones)) return map;
    for (const a of asignaciones) {
      const cedula = String(a.employeeId || '').trim();
      if (cedula) map.set(cedula, a);
    }
    return map;
  }, [asignaciones]);

  // =========================================================
  // COLUMNAS
  // =========================================================
  const columnas = [
    {
      key: 'employeeId',
      label: 'Cédula',
      bold: true,
      color: 'var(--primary)',
      width: '110px',
      nowrap: true,
    },
    {
      key: 'nombre',
      label: 'Nombre',
      render: (row) => {
        const { nombre } = separarNombreApellido(row.nombre || '');
        return <span style={{ fontWeight: '500' }}>{nombre}</span>;
      },
    },
    {
      key: 'apellido',
      label: 'Apellido',
      render: (row) => {
        const { apellido } = separarNombreApellido(row.nombre || '');
        return (
          <span style={{ color: 'var(--text-secondary)' }}>{apellido}</span>
        );
      },
    },
    {
      key: 'diasLibresFijos',
      label: 'Días Libres Fijos',
      render: (row) => {
        const cedulaNorm = String(row.employeeId || '').trim();
        const novedadesEmp = novedadesPorEmpleado.get(cedulaNorm) || [];
        const asignacion = asignacionesPorCedula.get(cedulaNorm);
        const fijos = asignacion?.diasLibresFijos || [];

        // 🆕 Si tiene novedad → mostrar texto
        if (novedadesEmp.length > 0) {
          return <TextoNovedades novedades={novedadesEmp} />;
        }

        if (fijos.length === 0) {
          return (
            <span
              style={{
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                fontSize: '12px',
              }}
            >
              Sin fijos
            </span>
          );
        }
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {fijos.map((d, i) => (
              <Badge key={i} variant="warning" size="sm">
                {d}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'diasLibresRotativos',
      label: 'Días Libres Semana',
      render: (row) => {
        const cedulaNorm = String(row.employeeId || '').trim();
        const novedadesEmp = novedadesPorEmpleado.get(cedulaNorm) || [];
        const asignacion = asignacionesPorCedula.get(cedulaNorm);
        const rotativos = asignacion?.diasLibresRotativos || [];

        // 🆕 Si tiene novedad → mostrar texto
        if (novedadesEmp.length > 0) {
          return <TextoNovedades novedades={novedadesEmp} />;
        }

        if (rotativos.length === 0) {
          return (
            <span
              style={{
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                fontSize: '12px',
              }}
            >
              Sin rotativos
            </span>
          );
        }
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {rotativos.map((d, i) => (
              <Badge key={i} variant="info" size="sm" dot>
                {d}
              </Badge>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ============ FORMULARIO ============ */}
      <Card
        title="Asignar Días Libres Rotativos"
        subtitle="Configura los días libres por semana para cada empleado"
        icon="🗓️"
        variant="info"
        style={{ maxWidth: '640px' }}
      >
        <div
          style={{
            background: 'var(--info-soft)',
            border: '1px solid var(--card-info-border)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px',
            color: 'var(--card-info-title)',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '18px' }}>ℹ️</span>
          <span>
            Los días libres rotativos se asignan por semana y se normalizan al
            domingo de esa semana.
          </span>
        </div>

        <form
          onSubmit={handleAsignar}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <Input
            label="Cédula del Empleado"
            placeholder="Cedula"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value.replace(/\D/g, ''))}
            icon="👤"
            required
            hint="Solo números, sin puntos ni guiones"
          />

          <Input
            type="date"
            label="Semana (cualquier día)"
            value={semana}
            onChange={(e) => setSemana(e.target.value)}
            icon="📅"
            required
            hint="Se normalizará automáticamente al domingo de esa semana"
          />

          <Input
            label="Días Libres (separados por coma)"
            placeholder="Ej. lunes, martes"
            value={diasLibresSemana}
            onChange={(e) => setDiasLibresSemana(e.target.value)}
            icon="🗓️"
            required
            hint="Días válidos: lunes, martes, miércoles, jueves, viernes, sábado, domingo"
          />

          <Button
            type="submit"
            variant="warning"
            size="lg"
            loading={loading}
            fullWidth
          >
            {loading ? 'Asignando...' : '🗓️ Asignar Días Libres'}
          </Button>
        </form>
      </Card>

      {/* ============ TABLA RESUMEN ============ */}
      <Card
        title="Resumen de Días Libres por Empleado"
        subtitle={`Vista de la semana del ${semanaTabla} — incluye novedades activas`}
        icon="📋"
        variant="default"
        padding="none"
        headerStyle={{ padding: '16px 20px' }}
        bodyStyle={{ padding: '0' }}
      >
        {/* 🆕 Selector de semana */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg-hover)',
            flexWrap: 'wrap',
          }}
        >
          <label
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: '600',
            }}
          >
            Ver semana del:
          </label>
          <input
            type="date"
            value={semanaTabla}
            onChange={(e) => setSemanaTabla(e.target.value)}
            style={{
              padding: '0 14px',
              height: '38px',
              border: '1px solid var(--input-border)',
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              color: 'var(--input-text)',
              backgroundColor: 'var(--input-bg)',
              fontFamily: 'inherit',
              minWidth: '160px',
            }}
          />
          <Button
            variant="info"
            size="sm"
            onClick={() => setSemanaTabla(obtenerDomingoActual())}
          >
            📅 Hoy
          </Button>
        </div>

        <Table
          columns={columnas}
          data={asignaciones || []}
          theme="auto"
          hoverable
          striped
          size="md"
          emptyMessage="No hay asignaciones registradas"
          emptyIcon="📭"
        />
      </Card>
    </div>
  );
}