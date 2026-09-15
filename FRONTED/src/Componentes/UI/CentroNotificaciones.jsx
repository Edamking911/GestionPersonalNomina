// src/Componentes/UI/NotificationCenter.jsx
import { useState, useEffect, useRef } from 'react';
import { useNotificaciones } from '../Context/Notificaciones';

// 🎨 Íconos SVG (limpios en cualquier SO)
const IconoCampana = ({ color = 'currentColor', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconoCerrar = ({ color = 'currentColor', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Configuración visual por tipo
const TIPOS = {
  success: { icon: '✅', color: '#38a169', bg: 'rgba(72, 187, 120, 0.15)' },
  error: { icon: '❌', color: '#e53e3e', bg: 'rgba(252, 129, 129, 0.15)' },
  warning: { icon: '⚠️', color: '#dd6b20', bg: 'rgba(237, 137, 54, 0.15)' },
  info: { icon: 'ℹ️', color: '#3182ce', bg: 'rgba(66, 153, 225, 0.15)' },
};

// 🕐 Tiempo relativo
function tiempoRelativo(timestamp) {
  const diff = Date.now() - timestamp;
  const seg = Math.floor(diff / 1000);
  if (seg < 60) return 'Ahora';
  const min = Math.floor(seg / 60);
  if (min < 60) return `Hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const dias = Math.floor(hrs / 24);
  if (dias < 7) return `Hace ${dias} d`;
  return new Date(timestamp).toLocaleDateString('es-VE');
}

export default function NotificationCenter() {
  const {
    notificaciones,
    noLeidas,
    marcarLeida,
    marcarTodasLeidas,
    eliminarNotificacion,
    limpiarTodas,
  } = useNotificaciones();

  const [isOpen, setIsOpen] = useState(false);
  const [, forceUpdate] = useState(0);
  const wrapperRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Refrescar tiempo relativo cada 30s
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => forceUpdate((x) => x + 1), 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <>
      <style>{`
        @keyframes ncFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ncSlideDown {
          0% { opacity: 0; transform: translateY(-8px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ncPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .nc-wrapper { position: relative; }

        .nc-bell {
          position: relative;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e0;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .nc-bell:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          transform: scale(1.05);
        }
        .nc-bell.has-unread {
          color: #fff;
        }
        .nc-bell.has-unread svg {
          animation: ncPulse 2s ease-in-out infinite;
        }

        .nc-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          background: #e53e3e;
          color: #fff;
          border-radius: 9px;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-navbar);
          font-family: inherit;
        }

        .nc-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 380px;
          max-width: calc(100vw - 32px);
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          z-index: 99999;
          animation: ncSlideDown 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .nc-header {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nc-title {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nc-counter {
          background: var(--danger);
          color: #fff;
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 10px;
          font-weight: 700;
        }
        .nc-btn-text {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.2s ease;
        }
        .nc-btn-text:hover {
          background: var(--primary-soft);
        }

        .nc-list {
          max-height: 400px;
          overflow-y: auto;
          padding: 4px 0;
        }

        .nc-empty {
          padding: 40px 20px;
          text-align: center;
          color: var(--text-muted);
        }
        .nc-empty-icon {
          font-size: 40px;
          margin-bottom: 8px;
          opacity: 0.5;
        }

        .nc-item {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.15s ease;
          position: relative;
          border-left: 3px solid transparent;
        }
        .nc-item:hover {
          background: var(--bg-hover);
        }
        .nc-item.unread {
          background: var(--primary-soft);
        }
        .nc-item.unread:hover {
          background: var(--bg-hover);
        }
        .nc-item.unread::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--primary);
        }

        .nc-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .nc-content {
          flex: 1;
          min-width: 0;
        }
        .nc-item-title {
          margin: 0 0 2px 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
        }
        .nc-item-msg {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
          word-break: break-word;
        }
        .nc-item-time {
          font-size: 11px;
          color: var(--text-muted);
          font-style: italic;
        }

        .nc-delete {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .nc-item:hover .nc-delete {
          opacity: 1;
        }
        .nc-delete:hover {
          background: var(--card-danger-bg);
          color: var(--danger);
        }

        .nc-footer {
          padding: 8px 16px;
          border-top: 1px solid var(--border-light);
          background: var(--bg-hover);
          font-size: 11px;
          color: var(--text-muted);
          text-align: center;
        }
        .nc-footer button {
          background: none;
          border: none;
          color: var(--danger);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .nc-footer button:hover { text-decoration: underline; }
      `}</style>

      <div className="nc-wrapper" ref={wrapperRef}>
        <button
          className={`nc-bell ${noLeidas > 0 ? 'has-unread' : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          title="Notificaciones"
          aria-label="Notificaciones"
        >
          <IconoCampana size={20} />
          {noLeidas > 0 && (
            <span className="nc-badge">{noLeidas > 99 ? '99+' : noLeidas}</span>
          )}
        </button>

        {isOpen && (
          <div className="nc-dropdown">
            <div className="nc-header">
              <h3 className="nc-title">
                Notificaciones
                {noLeidas > 0 && <span className="nc-counter">{noLeidas}</span>}
              </h3>
              {noLeidas > 0 && (
                <button className="nc-btn-text" onClick={marcarTodasLeidas}>
                  Marcar todas
                </button>
              )}
            </div>

            <div className="nc-list">
              {notificaciones.length === 0 ? (
                <div className="nc-empty">
                  <div className="nc-empty-icon">🔔</div>
                  <p style={{ margin: 0, fontSize: '13px' }}>
                    No tienes notificaciones
                  </p>
                </div>
              ) : (
                notificaciones.map((n) => {
                  const t = TIPOS[n.tipo] || TIPOS.info;
                  return (
                    <div
                      key={n.id}
                      className={`nc-item ${!n.leida ? 'unread' : ''}`}
                      onClick={() => !n.leida && marcarLeida(n.id)}
                    >
                      <div
                        className="nc-icon-wrap"
                        style={{ background: t.bg }}
                      >
                        {n.icono || t.icon}
                      </div>
                      <div className="nc-content">
                        {n.titulo && (
                          <p className="nc-item-title">{n.titulo}</p>
                        )}
                        <p className="nc-item-msg">{n.mensaje}</p>
                        <span className="nc-item-time">
                          {tiempoRelativo(n.timestamp)}
                        </span>
                      </div>
                      <button
                        className="nc-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarNotificacion(n.id);
                        }}
                        title="Eliminar"
                      >
                        <IconoCerrar size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {notificaciones.length > 0 && (
              <div className="nc-footer">
                <button onClick={limpiarTodas}>Limpiar todo</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}