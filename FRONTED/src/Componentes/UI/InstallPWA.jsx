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
      console.log('[PWA] beforeinstallprompt capturado ✅');
      setDeferredPrompt(e);
    };

    const handleInstalled = () => {
      console.log('[PWA] App instalada ✅');
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
    // ✅ Caso ideal: hay prompt disponible → instalar directo
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] Resultado:', outcome);
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.error('[PWA] Error al prompt:', err);
      }
    }

    // ⚠️ No hay prompt (Chrome ya lo dismisseó) → mostrar instrucciones
    setShowHint(true);
  };

  // Solo ocultar si YA está instalada
  if (isInstalled) return null;

  // Si hay prompt → botón verde
  // Si no hay prompt → botón amarillo (con instrucciones)
  const hayPrompt = !!deferredPrompt;

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
          background: ${hayPrompt 
            ? 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)' 
            : 'linear-gradient(135deg, #d69e2e 0%, #b7791f 100%)'};
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.25s ease;
          height: 42px;
          box-shadow: 0 4px 12px ${hayPrompt 
            ? 'rgba(56, 161, 105, 0.35)' 
            : 'rgba(214, 158, 46, 0.35)'};
        }
        .ipwa-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px ${hayPrompt 
            ? 'rgba(56, 161, 105, 0.5)' 
            : 'rgba(214, 158, 46, 0.5)'};
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
          max-width: 460px;
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
          margin: 12px 0;
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
          padding-left: 30px;
          position: relative;
        }
        .ipwa-step::before {
          content: counter(step);
          counter-increment: step;
          position: absolute;
          left: 0;
          top: 1px;
          width: 20px;
          height: 20px;
          background: var(--primary);
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }
        .ipwa-step strong {
          color: var(--text-primary);
          font-weight: 700;
        }
        .ipwa-step code {
          background: var(--bg-hover);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          color: var(--primary);
        }
        .ipwa-warning {
          background: var(--warning-soft);
          border: 1px solid var(--card-warning-border);
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 12px;
          color: var(--card-warning-title);
          display: flex;
          gap: 8px;
          align-items: flex-start;
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
        title={hayPrompt ? 'Instalar app' : 'Ver cómo instalar la app'}
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
              {platform === 'desktop' && 'Instalar en esta PC'}
            </h3>

            {platform === 'desktop' && (
              <>
                <div className="ipwa-warning">
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <span>
                    Chrome ya mostró el diálogo antes. Ahora hay que instalarla
                    desde el menú del navegador.
                  </span>
                </div>

                <div className="ipwa-steps">
                  <p className="ipwa-step">
                    En la barra de direcciones, busca el ícono{' '}
                    <strong>📲 (monitor con flecha hacia abajo)</strong> al lado
                    de la URL <code>https://172.18.0.84:5173</code>
                  </p>
                  <p className="ipwa-step">
                    Si NO aparece, haz clic en el menú <strong>⋮</strong>{' '}
                    (arriba a la derecha de Chrome)
                  </p>
                  <p className="ipwa-step">
                    Busca la opción{' '}
                    <strong>"Instalar Sistema Biométrico"</strong> o{' '}
                    <strong>"Instalar aplicación"</strong>
                  </p>
                  <p className="ipwa-step">
                    Confirma con <strong>"Instalar"</strong>
                  </p>
                </div>
              </>
            )}

            {platform === 'android' && (
              <>
                <div className="ipwa-warning">
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <span>
                    Chrome ya dismisseó el diálogo antes. Instálala desde el menú.
                  </span>
                </div>

                <div className="ipwa-steps">
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
                    ¡Listo! Busca el ícono en tu cajón de apps
                  </p>
                </div>
              </>
            )}

            {platform === 'ios' && (
              <div className="ipwa-steps">
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
              </div>
            )}

            <button className="ipwa-close" onClick={() => setShowHint(false)}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}