// src/Componentes/UI/Button.jsx

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  onClick,
  type = 'button',
  title,
  style = {},
  ...props
}) {
  // =========================================================
  // VARIANTES DE COLOR
  // Los colores vivos (primary, success, etc.) se mantienen
  // iguales en ambos temas porque ya tienen contraste suficiente.
  // Solo los variants neutros (ghost, light) usan variables.
  // =========================================================
  const variants = {
    primary: {
      bg: 'linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)',
      bgHover: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
      color: '#fff',
      border: 'none',
      shadow: 'rgba(49, 130, 206, 0.35)',
    },
    success: {
      bg: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)',
      bgHover: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
      color: '#fff',
      border: 'none',
      shadow: 'rgba(56, 161, 105, 0.35)',
    },
    danger: {
      bg: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
      bgHover: 'linear-gradient(135deg, #fc8181 0%, #e53e3e 100%)',
      color: '#fff',
      border: 'none',
      shadow: 'rgba(229, 62, 62, 0.35)',
    },
    warning: {
      bg: 'linear-gradient(135deg, #dd6b20 0%, #c05621 100%)',
      bgHover: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
      color: '#fff',
      border: 'none',
      shadow: 'rgba(221, 107, 32, 0.35)',
    },
    info: {
      bg: 'linear-gradient(135deg, #805ad5 0%, #6b46c1 100%)',
      bgHover: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)',
      color: '#fff',
      border: 'none',
      shadow: 'rgba(128, 90, 213, 0.35)',
    },
    // 👇 Adaptado a variables
    ghost: {
      bg: 'transparent',
      bgHover: 'var(--bg-hover)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-color)',
      shadow: 'transparent',
    },
    // 👇 Adaptado a variables
    dark: {
      bg: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
      bgHover: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
      color: '#f7fafc',
      border: '1px solid #4a5568',
      shadow: 'rgba(0, 0, 0, 0.3)',
    },
    // 👇 Adaptado a variables (éste SÍ cambia entre claro/oscuro)
    light: {
      bg: 'var(--bg-card)',
      bgHover: 'var(--bg-hover)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
      shadow: 'var(--shadow-sm)',
    },
  };

  // =========================================================
  // TAMAÑOS
  // =========================================================
  const sizes = {
    sm: { height: '34px', padding: '0 12px', fontSize: '12px', gap: '6px' },
    md: { height: '42px', padding: '0 18px', fontSize: '14px', gap: '8px' },
    lg: { height: '50px', padding: '0 24px', fontSize: '15px', gap: '10px' },
  };

  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  // =========================================================
  // ESTILO FINAL
  // =========================================================
  const isDisabled = disabled || loading;

  const finalStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    height: s.height,
    padding: s.padding,
    fontSize: s.fontSize,
    fontWeight: '600',
    fontFamily: 'inherit',
    background: v.bg,
    color: v.color,
    border: v.border,
    borderRadius: '8px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isDisabled ? 'none' : `0 4px 12px ${v.shadow}`,
    opacity: isDisabled ? 0.6 : 1,
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : 'auto',
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
    outline: 'none',
    ...style,
  };

  // =========================================================
  // HANDLERS DE HOVER / ACTIVE
  // =========================================================
  const handleMouseEnter = (e) => {
    if (isDisabled) return;
    e.currentTarget.style.background = v.bgHover;
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = `0 8px 20px ${v.shadow}`;
  };

  const handleMouseLeave = (e) => {
    if (isDisabled) return;
    e.currentTarget.style.background = v.bg;
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = `0 4px 12px ${v.shadow}`;
  };

  const handleMouseDown = (e) => {
    if (isDisabled) return;
    e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
  };

  const handleMouseUp = (e) => {
    if (isDisabled) return;
    e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
  };

  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      title={title}
      style={finalStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {iconLeft && !loading && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {iconLeft}
        </span>
      )}

      {loading && (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'btnSpinner 0.8s linear infinite',
            display: 'inline-block',
          }}
        ></span>
      )}

      <span>{children}</span>

      {iconRight && !loading && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {iconRight}
        </span>
      )}

      <style>{`
        @keyframes btnSpinner {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}