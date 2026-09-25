// src/Componentes/UI/BotonActualizar.jsx
import { useState } from 'react';

export default function BotonActualizar() {
  const [updating, setUpdating] = useState(false);

  const handleActualizar = () => {
    setUpdating(true);

    // 🚀 1. Disparar limpieza en background (sin esperar)
    limpiarCacheBackground();

    // ⚡ 2. Recargar YA (sin query string, sin esperar)
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const limpiarCacheBackground = () => {
    // 🔥 Sin await, fire-and-forget
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => regs.forEach((r) => r.unregister()))
          .catch(() => {});
      }

      if ('caches' in window) {
        caches
          .keys()
          .then((keys) => keys.forEach((k) => caches.delete(k)))
          .catch(() => {});
      }
    } catch {
      // Ignorar errores — igual recargamos
    }
  };

  return (
    <>
      <style>{`
        .boton-update {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 99998;
          background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 12px 18px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(56, 161, 105, 0.4);
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .boton-update:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(56, 161, 105, 0.5);
        }
        .boton-update:active {
          transform: translateY(0);
        }
        .boton-update:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: translateY(0);
        }
        .boton-update .icono {
          font-size: 16px;
          display: inline-block;
        }
        .boton-update .icono.spinning {
          animation: botonUpdateRotate 0.8s linear infinite;
        }
        @keyframes botonUpdateRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 600px) {
          .boton-update {
            bottom: 12px;
            right: 12px;
            padding: 10px 14px;
            font-size: 12px;
          }
        }
      `}</style>

      <button
        className="boton-update"
        onClick={handleActualizar}
        disabled={updating}
        title="Recargar la aplicación"
      >
        <span className={`icono ${updating ? 'spinning' : ''}`}>
          {updating ? '⏳' : '🔄'}
        </span>
        {updating ? 'Actualizando...' : 'Actualizar'}
      </button>
    </>
  );
}