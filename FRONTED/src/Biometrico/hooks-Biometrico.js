// src/hooks/useBiometrico.js
import { useState, useEffect, useCallback } from 'react';
import api from '../servicio/Api';

export function useBiometrico() {
  // Estados
  const [usuarios, setUsuarios] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [archivoExcel, setArchivoExcel] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('usuarios');
  const [cedulaBusqueda, setCedulaBusqueda] = useState('');
  const [eventosEmpleado, setEventosEmpleado] = useState(null);
  const [registrosFecha, setRegistrosFecha] = useState(null);
  const [fechaUnica, setFechaUnica] = useState('');
  const [marcajesFechaUnica, setMarcajesFechaUnica] = useState(null);
  const [marcajesHoy, setMarcajesHoy] = useState([]);

  // ✅ Formateo de hora (MEJORADO)
  const formatearHoraDesdeTimestamp = useCallback((timestamp, fallbackHora) => {
  // Si fallbackHora existe y tiene AM/PM, devolverlo tal cual
      if (fallbackHora && typeof fallbackHora === 'string') {
        if (fallbackHora.includes('a. m.') || fallbackHora.includes('p. m.')) {
          return fallbackHora.trim();
        }
        // Si no tiene AM/PM, extraer la hora y convertirla
        const match = fallbackHora.match(/(\d{1,2}):(\d{2}):(\d{2})/);
        if (match) {
          let h = parseInt(match[1], 10);
          const min = match[2];
          const s = match[3];
          const ampm = h >= 12 ? 'p. m.' : 'a. m.';
          h = h % 12 || 12;
          return `${String(h).padStart(2, '0')}:${min}:${s} ${ampm}`;
        }
        return fallbackHora.trim();
      }

      // Si no hay fallbackHora, usar timestamp (con hora LOCAL)
      if (timestamp) {
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) {
          let h = d.getHours(); // Hora local del navegador
          const min = String(d.getMinutes()).padStart(2, '0');
          const s = String(d.getSeconds()).padStart(2, '0');
          const ampm = h >= 12 ? 'p. m.' : 'a. m.';
          h = h % 12 || 12;
          return `${String(h).padStart(2, '0')}:${min}:${s} ${ampm}`;
        }
      }
      return 'N/A';
    }, []);
  // Verificar estado del backend
  const checkStatusAutomatico = useCallback(async () => {
    try {
      const res = await api.get('/biometrico/status');
      setIsOnline(Boolean(res.data?.online));
    } catch {
      setIsOnline(false);
    }
  }, []);

  // ⭐ Cargar marcajes de hoy con formato YYYY-MM-DD (ISO)
  const cargarMarcajesHoy = useCallback(async () => {
    try {
      const hoy = new Date();
      const dia = String(hoy.getDate()).padStart(2, '0');
      const mes = String(hoy.getMonth() + 1).padStart(2, '0');
      const anio = hoy.getFullYear();
      const fechaStr = `${anio}-${mes}-${dia}`;

      console.log(`📅 [cargarMarcajesHoy] Consultando para hoy (${fechaStr})...`);

      const res = await api.get(`/biometrico/marcajes/${fechaStr}`);
      console.log('📦 [cargarMarcajesHoy] Respuesta completa:', res);
      console.log('📦 [cargarMarcajesHoy] res.data:', res.data);

      // Extraer marcajes
      let marcajes = res.data?.marcajes || [];
      if (!Array.isArray(marcajes)) {
        console.warn('⚠️ [cargarMarcajesHoy] No es un arreglo, convirtiendo...');
        marcajes = [];
      }

      console.log('✅ [cargarMarcajesHoy] Marcajes extraídos:', marcajes);
      setMarcajesHoy(marcajes);
    } catch (error) {
      console.error('❌ [cargarMarcajesHoy] Error:', error);
      setMarcajesHoy([]);
    }
  }, []);

  // ⭐ Cargar todos los datos (usuarios, stats, marcajes de hoy)
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 [cargarDatos] Iniciando carga...');

      const [resUsers, resStats] = await Promise.all([
        api.get('/biometrico/list-all-users'),
        api.get('/biometrico/stats')
      ]);

      console.log('📦 [cargarDatos] resUsers (completo):', resUsers);
      console.log('📦 [cargarDatos] resUsers.data:', resUsers.data);

      // EXTRAER USUARIOS DE LA RESPUESTA
      let usuariosData = [];
      if (resUsers.data) {
        if (Array.isArray(resUsers.data.usuarios)) {
          usuariosData = resUsers.data.usuarios;
        } else if (Array.isArray(resUsers.data)) {
          usuariosData = resUsers.data;
        } else {
          for (let key in resUsers.data) {
            if (Array.isArray(resUsers.data[key])) {
              console.log(`🔍 [cargarDatos] Encontrado arreglo en la propiedad "${key}"`);
              usuariosData = resUsers.data[key];
              break;
            }
          }
        }
      }

      console.log('👥 [cargarDatos] Usuarios crudos:', usuariosData);

      const usuariosConEstado = usuariosData.map(u => ({
        ...u,
        activo: u.activo !== undefined ? u.activo : true
      }));

      console.log('👥 [cargarDatos] Usuarios con estado:', usuariosConEstado);
      setUsuarios(usuariosConEstado);

      setStats(resStats.data || null);

      await cargarMarcajesHoy();

      setIsOnline(true);
      console.log('✅ [cargarDatos] Carga completada exitosamente');
    } catch (error) {
      console.error('❌ [cargarDatos] Error:', error);
      setMensaje('Error al cargar los datos del biométrico.');
      setIsOnline(false);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [cargarMarcajesHoy]);

  // ---------- FUNCIONES DE ACCIONES ----------
  const handleSincronizarHoy = useCallback(async () => {
    try {
      setMensaje('Sincronizando marcajes de hoy...');
      await cargarMarcajesHoy();
      setMensaje('Sincronización de hoy completada.');
      setIsOnline(true);
    } catch {
      setMensaje('Error sincronizando hoy.');
      setIsOnline(false);
    }
  }, [cargarMarcajesHoy]);

  const handleSincronizarAyer = useCallback(async () => {
    try {
      setMensaje('Sincronizando marcajes de ayer...');
      await api.post('/biometrico/sync-yesterday');
      setMensaje('Sincronización de ayer completada con éxito.');
      setIsOnline(true);
      cargarDatos();
    } catch {
      setMensaje('Error sincronizando ayer.');
      setIsOnline(false);
    }
  }, [cargarDatos]);

  const handleLimpiarDuplicados = useCallback(async () => {
    try {
      setMensaje('Limpiando registros duplicados...');
      const res = await api.get('/biometrico/clean-duplicates');
      setMensaje(res.data.message || 'Duplicados limpiados con éxito.');
      cargarDatos();
    } catch {
      setMensaje('Error al limpiar duplicados.');
    }
  }, [cargarDatos]);

  const handleLimpiarCache = useCallback(async () => {
    try {
      setMensaje('Limpiando caché...');
      const res = await api.get('/biometrico/clear-cache');
      setMensaje(res.data.message || 'Caché limpiada exitosamente.');
    } catch {
      setMensaje('Error al limpiar la caché.');
    }
  }, []);

  const handleEliminarUsuario = useCallback(async (employeeNo) => {
    if (!window.confirm(`¿Seguro que deseas desactivar al usuario con cédula ${employeeNo}?`)) return;
    try {
      setMensaje(`Desactivando usuario ${employeeNo}...`);
      await api.delete(`/biometrico/delete-user/${employeeNo}`);
      setMensaje('Usuario desactivado con éxito.');
      setUsuarios(prevUsuarios =>
        prevUsuarios.map(u =>
          String(u.employeeNo || u.cedula) === String(employeeNo)
            ? { ...u, activo: false }
            : u
        )
      );
      setMarcajesHoy(prev =>
        prev.filter(m => String(m.employeeId || m.empleadoId) !== String(employeeNo))
      );
    } catch (error) {
      console.error(error);
      setMensaje('Error al intentar desactivar el usuario.');
    }
  }, []);

  const handleSubirExcel = useCallback(async (e) => {
    e.preventDefault();
    if (!archivoExcel) {
      setMensaje('Por favor selecciona un archivo Excel primero.');
      return;
    }
    const formData = new FormData();
    formData.append('file', archivoExcel);
    try {
      setMensaje('Procesando carga masiva...');
      const res = await api.post('/biometrico/import-users', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMensaje(`Carga exitosa: ${res.data.creados || 0} creados, ${res.data.actualizados || 0} actualizados.`);
      setArchivoExcel(null);
      cargarDatos();
    } catch {
      setMensaje('Error al procesar el archivo Excel.');
    }
  }, [archivoExcel, cargarDatos]);

  const buscarEventosPorCedula = useCallback(async (e) => {
    e.preventDefault();
    if (!cedulaBusqueda) return;
    try {
      setLoading(true);
      const res = await api.get(`/biometrico/events?employeeId=${cedulaBusqueda}`);
      setEventosEmpleado(res.data);
      setMensaje(`Resultados cargados para la cédula: ${cedulaBusqueda}`);
    } catch {
      setMensaje('No se encontraron eventos para esta cédula.');
      setEventosEmpleado(null);
    } finally {
      setLoading(false);
    }
  }, [cedulaBusqueda]);

  const cargarRegistrosPorFecha = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/biometrico/records-by-date');
      console.log('📦 [cargarRegistrosPorFecha] Respuesta completa:', res.data);
      setRegistrosFecha(res.data);
      console.log('✅ [cargarRegistrosPorFecha] registrosFecha actualizado:', res.data);
    } catch {
      setMensaje('Error al obtener registros por fecha.');
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarPorFechaEspecifica = useCallback(async (e) => {
    e.preventDefault();
    if (!fechaUnica) {
      setMensaje('Por favor selecciona una fecha.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/biometrico/marcajes/${fechaUnica}`);
      setMarcajesFechaUnica(res.data);
      setMensaje(`Marcajes cargados para la fecha: ${fechaUnica}`);
    } catch {
      setMensaje('Error al consultar marcajes para esta fecha.');
      setMarcajesFechaUnica(null);
    } finally {
      setLoading(false);
    }
  }, [fechaUnica]);

  // ---------- EFECTOS ----------
  useEffect(() => {
  cargarDatos();
  const timerStatus = setInterval(checkStatusAutomatico, 8000);
  const timerSync = setInterval(cargarMarcajesHoy, 10000);
  
  // Nuevo intervalo para recargar historial cada 10s
  const timerHistory = setInterval(() => {
    // Solo recargar si la vista activa es "marcajes"
    if (vistaActiva === 'marcajes') {
      cargarRegistrosPorFecha();
    }
  }, 10000);

  return () => {
    clearInterval(timerStatus);
    clearInterval(timerSync);
    clearInterval(timerHistory);
  };
}, [cargarDatos, checkStatusAutomatico, cargarMarcajesHoy, cargarRegistrosPorFecha, vistaActiva]);

  // ---------- ESTADOS DERIVADOS ----------
  const usuariosActivos = usuarios.filter(u => u.activo === true);
  const usuariosInactivos = usuarios.filter(u => u.activo === false);

  console.log('📊 TOTAL USUARIOS (todos):', usuarios.length);
  console.log('✅ USUARIOS ACTIVOS:', usuariosActivos.length);
  console.log('🚫 USUARIOS INACTIVOS:', usuariosInactivos.length);

  const cedulasMarcadasSet = new Set(
    marcajesHoy.map(m => String(m.employeeId || m.empleadoId || '').trim())
  );

  console.log('🔑 Cédulas que marcaron hoy:', Array.from(cedulasMarcadasSet));

  const usuariosMarcados = usuariosActivos.filter(u =>
    cedulasMarcadasSet.has(String(u.employeeNo || u.cedula || '').trim())
  );

  const usuariosPendientes = usuariosActivos.filter(u =>
    !cedulasMarcadasSet.has(String(u.employeeNo || u.cedula || '').trim())
  );

  console.log('👥 USUARIOS MARCADOS HOY:', usuariosMarcados.length);
  console.log('⏳ USUARIOS PENDIENTES:', usuariosPendientes.length);

  // ---------- RETORNO ----------
  return {
    usuarios,
    usuariosActivos,
    usuariosInactivos,
    stats,
    loading,
    isOnline,
    mensaje,
    setMensaje,
    archivoExcel,
    setArchivoExcel,
    vistaActiva,
    setVistaActiva,
    cedulaBusqueda,
    setCedulaBusqueda,
    eventosEmpleado,
    registrosFecha,
    fechaUnica,
    setFechaUnica,
    marcajesFechaUnica,
    marcajesHoy,
    usuariosMarcados,
    usuariosPendientes,
    formatearHoraDesdeTimestamp,
    cargarDatos,
    handleSincronizarHoy,
    handleSincronizarAyer,
    handleLimpiarDuplicados,
    handleLimpiarCache,
    handleEliminarUsuario,
    handleSubirExcel,
    buscarEventosPorCedula,
    cargarRegistrosPorFecha,
    buscarPorFechaEspecifica,
  };
}