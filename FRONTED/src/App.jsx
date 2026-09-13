// src/App.jsx
import { useState } from 'react';
import Biometrico from './Biometrico/Biometrico';
import ReglasBiometrico from './Reglas-Biometricos/ReglasBiometricos';
import ThemeToggle from './Componentes/UI/ThemeToggle';

function App() {
  const [vista, setVista] = useState('biometrico');

  return (
    <div>
      {/* ============ ESTILOS DE NAVEGACIÓN ============ */}
      <style>{`
        .nav-btn {
          background: transparent;
          color: var(--text-secondary);
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
          color: var(--text-inverse);
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

        .nav-btn:hover::after {
          width: 60%;
        }

        .nav-btn.active::after {
          width: 0;
        }
      `}</style>

      {/* ============ BARRA DE NAVEGACIÓN ============ */}
      <nav
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
        {/* --- Lado izquierdo: botones de vista --- */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className={`nav-btn ${vista === 'biometrico' ? 'active' : ''}`}
            onClick={() => setVista('biometrico')}
          >
            <span className="nav-icon">📊</span>
            Biométrico
          </button>

          <button
            className={`nav-btn ${vista === 'reglas' ? 'active' : ''}`}
            onClick={() => setVista('reglas')}
          >
            <span className="nav-icon">⚙️</span>
            Reglas
          </button>
        </div>

        {/* --- Lado derecho: toggle de tema --- */}
        <ThemeToggle />
      </nav>

      {/* ============ VISTA ACTIVA ============ */}
      {vista === 'biometrico' ? <Biometrico /> : <ReglasBiometrico />}
    </div>
  );
}

export default App;