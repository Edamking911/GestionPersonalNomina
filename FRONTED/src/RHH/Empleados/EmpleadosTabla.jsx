// src/GestionPersonal/Componentes/EmpleadosTabla.jsx
import { useMemo, useState } from 'react';
import Card from '../../Componentes/UI/Card';
import Table from '../../Componentes/UI/Table';
import Button from '../../Componentes/UI/Button';
import Badge from '../../Componentes/UI/Badge';
import Input from '../../Componentes/UI/Input';
import Select from '../../Componentes/UI/Select';
import Pagination from '../../Componentes/UI/Paginacion';
import TableSkeleton from '../../Componentes/UI/EsqueletoTable';
import { usePagination } from '../../Hoosk/PaginacionHoosk';

// 🆕 Helper: obtiene nombre del cargo (string o objeto)
const obtenerNombreCargo = (cargo) => {
  if (!cargo) return null;
  if (typeof cargo === 'string') return cargo;
  return cargo.nombre || null;
};

export default function EmpleadosTabla({
  empleados,
  loading,
  onVer,
  onEditar,
  onDesactivar,
  onEliminar,
  onCrear,
  onImportarExcel,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const cargosUnicos = useMemo(() => {
    const set = new Set();
    empleados.forEach((e) => {
      const nombre = obtenerNombreCargo(e.cargo);
      if (nombre) set.add(nombre);
    });
    return Array.from(set).sort();
  }, [empleados]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return empleados.filter((e) => {
      if (q) {
        const match =
          String(e.cedula || '').includes(q) ||
          (e.nombre || '').toLowerCase().includes(q) ||
          (e.apellido || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filtroCargo && obtenerNombreCargo(e.cargo) !== filtroCargo)
        return false;
      if (filtroEstado && e.estado !== filtroEstado) return false;
      return true;
    });
  }, [empleados, busqueda, filtroCargo, filtroEstado]);

  const pagination = usePagination(filtrados, {
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 250],
    resetKeys: [busqueda, filtroCargo, filtroEstado],
  });

  // =========================================================
  // COLUMNAS
  // =========================================================
  const columns = [
    {
      key: 'cedula',
      label: 'Cédula',
      bold: true,
      color: 'var(--primary)',
      width: '110px',
      nowrap: true,
    },
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellido', label: 'Apellido' },
    {
      key: 'cargo',
      label: 'Cargo',
      render: (row) => {
        const nombre = obtenerNombreCargo(row.cargo);
        return nombre ? (
          <span
            style={{
              background: 'var(--primary-soft)',
              color: 'var(--primary)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
          >
            {nombre}
          </span>
        ) : (
          <span
            style={{
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              fontSize: '12px',
            }}
          >
            Sin cargo
          </span>
        );
      },
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => row.email || '—',
      nowrap: true,
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: (row) => row.telefono || '—',
      nowrap: true,
    },
    {
      key: 'estado',
      label: 'Estado',
      align: 'center',
      nowrap: true,
      render: (row) => {
        const map = {
          ACTIVO: { variant: 'success', texto: 'Activo' },
          INACTIVO: { variant: 'danger', texto: 'Inactivo' },
          SUSPENDIDO: { variant: 'warning', texto: 'Suspendido' },
        };
        const b = map[row.estado] || { variant: 'default', texto: row.estado };
        const debeParpadear =
          row.estado === 'ACTIVO' || row.estado === 'SUSPENDIDO';

        return (
          <Badge variant={b.variant} size="sm" dot pulse={debeParpadear}>
            {b.texto}
          </Badge>
        );
      },
    },
    {
      key: 'acciones',
      label: 'Acciones',
      align: 'right',
      nowrap: true,
      render: (row) => (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            justifyContent: 'flex-end',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="info"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onVer(row);
            }}
            title="Ver detalle"
          >
            👁️
          </Button>
          <Button
            variant="warning"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEditar(row);
            }}
            title="Editar"
          >
            ✏️
          </Button>
          {row.estado === 'ACTIVO' && (
            <Button
              variant="dark"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDesactivar(row);
              }}
              title="Desactivar empleado"
            >
              🚫
            </Button>
          )}

          {/* 🔒 ELIMINAR BLOQUEADO */}
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.alert(
                '🔒 Funcionalidad en desarrollo\n\nLa eliminación de empleados estará disponible próximamente. Por ahora puedes usar "Desactivar" para marcarlo como inactivo.',
              );
            }}
            title="🔒 Eliminar (en desarrollo)"
            style={{ opacity: 0.7 }}
          >
            🔒
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card
      title="Empleados Registrados"
      subtitle={`${filtrados.length} de ${empleados.length} empleados`}
      icon="👥"
      variant="default"
      padding="none"
      headerStyle={{ padding: '16px 20px' }}
      bodyStyle={{ padding: '0' }}
    >
      <style>{`
        @media (max-width: 768px) {
          .gp-filtros {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .gp-filtro-item {
            width: 100% !important;
            flex: 1 1 auto !important;
          }
          .gp-botones-header {
            width: 100% !important;
            margin-left: 0 !important;
            flex-direction: column !important;
          }
          .gp-botones-header button {
            width: 100% !important;
          }
        }
      `}</style>

      {/* ============ FILTROS + BOTONES ============ */}
      <div
        className="gp-filtros"
        style={{
          padding: '16px 20px',
          background: 'var(--bg-hover)',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <div
          className="gp-filtro-item"
          style={{ flex: '1 1 220px', minWidth: '200px' }}
        >
          <Input
            label="Buscar"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="🔍 Cédula, nombre o apellido..."
            size="sm"
          />
        </div>

        <div
          className="gp-filtro-item"
          style={{ flex: '1 1 180px', minWidth: '160px' }}
        >
          <Select
            label="Cargo"
            value={filtroCargo}
            onChange={(e) => setFiltroCargo(e.target.value)}
            options={[
              { value: '', label: 'Todos los cargos' },
              ...cargosUnicos.map((c) => ({ value: c, label: c })),
            ]}
            size="sm"
          />
        </div>

        <div
          className="gp-filtro-item"
          style={{ flex: '1 1 160px', minWidth: '140px' }}
        >
          <Select
            label="Estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'ACTIVO', label: '✅ Activo' },
              { value: 'INACTIVO', label: '🚫 Inactivo' },
              { value: 'SUSPENDIDO', label: '⏸️ Suspendido' },
            ]}
            size="sm"
          />
        </div>

        {(busqueda || filtroCargo || filtroEstado) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBusqueda('');
              setFiltroCargo('');
              setFiltroEstado('');
            }}
          >
            🔄 Limpiar
          </Button>
        )}

        <div
          className="gp-botones-header"
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <Button
            variant="primary"
            size="sm"
            onClick={onImportarExcel}
            iconLeft="📤"
            title="Importar empleados desde Excel"
          >
            Importar Excel
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={onCrear}
            iconLeft="➕"
          >
            Nuevo Empleado
          </Button>
        </div>
      </div>

      {/* ============ TABLA / CARDS ============ */}
      {loading && empleados.length === 0 ? (
        <div style={{ padding: '20px' }}>
          <TableSkeleton columns={7} rows={8} />
        </div>
      ) : (
        <>
          <div className="gp-tabla-desktop">
            <Table
              columns={columns}
              data={pagination.paginatedItems}
              theme="auto"
              hoverable
              striped
              size="md"
              emptyMessage="No hay empleados que coincidan con los filtros"
              emptyIcon="👥"
              onRowClick={(row) => onVer(row)}
            />
          </div>

          <div className="gp-cards-mobile">
            {pagination.paginatedItems.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>👥</div>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  No hay empleados que coincidan con los filtros
                </p>
              </div>
            ) : (
              pagination.paginatedItems.map((emp, idx) => (
                <CardEmpleado
                  key={`${emp.cedula}-${idx}`}
                  empleado={emp}
                  onVer={onVer}
                  onEditar={onEditar}
                  onDesactivar={onDesactivar}
                  onEliminar={onEliminar}
                />
              ))
            )}
          </div>

          {filtrados.length > 0 && <Pagination {...pagination} />}
        </>
      )}

      <style>{`
        .gp-tabla-desktop { display: block; }
        .gp-cards-mobile { display: none; }

        @media (max-width: 768px) {
          .gp-tabla-desktop { display: none; }
          .gp-cards-mobile {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px;
          }
        }
      `}</style>
    </Card>
  );
}

