// src/Componentes/UI/ShortcutsModal.jsx
import { useEffect, useState } from 'react';
import { formatShortcut } from '../../Hoosk/UseKeyboard';

export default function ShortcutsModal({ isOpen, onClose }) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(
      typeof navigator !== 'undefined' &&
        /Mac|iPhone|iPad|iPod/.test(navigator.platform),
    );
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 🎹 Grupos de atajos
  const grupos = [
    {
      titulo: 'Navegación',
      icono: '🧭',
      atajos: [
        { combo: 'ctrl+k', label: 'Buscador global' },
        { combo: 'ctrl+b', label: 'Ir a Biométrico' },
        { combo: 'ctrl+r', label: 'Ir a Reglas' },
      ],
    },
    {
      titulo: 'Apariencia',
      icono: '🎨',
      atajos: [
        { combo: 'ctrl+d', label: 'Cambiar tema (claro/oscuro)' },
      ],
    },
    {
      titulo: 'Sistema',
      icono: '⚙️',
      atajos: [
        { combo: 'ctrl+/', label: 'Mostrar esta ayuda' },
        { combo: 'escape', label: 'Cerrar modales / buscador' },
      ],
    },
  ];

  return (
    <>
      <style>{`
        @keyframes skFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes skSlideDown {
          0% { opacity: 0; transform: translateY(-30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .sk-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: skFadeIn 0.2s ease-out;
        }
        .sk-modal {
          background: var(--bg-card);
          border-radius: 14px;
          max-width: 540px;
          width: 100%;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          animation: skSlideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid var(--border-light);
        }
        .sk-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .sk-title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sk-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg-hover);
          color: var(--text-secondary);
          border: none;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .sk-close:hover {
          background: var(--card-danger-bg);
          color: var(--danger);
        }
        .sk-body {
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1;
        }
        .sk-group {
          margin-bottom: 24px;
        }
        .sk-group:last-child {
          margin-bottom: 0;
        }
        .sk-group-title {
          margin: 0 0 12px 0;
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sk-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 4px;
          transition: background 0.15s ease;
        }
        .sk-row:hover {
          background: var(--bg-hover);
        }
        .sk-label {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .sk-combo {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .sk-key {
          background: var(--bg-hover);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-bottom-width: 2px;
          padding: 4px 9px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
          min-width: 24px;
          text-align: center;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
        }
        .sk-footer {
          padding: 14px 24px;
          background: var(--bg-hover);
          border-top: 1px solid var(--border-light);
          font-size: 12px;
          color: var(--text-muted);
          text-align: center;
        }
        .sk-footer strong {
          color: var(--text-secondary);
        }
      `}</style>

      <div className="sk-backdrop" onClick={onClose}>
        <div className="sk-modal" onClick={(e) => e.stopPropagation()}>
          {/* HEADER */}
          <div className="sk-header">
            <h2 className="sk-title">
              ⌨️ Atajos de Teclado
            </h2>
            <button className="sk-close" onClick={onClose} title="Cerrar">
              ✕
            </button>
          </div>

          {/* BODY */}
          <div className="sk-body">
            {grupos.map((grupo) => (
              <div key={grupo.titulo} className="sk-group">
                <h3 className="sk-group-title">
                  <span>{grupo.icono}</span>
                  {grupo.titulo}
                </h3>
                {grupo.atajos.map((atajo) => {
                  const teclas = formatShortcut(atajo.combo).split(
                    isMac ? /(?=[⌘⌥⇧])/ : / \+ /,
                  );
                  return (
                    <div key={atajo.combo} className="sk-row">
                      <span className="sk-label">{atajo.label}</span>
                      <div className="sk-combo">
                        {teclas.map((tecla, idx) => (
                          <span key={idx} className="sk-key">
                            {tecla.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div className="sk-footer">
            Presiona <strong>Esc</strong> para cerrar · Los atajos funcionan en
            cualquier pantalla
          </div>
        </div>
      </div>
    </>
  );
}