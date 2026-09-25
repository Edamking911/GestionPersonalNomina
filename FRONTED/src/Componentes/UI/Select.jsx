import { useEffect, useRef, useState } from 'react';

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
  ...props
}) {
  const sizes = {
    sm: { height: '36px', padding: '0 12px', fontSize: '13px' },
    md: { height: '42px', padding: '0 14px', fontSize: '14px' },
    lg: { height: '50px', padding: '0 16px', fontSize: '15px' },
  };

  const s = sizes[size] || sizes.md;

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt,
  );

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = normalizedOptions.find((o) => o.value === value);
  const displayText = selectedOption?.label || placeholder;

  // 🎯 Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // 🎯 Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open]);

  // 🎯 Scroll al item seleccionado cuando se abre
  useEffect(() => {
    if (open && listRef.current && selectedOption) {
      const el = listRef.current.querySelector(
        `[data-value="${selectedOption.value}"]`,
      );
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, selectedOption]);

  const inputBorder = error
    ? 'var(--input-border-error)'
    : 'var(--input-border)';

  const handleSelect = (opt) => {
    onChange({ target: { value: opt.value } });
    setOpen(false);
  };

  const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: fullWidth ? '100%' : 'auto',
    ...style,
  };

  const triggerStyle = {
    width: '100%',
    height: s.height,
    padding: s.padding,
    paddingRight: '40px',
    fontSize: s.fontSize,
    fontFamily: 'inherit',
    color: selectedOption ? 'var(--input-text)' : 'var(--input-hint)',
    background: 'var(--input-bg)',
    border: `1px solid ${open ? 'var(--input-border-focus)' : inputBorder}`,
    borderRadius: '8px',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    opacity: disabled ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left',
    position: 'relative',
    boxShadow: open ? '0 0 0 3px var(--input-focus-shadow)' : 'none',
  };

  return (
    <div style={wrapperStyle} ref={wrapperRef}>
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
            <span
              style={{ color: 'var(--input-error-text)', marginLeft: '4px' }}
            >
              *
            </span>
          )}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {/* 🎯 Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          style={triggerStyle}
        >
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayText}
          </span>

          {/* Flecha */}
          <span
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: `translateY(-50%) rotate(${open ? '180deg' : '0deg'})`,
              transition: 'transform 0.2s ease',
              color: 'var(--text-muted)',
              fontSize: '12px',
              pointerEvents: 'none',
            }}
          >
            ▼
          </span>
        </button>

        {/* 🎯 Dropdown custom */}
        {open && (
          <div
            ref={listRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 9999,
              background: 'var(--input-option-bg, var(--bg-card))',
              border: '1px solid var(--input-border)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '240px',
              overflowY: 'auto',
              padding: '4px',
              animation: 'selectFadeIn 0.15s ease-out',
            }}
          >
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-value={opt.value}
                  onClick={() => handleSelect(opt)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontSize: s.fontSize,
                    fontFamily: 'inherit',
                    color: isSelected
                      ? 'var(--primary)'
                      : 'var(--input-option-text, var(--text-primary))',
                    background: isSelected
                      ? 'var(--primary-soft)'
                      : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: isSelected ? '700' : '500',
                    transition: 'background 0.15s ease',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {isSelected ? '✓ ' : ''}
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
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

      <style>{`
        @keyframes selectFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
