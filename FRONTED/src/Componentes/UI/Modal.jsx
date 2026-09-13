// src/Componentes/UI/Modal.jsx
import { useEffect } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',         // 'sm' | 'md' | 'lg' | 'xl'
  variant = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'info'
  closeOnBackdrop = true,
  closeOnEsc = true,
  hideCloseBtn = false,
}) {
  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, closeOnEsc]);

  // Bloquear scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // =========================================================
  // VARIANTES
  // =========================================================
  const variants = {
    default: { accent: 'linear-gradient(90deg, #3182ce, #2b6cb0)', iconBg: '#ebf8ff', iconColor: '#3182ce' },
    success: { accent: 'linear-gradient(90deg, #38a169, #2f855a)', iconBg: '#c6f6d5', iconColor: '#38a169' },
    warning: { accent: 'linear-gradient(90deg, #dd6b20, #c05621)', iconBg: '#feebc8', iconColor: '#dd6b20' },
    danger: { accent: 'linear-gradient(90deg, #e53e3e, #c53030)', iconBg: '#fed7d7', iconColor: '#e53e3e' },
    info: { accent: 'linear-gradient(90deg, #805ad5, #6b46c1)', iconBg: '#e9d8fd', iconColor: '#805ad5' },
  };

  const sizes = {
    sm: '400px',
    md: '560px',
    lg: '720px',
    xl: '900px',
  };

  const v = variants[variant] || variants.default;
  const maxWidth = sizes[size] || sizes.md;

  return (
    <>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideDown {
          0% { opacity: 0; transform: translateY(-40px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes modalAccentShimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <div
        onClick={() => closeOnBackdrop && onClose()}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'modalFadeIn 0.25s ease-out',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: '14px',
            maxWidth,
            width: '100%',
            maxHeight: '90vh',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'modalSlideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* BARRA SUPERIOR ANIMADA */}
          <div
            style={{
              height: '4px',
              background: v.accent,
              backgroundSize: '200% auto',
              animation: 'modalAccentShimmer 3s linear infinite',
            }}
          ></div>

          {/* HEADER */}
          {(title || !hideCloseBtn) && (
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {icon && (
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: v.iconBg,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                {title && (
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#1a202c', fontWeight: '700' }}>
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#718096' }}>
                    {subtitle}
                  </p>
                )}
              </div>
              {!hideCloseBtn && (
                <button
                  onClick={onClose}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#f7fafc',
                    color: '#4a5568',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#fed7d7';
                    e.target.style.color = '#e53e3e';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f7fafc';
                    e.target.style.color = '#4a5568';
                  }}
                  title="Cerrar"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* BODY */}
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
            {children}
          </div>

          {/* FOOTER */}
          {footer && (
            <div
              style={{
                padding: '16px 24px',
                background: '#f7fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}