// src/Componentes/BiometricoComponent/UserTable.jsx
export default function UserTable({ title, users, emptyMessage, bgHeader, badgeColor, badgeTextColor, onDelete, showStatus = false }) {
  const usersList = Array.isArray(users) ? users : [];

  return (
    <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: bgHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#2d3748' }}>{title}</h3>
        <span style={{ background: badgeColor, color: badgeTextColor, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
          {usersList.length} {usersList.length === 1 ? 'Registrado' : 'Registrados'}
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#4a5568', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <th style={{ padding: '12px 20px' }}>Cédula / ID</th>
            <th style={{ padding: '12px 20px' }}>Nombre</th>
            <th style={{ padding: '12px 20px' }}>Apellido</th>
            {showStatus && <th style={{ padding: '12px 20px' }}>Estado</th>}
            <th style={{ padding: '12px 20px', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usersList.length > 0 ? (
            usersList.map((user, index) => {
              const cedulaNum = user.employeeNo || user.cedula;
              const partesNombre = (user.name || user.nombre || '').trim().split(' ');
              const primerNombre = partesNombre[0] || '';
              const apellidoRestante = partesNombre.slice(1).join(' ') || 'N/A';
              const activo = user.activo !== undefined ? user.activo : true; // Por si no viene

              return (
                <tr key={index} style={{ borderBottom: '1px solid #edf2f7', fontSize: '14px', background: index % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '12px 20px', fontWeight: '600', color: '#2b6cb0' }}>{cedulaNum}</td>
                  <td style={{ padding: '12px 20px', color: '#2d3748' }}>{primerNombre}</td>
                  <td style={{ padding: '12px 20px', color: '#4a5568' }}>{user.lastName || apellidoRestante}</td>
                  {showStatus && (
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{
                        background: activo ? '#c6f6d5' : '#fed7d7',
                        color: activo ? '#22543d' : '#9b2c2c',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  )}
                  <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => onDelete(cedulaNum)}
                      style={{ padding: '6px 12px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >
                      {activo ? '🗑️ Desactivar' : '🔁 Activar'} {/* Opcional: cambiar texto según estado */}
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={showStatus ? 5 : 4} style={{ textAlign: 'center', padding: '30px', color: '#a0aec0' }}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}