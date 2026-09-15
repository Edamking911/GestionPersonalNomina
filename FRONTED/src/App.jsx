// src/App.jsx
import { useState } from 'react';
import Biometrico from './Biometrico/Biometrico';
import ReglasBiometrico from './Reglas-Biometricos/ReglasBiometricos';
import ThemeToggle from './Componentes/UI/ThemeToggle';
import GlobalSearch from './Componentes/UI/GlobalSearch';
import NotificationCenter from './Componentes/UI/CentroNotificaciones';
import ShortcutsModal from './Componentes/UI/ShortcutsModal';
import DensityToggle from './Componentes/UI/DensidaToggle';
import { useTheme } from './Componentes/Context/ThemesContext';
import { useKeyboardShortcuts } from './Hoosk/UseKeyboard';
import InstallPWA from './Componentes/UI/InstallPWA';


function App() {
  const [vista, setVista] = useState('biometrico');
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { toggleTheme } = useTheme();

  useKeyboardShortcuts({
    'ctrl+b': () => setVista('biometrico'),
    'ctrl+r': () => setVista('reglas'),
    'ctrl+d': () => toggleTheme(),
    'ctrl+/': () => setShortcutsOpen((prev) => !prev),
  });

  return (
    <div>
      <style>{`
        .nav-btn {
          background: transparent;
          color: rgba(255, 255, 255, 0.75);
          border: none;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          padding: 10px 18px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          transition: all 0.25s ease;
          font-family: inherit;
        }
        .nav-btn .nav-icon {
          display: inline-block;
          font-size: 18px;
          transition: transform 0.3s ease;
        }
        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          transform: translateY(-2px);
        }
        .nav-btn:hover .nav-icon {
          transform: scale(1.25) rotate(-8deg);
        }
        .nav-btn.active {
          background: var(--primary);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(49, 130, 206, 0.4);
        }
        .nav-btn.active .nav-icon {
          transform: scale(1.1);
        }
        .nav-btn::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          width: 0;
          height: 2px;
          background: #63b3ed;
          transition: all 0.3s ease;
          transform: translateX(-50%);
          border-radius: 2px;
        }
        .nav-btn:hover::after { width: 60%; }
        .nav-btn.active::after { width: 0; }

        .nav-search-hint {
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
        .nav-search-hint:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          transform: scale(1.05);
        }
        .nav-kbd {
          background: rgba(255, 255, 255, 0.15);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-family: monospace;
          color: #cbd5e0;
        }
        .nav-help-btn,
        .nav-density-btn {
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
        .nav-density-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          transform: scale(1.1);
        }
        .nav-help-btn:active,
        .nav-density-btn:active {
          transform: scale(0.95);
        }
      `}</style>

      <nav
        className="navbar-app"
        style={{
          padding: '12px 24px',
          background: 'var(--bg-navbar)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          className="navbar-left"
          style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
        >
          <button
            className={`nav-btn ${vista === 'biometrico' ? 'active' : ''}`}
            onClick={() => setVista('biometrico')}
            title="Biométrico (Ctrl+B)"
          >
            <span className="nav-icon">📊</span>
            Biométrico
          </button>

          <button
            className={`nav-btn ${vista === 'reglas' ? 'active' : ''}`}
            onClick={() => setVista('reglas')}
            title="Reglas (Ctrl+R)"
          >
            <span className="nav-icon">⚙️</span>
            Reglas
          </button>
        </div>

        <div
          className="navbar-right"
          style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
        >
          <button
            className="nav-search-hint"
            onClick={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                ctrlKey: true,
              });
              window.dispatchEvent(event);
            }}
            title="Buscar por cédula (Ctrl+K)"
          >
            🔍 Buscar
            <span className="nav-kbd">Ctrl</span>
            <span className="nav-kbd">K</span>
          </button>

          <InstallPWA />

          <DensityToggle />

          <button
            className="nav-help-btn"
            onClick={() => setShortcutsOpen(true)}
            title="Atajos de teclado (Ctrl+/)"
            aria-label="Atajos de teclado"
          >
            ❓
          </button>

          <NotificationCenter />

          <ThemeToggle />
        </div>
      </nav>

      <div key={vista} className="view-transition">
        {vista === 'biometrico' ? <Biometrico /> : <ReglasBiometrico />}
      </div>

      <GlobalSearch />

      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}

export default App;
