// src/Componentes/BiometricoComponent/UserTable.jsx
import Table from '../UI/Table';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Pagination from '../UI/Paginacion';
import TableSkeleton from '../UI/EsqueletoTable';
import { usePagination } from '../../Hoosk/PaginacionHoosk';

function separarNombreApellido(nombreCompleto) {
  if (!nombreCompleto) return { nombre: '', apellido: 'N/A' };
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  const total = partes.length;
  if (total === 1) return { nombre: partes[0], apellido: 'N/A' };
  if (total === 2) return { nombre: partes[0], apellido: partes[1] };
  if (total === 3) return { nombre: partes[0], apellido: partes.slice(1).join(' ') };
  if (total === 4) {
    return { nombre: partes.slice(0, 2).join(' '), apellido: partes.slice(2).join(' ') };
  }
  const mitad = Math.ceil(total / 2);
  return { nombre: partes.slice(0, mitad).join(' '), apellido: partes.slice(mitad).join(' ') };
}

export default function UserTable({
  title,
  users,
  loading = false,      // 👈 NUEVA PROP
  emptyMessage,
  variant = 'success',
  bgHeader,             // (deprecated)
  badgeColor,           // (deprecated)
  badgeTextColor,       // (deprecated)
  onDelete,
  onActivate,
  showStatus = false,
  initialPageSize = 25,
}) {
  const usersList = Array.isArray(users) ? users : [];

  // 📄 Paginación
  const pagination = usePagination(usersList, {
    initialPageSize,
    pageSizeOptions: [10, 25, 50, 100, 250, 500],
    resetKeys: [title, usersList.length],
  });

  const columnas = [
    {
      key: 'employeeId',
      label: 'Cédula / ID',
      bold: true,
      color: 'var(--primary)',
      width: '140px',
      nowrap: true,
      render: (row) => row.employeeNo || row.cedula,
    },
    {
      key: 'nombre',
      label: 'Nombre',
      render: (row) => {
        const { nombre } = separarNombreApellido(row.name || row.nombre || '');
        return nombre;
      },
    },
    {
      key: 'apellido',
      label: 'Apellido',
      render: (row) => {
        const { apellido } = separarNombreApellido(row.name || row.nombre || '');
        return <span style={{ color: 'var(--text-secondary)' }}>{apellido}</span>;
      },
    },
  ];

  if (showStatus) {
    columnas.push({
      key: 'estado',
      label: 'Estado',
      render: (row) => {
        const activo = row.activo !== undefined ? row.activo : true;
        return (
          <Badge variant={activo ? 'success' : 'danger'} dot pulse={activo} size="sm">
            {activo ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    });
  }

  columnas.push({
    key: 'acciones',
    label: 'Acciones',
    align: 'right',
    render: (row) => {
      const cedulaNum = row.employeeNo || row.cedula;
      const activo = row.activo !== undefined ? row.activo : true;
      return (
        <Button
          variant={activo ? 'danger' : 'success'}
          size="sm"
          onClick={() => (activo ? onDelete(cedulaNum) : onActivate(cedulaNum))}
        >
          {activo ? '🗑️ Desactivar' : '🔁 Activar'}
        </Button>
      );
    },
  });

  return (
    <Card
      title={title}
      variant={variant}
      padding="none"
      headerStyle={{
        padding: '16px 20px',
      }}
      bodyStyle={{ padding: '0' }}
    >
      {/* 🦴 Skeleton mientras carga */}
      {loading ? (
        <div style={{ padding: '16px' }}>
          <TableSkeleton
            columns={showStatus ? 5 : 4}
            rows={5}
            hasHeader={false}
          />
        </div>
      ) : (
        <>
          <Table
            columns={columnas}
            data={pagination.paginatedItems}
            theme="auto"
            hoverable
            striped
            size="md"
            emptyMessage={emptyMessage}
            emptyIcon="📭"
          />

          {/* 📄 Paginación — solo se muestra si hay datos */}
          {usersList.length > 0 && <Pagination {...pagination} />}
        </>
      )}
    </Card>
  );
}