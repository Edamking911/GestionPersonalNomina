// src/Componentes/ReglasComponent/Novedades/NovedadesPanel.jsx
import { useState, useEffect, useMemo } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Table from '../UI/Table';
import Pagination from '../UI/Paginacion';
import TableSkeleton from '../UI/EsqueletoTable';
import { usePagination } from '../../Hoosk/PaginacionHoosk';
import NuevaNovedadModal from './NuevaNovedadModal';
import NovedadDetalleModal from './NovedadDetalleModal';
import {
  TIPOS_NOVEDAD,
  getTipoInfo,
  formatearFecha,
  calcularDias,
} from './constants';

export default function NovedadesPanel({
  novedades,
  listarNovedades,
  crearNovedad,
  actualizarNovedad,
  eliminarNovedad,
  descargarConstanciaNovedad,
}) {
  // ========== FILTROS ==========
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [filtroCedula, setFiltroCedula] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [incluirInactivas, setIncluirInactivas] = useState(false);

  // ========== MODALES ==========
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [novedadSeleccionada, setNovedadSeleccionada] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [cargando, setCargando] = useState(false);

  const listaNovedades = novedades || [];

  // ========== CARGA INICIAL ==========
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      await listarNovedades({
        desde: filtroDesde || undefined,
        hasta: filtroHasta || undefined,
        cedula: filtroCedula || undefined,
        incluirInactivas,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // ========== Filtro por tipo (en cliente) ==========
  const novedadesFiltradas = useMemo(() => {
    if (!filtroTipo) return listaNovedades;
    return listaNovedades.filter((n) => n.tipo === filtroTipo);
  }, [listaNovedades, filtroTipo]);

  const pagination = usePagination(novedadesFiltradas, {
    initialPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100, 250],
    resetKeys: [filtroTipo, listaNovedades.length],
  });

  // ========== HANDLERS ==========
  const handleAplicarFiltros = () => cargar();

  const handleLimpiarFiltros = () => {
    setFiltroDesde('');
    setFiltroHasta('');
    setFiltroCedula('');
    setFiltroTipo('');
    setIncluirInactivas(false);
    listarNovedades({}).catch(console.error);
  };

  const handleNueva = () => {
    setNovedadSeleccionada(null);
    setModoEdicion(false);
    setModalNuevoOpen(true);
  };

  const handleVer = (novedad) => {
    setNovedadSeleccionada(novedad);
    setModalDetalleOpen(true);
  };

  const handleEditar = (novedad) => {
    setNovedadSeleccionada(novedad);
    setModoEdicion(true);
    setModalNuevoOpen(true);
    setModalDetalleOpen(false);
  };

  const handleEliminar = async (novedad) => {
    if (!window.confirm(`¿Desactivar la novedad de ${novedad.cedula}?`)) return;
    try {
      await eliminarNovedad(novedad.id);
      await cargar();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePDF = async (novedad) => {
    try {
      await descargarConstanciaNovedad(novedad.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGuardar = async (dto) => {
    if (modoEdicion && novedadSeleccionada) {
      await actualizarNovedad(novedadSeleccionada.id, dto);
    } else {
      await crearNovedad(dto);
    }
    setModalNuevoOpen(false);
    await cargar();
  };

  // ========== COLUMNAS ==========
  const columns = [
    {
      key: 'cedula',
      label: 'Cédula',
      bold: true,
      color: 'var(--primary)',
      width: '110px',
      nowrap: true,
    },
    {
      key: 'empleado',
      label: 'Empleado',
      render: (row) => {
        if (row.empleado) {
          return `${row.empleado.nombre || ''} ${row.empleado.apellido || ''}`.trim();
        }
        return '—';
      },
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (row) => {
        const info = getTipoInfo(row.tipo);
        return (
          <Badge variant={info.variant} size="sm">
            {info.label}
          </Badge>
        );
      },
      nowrap: true,
    },
    {
      key: 'fechaInicio',
      label: 'Desde',
      render: (row) => formatearFecha(row.fechaInicio),
      nowrap: true,
    },
    {
      key: 'fechaFin',
      label: 'Hasta',
      render: (row) => formatearFecha(row.fechaFin),
      nowrap: true,
    },
    {
      key: 'dias',
      label: 'Días',
      align: 'center',
      render: (row) => calcularDias(row.fechaInicio, row.fechaFin),
    },
    {
      key: 'motivo',
      label: 'Motivo',
      render: (row) => row.motivo || '—',
    },
    {
      key: 'activo',
      label: 'Estado',
      align: 'center',
      render: (row) => (
        <Badge variant={row.activo ? 'success' : 'danger'} size="sm" dot>
          {row.activo ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
      nowrap: true,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      align: 'right',
      nowrap: true,
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <Button variant="info" size="sm" onClick={() => handleVer(row)} title="Ver detalle">
            👁️
          </Button>
          <Button variant="warning" size="sm" onClick={() => handleEditar(row)} title="Editar">
            ✏️
          </Button>
          <Button variant="dark" size="sm" onClick={() => handlePDF(row)} title="Constancia PDF">
            📄
          </Button>
          {row.activo && (
            <Button variant="danger" size="sm" onClick={() => handleEliminar(row)} title="Desactivar">
              🗑️
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Gestión de Novedades"
        subtitle="Registra vacaciones, reposos, permisos y faltas del personal"
        icon="🏖️"
        variant="info"
        padding="none"
        headerStyle={{ padding: '16px 20px' }}
        bodyStyle={{ padding: '0' }}
      >
        {/* ============ FILTROS ============ */}
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
          <div style={{ minWidth: '150px' }}>
            <Input
              label="Desde"
              type="date"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
              size="sm"
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <Input
              label="Hasta"
              type="date"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
              size="sm"
            />
          </div>

          <div style={{ minWidth: '140px' }}>
            <Input
              label="Cédula"
              value={filtroCedula}
              onChange={(e) => setFiltroCedula(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 29789773"
              size="sm"
            />
          </div>

          <div style={{ minWidth: '200px' }}>
            <Select
              label="Tipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              options={[{ value: '', label: 'Todos los tipos' }, ...TIPOS_NOVEDAD]}
              placeholder=""
              size="sm"
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              paddingBottom: '10px',
            }}
          >
            <input
              type="checkbox"
              checked={incluirInactivas}
              onChange={(e) => setIncluirInactivas(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Incluir inactivas
          </label>

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', paddingBottom: '4px' }}>
            <Button variant="ghost" size="sm" onClick={handleLimpiarFiltros}>
              🔄 Limpiar
            </Button>
            <Button variant="info" size="sm" onClick={handleAplicarFiltros} iconLeft="🔍">
              Buscar
            </Button>
            <Button variant="success" size="sm" onClick={handleNueva} iconLeft="➕">
              Nueva
            </Button>
          </div>
        </div>

        {/* ============ TABLA ============ */}
        {cargando ? (
          <div style={{ padding: '20px' }}>
            <TableSkeleton columns={8} rows={8} />
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
              emptyMessage="No hay novedades registradas"
              emptyIcon="🏖️"
            />
            <Pagination {...pagination} />
          </>
        )}
      </Card>

      {/* ============ MODALES ============ */}
      <NuevaNovedadModal
        isOpen={modalNuevoOpen}
        onClose={() => setModalNuevoOpen(false)}
        onSave={handleGuardar}
        novedad={novedadSeleccionada}
        modoEdicion={modoEdicion}
      />

      <NovedadDetalleModal
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        novedad={novedadSeleccionada}
        onEditar={() => handleEditar(novedadSeleccionada)}
        onEliminar={() => handleEliminar(novedadSeleccionada).then(() => setModalDetalleOpen(false))}
        onDescargarPDF={() => handlePDF(novedadSeleccionada)}
      />
    </>
  );
}