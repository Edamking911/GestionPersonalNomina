export default function StatsCards({ usuariosActivos, usuariosMarcados, usuariosPendientes, loading, isOnline }) {
  const totalUsuarios = Array.isArray(usuariosActivos) ? usuariosActivos.length : 0;
  const totalMarcados = Array.isArray(usuariosMarcados) ? usuariosMarcados.length : 0;
  const totalPendientes = Array.isArray(usuariosPendientes) ? usuariosPendientes.length : 0;

  return (
    <div style={{ display: 'flex', gap: '15px', margin: '20px 0', flexWrap: 'wrap' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '18px 22px', borderRadius: '10px', minWidth: '160px' }}>
        <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Total Usuarios</span>
        <p style={{ margin: '8px 0 0 0', fontSize: '26px', fontWeight: 'bold', color: '#3182ce' }}>{totalUsuarios}</p>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '18px 22px', borderRadius: '10px', minWidth: '160px' }}>
        <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Han Marcado Hoy</span>
        <p style={{ margin: '8px 0 0 0', fontSize: '26px', fontWeight: 'bold', color: '#38a169' }}>{totalMarcados}</p>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '18px 22px', borderRadius: '10px', minWidth: '160px' }}>
        <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Pendientes</span>
        <p style={{ margin: '8px 0 0 0', fontSize: '26px', fontWeight: 'bold', color: '#dd6b20' }}>{totalPendientes}</p>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '18px 22px', borderRadius: '10px', minWidth: '160px' }}>
        <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Estado Sistema</span>
        <p style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: loading ? '#d69e2e' : (isOnline ? '#38a169' : '#e53e3e'), display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: loading ? '#d69e2e' : (isOnline ? '#38a169' : '#e53e3e'), display: 'inline-block' }}></span>
          {loading ? 'Cargando...' : (isOnline ? 'Online' : 'Offline')}
        </p>
      </div>
    </div>
  );
}