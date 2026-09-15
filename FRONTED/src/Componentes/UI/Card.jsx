// src/Componentes/UI/Card.jsx

export default function Card({
  children,
  title,
  subtitle,
  icon = null,
  variant = 'default',
  padding = 'normal',
  hoverable = false,
  fullWidth = false,
  style = {},
  headerStyle = {},
  bodyStyle = {},
  ...props
}) {
  // =========================================================
  // 🎨 VARIANTES — usan SOLO variables CSS
  // =========================================================
  // Sin useTheme(). El navegador cambia los valores según la
  // clase .dark del <html>. Cero bugs de re-render.
  // =========================================================
  const variants = {
    default: {
      bg: 'var(--card-default-bg)',
      headerBg: 'var(--card-default-header)',
      border: 'var(--card-default-border)',
      titleColor: 'var(--card-default-title)',
      subtitleColor: 'var(--card-default-subtitle)',
      textColor: 'var(--card-default-text)',
    },
    success: {
      bg: 'var(--card-success-bg)',
      headerBg: 'var(--card-success-header)',
      border: 'var(--card-success-border)',
      titleColor: 'var(--card-success-title)',
      subtitleColor: 'var(--card-success-subtitle)',
      textColor: 'var(--card-success-text)',
    },
    warning: {
      bg: 'var(--card-warning-bg)',
      headerBg: 'var(--card-warning-header)',
      border: 'var(--card-warning-border)',
      titleColor: 'var(--card-warning-title)',
      subtitleColor: 'var(--card-warning-subtitle)',
      textColor: 'var(--card-warning-text)',
    },
    danger: {
      bg: 'var(--card-danger-bg)',
      headerBg: 'var(--card-danger-header)',
      border: 'var(--card-danger-border)',
      titleColor: 'var(--card-danger-title)',
      subtitleColor: 'var(--card-danger-subtitle)',
      textColor: 'var(--card-danger-text)',
    },
    info: {
      bg: 'var(--card-info-bg)',
      headerBg: 'var(--card-info-header)',
      border: 'var(--card-info-border)',
      titleColor: 'var(--card-info-title)',
      subtitleColor: 'var(--card-info-subtitle)',
      textColor: 'var(--card-info-text)',
    },
    dark: {
      bg: 'var(--card-dark-bg)',
      headerBg: 'var(--card-dark-header)',
      border: 'var(--card-dark-border)',
      titleColor: 'var(--card-dark-title)',
      subtitleColor: 'var(--card-dark-subtitle)',
      textColor: 'var(--card-dark-text)',
    },
  };

  const paddings = {
    none: '0',
    sm: '12px 16px',
    normal: '20px 24px',
    lg: '28px 32px',
  };

  const v = variants[variant] || variants.default;
  const p = paddings[padding] || paddings.normal;

  const hasHeader = title || subtitle || icon;

  const cardStyle = {
    background: v.bg,
    border: `1px solid ${v.border}`,
    borderRadius: '10px',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    width: fullWidth ? '100%' : 'auto',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...style,
  };

  return (
    <div style={cardStyle} {...props}>
      {hasHeader && (
        <div
          style={{
            padding: p,
            background: v.headerBg,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            ...headerStyle,
          }}
        >
          {icon && (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--card-icon-bg)',
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
              <h3
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '700',
                  color: v.titleColor,
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '13px',
                  color: v.subtitleColor,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: p, color: v.textColor, ...bodyStyle }}>
        {children}
      </div>
    </div>
  );
}