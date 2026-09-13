// src/Componentes/UI/Select.jsx

export default function Select({
  label,
  value,
  onChange,
  options = [], // [{ value: '', label: '' }] o ['opcion1', 'opcion2']
  placeholder = 'Selecciona...',
  error = '',
  hint = '',
  disabled = false,
  required = false,
  fullWidth = true,
  theme = 'light',
  size = 'md',
  style = {},
  selectStyle = {},
  ...props
}) {
  const sizes = {
    sm: { height: '36px', padding: '0 12px', fontSize: '13px' },
    md: { height: '42px', padding: '0 14px', fontSize: '14px' },
    lg: { height: '50px', padding: '0 16px', fontSize: '15px' },
  };

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
      hint: '#718096',
      error: '#e53e3e',
      focusShadow: 'rgba(49, 130, 206, 0.15)',
      errorShadow: 'rgba(229, 62, 62, 0.15)',
      optionBg: '#fff',
      optionText: '#2d3748',
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
      hint: '#718096',
      error: '#fc8181',
      focusShadow: 'rgba(49, 130, 206, 0.25)',
      errorShadow: 'rgba(229, 62, 62, 0.25)',
      optionBg: '#2d3748',
      optionText: '#f7fafc',
      colorScheme: 'dark',
    },
  };

  const s = sizes[size] || sizes.md;
  const t = themes[theme] || themes.light;

  // Normalizar opciones (acepta strings o { value, label })
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const inputBorder = error ? t.borderError : t.border;

  const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: fullWidth ? '100%' : 'auto',
    ...style,
  };

  const selectBaseStyle = {
    width: '100%',
    height: s.height,
    padding: s.padding,
    fontSize: s.fontSize,
    fontFamily: 'inherit',
    color: t.text,
    background: t.bg,
    border: `1px solid ${inputBorder}`,
    borderRadius: '8px',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    colorScheme: t.colorScheme,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px',
    paddingRight: '40px',
    boxSizing: 'border-box',
    opacity: disabled ? 0.6 : 1,
    ...selectStyle,
  };

  return (
    <div style={wrapperStyle}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            color: t.labelColor,
          }}
        >
          {label}
          {required && (
            <span style={{ color: t.error, marginLeft: '4px' }}>*</span>
          )}
        </label>
      )}

      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={selectBaseStyle}
        onMouseEnter={(e) => {
          if (disabled) return;
          if (!error) e.currentTarget.style.borderColor = t.borderHover;
          e.currentTarget.style.background = t.bgHover;
        }}
        onMouseLeave={(e) => {
          if (disabled) return;
          if (!error) e.currentTarget.style.borderColor = t.border;
          e.currentTarget.style.background = t.bg;
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? t.borderError : t.borderFocus;
          e.currentTarget.style.boxShadow = error
            ? `0 0 0 3px ${t.errorShadow}`
            : `0 0 0 3px ${t.focusShadow}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = inputBorder;
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled style={{ background: t.optionBg, color: t.optionText }}>
            {placeholder}
          </option>
        )}
        {normalizedOptions.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ background: t.optionBg, color: t.optionText }}
          >
            {opt.label}
          </option>
        ))}
      </select>

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