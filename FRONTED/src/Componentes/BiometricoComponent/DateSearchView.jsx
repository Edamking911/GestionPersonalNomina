// src/Componentes/BiometricoComponent/DateSearchView.jsx
export default function DateSearchView({
  fechaUnica,
  setFechaUnica,
  marcajesFechaUnica,
  onSearch,
  formatearHora
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#2d3748' }}>
        Consultar Marcajes por Día Exacto
      </h3>

      <form onSubmit={onSearch} style={{ display: 'flex', gap: '12px', margin: '15px 0 25px 0', alignItems: 'center' }}>
        <input
          type="date"
          value={fechaUnica}
          onChange={(e) => setFechaUnica(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
        />
        <button
          type="submit"
          style={{ padding: '10px 20px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
        >
          🔍 Consultar Día
        </button>
      </form>

      {marcajesFechaUnica && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', background: '#f7fafc', padding: '12px 18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>
                Resultados para la fecha:
              </span>
              <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#2b6cb0' }}>
                {marcajesFechaUnica.fecha}
              </p>
            </div>
            <div style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
              Total Marcajes: {marcajesFechaUnica.totalMarcajes}
            </div>
          </div>

          {marcajesFechaUnica.marcajes && marcajesFechaUnica.marcajes.length > 0 ? (
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#4a5568', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Cédula ID</th>
                    <th style={{ padding: '12px 16px' }}>Nombre Empleado</th>
                    <th style={{ padding: '12px 16px' }}>Hora</th>
                    <th style={{ padding: '12px 16px' }}>Método</th>
                    <th style={{ padding: '12px 16px' }}>Dispositivo</th>
                  </tr>
                </thead>
                <tbody>
                  {marcajesFechaUnica.marcajes.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #edf2f7', fontSize: '14px' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#2b6cb0' }}>{m.employeeId}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '500', color: '#2d3748' }}>{m.nombre}</td>
                      <td style={{ padding: '12px 16px', color: '#38a169', fontWeight: '600' }}>
                        {formatearHora(m.timestamp, m.hora)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#edf2f7', color: '#4a5568', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                          {m.metodoMarcaje}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#718096', fontSize: '13px' }}>{m.dispositivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px' }}>No hay marcajes registrados para esta fecha.</p>
          )}
        </div>
      )}
    </div>
  );
}