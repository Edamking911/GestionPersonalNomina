// src/Componentes/UI/Select.jsx

export default function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Selecciona...',
  error = '',
  hint = '',
  disabled = false,
  required = false,
  fullWidth = true,
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

  const s = sizes[size] || sizes.md;

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const inputBorder = error
    ? 'var(--input-border-error)'
    : 'var(--input-border)';

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
    color: 'var(--input-text)',
    background: 'var(--input-bg)',
    border: `1px solid ${inputBorder}`,
    borderRadius: '8px',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
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
            color: 'var(--text-secondary)',
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--input-error-text)', marginLeft: '4px' }}>
              *
            </span>
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
          if (!error) e.currentTarget.style.borderColor = 'var(--input-border-hover)';
          e.currentTarget.style.background = 'var(--input-bg-hover)';
        }}
        onMouseLeave={(e) => {
          if (disabled) return;
          if (!error) e.currentTarget.style.borderColor = 'var(--input-border)';
          e.currentTarget.style.background = 'var(--input-bg)';
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error
            ? 'var(--input-border-error)'
            : 'var(--input-border-focus)';
          e.currentTarget.style.boxShadow = error
            ? '0 0 0 3px var(--input-error-shadow)'
            : '0 0 0 3px var(--input-focus-shadow)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = inputBorder;
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      >
        {placeholder && (
          <option
            value=""
            disabled
            style={{
              background: 'var(--input-option-bg)',
              color: 'var(--input-option-text)',
            }}
          >
            {placeholder}
          </option>
        )}
        {normalizedOptions.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{
              background: 'var(--input-option-bg)',
              color: 'var(--input-option-text)',
            }}
          >
            {opt.label}
          </option>
        ))}
      </select>

      {(error || hint) && (
        <span
          style={{
            fontSize: '12px',
            color: error ? 'var(--input-error-text)' : 'var(--input-hint)',
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