// src/Componentes/BiometricoComponent/UserTable.jsx
import Table from '../UI/Table';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import Card from '../UI/Card';

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
  emptyMessage,
  variant = 'success',   // 👈 NUEVA PROP: 'success' | 'warning' | 'danger' | 'info' | 'default'
  // bgHeader se mantiene por retrocompatibilidad pero ya no se usa para colores hardcodeados
  bgHeader,              // (deprecated)
  badgeColor,
  badgeTextColor,
  onDelete,
  onActivate,
  showStatus = false,
}) {
  const usersList = Array.isArray(users) ? users : [];

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
        // 👇 Ya no se pasa background hardcodeado. El Card usa su propia variable
        // según el variant (success → --card-success-header, etc.)
      }}
      bodyStyle={{ padding: '0' }}
    >
      <Table
        columns={columnas}
        data={usersList}
        theme="auto"
        hoverable
        striped
        size="md"
        emptyMessage={emptyMessage}
        emptyIcon="📭"
      />
    </Card>
  );
}