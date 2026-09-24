// src/GestionPersonal/Componentes/ImportarEmpleadosExcelModal.jsx
import { useState, useRef } from 'react';
import Modal from '../../Componentes/UI/Modal';
import Button from '../../Componentes/UI/Button';
import Badge from '../../Componentes/UI/Badge';

export default function ImportarEmpleadosExcelModal({
  isOpen,
  onClose,
  onDescargarPlantilla,
  onValidar,
  onImportar,
  previewExcel,
  resultadoImportacion,
  onLimpiarPreview,
}) {
  const [archivo, setArchivo] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loadingValidar, setLoadingValidar] = useState(false);
  const [loadingImportar, setLoadingImportar] = useState(false);
  const fileInputRef = useRef(null);

  // 🔒 ¿Hay errores que bloqueen la importación?
  const tieneErrores =
    previewExcel &&
    previewExcel.filasConError !== undefined &&
    previewExcel.filasConError > 0;

  const yaValido = !!previewExcel;
  const puedeImportar =
    archivo &&
    previewExcel &&
    !tieneErrores &&
    !resultadoImportacion &&
    !loadingImportar;

  // =========================================================
  // HANDLERS
  // =========================================================
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
        onLimpiarPreview();
      } else {
        alert('Solo se aceptan archivos .xlsx o .xls');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
      onLimpiarPreview();
    }
  };

  const handleReset = () => {
    setArchivo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onLimpiarPreview();
  };

  const handleValidar = async () => {
    if (!archivo) return alert('Selecciona un archivo primero.');
    setLoadingValidar(true);
    try {
      await onValidar(archivo);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingValidar(false);
    }
  };

  const handleImportar = async () => {
    if (!archivo) return alert('Selecciona un archivo primero.');

    // 🚫 VALIDACIÓN 1: no validado todavía
    if (!previewExcel) {
      window.alert(
        '⚠️ Primero debes validar el Excel.\n\nHaz clic en "🔍 Validar Excel" antes de aplicar los cambios.',
      );
      return;
    }

    // 🚫 VALIDACIÓN 2: hay errores
    if (tieneErrores) {
      window.alert(
        `❌ No se puede importar el Excel.\n\nHay ${previewExcel.filasConError} fila(s) con errores que deben corregirse primero.\n\nRevisa la lista de errores arriba, corrígelos en el archivo Excel y vuelve a subirlo.`,
      );
      return;
    }

    // 🚫 VALIDACIÓN 3: no hay filas válidas
    if (previewExcel.filasValidas === 0) {
      window.alert(
        '⚠️ No hay filas válidas para importar.\n\nEl Excel no contiene empleados que se puedan crear.',
      );
      return;
    }

    // ✅ Confirmar importación
    if (
      !window.confirm(
        `¿Aplicar los cambios?\n\nSe crearán ${previewExcel.filasValidas} empleado(s).`,
      )
    )
      return;

    setLoadingImportar(true);
    try {
      await onImportar(archivo);
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingImportar(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const thStyle = {
    padding: '8px 10px',
    textAlign: 'left',
    fontSize: '10px',
    color: 'var(--table-header-text)',
    textTransform: 'uppercase',
    fontWeight: '700',
  };

  // =========================================================
  // FOOTER
  // =========================================================
  const footer = (
    <>
      <Button variant="ghost" size="md" onClick={onClose}>
        Cerrar
      </Button>
      <Button
        variant="primary"
        size="md"
        onClick={handleValidar}
        disabled={!archivo || loadingValidar || !!resultadoImportacion}
        loading={loadingValidar}
        iconLeft="🔍"
      >
        Validar Excel
      </Button>

      {/* 🔒 BOTÓN APLICAR CON ESTADO DINÁMICO */}
      <Button
        variant={tieneErrores ? 'ghost' : puedeImportar ? 'success' : 'light'}
        size="md"
        onClick={handleImportar}
        disabled={!puedeImportar || loadingImportar}
        loading={loadingImportar}
        iconLeft={
          tieneErrores ? '🔒' : puedeImportar ? '✅' : '🔒'
        }
        title={
          tieneErrores
            ? 'Corrige los errores primero'
            : !previewExcel
              ? 'Primero valida el Excel'
              : puedeImportar
                ? 'Aplicar cambios'
                : 'No disponible'
        }
        style={
          tieneErrores
            ? {
                opacity: 0.6,
                cursor: 'not-allowed',
                border: '1px dashed var(--danger)',
                color: 'var(--danger)',
              }
            : !previewExcel
              ? {
                  opacity: 0.5,
                  cursor: 'not-allowed',
                }
              : {}
        }
      >
        {tieneErrores ? 'Corrige errores' : 'Aplicar cambios'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importar Empleados desde Excel"
      subtitle="Carga masiva de empleados con validación previa"
      icon="📤"
      variant="warning"
      size="lg"
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* ============ 1. DESCARGAR PLANTILLA ============ */}
        <div
          style={{
            background: 'var(--info-soft)',
            border: '1px solid var(--card-info-border)',
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '28px' }}>📥</span>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <p
              style={{
                margin: 0,
                fontWeight: '700',
                color: 'var(--card-info-title)',
                fontSize: '14px',
              }}
            >
              1. Descarga la plantilla
            </p>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '12px',
                color: 'var(--card-info-subtitle)',
              }}
            >
              Contiene todos los campos y la lista de cargos válidos
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onDescargarPlantilla}
            iconLeft="📥"
          >
            Descargar
          </Button>
        </div>

        {/* ============ 2. SUBIR ARCHIVO ============ */}
        <div>
          <p
            style={{
              margin: '0 0 8px 0',
              fontSize: '13px',
              fontWeight: '700',
              color: 'var(--text-primary)',
            }}
          >
            2. Sube el Excel editado
          </p>
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${
                tieneErrores
                  ? 'var(--danger)'
                  : dragActive
                    ? 'var(--primary)'
                    : yaValido
                      ? 'var(--success)'
                      : 'var(--border-color)'
              }`,
              background: tieneErrores
                ? 'var(--card-danger-bg)'
                : dragActive
                  ? 'var(--primary-soft)'
                  : yaValido
                    ? 'var(--card-success-bg)'
                    : 'var(--bg-hover)',
              borderRadius: '10px',
              padding: '30px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '6px' }}>
              {tieneErrores ? '❌' : yaValido ? '✅' : '📄'}
            </div>
            <p
              style={{
                margin: 0,
                fontWeight: '600',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            >
              {archivo
                ? archivo.name
                : 'Arrastra tu Excel aquí o haz clic para buscar'}
            </p>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
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

          {archivo && (
            <div
              style={{
                marginTop: '8px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                iconLeft="🗑️"
              >
                Descartar
              </Button>
            </div>
          )}
        </div>

        {/* ============ 3. PREVIEW ============ */}
        {previewExcel && (
          <div>
            <p
              style={{
                margin: '0 0 8px 0',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-primary)',
              }}
            >
              3. Resultado de la validación
            </p>

            {/* 🚫 BANNER GRANDE DE ERRORES */}
            {tieneErrores && (
              <div
                style={{
                  background: 'var(--card-danger-bg)',
                  border: '2px solid var(--danger)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  marginBottom: '14px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '28px' }}>🚫</span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: '700',
                      color: 'var(--card-danger-title)',
                    }}
                  >
                    No se puede importar este Excel
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '13px',
                      color: 'var(--card-danger-title)',
                      lineHeight: 1.4,
                    }}
                  >
                    Hay <strong>{previewExcel.filasConError}</strong> fila(s)
                    con errores. Corrige el archivo Excel y vuelve a subirlo.
                  </p>
                </div>
              </div>
            )}

            {/* ✅ BANNER DE ÉXITO SI TODO OK */}
            {!tieneErrores && previewExcel.filasValidas > 0 && (
              <div
                style={{
                  background: 'var(--card-success-bg)',
                  border: '2px solid var(--success)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  marginBottom: '14px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '24px' }}>✅</span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: '700',
                      color: 'var(--card-success-title)',
                    }}
                  >
                    Excel válido — listo para importar
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: '12px',
                      color: 'var(--card-success-title)',
                    }}
                  >
                    {previewExcel.filasValidas} empleado(s) se crearán al hacer
                    clic en "Aplicar cambios"
                  </p>
                </div>
              </div>
            )}

            {/* Stats mini */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '12px',
                flexWrap: 'wrap',
              }}
            >
              <StatMini
                label="Total Filas"
                value={previewExcel.totalFilas ?? 0}
                bg="var(--card-info-bg)"
                color="var(--card-info-title)"
              />
              <StatMini
                label="Válidas"
                value={previewExcel.filasValidas ?? 0}
                bg="var(--card-success-bg)"
                color="var(--card-success-title)"
              />
              <StatMini
                label="Con Error"
                value={previewExcel.filasConError ?? 0}
                bg={
                  previewExcel.filasConError > 0
                    ? 'var(--card-danger-bg)'
                    : 'var(--card-success-bg)'
                }
                color={
                  previewExcel.filasConError > 0
                    ? 'var(--card-danger-title)'
                    : 'var(--card-success-title)'
                }
              />
            </div>

            {/* Lista de errores */}
            {previewExcel.errores?.length > 0 && (
              <div
                style={{
                  background: 'var(--card-danger-bg)',
                  border: '1px solid var(--card-danger-border)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}
              >
                <p
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'var(--card-danger-title)',
                  }}
                >
                  ⚠️ Errores encontrados ({previewExcel.errores.length})
                </p>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '18px',
                    fontSize: '12px',
                    color: 'var(--card-danger-title)',
                  }}
                >
                  {previewExcel.errores.slice(0, 30).map((err, i) => (
                    <li key={i}>
                      <strong>Fila {err.fila}:</strong> {err.error}
                    </li>
                  ))}
                  {previewExcel.errores.length > 30 && (
                    <li style={{ fontStyle: 'italic' }}>
                      ...y {previewExcel.errores.length - 30} errores más
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview tabla */}
            {previewExcel.preview?.length > 0 && (
              <div
                style={{
                  maxHeight: '240px',
                  overflowY: 'auto',
                  borderRadius: '8px',
                  border: '1px solid var(--table-row-border)',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    background: 'var(--table-row-bg)',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: 'var(--table-header-bg)',
                        position: 'sticky',
                        top: 0,
                      }}
                    >
                      {[
                        'Fila',
                        'Cédula',
                        'Nombre',
                        'Apellido',
                        'Cargo',
                        'Estado',
                      ].map((h, i) => (
                        <th key={i} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewExcel.preview.slice(0, 50).map((p, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid var(--table-row-border)',
                          background:
                            i % 2 === 0
                              ? 'var(--table-row-bg)'
                              : 'var(--table-row-bg-alt)',
                        }}
                      >
                        <td
                          style={{
                            padding: '6px 10px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {p.fila}
                        </td>
                        <td
                          style={{
                            padding: '6px 10px',
                            fontWeight: '600',
                            color: 'var(--primary)',
                          }}
                        >
                          {p.cedula}
                        </td>
                        <td
                          style={{
                            padding: '6px 10px',
                            color: 'var(--table-row-text)',
                          }}
                        >
                          {p.nombre}
                        </td>
                        <td
                          style={{
                            padding: '6px 10px',
                            color: 'var(--table-row-text)',
                          }}
                        >
                          {p.apellido}
                        </td>
                        <td
                          style={{
                            padding: '6px 10px',
                            color: 'var(--table-row-text)',
                          }}
                        >
                          {p.cargoNombre || '—'}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <Badge
                            variant={
                              p.estado === 'ACTIVO' ? 'success' : 'warning'
                            }
                            size="sm"
                          >
                            {p.estado}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============ 4. RESULTADO ============ */}
        {resultadoImportacion && (
          <div
            style={{
              background: 'var(--card-success-bg)',
              border: '1px solid var(--card-success-border)',
              borderRadius: '10px',
              padding: '14px 18px',
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: '700',
                color: 'var(--card-success-title)',
                fontSize: '14px',
              }}
            >
              ✅ Importación exitosa
            </p>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '10px',
                flexWrap: 'wrap',
              }}
            >
              <StatMini
                label="Empleados creados"
                value={resultadoImportacion.creados || 0}
                bg="var(--bg-card)"
                color="var(--success)"
              />
              {resultadoImportacion.conFechaDefault > 0 && (
                <StatMini
                  label="Con fecha por defecto"
                  value={resultadoImportacion.conFechaDefault}
                  bg="var(--bg-card)"
                  color="var(--warning)"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// 🔧 Sub-componente
const StatMini = ({ label, value, bg, color }) => (
  <div
    style={{
      background: bg,
      padding: '10px 16px',
      borderRadius: '8px',
      flex: 1,
      minWidth: '120px',
    }}
  >
    <span
      style={{
        fontSize: '10px',
        color,
        textTransform: 'uppercase',
        fontWeight: '700',
        letterSpacing: '0.4px',
      }}
    >
      {label}
    </span>
    <p
      style={{
        margin: '4px 0 0 0',
        fontSize: '20px',
        fontWeight: 'bold',
        color,
      }}
    >
      {value}
    </p>
  </div>
);