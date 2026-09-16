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
  size = 'md',
  style = {},
  inputStyle = {},
  ...props
}) {
  const sizes = {
    sm: { height: '36px', padding: '0 12px', fontSize: '13px' },
    md: { height: '42px', padding: '0 14px', fontSize: '14px' },
    lg: { height: '50px', padding: '0 16px', fontSize: '15px' },
  };

  const s = sizes[size] || sizes.md;

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

  const inputBaseStyle = {
    width: '100%',
    height: s.height,
    padding: s.padding,
    paddingLeft: icon ? '40px' : s.padding,
    fontSize: s.fontSize,
    fontFamily: 'inherit',
    color: 'var(--input-text)',
    background: 'var(--input-bg)',
    border: `1px solid ${inputBorder}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    opacity: disabled ? 0.6 : 1,
    ...inputStyle,
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
            transition: 'color 0.2s ease',
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

      <div style={{ position: 'relative' }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
              color: 'var(--input-icon-color)',
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
            if (!error) e.currentTarget.style.borderColor = 'var(--input-border-hover)';
          }}
          onMouseLeave={(e) => {
            if (disabled) return;
            if (!error) e.currentTarget.style.borderColor = 'var(--input-border)';
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error
              ? 'var(--input-border-error)'
              : 'var(--input-border-focus)';
            e.currentTarget.style.background = 'var(--input-bg-focus)';
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 3px var(--input-error-shadow)'
              : '0 0 0 3px var(--input-focus-shadow)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = inputBorder;
            e.currentTarget.style.background = 'var(--input-bg)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          {...props}
        />
      </div>

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