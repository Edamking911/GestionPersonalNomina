// src/Componentes/UI/ThemeToggle.jsx
import { useTheme } from '../Context/ThemesContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      <style>{`
        @keyframes girarIcono {
          from { transform: rotate(0deg) scale(0.5); opacity: 0; }
          to { transform: rotate(360deg) scale(1); opacity: 1; }
        }

        .theme-toggle-navbar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e0;
          transition: all 0.25s ease;
          flex-shrink: 0;
        }

        .theme-toggle-navbar:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.1) rotate(15deg);
          box-shadow: 0 6px 16px rgba(128, 90, 213, 0.35);
        }

        .theme-toggle-navbar:active {
          transform: scale(0.95);
        }

        .theme-toggle-navbar .icono {
          animation: girarIcono 0.5s ease-out;
          display: inline-block;
          line-height: 1;
        }
      `}</style>

      <button
        className="theme-toggle-navbar"
        onClick={toggleTheme}
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        <span key={isDark ? 'dark' : 'light'} className="icono">
          {isDark ? '☀️' : '🌙'}
        </span>
      </button>
    </>
  );
}