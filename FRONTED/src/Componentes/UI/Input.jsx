// src/Componentes/UI/Input.jsx

export default function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  error = '',
  hint = '',
  icon = null,
  disabled = false,
  required = false,
  fullWidth = true,
  theme = 'light', // 'light' | 'dark'
  size = 'md',     // 'sm' | 'md' | 'lg'
  style = {},
  inputStyle = {},
  ...props
}) {
  // =========================================================
  // TAMAÑOS
  // =========================================================
  const sizes = {
    sm: { height: '36px', padding: '0 12px', fontSize: '13px' },
    md: { height: '42px', padding: '0 14px', fontSize: '14px' },
    lg: { height: '50px', padding: '0 16px', fontSize: '15px' },
  };

  // =========================================================
  // TEMAS
  // =========================================================
  const themes = {
    light: {
      labelColor: '#4a5568',
      bg: '#fff',
      bgHover: '#f7fafc',
      bgFocus: '#fff',
      border: '#cbd5e0',
      borderHover: '#a0aec0',
      borderFocus: '#3182ce',
      borderError: '#e53e3e',
      text: '#2d3748',
      placeholder: '#a0aec0',
      hint: '#718096',
      error: '#e53e3e',
      focusShadow: 'rgba(49, 130, 206, 0.15)',
      errorShadow: 'rgba(229, 62, 62, 0.15)',
      iconColor: '#a0aec0',
      colorScheme: 'light',
    },
    dark: {
      labelColor: '#a0aec0',
      bg: '#2d3748',
      bgHover: '#374151',
      bgFocus: '#2d3748',
      border: '#4a5568',
      borderHover: '#718096',
      borderFocus: '#3182ce',
      borderError: '#e53e3e',
      text: '#f7fafc',
      placeholder: '#718096',
      hint: '#718096',
      error: '#fc8181',
      focusShadow: 'rgba(49, 130, 206, 0.25)',
      errorShadow: 'rgba(229, 62, 62, 0.25)',
      iconColor: '#718096',
      colorScheme: 'dark',
    },
  };

  const s = sizes[size] || sizes.md;
  const t = themes[theme] || themes.light;

  const inputBorder = error ? t.borderError : t.border;

  const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: fullWidth ? '100%' : 'auto',
    ...style,
  };

  const inputBaseStyle = {
    width: '100%',
    height: s.height,
    padding: s.padding,
    paddingLeft: icon ? '40px' : s.padding,
    fontSize: s.fontSize,
    fontFamily: 'inherit',
    color: t.text,
    background: t.bg,
    border: `1px solid ${inputBorder}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s ease',
    colorScheme: t.colorScheme,
    boxSizing: 'border-box',
    ...inputStyle,
  };

  return (
    <div style={wrapperStyle}>
      {/* LABEL */}
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            color: t.labelColor,
            transition: 'color 0.2s ease',
          }}
        >
          {label}
          {required && (
            <span style={{ color: t.error, marginLeft: '4px' }}>*</span>
          )}
        </label>
      )}

      {/* INPUT CONTAINER */}
      <div style={{ position: 'relative' }}>
        {/* ÍCONO A LA IZQUIERDA */}
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
              color: t.iconColor,
              pointerEvents: 'none',
              transition: 'color 0.2s ease',
            }}
          >
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={inputBaseStyle}
          onMouseEnter={(e) => {
            if (disabled) return;
            if (!error) e.currentTarget.style.borderColor = t.borderHover;
          }}
          onMouseLeave={(e) => {
            if (disabled) return;
            if (!error) e.currentTarget.style.borderColor = t.border;
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? t.borderError : t.borderFocus;
            e.currentTarget.style.background = t.bgFocus;
            e.currentTarget.style.boxShadow = error
              ? `0 0 0 3px ${t.errorShadow}`
              : `0 0 0 3px ${t.focusShadow}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = inputBorder;
            e.currentTarget.style.background = t.bg;
            e.currentTarget.style.boxShadow = 'none';
          }}
          {...props}
        />
      </div>

      {/* HINT O ERROR */}
      {(error || hint) && (
        <span
          style={{
            fontSize: '12px',
            color: error ? t.error : t.hint,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {error && '⚠️ '}
          {error || hint}
        </span>
      )}
    </div>
  );
}