// =========================================================
// 📱 Card individual para móvil
// =========================================================
function CardEmpleado({ empleado, onVer, onEditar, onDesactivar }) {
  const estadoMap = {
    ACTIVO: { variant: 'success', texto: 'Activo' },
    INACTIVO: { variant: 'danger', texto: 'Inactivo' },
    SUSPENDIDO: { variant: 'warning', texto: 'Suspendido' },
  };
  const b = estadoMap[empleado.estado] || {
    variant: 'default',
    texto: empleado.estado,
  };
  const debeParpadear =
    empleado.estado === 'ACTIVO' || empleado.estado === 'SUSPENDIDO';
  const cargoNombre = obtenerNombreCargo(empleado.cargo);

  return (
    <div
      onClick={() => onVer(empleado)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '13px',
            fontWeight: '700',
            color: 'var(--primary)',
          }}
        >
          {empleado.cedula}
        </span>
        <Badge variant={b.variant} size="sm" dot pulse={debeParpadear}>
          {b.texto}
        </Badge>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <p
          style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: '700',
            color: 'var(--text-primary)',
          }}
        >
          {empleado.nombre} {empleado.apellido}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          marginBottom: '12px',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Cargo:</span>
          <span
            style={{
              color: cargoNombre ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: cargoNombre ? '600' : '400',
              fontStyle: cargoNombre ? 'normal' : 'italic',
            }}
          >
            {cargoNombre || 'Sin cargo'}
          </span>
        </div>
        {empleado.email && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Email:</span>
            <span
              style={{
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '60%',
              }}
            >
              {empleado.email}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '10px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="info"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onVer(empleado);
          }}
          title="Ver detalle"
        >
          👁️
        </Button>
        <Button
          variant="warning"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEditar(empleado);
          }}
          title="Editar"
        >
          ✏️
        </Button>
        {empleado.estado === 'ACTIVO' && (
          <Button
            variant="dark"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDesactivar(empleado);
            }}
            title="Desactivar"
          >
            🚫
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            window.alert(
              '🔒 Funcionalidad en desarrollo\n\nLa eliminación estará disponible próximamente.',
            );
          }}
          title="🔒 Eliminar (en desarrollo)"
          style={{ opacity: 0.7 }}
        >
          🔒
        </Button>
      </div>
    </div>
  );
}
