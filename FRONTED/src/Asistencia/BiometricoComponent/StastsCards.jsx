// src/Componentes/BiometricoComponent/StatsCards.jsx

// 🎨 Íconos SVG inline
const IconoUsuarios = ({ color }) => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconoCheck = ({ color }) => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconoReloj = ({ color }) => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconoHuella = ({ color }) => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4c-3.5 0-6.3 2.8-6.3 6.3v6" />
    <path d="M12 4c3.5 0 6.3 2.8 6.3 6.3v6" />
    <path d="M12 8c-1.3 0-2.4 1.1-2.4 2.4v7" />
    <path d="M12 8c1.3 0 2.4 1.1 2.4 2.4v7" />
    <path d="M12 12c0-1.3 1.1-2.4 2.4-2.4" />
    <path d="M12 16.5v2" />
  </svg>
);

const IconoHuellaOff = ({ color }) => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4c-3.5 0-6.3 2.8-6.3 6.3v6" />
    <path d="M12 4c3.5 0 6.3 2.8 6.3 6.3v3" />
    <path d="M12 8c-1.3 0-2.4 1.1-2.4 2.4v5" />
    <path d="M12 8c1.3 0 2.4 1.1 2.4 2.4" />
    <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
  </svg>
);

export default function StatsCards({
  usuariosActivos,
  usuariosMarcados,
  usuariosPendientes,
  loading,
  isOnline,
}) {
  const totalUsuarios = Array.isArray(usuariosActivos) ? usuariosActivos.length : 0;
  const totalMarcados = Array.isArray(usuariosMarcados) ? usuariosMarcados.length : 0;
  const totalPendientes = Array.isArray(usuariosPendientes) ? usuariosPendientes.length : 0;

  return (
    <>
      <style>{`
        @keyframes entradaTarjeta {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulsoPunto {
          0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
          50% { box-shadow: 0 0 0 6px transparent; opacity: 0.85; }
        }
        @keyframes contadorPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        .stat-card {
          background: var(--stat-card-bg);
          border: 1px solid var(--stat-card-border);
          padding: 18px 22px;
          border-radius: 10px;
          min-width: 160px;
          box-shadow: var(--stat-card-shadow);
          position: relative;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          animation: entradaTarjeta 0.5s ease-out backwards;
          cursor: default;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--accent-color, #3182ce);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease;
        }

        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--stat-card-shadow-hover);
          border-color: var(--accent-color, #3182ce);
        }

        .stat-card:hover::before { transform: scaleX(1); }
        .stat-card:hover .stat-numero { animation: contadorPop 0.6s ease-out; }
        .stat-card:hover .stat-icono-wrapper {
          transform: scale(1.1) rotate(-8deg);
        }

        .stat-icono-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background: var(--accent-color-light, #ebf8ff);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.35s ease;
        }

        .stat-card:nth-child(1) { animation-delay: 0s; }
        .stat-card:nth-child(2) { animation-delay: 0.1s; }
        .stat-card:nth-child(3) { animation-delay: 0.2s; }
        .stat-card:nth-child(4) { animation-delay: 0.3s; }

        .stat-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .stat-punto {
          width: 10px; height: 10px; border-radius: 50%; display: inline-block; transition: background 0.3s ease;
        }
        .stat-punto.online { background: #38a169; color: #38a169; animation: pulsoPunto 2s ease-in-out infinite; }
        .stat-punto.offline { background: #e53e3e; color: #e53e3e; }
        .stat-punto.loading { background: #d69e2e; color: #d69e2e; animation: pulsoPunto 1s ease-in-out infinite; }
      `}</style>

      <div
        className="stats-grid-mobile"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '15px',
          margin: '20px 0',
        }}
      >
        {/* Total Usuarios */}
        <div
          className="stat-card"
          style={{
            '--accent-color': '#3182ce',
            '--accent-color-light': 'var(--accent-blue-light)',
          }}
        >
          <div className="stat-icono-wrapper">
            <IconoUsuarios color="#3182ce" />
          </div>
          <div className="stat-info">
            <span
              style={{
                fontSize: '11px',
                color: 'var(--stat-card-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: '600',
              }}
            >
              Total Usuarios
            </span>
            <p
              className="stat-numero"
              style={{
                margin: '4px 0 0 0',
                fontSize: '26px',
                fontWeight: 'bold',
                color: '#3182ce',
              }}
            >
              {totalUsuarios}
            </p>
          </div>
        </div>

        {/* Han Marcado Hoy */}
        <div
          className="stat-card"
          style={{
            '--accent-color': '#38a169',
            '--accent-color-light': 'var(--accent-green-light)',
          }}
        >
          <div className="stat-icono-wrapper">
            <IconoCheck color="#38a169" />
          </div>
          <div className="stat-info">
            <span
              style={{
                fontSize: '11px',
                color: 'var(--stat-card-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: '600',
              }}
            >
              Han Marcado Hoy
            </span>
            <p
              className="stat-numero"
              style={{
                margin: '4px 0 0 0',
                fontSize: '26px',
                fontWeight: 'bold',
                color: '#38a169',
              }}
            >
              {totalMarcados}
            </p>
          </div>
        </div>

        {/* Pendientes */}
        <div
          className="stat-card"
          style={{
            '--accent-color': '#dd6b20',
            '--accent-color-light': 'var(--accent-orange-light)',
          }}
        >
          <div className="stat-icono-wrapper">
            <IconoReloj color="#dd6b20" />
          </div>
          <div className="stat-info">
            <span
              style={{
                fontSize: '11px',
                color: 'var(--stat-card-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: '600',
              }}
            >
              Pendientes
            </span>
            <p
              className="stat-numero"
              style={{
                margin: '4px 0 0 0',
                fontSize: '26px',
                fontWeight: 'bold',
                color: '#dd6b20',
              }}
            >
              {totalPendientes}
            </p>
          </div>
        </div>

        {/* Estado Sistema */}
        <div
          className="stat-card"
          style={{
            '--accent-color': loading
              ? '#d69e2e'
              : isOnline
              ? '#38a169'
              : '#e53e3e',
            '--accent-color-light': loading
              ? 'var(--accent-yellow-light)'
              : isOnline
              ? 'var(--accent-green-light)'
              : 'var(--accent-red-light)',
          }}
        >
          <div className="stat-icono-wrapper">
            {isOnline && !loading ? (
              <IconoHuella color="#38a169" />
            ) : !loading ? (
              <IconoHuellaOff color="#e53e3e" />
            ) : (
              <IconoHuella color="#d69e2e" />
            )}
          </div>
          <div className="stat-info">
            <span
              style={{
                fontSize: '11px',
                color: 'var(--stat-card-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: '600',
              }}
            >
              Estado Sistema
            </span>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '18px',
                fontWeight: 'bold',
                color: loading ? '#d69e2e' : isOnline ? '#38a169' : '#e53e3e',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                className={`stat-punto ${
                  loading ? 'loading' : isOnline ? 'online' : 'offline'
                }`}
              ></span>
              {loading ? 'Cargando...' : isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}