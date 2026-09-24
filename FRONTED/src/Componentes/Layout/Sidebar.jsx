// src/Componentes/Layout/Sidebar.jsx
import { useState } from 'react';

// =========================================================
// 🎯 CONFIGURACIÓN DE SUITES
// =========================================================
// Aquí defines los módulos y submenús. Cuando agregues más,
// solo tocas este array.
// =========================================================
export const SUITES = [
  {
    id: 'asistencia',
    label: 'Asistencia',
    icon: '📊',
    submenus: [
      { id: 'biometrico', label: 'Biométrico', icon: '📊' },
      { id: 'reglas', label: 'Reglas', icon: '⚙️' },
    ],
  },
  {
    id: 'rrhh',
    label: 'Recursos Humanos',
    icon: '👥',
    submenus: [
      { id: 'empleados', label: 'Empleados', icon: '👤' },
      // 🆕 Cuando agregues:
      // { id: 'cargos', label: 'Cargos', icon: '💼' },
      // { id: 'departamentos', label: 'Departamentos', icon: '🏢' },
    ],
  },
  // 🆕 Futuras suites:
  // {
  //   id: 'nomina',
  //   label: 'Nómina',
  //   icon: '💰',
  //   submenus: [...],
  // },
  // {
  //   id: 'config',
  //   label: 'Configuración',
  //   icon: '🔧',
  //   submenus: [...],
  // },
];

