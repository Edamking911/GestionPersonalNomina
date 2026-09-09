// src/Componentes/BiometricoComponent/ActionBar.jsx
export default function ActionBar({ 
  onSyncToday, 
  onSyncYesterday, 
  onCleanDuplicates, 
  onClearCache, 
  onRefresh, 
  archivoExcel, 
  setArchivoExcel, 
  onImportExcel 
}) {
  return (
    <div style={{ background: '#fff', padding: '15px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap' }}>
      <button onClick={onSyncToday} style={{ padding: '9px 14px', cursor: 'pointer', background: '#38a169', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px' }}>
        🔄 Sincronizar Hoy
      </button>
      <button onClick={onSyncYesterday} style={{ padding: '9px 14px', cursor: 'pointer', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px' }}>
        📅 Sincronizar Ayer
      </button>
      <button onClick={onCleanDuplicates} style={{ padding: '9px 14px', cursor: 'pointer', background: '#dd6b20', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px' }}>
        🧹 Limpiar Duplicados
      </button>
      <button onClick={onClearCache} style={{ padding: '9px 14px', cursor: 'pointer', background: '#805ad5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px' }}>
        ⚡ Limpiar Caché
      </button>
      <button onClick={onRefresh} style={{ padding: '9px 14px', cursor: 'pointer', background: '#718096', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px' }}>
        📥 Refrescar Datos
      </button>

      <form onSubmit={onImportExcel} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
        <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => setArchivoExcel(e.target.files[0])} style={{ fontSize: '12px', color: '#4a5568' }} />
        <button type="submit" style={{ padding: '9px 16px', cursor: 'pointer', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px' }}>
          📂 Importar Excel
        </button>
      </form>
    </div>
  );
}