// src/Componentes/UI/GlobalSearch.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import Badge from './Badge';
import ReporteIndividualModal from './ReporteIndividual';
import api from '../../servicio/Api';

// 🎨 Ícono SVG de usuario
const IconoUsuario = ({ color = 'currentColor', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// 🎨 Ícono de filtro
const IconoFiltro = ({ color = 'currentColor', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const DIAS_SEMANA = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [diasLibres, setDiasLibres] = useState({});
  const [reporteOpen, setReporteOpen] = useState(false);
  const [reporteEmpleado, setReporteEmpleado] = useState(null);

  // 🎛️ Filtros avanzados
  const [showFilters, setShowFilters] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'activos' | 'inactivos'
  const [filtroHorario, setFiltroHorario] = useState('todos');
  const [filtroDiaLibre, setFiltroDiaLibre] = useState('todos');
  const [filtroAsignacion, setFiltroAsignacion] = useState('todos'); // 'todos' | 'con' | 'sin'

  const inputRef = useRef(null);
  const recargandoRef = useRef(false);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem('global-search-history');
      if (guardado) setHistorial(JSON.parse(guardado));
    } catch {}
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 🔄 Cargar datos cada vez que se abre
  useEffect(() => {
    if (!isOpen) return;
    if (recargandoRef.current) return;

    const cargar = async () => {
      recargandoRef.current = true;
      setLoading(true);
      try {
        const [resU, resA, resD] = await Promise.allSettled([
          api.get('/biometrico/list-all-users'),
          api.get('/reglas/asignaciones'),
          api.get('/reglas/dias-libres'),
        ]);

        if (resU.status === 'fulfilled') {
          const data = resU.value.data;
          let lista = [];
          if (Array.isArray(data?.usuarios)) lista = data.usuarios;
          else if (Array.isArray(data)) lista = data;
          else if (data && typeof data === 'object') {
            for (const key in data) {
              if (Array.isArray(data[key])) {
                lista = data[key];
                break;
              }
            }
          }
          setUsuarios(lista);
        }

        if (resA.status === 'fulfilled') {
          const lista =
            resA.value.data?.asignaciones || resA.value.data || [];
          setAsignaciones(Array.isArray(lista) ? lista : []);
        }

        if (resD.status === 'fulfilled') {
          setDiasLibres(resD.value.data || {});
        }
      } catch (err) {
        console.error('[GlobalSearch] Error:', err);
      } finally {
        setLoading(false);
        recargandoRef.current = false;
      }
    };

    cargar();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setReporteOpen(false);
    }
  }, [isOpen]);

  // =========================================================
  // 🎛️ FILTROS ACTIVOS
  // =========================================================
  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (filtroEstado !== 'todos') count++;
    if (filtroHorario !== 'todos') count++;
    if (filtroDiaLibre !== 'todos') count++;
    if (filtroAsignacion !== 'todos') count++;
    return count;
  }, [filtroEstado, filtroHorario, filtroDiaLibre, filtroAsignacion]);

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroHorario('todos');
    setFiltroDiaLibre('todos');
    setFiltroAsignacion('todos');
  };

  // =========================================================
  // 📋 HORARIOS ÚNICOS (para dropdown)
  // =========================================================
  const horariosUnicos = useMemo(() => {
    const set = new Set();
    asignaciones.forEach((a) => {
      const nombre = a.horarioNombre || a.horarioId;
      if (nombre) set.add(nombre);
    });
    return Array.from(set).sort();
  }, [asignaciones]);

  // =========================================================
  // 🔍 LISTA FILTRADA COMPLETA
  // =========================================================
  const resultadosFiltrados = useMemo(() => {
    const q = query.trim().toLowerCase();

    return usuarios.filter((u) => {
      const cedula = String(
        u.employeeNo || u.employeeId || u.cedula || u.id || '',
      );
      const nombre = (u.name || u.nombre || '').toLowerCase();

      // 🔍 Query de búsqueda (cédula o nombre)
      if (q.length >= 3) {
        const matchQuery = cedula.includes(q) || nombre.includes(q);
        if (!matchQuery) return false;
      } else if (q.length > 0 && q.length < 3) {
        // Con menos de 3 caracteres, solo filtrar por filtros
      }

      // 🎛️ Filtros
      const activo =
        u.activo !== false && u.activo !== 0 && u.activo !== 'false';

      if (filtroEstado === 'activos' && !activo) return false;
      if (filtroEstado === 'inactivos' && activo) return false;

      const asignacion = asignaciones.find(
        (a) => String(a.employeeId) === cedula,
      );

      if (filtroAsignacion === 'con' && !asignacion) return false;
      if (filtroAsignacion === 'sin' && asignacion) return false;

      if (filtroHorario !== 'todos') {
        if (!asignacion) return false;
        const nombreHorario =
          asignacion.horarioNombre || asignacion.horarioId || '';
        if (nombreHorario !== filtroHorario) return false;
      }

      if (filtroDiaLibre !== 'todos') {
        if (!asignacion) return false;
        const fijos = asignacion.diasLibresFijos || [];
        const rotativos = asignacion.diasLibresRotativos || [];
        if (
          !fijos.includes(filtroDiaLibre) &&
          !rotativos.includes(filtroDiaLibre)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    usuarios,
    asignaciones,
    query,
    filtroEstado,
    filtroHorario,
    filtroDiaLibre,
    filtroAsignacion,
  ]);

  // 🔍 Resultado DETALLADO (solo cuando hay query exacta de cédula)
  const resultadoDetallado = useMemo(() => {
    const q = query.trim();
    if (!q || q.length < 3) return null;
    if (filtrosActivos > 0) return null;

    // Solo mostrar detalle si es búsqueda por cédula exacta
    const encontrado = usuarios.find((u) => {
      const cedula = String(
        u.employeeNo || u.employeeId || u.cedula || u.id || '',
      );
      return cedula.includes(q);
    });

    if (!encontrado) return { encontrado: false };

    const cedula = String(
      encontrado.employeeNo ||
        encontrado.employeeId ||
        encontrado.cedula ||
        encontrado.id ||
        '',
    );

    const asignacion = asignaciones.find(
      (a) => String(a.employeeId) === cedula,
    );
    const rotativos = diasLibres?.[cedula] || {};

    const semanasConRotativos = Object.entries(rotativos).map(
      ([sem, dias]) => ({ semana: sem, dias }),
    );

    return {
      encontrado: true,
      cedula,
      nombre: encontrado.name || encontrado.nombre || 'Sin nombre',
      activo:
        encontrado.activo !== false &&
        encontrado.activo !== 0 &&
        encontrado.activo !== 'false',
      asignacion,
      rotativos: semanasConRotativos,
    };
  }, [query, usuarios, asignaciones, diasLibres, filtrosActivos]);

  const guardarEnHistorial = (cedula) => {
    setHistorial((prev) => {
      const nuevo = [cedula, ...prev.filter((c) => c !== cedula)].slice(0, 5);
      try {
        localStorage.setItem('global-search-history', JSON.stringify(nuevo));
      } catch {}
      return nuevo;
    });
  };

  const handleCopiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      guardarEnHistorial(texto);
    } catch {}
  };

  const handleAbrirReporte = (empleado) => {
    setReporteEmpleado(empleado);
    setReporteOpen(true);
  };

  const tieneQueryValida = query.trim().length >= 3;
  const mostrarLista =
    filtrosActivos > 0 || (tieneQueryValida && !resultadoDetallado?.encontrado);
  const mostrarDetalle = !filtrosActivos && resultadoDetallado?.encontrado;

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes gsFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gsSlideDown {
          0% { opacity: 0; transform: translateY(-30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gsSpin { to { transform: rotate(360deg); } }
        .gs-backdrop {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 99998;
          display: flex; align-items: flex-start; justify-content: center;
          padding: 80px 20px 20px;
          animation: gsFadeIn 0.2s ease-out;
        }
        .gs-modal {
          background: var(--bg-card);
          border-radius: 14px; max-width: 720px; width: 100%;
          box-shadow: var(--shadow-lg); overflow: hidden;
          animation: gsSlideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-height: 85vh; display: flex; flex-direction: column;
        }
        .gs-input-wrap {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-light);
        }
        .gs-input {
          flex: 1; background: transparent; border: none; outline: none;
          font-size: 16px; color: var(--text-primary); font-family: inherit;
        }
        .gs-input::placeholder { color: var(--text-muted); }
        .gs-kbd {
          background: var(--bg-hover); color: var(--text-secondary);
          border: 1px solid var(--border-light);
          padding: 3px 8px; border-radius: 6px;
          font-size: 11px; font-family: monospace;
        }
        .gs-filter-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px;
          background: var(--bg-hover);
          color: var(--text-secondary);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          position: relative;
        }
        .gs-filter-btn:hover {
          background: var(--bg-card);
          color: var(--text-primary);
          border-color: var(--primary);
        }
        .gs-filter-btn.active {
          background: var(--primary-soft);
          color: var(--primary);
          border-color: var(--primary);
        }
        .gs-filter-badge {
          background: var(--primary);
          color: #fff;
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 10px;
          font-weight: 700;
          margin-left: 2px;
        }
        .gs-filters-panel {
          padding: 14px 18px;
          background: var(--bg-hover);
          border-bottom: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: gsSlideDown 0.25s ease-out;
        }
        .gs-filter-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .gs-filter-label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.3px;
          margin-right: 4px;
          min-width: 90px;
        }
        .gs-filter-chip {
          padding: 5px 12px;
          background: var(--bg-card);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .gs-filter-chip:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .gs-filter-chip.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }
        .gs-filter-select {
          padding: 5px 10px;
          background: var(--bg-card);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          outline: none;
          min-width: 130px;
        }
        .gs-clear-filters {
          margin-left: auto;
          background: transparent;
          border: none;
          color: var(--danger);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          font-family: inherit;
        }
        .gs-clear-filters:hover {
          background: var(--card-danger-bg);
        }
        .gs-body { padding: 16px 18px; overflow-y: auto; flex: 1; }
        .gs-historial { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
        .gs-chip {
          background: var(--bg-hover); border: 1px solid var(--border-light);
          color: var(--text-secondary); padding: 5px 12px;
          border-radius: 20px; font-size: 12px; cursor: pointer;
          font-family: monospace; transition: all 0.2s ease;
        }
        .gs-chip:hover {
          background: var(--primary-soft); color: var(--primary);
          border-color: var(--primary);
        }
        .gs-result-card {
          background: var(--bg-hover); border: 1px solid var(--border-light);
          border-radius: 12px; padding: 16px;
        }
        .gs-info-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0; border-bottom: 1px solid var(--border-light);
          font-size: 13px;
        }
        .gs-info-row:last-child { border-bottom: none; }
        .gs-info-label {
          color: var(--text-muted); font-size: 12px;
          text-transform: uppercase; font-weight: 600; letter-spacing: 0.3px;
        }
        .gs-info-value { color: var(--text-primary); font-weight: 600; }
        .gs-action-btn {
          background: var(--primary); color: #fff; border: none;
          padding: 8px 16px; border-radius: 8px; font-size: 13px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          transition: all 0.2s ease;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .gs-action-btn:hover {
          background: var(--primary-hover); transform: translateY(-1px);
        }
        .gs-action-btn.secondary {
          background: var(--bg-hover); color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }
        .gs-action-btn.secondary:hover {
          background: var(--bg-card);
          color: var(--text-primary);
          border-color: var(--primary);
        }
        .gs-spinner {
          width: 18px; height: 18px;
          border: 2px solid var(--border-color);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: gsSpin 0.8s linear infinite;
        }

        /* 📋 Lista de resultados */
        .gs-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .gs-list-count {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.3px;
          margin-bottom: 8px;
        }
        .gs-list-count strong {
          color: var(--primary);
          font-size: 14px;
        }
        .gs-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--bg-hover);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .gs-item:hover {
          border-color: var(--primary);
          transform: translateX(2px);
        }
        .gs-item-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: var(--primary-soft);
          display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .gs-item-info {
          flex: 1;
          min-width: 0;
        }
        .gs-item-name {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .gs-item-meta {
          margin: 2px 0 0 0;
          font-size: 12px;
          color: var(--text-muted);
          font-family: monospace;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .gs-item-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .gs-item-action {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .gs-item-action:hover {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }
      `}</style>

      <div className="gs-backdrop" onClick={() => setIsOpen(false)}>
        <div className="gs-modal" onClick={(e) => e.stopPropagation()}>
          {/* INPUT + FILTROS */}
          <div className="gs-input-wrap">
            <span style={{ fontSize: '20px' }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              className="gs-input"
              placeholder={
                loading
                  ? 'Cargando datos...'
                  : `Buscar por cédula o nombre... (${usuarios.length} empleados)`
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {loading && <div className="gs-spinner"></div>}

            <button
              className={`gs-filter-btn ${showFilters || filtrosActivos > 0 ? 'active' : ''}`}
              onClick={() => setShowFilters((prev) => !prev)}
              title="Filtros avanzados"
            >
              <IconoFiltro size={14} />
              Filtros
              {filtrosActivos > 0 && (
                <span className="gs-filter-badge">{filtrosActivos}</span>
              )}
            </button>

            <span className="gs-kbd">ESC</span>
          </div>

          {/* PANEL DE FILTROS */}
          {showFilters && (
            <div className="gs-filters-panel">
              {/* Estado */}
              <div className="gs-filter-group">
                <span className="gs-filter-label">Estado:</span>
                <button
                  className={`gs-filter-chip ${filtroEstado === 'todos' ? 'active' : ''}`}
                  onClick={() => setFiltroEstado('todos')}
                >
                  Todos
                </button>
                <button
                  className={`gs-filter-chip ${filtroEstado === 'activos' ? 'active' : ''}`}
                  onClick={() => setFiltroEstado('activos')}
                >
                  ✅ Activos
                </button>
                <button
                  className={`gs-filter-chip ${filtroEstado === 'inactivos' ? 'active' : ''}`}
                  onClick={() => setFiltroEstado('inactivos')}
                >
                  ❌ Inactivos
                </button>
              </div>

              {/* Asignación */}
              <div className="gs-filter-group">
                <span className="gs-filter-label">Asignación:</span>
                <button
                  className={`gs-filter-chip ${filtroAsignacion === 'todos' ? 'active' : ''}`}
                  onClick={() => setFiltroAsignacion('todos')}
                >
                  Todos
                </button>
                <button
                  className={`gs-filter-chip ${filtroAsignacion === 'con' ? 'active' : ''}`}
                  onClick={() => setFiltroAsignacion('con')}
                >
                  📅 Con horario
                </button>
                <button
                  className={`gs-filter-chip ${filtroAsignacion === 'sin' ? 'active' : ''}`}
                  onClick={() => setFiltroAsignacion('sin')}
                >
                  🚫 Sin horario
                </button>
              </div>

              {/* Horario */}
              <div className="gs-filter-group">
                <span className="gs-filter-label">Horario:</span>
                <select
                  className="gs-filter-select"
                  value={filtroHorario}
                  onChange={(e) => setFiltroHorario(e.target.value)}
                >
                  <option value="todos">Todos los horarios</option>
                  {horariosUnicos.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Día libre */}
              <div className="gs-filter-group">
                <span className="gs-filter-label">Día libre:</span>
                <select
                  className="gs-filter-select"
                  value={filtroDiaLibre}
                  onChange={(e) => setFiltroDiaLibre(e.target.value)}
                >
                  <option value="todos">Cualquier día</option>
                  {DIAS_SEMANA.map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </option>
                  ))}
                </select>

                {filtrosActivos > 0 && (
                  <button
                    className="gs-clear-filters"
                    onClick={limpiarFiltros}
                  >
                    ✕ Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          )}

          {/* BODY */}
          <div className="gs-body">
            {/* Historial */}
            {historial.length > 0 && !query && filtrosActivos === 0 && (
              <div>
                <p
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: '700',
                    letterSpacing: '0.4px',
                  }}
                >
                  Búsquedas recientes
                </p>
                <div className="gs-historial">
                  {historial.map((c, i) => (
                    <button
                      key={i}
                      className="gs-chip"
                      onClick={() => setQuery(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Estado inicial */}
            {!query && filtrosActivos === 0 && historial.length === 0 && !loading && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 20px',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔎</div>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Busca por cédula o nombre, o usa los filtros
                </p>
                <p style={{ margin: '6px 0 0 0', fontSize: '11px' }}>
                  Atajo: <span className="gs-kbd">Ctrl</span>{' '}
                  <span className="gs-kbd">K</span>
                </p>
              </div>
            )}

            {/* Query muy corta */}
            {query && query.length < 3 && filtrosActivos === 0 && (
              <p
                style={{
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  padding: '20px',
                }}
              >
                Sigue escribiendo... (mínimo 3 caracteres)
              </p>
            )}

            {/* Sin resultados */}
            {!loading &&
              filtrosActivos > 0 &&
              resultadosFiltrados.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '30px 20px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                  <p style={{ margin: 0, fontSize: '13px' }}>
                    No hay empleados que coincidan con los filtros
                  </p>
                </div>
              )}

            {/* Resultado detallado (query sin filtros) */}
            {mostrarDetalle && resultadoDetallado && (
              <div className="gs-result-card">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'var(--primary-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconoUsuario color="var(--primary)" size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {resultadoDetallado.nombre}
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: '13px',
                        color: 'var(--text-muted)',
                        fontFamily: 'monospace',
                      }}
                    >
                      Cédula: {resultadoDetallado.cedula}
                    </p>
                  </div>
                  <Badge
                    variant={resultadoDetallado.activo ? 'success' : 'danger'}
                    size="md"
                    dot
                  >
                    {resultadoDetallado.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <div className="gs-info-row">
                    <span className="gs-info-label">Horario asignado</span>
                    <span className="gs-info-value">
                      {resultadoDetallado.asignacion?.horarioNombre || (
                        <span style={{ color: 'var(--text-muted)' }}>
                          Sin asignar
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="gs-info-row">
                    <span className="gs-info-label">Días libres fijos</span>
                    <span className="gs-info-value">
                      {resultadoDetallado.asignacion?.diasLibresFijos?.length >
                      0
                        ? resultadoDetallado.asignacion.diasLibresFijos.join(
                            ', ',
                          )
                        : '—'}
                    </span>
                  </div>

                  {resultadoDetallado.rotativos.length > 0 && (
                    <div className="gs-info-row">
                      <span className="gs-info-label">
                        Semanas con rotativos
                      </span>
                      <span className="gs-info-value">
                        {resultadoDetallado.rotativos.length} semana(s)
                      </span>
                    </div>
                  )}

                  <div className="gs-info-row">
                    <span className="gs-info-label">Entrada / Salida</span>
                    <span className="gs-info-value">
                      {resultadoDetallado.asignacion
                        ? `${resultadoDetallado.asignacion.entrada} - ${resultadoDetallado.asignacion.salida}`
                        : '—'}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    className="gs-action-btn"
                    onClick={() =>
                      handleAbrirReporte({
                        cedula: resultadoDetallado.cedula,
                        nombre: resultadoDetallado.nombre,
                      })
                    }
                  >
                    📊 Ver historial completo
                  </button>
                  <button
                    className="gs-action-btn secondary"
                    onClick={() => handleCopiar(resultadoDetallado.cedula)}
                  >
                    📋 Copiar cédula
                  </button>
                  <button
                    className="gs-action-btn secondary"
                    onClick={() => setIsOpen(false)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            {/* 🔍 Query sin match + sin filtros */}
            {!loading &&
              filtrosActivos === 0 &&
              tieneQueryValida &&
              resultadoDetallado &&
              !resultadoDetallado.encontrado && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '30px 20px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                    📭
                  </div>
                  <p style={{ margin: 0, fontSize: '13px' }}>
                    No se encontró ningún empleado con "{query}"
                  </p>
                </div>
              )}

            {/* 📋 LISTA de resultados (con filtros activos o búsqueda por nombre) */}
            {!loading &&
              filtrosActivos > 0 &&
              resultadosFiltrados.length > 0 && (
                <div>
                  <p className="gs-list-count">
                    Resultados: <strong>{resultadosFiltrados.length}</strong>{' '}
                    {resultadosFiltrados.length === 1
                      ? 'empleado'
                      : 'empleados'}
                  </p>

                  <div className="gs-list">
                    {resultadosFiltrados.slice(0, 50).map((u, i) => {
                      const cedula = String(
                        u.employeeNo || u.employeeId || u.cedula || u.id || '',
                      );
                      const asignacion = asignaciones.find(
                        (a) => String(a.employeeId) === cedula,
                      );
                      const activo =
                        u.activo !== false &&
                        u.activo !== 0 &&
                        u.activo !== 'false';

                      return (
                        <div
                          key={i}
                          className="gs-item"
                          onClick={() =>
                            handleAbrirReporte({
                              cedula,
                              nombre: u.name || u.nombre || 'Sin nombre',
                            })
                          }
                        >
                          <div className="gs-item-icon">
                            <IconoUsuario color="var(--primary)" size={18} />
                          </div>
                          <div className="gs-item-info">
                            <p className="gs-item-name">
                              {u.name || u.nombre || 'Sin nombre'}
                            </p>
                            <p className="gs-item-meta">
                              <span>{cedula}</span>
                              {asignacion?.horarioNombre && (
                                <span>⏰ {asignacion.horarioNombre}</span>
                              )}
                              {!asignacion && (
                                <span style={{ fontStyle: 'italic' }}>
                                  Sin horario
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="gs-item-right">
                            <Badge
                              variant={activo ? 'success' : 'danger'}
                              size="sm"
                              dot
                            >
                              {activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <button
                              className="gs-item-action"
                              title="Ver reporte individual"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAbrirReporte({
                                  cedula,
                                  nombre: u.name || u.nombre || 'Sin nombre',
                                });
                              }}
                            >
                              📊
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {resultadosFiltrados.length > 50 && (
                    <p
                      style={{
                        textAlign: 'center',
                        padding: '12px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                      }}
                    >
                      Mostrando 50 de {resultadosFiltrados.length} resultados
                      · Refina tu búsqueda
                    </p>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* 📄 MODAL DE REPORTE INDIVIDUAL */}
      {reporteOpen && reporteEmpleado && (
        <ReporteIndividualModal
          isOpen={reporteOpen}
          employeeId={reporteEmpleado.cedula}
          nombre={reporteEmpleado.nombre}
          onClose={() => setReporteOpen(false)}
        />
      )}
    </>
  );
}