// src/Componentes/UI/InstallPWA.jsx
import { useState, useEffect } from 'react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [platform, setPlatform] = useState('other');

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /Android/i.test(ua);
    const isDesktop = !isIOS && !isAndroid;

    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');
    else setPlatform('desktop');

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsInstalled(standalone);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Resultado:', outcome);
      setDeferredPrompt(null);
      return;
    }
    setShowHint(true);
  };

  if (isInstalled) return null;

  return (
    <>
      <style>{`
        @keyframes ipwaFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ipwaSlideDown {
          0% { opacity: 0; transform: translateY(-10px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ipwa-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.25s ease;
          height: 42px;
          box-shadow: 0 4px 12px rgba(56, 161, 105, 0.35);
        }
        .ipwa-btn:hover {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(56, 161, 105, 0.5);
        }
        .ipwa-btn:active { transform: translateY(0) scale(0.98); }

        .ipwa-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 100001;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: ipwaFadeIn 0.2s ease-out;
        }
        .ipwa-modal {
          background: var(--bg-card);
          border-radius: 14px;
          max-width: 440px;
          width: 100%;
          padding: 24px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-light);
          animation: ipwaSlideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-height: 90vh;
          overflow-y: auto;
        }
        .ipwa-modal-title {
          margin: 0 0 16px 0;
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
        }
        .ipwa-steps {
          counter-reset: step;
          margin-bottom: 20px;
        }
        .ipwa-step {
          margin: 10px 0;
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
          padding-left: 24px;
          position: relative;
        }
        .ipwa-step::before {
          content: counter(step);
          counter-increment: step;
          position: absolute;
          left: 0;
          top: 2px;
          width: 18px;
          height: 18px;
          background: var(--primary);
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }
        .ipwa-step strong {
          color: var(--text-primary);
          font-weight: 700;
        }
        .ipwa-close {
          width: 100%;
          padding: 12px;
          background: var(--primary);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .ipwa-close:hover { background: var(--primary-hover); }

        .ipwa-icon-box {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          background: var(--primary-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          margin: 0 auto 16px auto;
        }
      `}</style>

      <button
        className="ipwa-btn"
        onClick={handleInstall}
        title="Instalar app en tu dispositivo"
      >
        📲 <span className="ipwa-btn-text">Instalar</span>
      </button>

      {showHint && (
        <div className="ipwa-backdrop" onClick={() => setShowHint(false)}>
          <div className="ipwa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ipwa-icon-box">📲</div>
            <h3 className="ipwa-modal-title">
              {platform === 'ios' && 'Instalar en iOS'}
              {platform === 'android' && 'Instalar en Android'}
              {platform === 'desktop' && 'Instalar en PC'}
            </h3>

            <div className="ipwa-steps">
              {platform === 'ios' && (
                <>
                  <p className="ipwa-step">
                    Abre esta página en <strong>Safari</strong> (no Chrome)
                  </p>
                  <p className="ipwa-step">
                    Toca el botón <strong>Compartir</strong> (↑ en la barra inferior)
                  </p>
                  <p className="ipwa-step">
                    Desliza y toca <strong>"Añadir a pantalla de inicio"</strong>
                  </p>
                  <p className="ipwa-step">
                    Toca <strong>"Añadir"</strong> arriba a la derecha
                  </p>
                </>
              )}

              {platform === 'android' && (
                <>
                  <p className="ipwa-step">
                    Toca el menú <strong>⋮</strong> (arriba a la derecha)
                  </p>
                  <p className="ipwa-step">
                    Selecciona <strong>"Instalar aplicación"</strong> o{' '}
                    <strong>"Añadir a pantalla de inicio"</strong>
                  </p>
                  <p className="ipwa-step">
                    Confirma tocando <strong>"Instalar"</strong>
                  </p>
                  <p className="ipwa-step">
                    ¡Listo! Busca el ícono <strong>Biométrico</strong> en tu cajón
                  </p>
                </>
              )}

              {platform === 'desktop' && (
                <>
                  <p className="ipwa-step">
                    Busca el ícono <strong>📲</strong> en la barra de direcciones
                  </p>
                  <p className="ipwa-step">
                    O abre el menú y busca <strong>"Instalar Sistema Biométrico"</strong>
                  </p>
                  <p className="ipwa-step">Confirma la instalación</p>
                </>
              )}
            </div>

            <button
              className="ipwa-close"
              onClick={() => setShowHint(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}