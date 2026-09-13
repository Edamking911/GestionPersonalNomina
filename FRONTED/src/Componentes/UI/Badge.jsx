// src/Componentes/UI/Badge.jsx

export default function Badge({
  children,
  variant = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'info' | 'dark' | 'light'
  size = 'md',
  icon = null,
  dot = false,
  pulse = false,
  style = {},
}) {
  // 👇 Todos apuntan a variables CSS
  const variants = {
    default: {
      bg: 'var(--badge-default-bg)',
      color: 'var(--badge-default-text)',
      dot: 'var(--badge-default-dot)',
    },
    success: {
      bg: 'var(--badge-success-bg)',
      color: 'var(--badge-success-text)',
      dot: 'var(--badge-success-dot)',
    },
    warning: {
      bg: 'var(--badge-warning-bg)',
      color: 'var(--badge-warning-text)',
      dot: 'var(--badge-warning-dot)',
    },
    danger: {
      bg: 'var(--badge-danger-bg)',
      color: 'var(--badge-danger-text)',
      dot: 'var(--badge-danger-dot)',
    },
    info: {
      bg: 'var(--badge-info-bg)',
      color: 'var(--badge-info-text)',
      dot: 'var(--badge-info-dot)',
    },
    dark: {
      bg: 'var(--badge-dark-bg)',
      color: 'var(--badge-dark-text)',
      dot: 'var(--badge-dark-dot)',
    },
    light: {
      bg: 'var(--badge-light-bg)',
      color: 'var(--badge-light-text)',
      dot: 'var(--badge-light-dot)',
    },
  };

  const sizes = {
    sm: { padding: '2px 8px', fontSize: '10px', dotSize: '6px', gap: '4px' },
    md: { padding: '4px 10px', fontSize: '12px', dotSize: '8px', gap: '6px' },
    lg: { padding: '6px 14px', fontSize: '13px', dotSize: '10px', gap: '6px' },
  };

  const v = variants[variant] || variants.default;
  const s = sizes[size] || sizes.md;

  return (
    <>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: s.gap,
          padding: s.padding,
          background: v.bg,
          color: v.color,
          borderRadius: '20px',
          fontSize: s.fontSize,
          fontWeight: '700',
          letterSpacing: '0.3px',
          whiteSpace: 'nowrap',
          ...style,
        }}
      >
        {dot && (
          <span
            style={{
              width: s.dotSize,
              height: s.dotSize,
              borderRadius: '50%',
              background: v.dot,
              display: 'inline-block',
              animation: pulse ? 'badgePulse 2s ease-in-out infinite' : 'none',
              color: v.dot,
            }}
          ></span>
        )}
        {icon && <span style={{ fontSize: s.fontSize }}>{icon}</span>}
        {children}
      </span>

      {pulse && (
        <style>{`
          @keyframes badgePulse {
            0%, 100% {
              box-shadow: 0 0 0 0 currentColor;
              opacity: 1;
            }
            50% {
              box-shadow: 0 0 0 6px transparent;
              opacity: 0.85;
            }
          }
        `}</style>
      )}
    </>
  );
}