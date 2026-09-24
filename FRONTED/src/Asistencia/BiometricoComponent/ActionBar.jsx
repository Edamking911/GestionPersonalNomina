// src/Componentes/BiometricoComponent/ActionBar.jsx
import { useRef, useState } from 'react';
import Button from '../../Componentes/UI/Button';

export default function ActionBar({
  onSyncToday,
  onSyncYesterday,
  onCleanDuplicates,
  onClearCache,
  onRefresh,
  archivoExcel,
  setArchivoExcel,
  onImportExcel,
}) {
  const fileInputRef = useRef(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoExcel(e.target.files[0]);
    }
  };

  const handleLimpiarArchivo = () => {
    setArchivoExcel(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!archivoExcel) return;
    setModalAbierto(true);
  };

  const handleConfirmarImportacion = async () => {
    setSubiendo(true);
    try {
      const fakeEvent = { preventDefault: () => {} };
      await onImportExcel(fakeEvent);
      setModalAbierto(false);
      handleLimpiarArchivo();
    } catch (error) {
      console.error(error);
    } finally {
      setSubiendo(false);
    }
  };

  const handleCancelar = () => {
    setModalAbierto(false);
    handleLimpiarArchivo();
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <>
      <div
        className="action-bar-mobile"
        style={{
          background: 'var(--bg-card)',
          padding: '15px 20px',
          borderRadius: '10px',
          border: '1px solid var(--border-light)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          marginBottom: '25px',
          flexWrap: 'wrap',
        }}
      >
        <Button variant="success" size="sm" onClick={onSyncToday}>
          🔄 Sincronizar Hoy
        </Button>

        <Button variant="primary" size="sm" onClick={onSyncYesterday}>
          📅 Sincronizar Ayer
        </Button>

        <Button variant="warning" size="sm" onClick={onCleanDuplicates}>
          🧹 Limpiar Duplicados
        </Button>

        <Button variant="info" size="sm" onClick={onClearCache}>
          ⚡ Limpiar Caché
        </Button>

        <Button variant="dark" size="sm" onClick={onRefresh}>
          📥 Refrescar Datos
        </Button>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            marginLeft: 'auto',
            background: 'var(--bg-hover)',
            padding: '6px',
            borderRadius: '10px',
            border: '1px solid var(--border-light)',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <Button
            variant="light"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Selecciona un archivo Excel"
          >
            📎 Elegir archivo
          </Button>

          <span
            style={{
              fontSize: '12px',
              color: archivoExcel
                ? 'var(--text-primary)'
                : 'var(--text-muted)',
              fontStyle: archivoExcel ? 'normal' : 'italic',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={
              archivoExcel ? archivoExcel.name : 'No se ha seleccionado ningún archivo'
            }
          >
            {archivoExcel ? archivoExcel.name : 'Ningún archivo'}
          </span>

          {archivoExcel && (
            <button
              type="button"
              onClick={handleLimpiarArchivo}
              style={{
                padding: '6px 10px',
                background: '#fed7d7',
                color: '#9b2c2c',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#fc8181';
                e.target.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fed7d7';
                e.target.style.color = '#9b2c2c';
              }}
              title="Quitar archivo"
            >
              ✕
            </button>
          )}

          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={!archivoExcel}
          >
            📂 Importar Excel
          </Button>
        </form>
      </div>

      {/* ============ MODAL DE CONFIRMACIÓN ============ */}
      {modalAbierto && archivoExcel && (
        <div
          onClick={() => !subiendo && setModalAbierto(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              maxWidth: '580px',
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--primary-soft)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                📂
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '17px',
                    color: 'var(--text-primary)',
                    fontWeight: '700',
                  }}
                >
                  Confirmar Importación
                </h3>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                  }}
                >
                  Revisa el formato y el archivo antes de continuar
                </p>
              </div>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <p
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                }}
              >
                ¿Estás seguro que deseas subir este archivo Excel? Los datos de los
                usuarios se actualizarán según su contenido.
              </p>

              <div
                style={{
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={archivoExcel.name}
                    >
                      {archivoExcel.name}
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {formatSize(archivoExcel.size)}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  📋 Formato esperado del Excel
                </h4>

                <div
                  style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: 'var(--bg-navbar)',
                          color: '#fff',
                        }}
                      >
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>
                          Cédula *
                        </th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>
                          Nombre *
                        </th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>
                          Apellido
                        </th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>
                          Cargo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td
                          style={{
                            padding: '8px 12px',
                            fontFamily: 'monospace',
                            color: 'var(--primary)',
                          }}
                        >
                          12345678
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>
                          JUAN
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>
                          PEREZ
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                          Empleado
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--warning-soft)',
                  border: '1px solid var(--card-warning-border)',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: 'var(--card-warning-title)',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '16px' }}>⚠️</span>
                <span>
                  <strong>Importante:</strong> Esta acción actualizará o creará
                  usuarios en el biométrico. Si un usuario ya existe (misma cédula),
                  sus datos serán actualizados.
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '16px 24px',
                background: 'var(--bg-hover)',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <Button
                variant="light"
                size="md"
                onClick={handleCancelar}
                disabled={subiendo}
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmarImportacion}
                loading={subiendo}
              >
                {subiendo ? 'Subiendo...' : 'Sí, subir archivo'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translateY(-40px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}