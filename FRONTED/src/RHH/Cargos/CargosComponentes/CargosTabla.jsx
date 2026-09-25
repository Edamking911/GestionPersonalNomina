// src/RRH/Cargos/Componentes/CargosTabla.jsx
import { useMemo, useState } from 'react';
import Card from '../../../Componentes/UI/Card';
import Table from '../../../Componentes/UI/Table';
import Button from '../../../Componentes/UI/Button';
import Input from '../../../Componentes/UI/Input';
import Select from '../../../Componentes/UI/Select';
import Pagination from '../../../Componentes/UI/Paginacion';
import TableSkeleton from '../../../Componentes/UI/EsqueletoTable';
import { usePagination } from '../../../Hoosk/PaginacionHoosk';

// 🆕 Helper para sacar el nombre del departamento sin importar el formato
const obtenerNombreDepa = (row) => {
  if (!row) return null;
  return (
    row.nombreDepa ||
    row.departamento?.nombre ||
    row.departamentoNombre ||
    null
  );
};

export default function CargosTabla({
  cargos,
  loading,
  onCrear,
  onEditar,
  onEliminar,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroDepartamento, setFiltroDepartamento] = useState('');

  const departamentosUnicos = useMemo(() => {
    const set = new Set();
    cargos.forEach((c) => {
      const nombre = obtenerNombreDepa(c);
      if (nombre) set.add(nombre);
    });
    return Array.from(set).sort();
  }, [cargos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return cargos.filter((c) => {
      if (q) {
        const match = (c.nombre || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filtroDepartamento) {
        if (obtenerNombreDepa(c) !== filtroDepartamento) return false;
      }
      return true;
    });
  }, [cargos, busqueda, filtroDepartamento]);

  const pagination = usePagination(filtrados, {
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 250],
    resetKeys: [busqueda, filtroDepartamento],
  });

  const columns = [
    {
      key: 'nombre',
      label: 'Cargo',
      bold: true,
      color: 'var(--primary)',
    },
    {
      key: 'departamento',
      label: 'Departamento',
      render: (row) => {
        const dep = obtenerNombreDepa(row);
        return dep ? (
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
            🏢 {dep}
          </span>
        ) : (
          <span
            style={{
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              fontSize: '12px',
            }}
          >
            Sin departamento
          </span>
        );
      },
    },
    {
      key: 'sueldo',
      label: 'Sueldo',
      align: 'right',
      render: (row) => {
        const s = Number(row.sueldo);
        if (!s || isNaN(s)) {
          return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        }
        return (
          <span style={{ color: 'var(--success)', fontWeight: '700' }}>
            ${s.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
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
          style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="warning"
            size="sm"
            onClick={() => onEditar(row)}
            title="Editar cargo"
          >
            ✏️
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onEliminar(row)}
            title="Eliminar cargo"
          >
            🗑️
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card
      title="Cargos Registrados"
      subtitle={`${filtrados.length} de ${cargos.length} cargos`}
      icon="💼"
      variant="default"
      padding="none"
      headerStyle={{ padding: '16px 20px' }}
      bodyStyle={{ padding: '0' }}
    >
      <style>{`
        @media (max-width: 768px) {
          .cargos-filtros {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .cargos-filtros > div {
            width: 100% !important;
          }
        }
      `}</style>

      <div
        className="cargos-filtros"
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
        <div style={{ flex: '1 1 220px', minWidth: '200px' }}>
          <Input
            label="Buscar"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar cargo..."
            size="sm"
          />
        </div>

        <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
          <Select
            label="Departamento"
            value={filtroDepartamento}
            onChange={(e) => setFiltroDepartamento(e.target.value)}
            options={[
              { value: '', label: 'Todos los departamentos' },
              ...departamentosUnicos.map((d) => ({ value: d, label: d })),
            ]}
            size="sm"
          />
        </div>

        {(busqueda || filtroDepartamento) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBusqueda('');
              setFiltroDepartamento('');
            }}
          >
            🔄 Limpiar
          </Button>
        )}

        <Button
          variant="success"
          size="sm"
          onClick={onCrear}
          iconLeft="➕"
          style={{ marginLeft: 'auto' }}
        >
          Nuevo Cargo
        </Button>
      </div>

      {loading && cargos.length === 0 ? (
        <div style={{ padding: '20px' }}>
          <TableSkeleton columns={4} rows={6} />
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={pagination.paginatedItems}
            theme="auto"
            hoverable
            striped
            size="md"
            emptyMessage="No hay cargos registrados"
            emptyIcon="💼"
          />
          {filtrados.length > 0 && <Pagination {...pagination} />}
        </>
      )}
    </Card>
  );
}