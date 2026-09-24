// src/Componentes/Layout/AppLayout.jsx
import { useState, useEffect } from 'react';
import Sidebar, { SUITES } from './Sidebar';
import ThemeToggle from '../UI/ThemeToggle';
import GlobalSearch from '../UI/GlobalSearch';
import NotificationCenter from '../UI/CentroNotificaciones';
import ShortcutsModal from '../UI/ShortcutsModal';
import DensityToggle from '../UI/DensidaToggle';
import InstallPWA from '../UI/InstallPWA';
import { useKeyboardShortcuts } from '../../Hoosk/UseKeyboard';
import { useTheme } from '../Context/ThemesContext';

export default function AppLayout({ children, vistaActiva, onChangeVista }) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [sidebarColapsado, setSidebarColapsado] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { toggleTheme } = useTheme();

  // ⌨️ Atajos globales
  useKeyboardShortcuts({
    'ctrl+d': () => toggleTheme(),
    'ctrl+/': () => setShortcutsOpen((p) => !p),
    'ctrl+b': () => setMobileSidebarOpen((p) => !p), // toggle sidebar móvil
  });

  // Cerrar sidebar móvil al cambiar de vista
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [vistaActiva]);

  const suiteActual = SUITES.find((s) => s.id === vistaActiva.suite);
  const submenuActual = suiteActual?.submenus.find(
    (sub) => sub.id === vistaActiva.submenu,
  );

  return (
    <>
      <style>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
          background: var(--bg-app);
        }
        .app-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .app-header {
          height: 64px;
          padding: 0 20px;
          background: var(--bg-navbar);
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: var(--shadow-md);
        }
        .app-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .app-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .app-menu-btn {
          display: none;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e0;
          border: none;
          cursor: pointer;
          font-size: 20px;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .app-menu-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }
        .app-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-secondary);
          min-width: 0;
        }
        .app-breadcrumb-suite {
          font-weight: 600;
          color: var(--text-primary);
        }
        .app-breadcrumb-sep {
          opacity: 0.5;
        }
        .app-breadcrumb-sub {
          color: var(--primary);
          font-weight: 600;
        }
        .app-main {
          flex: 1;
          overflow-y: auto;
        }
        .app-search-hint {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e0;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          border: none;
          font-family: inherit;
          transition: all 0.2s ease;
          height: 42px;
        }
        .app-search-hint:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }
        .app-kbd {
          background: rgba(255, 255, 255, 0.15);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-family: monospace;
          color: #cbd5e0;
        }

        /* 📱 MÓVIL */
        @media (max-width: 768px) {
          .app-menu-btn { display: inline-flex; }
          .app-search-hint { display: none; }
          .app-breadcrumb { display: none; }
          .app-header { padding: 0 12px; }
          .app-header-right { gap: 6px; }
        }
      `}</style>

      <div className="app-layout">
        {/* Sidebar */}
        <Sidebar
          vistaActiva={vistaActiva}
          onChangeVista={onChangeVista}
          isMobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          colapsado={sidebarColapsado}
          onToggleColapsar={() => setSidebarColapsado((p) => !p)}
        />

        {/* Contenido */}
        <div className="app-content">
          {/* Header */}
          <header className="app-header">
            <div className="app-header-left">
              <button
                className="app-menu-btn"
                onClick={() => setMobileSidebarOpen(true)}
                title="Menú"
              >
                ☰
              </button>

              <div className="app-breadcrumb">
                <span className="app-breadcrumb-suite">
                  {suiteActual?.icon} {suiteActual?.label || 'Sistema'}
                </span>
                {submenuActual && (
                  <>
                    <span className="app-breadcrumb-sep">/</span>
                    <span className="app-breadcrumb-sub">
                      {submenuActual.label}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="app-header-right">
              <button
                className="app-search-hint"
                onClick={() => {
                  const event = new KeyboardEvent('keydown', {
                    key: 'k',
                    ctrlKey: true,
                  });
                  window.dispatchEvent(event);
                }}
                title="Buscar (Ctrl+K)"
              >
                🔍 Buscar
                <span className="app-kbd">Ctrl</span>
                <span className="app-kbd">K</span>
              </button>

              <InstallPWA />
              <DensityToggle />

              <button
                className="nav-help-btn"
                onClick={() => setShortcutsOpen(true)}
                title="Atajos (Ctrl+/)"
                aria-label="Atajos"
              >
                ❓
              </button>

              <NotificationCenter />
              <ThemeToggle />
            </div>
          </header>

          {/* Contenido principal */}
          <main className="app-main">
            <div key={`${vistaActiva.suite}-${vistaActiva.submenu}`}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Modales globales */}
      <GlobalSearch />
      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* Estilos compartidos reutilizados del header viejo */}
      <style>{`
        .nav-help-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e0;
          transition: all 0.2s ease;
          flex-shrink: 0;
          font-family: inherit;
        }
        .nav-help-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          transform: scale(1.1) rotate(8deg);
        }
      `}</style>
    </>
  );
}