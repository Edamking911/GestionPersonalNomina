// src/RRH/Departamentos/Componentes/DepartamentosTabla.jsx
import { useMemo, useState } from 'react';
import Card from '../../../Componentes/UI/Card';
import Table from '../../../Componentes/UI/Table';
import Button from '../../../Componentes/UI/Button';
import Input from '../../../Componentes/UI/Input';
import Pagination from '../../../Componentes/UI/Paginacion';
import TableSkeleton from '../../../Componentes/UI/EsqueletoTable';
import { usePagination } from '../../../Hoosk/PaginacionHoosk';

// 🆕 Formatear fecha a DD/MM/YYYY
const formatearFecha = (fecha) => {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '—';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${dd}/${m}/${y}`;
};

export default function DepartamentosTabla({
  departamentos,
  loading,
  onCrear,
  onEditar,
  onEliminar,
}) {
  const [busqueda, setBusqueda] = useState('');

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return departamentos;
    return departamentos.filter((d) =>
      (d.nombre || '').toLowerCase().includes(q),
    );
  }, [departamentos, busqueda]);

  const pagination = usePagination(filtrados, {
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 250],
    resetKeys: [busqueda],
  });

  const columns = [
    {
      key: 'nombre',
      label: 'Departamento',
      bold: true,
      color: 'var(--primary)',
    },
    {
      key: 'creacion',
      label: 'Fecha de Creación',
      render: (row) => {
        const fecha = row.creacion || row.createdAt || row.fechaCreacion;
        return (
          <span style={{ color: 'var(--text-secondary)' }}>
            📅 {formatearFecha(fecha)}
          </span>
        );
      },
      nowrap: true,
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
            title="Editar departamento"
          >
            ✏️
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onEliminar(row)}
            title="Eliminar departamento"
          >
            🗑️
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card
      title="Departamentos Registrados"
      subtitle={`${filtrados.length} de ${departamentos.length} departamentos`}
      icon="🏢"
      variant="default"
      padding="none"
      headerStyle={{ padding: '16px 20px' }}
      bodyStyle={{ padding: '0' }}
    >
      <div
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
            placeholder="🔍 Buscar departamento..."
            size="sm"
          />
        </div>

        {busqueda && (
          <Button variant="ghost" size="sm" onClick={() => setBusqueda('')}>
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
          Nuevo Departamento
        </Button>
      </div>

      {loading && departamentos.length === 0 ? (
        <div style={{ padding: '20px' }}>
          <TableSkeleton columns={3} rows={6} />
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
            emptyMessage="No hay departamentos registrados"
            emptyIcon="🏢"
          />
          {filtrados.length > 0 && <Pagination {...pagination} />}
        </>
      )}
    </Card>
  );
}
