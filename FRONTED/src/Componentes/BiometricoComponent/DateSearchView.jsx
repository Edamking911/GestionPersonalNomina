// src/Componentes/BiometricoComponent/DateSearchView.jsx
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';

export default function DateSearchView({
  fechaUnica,
  setFechaUnica,
  marcajesFechaUnica,
  onSearch,
  formatearHora,
}) {
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
              color: '#4a5568',
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
              border: '1px solid #cbd5e0',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#2d3748',
              background: '#fff',
              colorScheme: 'light',
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
                Resultados para la fecha:
              </span>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#2b6cb0',
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
                overflowX: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Cédula ID', 'Nombre Empleado', 'Fecha y Hora Exacta', 'Método', 'Dispositivo'].map((h, i) => (
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
                  {marcajesFechaUnica.marcajes.map((m, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #edf2f7',
                        background: idx % 2 === 0 ? '#fff' : '#fafbfc',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#2b6cb0' }}>
                        {m.employeeId}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '500', color: '#2d3748' }}>
                        {m.nombre}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#38a169', fontWeight: '600' }}>
                        {formatearHora(m.timestamp, m.hora)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant="light" size="sm">
                          {m.metodoMarcaje}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#718096', fontSize: '12px' }}>
                        {m.dispositivo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px' }}>
              No hay marcajes registrados para esta fecha.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}