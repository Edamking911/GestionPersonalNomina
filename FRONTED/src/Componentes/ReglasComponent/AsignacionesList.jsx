// src/Componentes/ReglasComponent/AsignacionesList.jsx
import { useState, useEffect,useMemo} from 'react';
import Card from '../UI/Card';
import Table from '../UI/Table';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import { getTipoInfo, formatearFecha, calcularDias } from '../Novedades/constants';

// =========================================================
//  HELPERS
// =========================================================
function separarNombreApellido(nombreCompleto) {
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
}

const fechaISOaString = (fechaStr) => {
  if (!fechaStr) return '';
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
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
// COLORES POR TIPO DE NOVEDAD
// =========================================================
const COLORES_TIPO = {
  VACACIONES: { color: '#3182ce', emoji: '🏖️', texto: 'Vacaciones' },
  REPOSO_MEDICO: { color: '#e53e3e', emoji: '🏥', texto: 'Reposo Médico' },
  PERMISO_REMUNERADO: {
    color: '#38a169',
    emoji: '📝',
    texto: 'Permiso Remunerado',
  },
  PERMISO_NO_REMUNERADO: {
    color: '#dd6b20',
    emoji: '📝',
    texto: 'Permiso No Rem.',
  },
  FALTA_JUSTIFICADA: {
    color: '#d69e2e',
    emoji: '⚠️',
    texto: 'Falta Justificada',
  },
  FALTA_INJUSTIFICADA: {
    color: '#e53e3e',
    emoji: '❌',
    texto: 'Falta Injustificada',
  },
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
        const tooltip = `${info.texto}: ${formatearFecha(
          n.fechaInicio,
        )} → ${formatearFecha(n.fechaFin)} (${dias} día${
          dias !== 1 ? 's' : ''
        })${n.motivo ? `\nMotivo: ${n.motivo}` : ''}`;

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
// 🆕 FILTROS POR NOVEDAD
// =========================================================
const FILTROS_NOVEDAD = [
  { value: 'todos', label: '👥 Todos' },
  { value: 'con-novedad', label: '🔔 Con novedad' },
  { value: 'vacaciones', label: '🏖️ Vacaciones' },
  { value: 'reposo', label: '🏥 Reposo' },
  { value: 'permisos', label: '📝 Permisos' },
  { value: 'faltas', label: '⚠️ Faltas' },
];

const aplicarFiltro = (filtro, novedadesEmp) => {
  if (filtro === 'todos') return true;
  if (filtro === 'con-novedad') return novedadesEmp.length > 0;

  const tipos = novedadesEmp.map((n) => n.tipo);

  if (filtro === 'vacaciones') return tipos.includes('VACACIONES');
  if (filtro === 'reposo') return tipos.includes('REPOSO_MEDICO');
  if (filtro === 'permisos') {
    return tipos.includes('PERMISO_REMUNERADO') || tipos.includes('PERMISO_NO_REMUNERADO');
  }
  if (filtro === 'faltas') {
    return tipos.includes('FALTA_JUSTIFICADA') || tipos.includes('FALTA_INJUSTIFICADA');
  }
  return true;
};

// =========================================================
// 🚀 COMPONENTE
// =========================================================
export default function AsignacionesList({
  asignaciones,
  onRefresh,
  novedades = [],
}) {
  const [semana, setSemana] = useState('');
  const [filtroNovedad, setFiltroNovedad] = useState('todos'); // 🆕

  const horariosMap = {
    HORARIO_8_5: '8:00 AM - 5:00 PM',
    HORARIO_8_5_30: '8:00 AM - 5:30 PM',
    HORARIO_8_6_30: '8:00 AM - 6:30 PM',
    HORARIO_8_7: '8:00 AM - 7:00 PM',
    HORARIO_8_8: '8:00 AM - 8:00 PM',
  };

  useEffect(() => {
    const hoy = new Date();
    const dia = hoy.getDay();
    const domingo = new Date(hoy);
    domingo.setDate(hoy.getDate() - dia);
    const year = domingo.getFullYear();
    const month = String(domingo.getMonth() + 1).padStart(2, '0');
    const day = String(domingo.getDate()).padStart(2, '0');
    setSemana(`${year}-${month}-${day}`);
  }, []);

  useEffect(() => {
    if (semana) onRefresh(semana);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semana]);

  const handleRefresh = () => {
    onRefresh(semana);
  };

  // 🆕 Mapa: cédula → novedades activas en la semana
  const novedadesPorEmpleado = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(novedades) || novedades.length === 0 || !semana) {
      return map;
    }

    for (const n of novedades) {
      if (!n.activo) continue;
      if (!novedadAplicaEnSemana(n, semana)) continue;

      const cedula = String(n.cedula || '').trim();
      if (!cedula) continue;

      if (!map.has(cedula)) map.set(cedula, []);
      map.get(cedula).push(n);
    }
    return map;
  }, [novedades, semana]);

  // 🆕 Aplicar filtro
  const asignacionesFiltradas = useMemo(() => {
    if (!Array.isArray(asignaciones)) return [];
    if (filtroNovedad === 'todos') return asignaciones;

    return asignaciones.filter((a) => {
      const cedula = String(a.employeeId || '').trim();
      const novedadesEmp = novedadesPorEmpleado.get(cedula) || [];
      return aplicarFiltro(filtroNovedad, novedadesEmp);
    });
  }, [asignaciones, filtroNovedad, novedadesPorEmpleado]);

  const totalFiltrados = asignacionesFiltradas.length;
  const totalOriginal = Array.isArray(asignaciones) ? asignaciones.length : 0;

  // =========================================================
  // COLUMNAS
  // =========================================================
  const columnas = [
    {
      key: 'employeeId',
      label: 'Cédula',
      bold: true,
      color: 'var(--primary)',
      width: '120px',
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
      key: 'horarioId',
      label: 'Horario',
      render: (row) => (
        <span
          style={{
            background: 'var(--primary-soft)',
            color: 'var(--primary)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
          }}
        >
          {horariosMap[row.horarioId] || row.horarioId}
        </span>
      ),
    },
    {
      key: 'diasLibresFijos',
      label: 'Días Libres Fijos',
      render: (row) => {
        const cedulaNorm = String(row.employeeId || '').trim();
        const novedadesEmp = novedadesPorEmpleado.get(cedulaNorm) || [];

        if (novedadesEmp.length > 0) {
          return <TextoNovedades novedades={novedadesEmp} />;
        }

        if (!row.diasLibresFijos || row.diasLibresFijos.length === 0) {
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
            {row.diasLibresFijos.map((dia, i) => (
              <Badge key={i} variant="warning" size="sm">
                {dia}
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

        if (novedadesEmp.length > 0) {
          return <TextoNovedades novedades={novedadesEmp} />;
        }

        if (!row.diasLibresRotativos || row.diasLibresRotativos.length === 0) {
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
            {row.diasLibresRotativos.map((dia, i) => (
              <Badge key={i} variant="info" size="sm" dot>
                {dia}
              </Badge>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <Card
      title="Asignaciones Semanales"
      subtitle="Consulta los horarios y días libres por semana"
      icon="📅"
      variant="default"
      padding="none"
      headerStyle={{ padding: '16px 20px' }}
      bodyStyle={{ padding: '0' }}
    >
      {/* ============ CONTROLES ============ */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          background: 'var(--bg-hover)',
        }}
      >
        {/* 🆕 Filtro de novedad */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: '600',
            }}
          >
            Filtrar:
          </label>
          <select
            value={filtroNovedad}
            onChange={(e) => setFiltroNovedad(e.target.value)}
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
              cursor: 'pointer',
              minWidth: '180px',
            }}
          >
            {FILTROS_NOVEDAD.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* 🆕 Contador */}
        {filtroNovedad !== 'todos' && (
          <Badge variant="info" size="sm" dot>
            {totalFiltrados} de {totalOriginal}
          </Badge>
        )}

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <label
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: '600',
            }}
          >
            Semana:
          </label>
          <input
            type="date"
            value={semana}
            onChange={(e) => setSemana(e.target.value)}
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
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--input-border-focus)';
              e.target.style.boxShadow = '0 0 0 3px var(--input-focus-shadow)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--input-border)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <Button variant="success" size="sm" onClick={handleRefresh}>
            🔄 Refrescar
          </Button>
        </div>
      </div>

      <Table
        columns={columnas}
        data={asignacionesFiltradas}
        theme="auto"
        hoverable
        striped
        size="md"
        emptyMessage={
          filtroNovedad === 'todos'
            ? 'No hay asignaciones para esta semana'
            : 'No hay empleados con ese tipo de novedad esta semana'
        }
        emptyIcon={filtroNovedad === 'todos' ? '📭' : '🔍'}
      />
    </Card>
  );
}