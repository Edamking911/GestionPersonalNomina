// src/Componentes/UI/Toast.jsx
import { useEffect, useState } from 'react';

export default function Toast({
  message,
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  duration = 4000,
  onClose,
  position = 'top-right', // 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!message) return;

    // Pequeño delay para que se vea la animación de entrada
    setTimeout(() => setVisible(true), 50);

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration]);

  const handleClose = () => {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      setLeaving(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!message) return null;

  // =========================================================
  // TIPOS (color + ícono + título)
  // =========================================================
  const types = {
    success: {
      accent: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)',
      iconBg: '#c6f6d5',
      icon: '✅',
      title: 'Éxito',
      textColor: '#22543d',
    },
    error: {
      accent: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
      iconBg: '#fed7d7',
      icon: '❌',
      title: 'Error',
      textColor: '#9b2c2c',
    },
    warning: {
      accent: 'linear-gradient(135deg, #dd6b20 0%, #c05621 100%)',
      iconBg: '#feebc8',
      icon: '⚠️',
      title: 'Atención',
      textColor: '#744210',
    },
    info: {
      accent: 'linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)',
      iconBg: '#bee3f8',
      icon: 'ℹ️',
      title: 'Información',
      textColor: '#2c5282',
    },
  };

  // =========================================================
  // POSICIONES
  // =========================================================
  const positions = {
    'top-right': { top: '20px', right: '20px' },
    'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' },
  };

  const t = types[type] || types.info;
  const p = positions[position] || positions['top-right'];

  return (
    <>
      <style>{`
        @keyframes toastSlideInRight {
          0% {
            opacity: 0;
            transform: translateX(100%) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes toastSlideOutRight {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(100%) scale(0.9);
          }
        }

        @keyframes toastSlideInCenter {
          0% {
            opacity: 0;
            transform: translate(-50%, -20px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }

        @keyframes toastSlideOutCenter {
          0% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -20px) scale(0.9);
          }
        }

        @keyframes progressBar {
          from { width: 100%; }
          to { width: 0%; }
        }

        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .toast-container {
          position: fixed;
          z-index: 100000;
          pointer-events: none;
        }

        .toast-box {
          pointer-events: auto;
          background: #fff;
          border-radius: 12px;
          min-width: 320px;
          max-width: 420px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25),
                      0 0 0 1px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .toast-box.is-right {
          animation: toastSlideInRight 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .toast-box.is-right.leaving {
          animation: toastSlideOutRight 0.3s ease-in forwards;
        }

        .toast-box.is-center {
          animation: toastSlideInCenter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .toast-box.is-center.leaving {
          animation: toastSlideOutCenter 0.3s ease-in forwards;
        }

        .toast-accent-bar {
          height: 4px;
          background: var(--toast-accent);
          background-size: 200% auto;
        }

        .toast-body {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
        }

        .toast-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--toast-icon-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          animation: iconPulse 1.5s ease-in-out infinite;
        }

        .toast-content {
          flex: 1;
          min-width: 0;
          padding-top: 2px;
        }

        .toast-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--toast-text);
          margin: 0 0 2px 0;
        }

        .toast-message {
          font-size: 13px;
          color: #4a5568;
          margin: 0;
          line-height: 1.4;
          word-break: break-word;
        }

        .toast-close {
          background: transparent;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .toast-close:hover {
          background: #f7fafc;
          color: #4a5568;
        }

        .toast-progress {
          height: 3px;
          background: var(--toast-accent);
          animation: progressBar var(--toast-duration) linear forwards;
        }
      `}</style>

      <div className="toast-container" style={p}>
        <div
          className={`toast-box ${
            position.includes('center') ? 'is-center' : 'is-right'
          } ${leaving ? 'leaving' : ''}`}
          style={{
            '--toast-accent': t.accent,
            '--toast-icon-bg': t.iconBg,
            '--toast-text': t.textColor,
            '--toast-duration': `${duration}ms`,
            opacity: visible ? 1 : 0,
          }}
        >
          <div className="toast-accent-bar"></div>

          <div className="toast-body">
            <div className="toast-icon">{t.icon}</div>

            <div className="toast-content">
              <p className="toast-title">{t.title}</p>
              <p className="toast-message">{message}</p>
            </div>

            <button className="toast-close" onClick={handleClose} title="Cerrar">
              ✕
            </button>
          </div>

          <div className="toast-progress"></div>
        </div>
      </div>
    </>
  );
}