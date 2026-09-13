// src/Componentes/ReglasComponent/ImportarExcel.jsx
import { useState, useRef } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';

export default function ImportarExcel({
  onDescargarPlantilla,
  onValidar,
  onImportar,
  previewExcel,
  resultadoImportacion,
  onLimpiarPreview,
  backups,
  onListarBackups,
  onRestaurarBackup,
  onRestaurarUltimo,
}) {
  const hoy = new Date();
  const mesActual = String(hoy.getMonth() + 1).padStart(2, '0');
  const anioActual = hoy.getFullYear();

  const [mesSeleccionado, setMesSeleccionado] = useState(mesActual);
  const [anioSeleccionado, setAnioSeleccionado] = useState(String(anioActual));
  const [archivo, setArchivo] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loadingValidar, setLoadingValidar] = useState(false);
  const [loadingImportar, setLoadingImportar] = useState(false);
  const fileInputRef = useRef(null);

  const selectStyle = {
    padding: '0 14px',
    height: '42px',
    border: '1px solid #cbd5e0',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
    color: '#2d3748',
    fontFamily: 'inherit',
    colorScheme: 'light',
  };

  const handleDescargarPlantilla = async () => {
    const mesFormateado = `${anioSeleccionado}-${mesSeleccionado}`;
    try {
      await onDescargarPlantilla(mesFormateado);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setArchivo(file);
      } else {
        alert('Solo se aceptan archivos .xlsx o .xls');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setArchivo(e.target.files[0]);
  };

  const handleValidar = async () => {
    if (!archivo) {
      alert('Selecciona un archivo primero.');
      return;
    }
    setLoadingValidar(true);
    try {
      await onValidar(archivo);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingValidar(false);
    }
  };

  const handleImportar = async () => {
    if (!archivo) return alert('Selecciona un archivo primero.');
    if (!previewExcel) return alert('Primero valida el archivo.');
    if (previewExcel.filasConError > 0) return alert('Corrige los errores antes de importar.');
    if (!window.confirm('¿Aplicar los cambios del Excel? Se creará un backup automático.')) return;

    setLoadingImportar(true);
    try {
      await onImportar(archivo);
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingImportar(false);
    }
  };

  const handleReset = () => {
    setArchivo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onLimpiarPreview();
  };

  const handleRestaurarUltimo = async () => {
    if (!window.confirm('⚠️ ¿Restaurar el backup MÁS RECIENTE? Esto sobrescribirá las asignaciones actuales.')) return;
    try {
      await onRestaurarUltimo();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRestaurarBackup = async (nombre) => {
    if (!window.confirm(`¿Restaurar el backup "${nombre}"?`)) return;
    try {
      await onRestaurarBackup(nombre);
    } catch (error) {
      console.error(error);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ============ 1. DESCARGAR PLANTILLA ============ */}
      <Card title="1. Descargar Plantilla Mensual" subtitle="Descarga el Excel con todos los empleados" icon="📥" variant="info">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#4a5568' }}>Mes</label>
            <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} style={{ ...selectStyle, minWidth: '150px' }}>
              <option value="01">Enero</option>
              <option value="02">Febrero</option>
              <option value="03">Marzo</option>
              <option value="04">Abril</option>
              <option value="05">Mayo</option>
              <option value="06">Junio</option>
              <option value="07">Julio</option>
              <option value="08">Agosto</option>
              <option value="09">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#4a5568' }}>Año</label>
            <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(e.target.value)} style={{ ...selectStyle, minWidth: '110px' }}>
              {[anioActual - 1, anioActual, anioActual + 1].map((a) => (
                <option key={a} value={String(a)}>{a}</option>
              ))}
            </select>
          </div>
          <Button variant="primary" size="md" onClick={handleDescargarPlantilla} iconLeft="📥">
            Descargar Plantilla
          </Button>
        </div>
      </Card>

      {/* ============ 2. SUBIR EXCEL ============ */}
      <Card title="2. Subir Excel Editado" subtitle="Arrastra el archivo o haz clic para seleccionarlo" icon="📤" variant="warning">
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? '#3182ce' : '#cbd5e0'}`,
            background: dragActive ? '#ebf8ff' : '#f7fafc',
            borderRadius: '10px',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>📄</div>
          <p style={{ margin: 0, fontWeight: '600', color: '#2d3748' }}>
            {archivo ? archivo.name : 'Arrastra tu Excel aquí o haz clic para buscar'}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#718096' }}>
            {archivo ? formatSize(archivo.size) : 'Formatos: .xlsx, .xls'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <Button variant="info" size="md" onClick={handleValidar} disabled={!archivo} loading={loadingValidar} iconLeft="🔍">
            {loadingValidar ? 'Validando...' : 'Validar Excel'}
          </Button>
          {archivo && (
            <Button variant="light" size="md" onClick={handleReset} iconLeft="🗑️">
              Descartar
            </Button>
          )}
        </div>
      </Card>

      {/* ============ 3. PREVIEW ============ */}
      {previewExcel && (
        <Card title="3. Preview de Cambios" subtitle="Revisa los cambios antes de aplicar" icon="🔍" variant="info">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ background: '#ebf8ff', padding: '12px 18px', borderRadius: '10px', flex: 1, minWidth: '140px' }}>
              <span style={{ fontSize: '11px', color: '#2b6cb0', textTransform: 'uppercase', fontWeight: '600' }}>Total Filas</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#2b6cb0' }}>{previewExcel.totalFilas}</p>
            </div>
            <div style={{ background: '#f0fff4', padding: '12px 18px', borderRadius: '10px', flex: 1, minWidth: '140px' }}>
              <span style={{ fontSize: '11px', color: '#22543d', textTransform: 'uppercase', fontWeight: '600' }}>Válidas</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#22543d' }}>{previewExcel.filasValidas}</p>
            </div>
            <div style={{ background: previewExcel.filasConError > 0 ? '#fed7d7' : '#f0fff4', padding: '12px 18px', borderRadius: '10px', flex: 1, minWidth: '140px' }}>
              <span style={{ fontSize: '11px', color: previewExcel.filasConError > 0 ? '#9b2c2c' : '#22543d', textTransform: 'uppercase', fontWeight: '600' }}>Con Error</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: previewExcel.filasConError > 0 ? '#9b2c2c' : '#22543d' }}>{previewExcel.filasConError}</p>
            </div>
          </div>

          {previewExcel.errores && previewExcel.errores.length > 0 && (
            <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#9b2c2c' }}>⚠️ Errores encontrados</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#9b2c2c' }}>
                {previewExcel.errores.map((err, i) => (
                  <li key={i}><strong>Fila {err.fila}:</strong> {err.error}</li>
                ))}
              </ul>
            </div>
          )}

          {previewExcel.preview && previewExcel.preview.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Fila', 'Cédula', 'Nombre', 'Cambios'].map((h, i) => (
                      <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#4a5568', textTransform: 'uppercase', fontWeight: '700' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewExcel.preview.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #edf2f7', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '10px 12px' }}>{p.fila}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '600', color: '#2b6cb0' }}>{p.employeeId}</td>
                      <td style={{ padding: '10px 12px' }}>{p.nombre}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {p.cambios.map((c, j) => (
                          <div key={j} style={{ fontSize: '12px', color: c === 'Sin cambios' ? '#a0aec0' : '#2d3748' }}>
                            {c === 'Sin cambios' ? c : `• ${c}`}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant={previewExcel.filasConError > 0 ? 'light' : 'success'}
              size="lg"
              onClick={handleImportar}
              disabled={loadingImportar || previewExcel.filasConError > 0}
              loading={loadingImportar}
              iconLeft="✅"
            >
              {loadingImportar ? 'Aplicando...' : 'Aplicar Cambios'}
            </Button>
          </div>
        </Card>
      )}

      {/* ============ 4. RESULTADO ============ */}
      {resultadoImportacion && (
        <Card variant="success" title="Importación Exitosa" icon="✅">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', padding: '12px 18px', borderRadius: '10px', flex: 1, minWidth: '140px' }}>
              <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Horarios Actualizados</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#38a169' }}>{resultadoImportacion.horariosActualizados || 0}</p>
            </div>
            <div style={{ background: '#fff', padding: '12px 18px', borderRadius: '10px', flex: 1, minWidth: '140px' }}>
              <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Días Libres Actualizados</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#38a169' }}>{resultadoImportacion.diasLibresActualizados || 0}</p>
            </div>
            <div style={{ background: '#fff', padding: '12px 18px', borderRadius: '10px', flex: 1, minWidth: '140px' }}>
              <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Días Libres Eliminados</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: '#dd6b20' }}>{resultadoImportacion.diasLibresEliminados || 0}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ============ 5. BACKUPS ============ */}
      <Card title="Historial de Backups" subtitle="Restaure versiones anteriores si algo sale mal" icon="📋" variant="default">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <Button variant="primary" size="sm" onClick={onListarBackups} iconLeft="🔄">
            Cargar Backups
          </Button>
          <Button variant="danger" size="sm" onClick={handleRestaurarUltimo} iconLeft="⚠️">
            Restaurar Último
          </Button>
        </div>

        {backups && backups.length > 0 ? (
          <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Archivo', 'Fecha', 'Tamaño', 'Acciones'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 12px', textAlign: i === 3 ? 'right' : 'left', fontSize: '11px', color: '#4a5568', textTransform: 'uppercase', fontWeight: '700' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {backups.map((b, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #edf2f7', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: 'monospace' }}>{b.nombre}</td>
                    <td style={{ padding: '10px 12px' }}>{new Date(b.fecha).toLocaleString('es-VE')}</td>
                    <td style={{ padding: '10px 12px' }}>{b.tamanoKB} KB</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <Button variant="warning" size="sm" onClick={() => handleRestaurarBackup(b.nombre)} iconLeft="🔄">
                        Restaurar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#a0aec0', textAlign: 'center', padding: '20px' }}>
            Haz clic en "Cargar Backups" para ver el historial.
          </p>
        )}
      </Card>
    </div>
  );
}