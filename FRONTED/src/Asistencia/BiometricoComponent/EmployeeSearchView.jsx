// src/Componentes/BiometricoComponent/EmployeeSearchView.jsx
import Card from '../../Componentes/UI/Card';
import Button from '../../Componentes/UI/Button';
import Input from '../../Componentes/UI/Input';
import Badge from '../../Componentes/UI/Badge';
import Pagination from '../../Componentes/UI/Paginacion';
import { usePagination } from '../../Hoosk/PaginacionHoosk';

export default function EmployeeSearchView({
  cedulaBusqueda,
  setCedulaBusqueda,
  eventosEmpleado,
  onSearch,
  formatearHora,
}) {
  // 📄 Paginación de eventos
  const pagination = usePagination(eventosEmpleado?.events || [], {
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 250, 500],
    resetKeys: [cedulaBusqueda, eventosEmpleado?.totalDias],
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
      title="Consultar Marcajes por Cédula de Empleado"
      subtitle="Busca un empleado por su cédula para ver todos sus marcajes"
      icon="🔍"
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
        <div style={{ flex: '1 1 300px' }}>
          <Input
            label="Cédula del Empleado"
            placeholder="Cedula"
            value={cedulaBusqueda}
            onChange={(e) => setCedulaBusqueda(e.target.value.replace(/\D/g, ''))}
            icon="👤"
            required
          />
        </div>

        <Button variant="primary" size="lg" type="submit" iconLeft="🔍">
          Buscar Empleado
        </Button>
      </form>

      {eventosEmpleado && (
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
                Cédula consultada:
              </span>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--primary)',
                }}
              >
                {cedulaBusqueda}
              </p>
            </div>
            <Badge variant="success" size="lg">
              Total Registros:{' '}
              {eventosEmpleado.totalDias || eventosEmpleado.totalRecords || 0}
            </Badge>
          </div>

          {eventosEmpleado.events && eventosEmpleado.events.length > 0 ? (
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
                      {['Nombre', 'Fecha y Hora Local', 'Método de Marcaje'].map((h, i) => (
                        <th key={i} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.paginatedItems.map((ev, idx) => (
                      <tr
                        key={`${ev.timestamp}-${idx}`}
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
                            fontWeight: '500',
                            color: 'var(--table-row-text)',
                          }}
                        >
                          {ev.nombre}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: 'var(--success)',
                            fontWeight: '600',
                          }}
                        >
                          {formatearHora(ev.timestamp, ev.horaLocal || ev.hora)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant="light" size="sm">
                            {ev.metodoMarcaje}
                          </Badge>
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
              No hay eventos detallados para esta cédula.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}