// src/Componentes/BiometricoComponent/EmployeeSearchView.jsx
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Badge from '../UI/Badge';

export default function EmployeeSearchView({
  cedulaBusqueda,
  setCedulaBusqueda,
  eventosEmpleado,
  onSearch,
  formatearHora,
}) {
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
              background: '#f7fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  color: '#718096',
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
                  color: '#2b6cb0',
                }}
              >
                {cedulaBusqueda}
              </p>
            </div>
            <Badge variant="success" size="lg">
              Total Registros: {eventosEmpleado.totalDias || eventosEmpleado.totalRecords || 0}
            </Badge>
          </div>

          {eventosEmpleado.events && eventosEmpleado.events.length > 0 ? (
            <div
              style={{
                overflowX: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Nombre', 'Fecha y Hora Local', 'Método de Marcaje'].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: '12px 16px',
                          fontSize: '11px',
                          color: '#4a5568',
                          textTransform: 'uppercase',
                          fontWeight: '700',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eventosEmpleado.events.map((ev, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #edf2f7',
                        background: idx % 2 === 0 ? '#fff' : '#fafbfc',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: '500', color: '#2d3748' }}>
                        {ev.nombre}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#38a169', fontWeight: '600' }}>
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
          ) : (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px' }}>
              No hay eventos detallados para esta cédula.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}