// src/Componentes/ReglasComponent/ReglasStats.jsx
import Card from '../../Componentes/UI/Card';

//  Íconos SVG inline
const IconoHorarios = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconoEmpleados = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconoDiasLibres = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconoRotativos = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconoNovedades = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7h-9" />
    <path d="M14 17H5" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </svg>
);

// 🔧 Fecha helpers
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

export default function ReglasStats({
  reglas,
  asignaciones,
  diasLibres,
  novedades = [],
}) {
  if (!reglas || !asignaciones) {
    return (
      <Card variant="default">
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            padding: '20px',
          }}
        >
          Cargando configuración de reglas...
        </p>
      </Card>
    );
  }

  const totalHorarios = reglas.horarios?.length || 0;
  const totalAsignaciones = asignaciones.length || 0;
  const totalDiasLibresFijos =
    asignaciones.filter((a) => a.diasLibresFijos && a.diasLibresFijos.length > 0)
      .length || 0;
  const totalDiasLibresRotativos = diasLibres ? Object.keys(diasLibres).length : 0;

  // 🆕 Empleados con novedad activa esta semana
  const semanaActual = obtenerDomingoActual();
  const cedulasConNovedad = new Set();
  if (Array.isArray(novedades)) {
    for (const n of novedades) {
      if (!n.activo) continue;
      if (!novedadAplicaEnSemana(n, semanaActual)) continue;
      const cedula = String(n.cedula || '').trim();
      if (cedula) cedulasConNovedad.add(cedula);
    }
  }
  const totalConNovedad = cedulasConNovedad.size;

  const stats = [
    {
      label: 'Horarios Definidos',
      value: totalHorarios,
      color: '#805ad5',
      colorLight: 'var(--accent-purple-light)',
      icon: <IconoHorarios color="#805ad5" />,
    },
    {
      label: 'Empleados con Asignación',
      value: totalAsignaciones,
      color: '#38a169',
      colorLight: 'var(--accent-green-light)',
      icon: <IconoEmpleados color="#38a169" />,
    },
    {
      label: 'Días Libres Fijos',
      value: totalDiasLibresFijos,
      color: '#dd6b20',
      colorLight: 'var(--accent-orange-light)',
      icon: <IconoDiasLibres color="#dd6b20" />,
    },
    {
      label: 'Empleados con Rotativos',
      value: totalDiasLibresRotativos,
      color: '#e53e3e',
      colorLight: 'var(--accent-red-light)',
      icon: <IconoRotativos color="#e53e3e" />,
    },
    // 🆕 NUEVA CARD
    {
      label: 'Con Novedad Esta Semana',
      value: totalConNovedad,
      color: '#3182ce',
      colorLight: 'var(--card-info-bg)',
      icon: <IconoNovedades color="#3182ce" />,
    },
  ];

  return (
    <>
      <style>{`
        @keyframes statEntrada {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes statNumeroPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes statIconoRotar {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-10deg) scale(1.1); }
        }
        @keyframes bordeBarrido {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes brilloDeslizar {
          0% { left: -100%; }
          100% { left: 200%; }
        }

        .reglas-stat-card {
          background: var(--stat-card-bg);
          border: 1px solid var(--stat-card-border);
          padding: 20px 22px;
          border-radius: 12px;
          min-width: 200px;
          flex: 1;
          box-shadow: var(--stat-card-shadow);
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: statEntrada 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
          cursor: default;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .reglas-stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(
            90deg,
            var(--accent) 0%,
            var(--accent) 40%,
            rgba(255, 255, 255, 0.9) 50%,
            var(--accent) 60%,
            var(--accent) 100%
          );
          background-size: 200% auto;
          animation: bordeBarrido 3s linear infinite;
        }

        .reglas-stat-card::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
          pointer-events: none;
        }

        .reglas-stat-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: var(--stat-card-shadow-hover);
          border-color: var(--accent);
        }

        .reglas-stat-card:hover::after {
          animation: brilloDeslizar 0.8s ease-out;
        }

        .reglas-stat-card:hover .reglas-stat-numero {
          animation: statNumeroPop 0.6s ease-out;
        }

        .reglas-stat-card:hover .reglas-stat-icono {
          animation: statIconoRotar 0.8s ease-in-out;
        }

        .reglas-stat-icono {
          width: 56px; height: 56px;
          border-radius: 14px;
          background: var(--accent-light);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .reglas-stat-card:nth-child(1) { animation-delay: 0s; }
        .reglas-stat-card:nth-child(2) { animation-delay: 0.12s; }
        .reglas-stat-card:nth-child(3) { animation-delay: 0.24s; }
        .reglas-stat-card:nth-child(4) { animation-delay: 0.36s; }
        .reglas-stat-card:nth-child(5) { animation-delay: 0.48s; }
      `}</style>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="reglas-stat-card"
            style={{
              '--accent': stat.color,
              '--accent-light': stat.colorLight,
            }}
          >
            <div className="reglas-stat-icono">{stat.icon}</div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--stat-card-text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                }}
              >
                {stat.label}
              </span>
              <p
                className="reglas-stat-numero"
                style={{
                  margin: '6px 0 0 0',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: stat.color,
                }}
              >
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}