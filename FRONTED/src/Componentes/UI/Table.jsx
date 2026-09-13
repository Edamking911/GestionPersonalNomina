// src/Componentes/UI/Table.jsx

export default function Table({
  columns = [],
  data = [],
  theme = 'auto',   // 'auto' (usa variables) | 'light' | 'dark' (forzado)
  hoverable = true,
  striped = true,
  size = 'md',
  emptyMessage = 'No hay datos para mostrar',
  emptyIcon = '📭',
  onRowClick = null,
  rowStyle = null,
}) {
  // =========================================================
  // TAMAÑOS
  // =========================================================
  const sizes = {
    sm: { padding: '8px 12px', fontSize: '12px' },
    md: { padding: '12px 16px', fontSize: '13px' },
    lg: { padding: '16px 20px', fontSize: '14px' },
  };

  // =========================================================
  // TEMAS
  // 'auto'  → usa variables CSS (cambia con el tema global)
  // 'light' → fuerza modo claro
  // 'dark'  → fuerza modo oscuro
  // =========================================================
  const themes = {
    auto: {
      headerBg: 'var(--table-header-bg)',
      headerText: 'var(--table-header-text)',
      headerBorder: 'var(--table-header-border)',
      rowBg: 'var(--table-row-bg)',
      rowBgAlt: 'var(--table-row-bg-alt)',
      rowHover: 'var(--table-row-hover)',
      rowBorder: 'var(--table-row-border)',
      rowText: 'var(--table-row-text)',
      emptyText: 'var(--table-empty-text)',
      emptyBg: 'var(--table-empty-bg)',
    },
    light: {
      headerBg: '#f8fafc',
      headerText: '#4a5568',
      headerBorder: '#e2e8f0',
      rowBg: '#fff',
      rowBgAlt: '#fafbfc',
      rowHover: '#f0f7ff',
      rowBorder: '#edf2f7',
      rowText: '#2d3748',
      emptyText: '#a0aec0',
      emptyBg: '#fff',
    },
    dark: {
      headerBg: '#1f2937',
      headerText: '#cbd5e0',
      headerBorder: '#374151',
      rowBg: '#2d3748',
      rowBgAlt: '#283141',
      rowHover: '#374151',
      rowBorder: '#374151',
      rowText: '#e2e8f0',
      emptyText: '#718096',
      emptyBg: '#2d3748',
    },
  };

  const s = sizes[size] || sizes.md;
  const t = themes[theme] || themes.auto;

  return (
    <div
      style={{
        overflowX: 'auto',
        borderRadius: '10px',
        border: `1px solid ${t.rowBorder}`,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr
            style={{
              background: t.headerBg,
              borderBottom: `2px solid ${t.headerBorder}`,
            }}
          >
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  padding: s.padding,
                  fontSize: '11px',
                  color: t.headerText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '700',
                  textAlign: col.align || 'left',
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, idx) => {
              const isEven = idx % 2 === 0;
              const customRowStyle = rowStyle ? rowStyle(row, idx) : {};

              return (
                <tr
                  key={idx}
                  onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
                  style={{
                    background: striped ? (isEven ? t.rowBg : t.rowBgAlt) : t.rowBg,
                    borderBottom: `1px solid ${t.rowBorder}`,
                    fontSize: s.fontSize,
                    color: t.rowText,
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background 0.15s ease',
                    ...customRowStyle,
                  }}
                  onMouseEnter={(e) => {
                    if (!hoverable) return;
                    e.currentTarget.style.background = t.rowHover;
                  }}
                  onMouseLeave={(e) => {
                    if (!hoverable) return;
                    e.currentTarget.style.background = striped
                      ? isEven
                        ? t.rowBg
                        : t.rowBgAlt
                      : t.rowBg;
                  }}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      style={{
                        padding: s.padding,
                        textAlign: col.align || 'left',
                        fontWeight: col.bold ? '600' : '400',
                        color: col.color || t.rowText,
                        whiteSpace: col.nowrap ? 'nowrap' : 'normal',
                      }}
                    >
                      {col.render ? col.render(row, idx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: t.emptyBg,
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>{emptyIcon}</div>
                <p style={{ margin: 0, color: t.emptyText, fontSize: '13px' }}>
                  {emptyMessage}
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}