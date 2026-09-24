// src/Componentes/BiometricoComponent/DateSearchView.jsx
import Card from '../../Componentes/UI/Card';
import Button from '../../Componentes/UI/Button';
import Badge from '../../Componentes/UI/Badge';
import Pagination from '../../Componentes/UI/Paginacion';
import { usePagination } from '../../Hoosk/PaginacionHoosk';

export default function DateSearchView({
  fechaUnica,
  setFechaUnica,
  marcajesFechaUnica,
  onSearch,
  formatearHora,
}) {
  // 📄 Paginación de los marcajes
  const pagination = usePagination(marcajesFechaUnica?.marcajes || [], {
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 250, 500],
    resetKeys: [marcajesFechaUnica?.fecha, marcajesFechaUnica?.totalMarcajes],
  });

  const thStyle = {
    padding: '12px 16px',
    fontSize: '11px',
    color: 'var(--table-header-text)',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: '0.5px',
  };

  return (
    <Card
      title="Consultar Marcajes por Día Exacto"
      subtitle="Selecciona una fecha para ver todos los marcajes de ese día"
      icon="📅"
      variant="info"
    >
      <form
        onSubmit={onSearch}
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '600',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            Fecha
          </label>
          <input
            type="date"
            value={fechaUnica}
            onChange={(e) => setFechaUnica(e.target.value)}
            style={{
              padding: '0 14px',
              height: '42px',
              border: '1px solid var(--input-border)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--input-text)',
              background: 'var(--input-bg)',
              outline: 'none',
              fontFamily: 'inherit',
              minWidth: '180px',
            }}
          />
        </div>

        <Button variant="primary" size="lg" type="submit" iconLeft="🔍">
          Consultar Día
        </Button>
      </form>

      {marcajesFechaUnica && (
        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              padding: '12px 18px',
              background: 'var(--bg-hover)',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                }}
              >
                Resultados para la fecha:
              </span>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--primary)',
                }}
              >
                {marcajesFechaUnica.fecha}
              </p>
            </div>
            <Badge variant="success" size="lg">
              Total Marcajes: {marcajesFechaUnica.totalMarcajes}
            </Badge>
          </div>

          {marcajesFechaUnica.marcajes && marcajesFechaUnica.marcajes.length > 0 ? (
            <div
              style={{
                border: '1px solid var(--table-row-border)',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    background: 'var(--table-row-bg)',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: 'var(--table-header-bg)',
                        borderBottom: '2px solid var(--table-header-border)',
                      }}
                    >
                      {['Cédula ID', 'Nombre Empleado', 'Fecha y Hora Exacta', 'Método', 'Dispositivo'].map((h, i) => (
                        <th key={i} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.paginatedItems.map((m, idx) => (
                      <tr
                        key={`${m.employeeId}-${idx}`}
                        style={{
                          borderBottom: '1px solid var(--table-row-border)',
                          background:
                            idx % 2 === 0
                              ? 'var(--table-row-bg)'
                              : 'var(--table-row-bg-alt)',
                        }}
                      >
                        <td
                          style={{
                            padding: '12px 16px',
                            fontWeight: '600',
                            color: 'var(--primary)',
                          }}
                        >
                          {m.employeeId}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            fontWeight: '500',
                            color: 'var(--table-row-text)',
                          }}
                        >
                          {m.nombre}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: 'var(--success)',
                            fontWeight: '600',
                          }}
                        >
                          {formatearHora(m.timestamp, m.hora)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant="light" size="sm">
                            {m.metodoMarcaje}
                          </Badge>
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: 'var(--text-muted)',
                            fontSize: '12px',
                          }}
                        >
                          {m.dispositivo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination {...pagination} />
            </div>
          ) : (
            <p
              style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                padding: '20px',
              }}
            >
              No hay marcajes registrados para esta fecha.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}