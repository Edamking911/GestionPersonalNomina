// src/Componentes/BiometricoComponent/MarcajesHistory.jsx
export default function MarcajesHistory({ registrosFecha }) {
  if (!registrosFecha || !registrosFecha.registrosPorFecha) {
    return (
      <div style={{ background: '#fff', padding: '40px', textAlign: 'center', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#a0aec0' }}>
        Cargando historial de marcajes...
      </div>
    );
  }

  const formatearFecha = (fechaStr) => {
    try {
      if (fechaStr.includes('de ') && fechaStr.includes(',')) return fechaStr;
      const partes = fechaStr.split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const anio = parseInt(partes[2], 10);
        const fecha = new Date(anio, mes, dia);
        return fecha.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return fechaStr;
    } catch {
      return fechaStr;
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '16px', color: '#2d3748', marginBottom: '15px' }}>
        Historial Cronológico de Marcajes
      </h3>

      {registrosFecha.registrosPorFecha.map((item, idx) => (
        <div
          key={idx}
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              borderBottom: '1px solid #edf2f7',
              paddingBottom: '10px'
            }}
          >
            <h4 style={{ margin: 0, color: '#2b6cb0', fontSize: '16px' }}>
              📅 {formatearFecha(item.fecha)}
            </h4>
            <span
              style={{
                background: '#ebf8ff',
                color: '#2b6cb0',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {item.totalMarcajes} marcajes registrados
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#718096', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '8px 12px' }}>Cédula</th>
                <th style={{ padding: '8px 12px' }}>Empleado</th>
                <th style={{ padding: '8px 12px' }}>Hora de Marcaje</th>
              </tr>
            </thead>
            <tbody>
              {item.marcajes.map((m, mIdx) => {
                // ✅ SIMPLEMENTE MOSTRAR horaLocal (ya viene normalizada del backend)
                const horaMostrada = m.horaLocal || 'N/A';
                return (
                  <tr key={mIdx} style={{ borderBottom: '1px solid #f7fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600' }}>
                      {m.empleadoId || m.employeeId}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {m.nombre || m.name}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#38a169', fontWeight: '600' }}>
                      {horaMostrada}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}