export default function Sidebar({
  vistaActiva,           // { suite: 'asistencia', submenu: 'biometrico' }
  onChangeVista,         // (suite, submenu) => void
  isMobileOpen,          // bool
  onCloseMobile,         // () => void
  colapsado,             // bool (desktop colapsado)
  onToggleColapsar,      // () => void
}) {
  const [suitesExpandidas, setSuitesExpandidas] = useState(() => {
    // Expandir automáticamente la suite activa
    const inicial = {};
    SUITES.forEach((s) => {
      inicial[s.id] = s.id === vistaActiva.suite;
    });
    return inicial;
  });

  const toggleSuite = (suiteId) => {
    setSuitesExpandidas((prev) => ({
      ...prev,
      [suiteId]: !prev[suiteId],
    }));
  };

  const handleClickSubmenu = (suiteId, submenuId) => {
    onChangeVista(suiteId, submenuId);
    if (onCloseMobile) onCloseMobile();
  };

  const handleClickSuite = (suiteId) => {
    // Si es la suite activa → toggle
    if (vistaActiva.suite === suiteId) {
      toggleSuite(suiteId);
    } else {
      // Si no → expandir + seleccionar primer submenú
      const suite = SUITES.find((s) => s.id === suiteId);
      setSuitesExpandidas((prev) => ({ ...prev, [suiteId]: true }));
      if (suite?.submenus[0]) {
        handleClickSubmenu(suiteId, suite.submenus[0].id);
      }
    }
  };

  return (
    <>
      <style>{`
        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 9998;
          display: none;
        }
        .sidebar-overlay.open { display: block; }

        .sidebar {
          width: 260px;
          height: 100vh;
          background: var(--bg-navbar);
          border-right: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          transition: width 0.25s ease;
          flex-shrink: 0;
        }
        .sidebar.colapsado {
          width: 70px;
        }

        .sidebar-logo {
          padding: 18px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--border-light);
          font-weight: 700;
          color: var(--text-primary);
          font-size: 15px;
        }
        .sidebar.colapsado .sidebar-logo-text { display: none; }

        .sidebar-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-suite {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          width: 100%;
          transition: all 0.15s ease;
          position: relative;
        }
        .sidebar-suite:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .sidebar-suite.active {
          color: var(--primary);
        }
        .sidebar-suite-icon {
          font-size: 18px;
          flex-shrink: 0;
        }
        .sidebar-suite-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-suite-arrow {
          font-size: 10px;
          transition: transform 0.2s ease;
          opacity: 0.6;
        }
        .sidebar-suite-arrow.open {
          transform: rotate(90deg);
        }
        .sidebar.colapsado .sidebar-suite-label,
        .sidebar.colapsado .sidebar-suite-arrow {
          display: none;
        }
        .sidebar.colapsado .sidebar-suite {
          justify-content: center;
        }

        .sidebar-submenu {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-left: 24px;
          margin-top: 4px;
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.3s ease;
        }
        .sidebar-submenu.open {
          max-height: 500px;
        }
        .sidebar.colapsado .sidebar-submenu {
          display: none;
        }

        .sidebar-sub {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          color: var(--text-muted);
          background: transparent;
          border: none;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          text-align: left;
          width: 100%;
          transition: all 0.15s ease;
        }
        .sidebar-sub:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .sidebar-sub.active {
          background: var(--primary-soft);
          color: var(--primary);
          font-weight: 700;
        }
        .sidebar-sub-icon {
          font-size: 14px;
          flex-shrink: 0;
        }

        .sidebar-footer {
          padding: 12px 8px;
          border-top: 1px solid var(--border-light);
        }
        .sidebar-collapse-btn {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          color: var(--text-muted);
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.15s ease;
        }
        .sidebar-collapse-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .sidebar.colapsado .sidebar-collapse-btn-text {
          display: none;
        }

        /* 📱 MÓVIL */
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 9999;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            width: 260px !important;
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          .sidebar.colapsado {
            width: 260px;
          }
          .sidebar.colapsado .sidebar-suite-label,
          .sidebar.colapsado .sidebar-suite-arrow,
          .sidebar.colapsado .sidebar-submenu,
          .sidebar.colapsado .sidebar-logo-text,
          .sidebar.colapsado .sidebar-collapse-btn-text {
            display: block;
          }
          .sidebar.colapsado .sidebar-submenu {
            display: flex;
          }
          .sidebar.colapsado .sidebar-suite {
            justify-content: flex-start;
          }
          .sidebar-overlay.open { display: block; }
          .sidebar-footer { display: none; }
        }
      `}</style>

      {/* Overlay móvil */}
      <div
        className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`}
        onClick={onCloseMobile}
      />

      <aside
        className={`sidebar ${colapsado ? 'colapsado' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <span style={{ fontSize: '22px' }}>🏢</span>
          <span className="sidebar-logo-text">Sistema RRHH</span>
        </div>

        {/* Lista de suites */}
        <nav className="sidebar-list">
          {SUITES.map((suite) => {
            const esActiva = vistaActiva.suite === suite.id;
            const expandida = suitesExpandidas[suite.id];

            return (
              <div key={suite.id}>
                <button
                  className={`sidebar-suite ${esActiva ? 'active' : ''}`}
                  onClick={() => handleClickSuite(suite.id)}
                  title={suite.label}
                >
                  <span className="sidebar-suite-icon">{suite.icon}</span>
                  <span className="sidebar-suite-label">{suite.label}</span>
                  <span
                    className={`sidebar-suite-arrow ${
                      expandida ? 'open' : ''
                    }`}
                  >
                    ▶
                  </span>
                </button>

                <div
                  className={`sidebar-submenu ${
                    expandida ? 'open' : ''
                  }`}
                >
                  {suite.submenus.map((sub) => {
                    const subActivo =
                      vistaActiva.suite === suite.id &&
                      vistaActiva.submenu === sub.id;
                    return (
                      <button
                        key={sub.id}
                        className={`sidebar-sub ${subActivo ? 'active' : ''}`}
                        onClick={() =>
                          handleClickSubmenu(suite.id, sub.id)
                        }
                      >
                        <span className="sidebar-sub-icon">{sub.icon}</span>
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer con botón colapsar */}
        <div className="sidebar-footer">
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleColapsar}
            title={colapsado ? 'Expandir' : 'Colapsar'}
          >
            <span>{colapsado ? '▶' : '◀'}</span>
            <span className="sidebar-collapse-btn-text">
              {colapsado ? '' : 'Colapsar'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}