// src/hooks/useBiometrico.js
import { useState, useEffect, useCallback } from 'react';
import api from '../servicio/Api';
import { useNotificaciones } from '../Componentes/Context/Notificaciones';

export function useBiometrico() {
  // 🔔 Notificaciones
  const { agregarNotificacion } = useNotificaciones();

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

  // ✅ Formateo de hora
  const formatearHoraDesdeTimestamp = useCallback((timestamp, fallbackHora) => {
    if (fallbackHora && typeof fallbackHora === 'string') {
      if (fallbackHora.includes('a. m.') || fallbackHora.includes('p. m.')) {
        return fallbackHora.trim();
      }
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

    if (timestamp) {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        let h = d.getHours();
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

  // ⭐ Cargar marcajes de hoy
  const cargarMarcajesHoy = useCallback(async () => {
    try {
      const hoy = new Date();
      const dia = String(hoy.getDate()).padStart(2, '0');
      const mes = String(hoy.getMonth() + 1).padStart(2, '0');
      const anio = hoy.getFullYear();
      const fechaStr = `${anio}-${mes}-${dia}`;

      console.log(`📅 [cargarMarcajesHoy] Consultando para hoy (${fechaStr})...`);

      const res = await api.get(`/biometrico/marcajes/${fechaStr}`);
      console.log('📦 [cargarMarcajesHoy] res.data:', res.data);

      let marcajes = res.data?.marcajes || [];
      if (!Array.isArray(marcajes)) {
        console.warn('⚠️ [cargarMarcajesHoy] No es un arreglo, convirtiendo...');
        marcajes = [];
      }

      console.log('✅ [cargarMarcajesHoy] Marcajes extraídos:', marcajes);
      setMarcajesHoy(marcajes);
      return marcajes;
    } catch (error) {
      console.error('❌ [cargarMarcajesHoy] Error:', error);
      setMarcajesHoy([]);
      return [];
    }
  }, []);

  // ⭐ Cargar todos los datos (con parámetro manual para notificar)
  const cargarDatos = useCallback(
    async (manual = false) => {
      try {
        setLoading(true);
        console.log('🔄 [cargarDatos] Iniciando carga...');

        const [resUsers, resStats] = await Promise.all([
          api.get('/biometrico/list-all-users'),
          api.get('/biometrico/stats'),
        ]);

        console.log('📦 [cargarDatos] resUsers.data:', resUsers.data);

        let usuariosData = [];
        if (resUsers.data) {
          if (Array.isArray(resUsers.data.usuarios)) {
            usuariosData = resUsers.data.usuarios;
          } else if (Array.isArray(resUsers.data)) {
            usuariosData = resUsers.data;
          } else {
            for (let key in resUsers.data) {
              if (Array.isArray(resUsers.data[key])) {
                console.log(`🔍 [cargarDatos] Encontrado arreglo en "${key}"`);
                usuariosData = resUsers.data[key];
                break;
              }
            }
          }
        }

        console.log('👥 [cargarDatos] Usuarios crudos:', usuariosData);

        const usuariosConEstado = usuariosData.map((u) => ({
          ...u,
          activo: u.activo !== undefined ? u.activo : true,
        }));

        setUsuarios(usuariosConEstado);
        setStats(resStats.data || null);

        await cargarMarcajesHoy();

        setIsOnline(true);
        console.log('✅ [cargarDatos] Carga completada exitosamente');

        // 🔔 Notificación SOLO si es refresco manual
        if (manual) {
          agregarNotificacion({
            tipo: 'info',
            titulo: 'Datos actualizados',
            mensaje: `${usuariosConEstado.length} empleados cargados correctamente.`,
          });
        }
      } catch (error) {
        console.error('❌ [cargarDatos] Error:', error);
        setMensaje('Error al cargar los datos del biométrico.');
        setIsOnline(false);
        setUsuarios([]);

        if (manual) {
          agregarNotificacion({
            tipo: 'error',
            titulo: 'Error al refrescar',
            mensaje: 'No se pudieron cargar los datos del biométrico.',
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [cargarMarcajesHoy, agregarNotificacion],
  );

  // ---------- FUNCIONES DE ACCIONES ----------
  const handleSincronizarHoy = useCallback(async () => {
    try {
      setMensaje('Sincronizando marcajes de hoy...');
      const marcajes = await cargarMarcajesHoy();
      setMensaje('Sincronización de hoy completada.');
      setIsOnline(true);

      agregarNotificacion({
        tipo: 'success',
        titulo: 'Sincronización completada',
        mensaje: `Se sincronizaron ${marcajes.length} marcajes de hoy.`,
      });
    } catch {
      setMensaje('Error sincronizando hoy.');
      setIsOnline(false);

      agregarNotificacion({
        tipo: 'error',
        titulo: 'Error al sincronizar',
        mensaje: 'No se pudieron obtener los marcajes de hoy.',
      });
    }
  }, [cargarMarcajesHoy, agregarNotificacion]);

  const handleSincronizarAyer = useCallback(async () => {
    try {
      setMensaje('Sincronizando marcajes de ayer...');
      const res = await api.post('/biometrico/sync-yesterday');
      setMensaje('Sincronización de ayer completada con éxito.');
      setIsOnline(true);
      cargarDatos();

      const cantidad = res.data?.total || res.data?.cantidad || 0;
      agregarNotificacion({
        tipo: 'success',
        titulo: 'Sincronización de ayer',
        mensaje: cantidad
          ? `Se sincronizaron ${cantidad} marcajes de ayer.`
          : 'Marcajes de ayer sincronizados correctamente.',
      });
    } catch {
      setMensaje('Error sincronizando ayer.');
      setIsOnline(false);

      agregarNotificacion({
        tipo: 'error',
        titulo: 'Error al sincronizar',
        mensaje: 'No se pudieron obtener los marcajes de ayer.',
      });
    }
  }, [cargarDatos, agregarNotificacion]);

  const handleLimpiarDuplicados = useCallback(async () => {
    try {
      setMensaje('Limpiando registros duplicados...');
      const res = await api.get('/biometrico/clean-duplicates');
      const msg = res.data.message || 'Duplicados limpiados con éxito.';
      setMensaje(msg);
      cargarDatos();

      agregarNotificacion({
        tipo: 'success',
        titulo: 'Limpieza de duplicados',
        mensaje: msg,
      });
    } catch {
      setMensaje('Error al limpiar duplicados.');

      agregarNotificacion({
        tipo: 'error',
        titulo: 'Error al limpiar',
        mensaje: 'No se pudieron limpiar los duplicados.',
      });
    }
  }, [cargarDatos, agregarNotificacion]);

  const handleLimpiarCache = useCallback(async () => {
    try {
      setMensaje('Limpiando caché...');
      const res = await api.get('/biometrico/clear-cache');
      const msg = res.data.message || 'Caché limpiada exitosamente.';
      setMensaje(msg);

      agregarNotificacion({
        tipo: 'info',
        titulo: 'Caché limpiada',
        mensaje: msg,
      });
    } catch {
      setMensaje('Error al limpiar la caché.');

      agregarNotificacion({
        tipo: 'error',
        titulo: 'Error al limpiar caché',
        mensaje: 'No se pudo limpiar la caché del biométrico.',
      });
    }
  }, [agregarNotificacion]);

  // 🔴 Desactivar usuario (con skipConfirm para evitar doble confirmación)
  const handleEliminarUsuario = useCallback(
    async (employeeNo, options = {}) => {
      const { skipConfirm = false } = options;

      if (
        !skipConfirm &&
        !window.confirm(
          `¿Seguro que deseas desactivar al usuario con cédula ${employeeNo}?`,
        )
      )
        return;

      try {
        setMensaje(`Desactivando usuario ${employeeNo}...`);
        await api.delete(`/biometrico/delete-user/${employeeNo}`);
        setMensaje('Usuario desactivado con éxito.');
        setUsuarios((prevUsuarios) =>
          prevUsuarios.map((u) =>
            String(u.employeeNo || u.cedula) === String(employeeNo)
              ? { ...u, activo: false }
              : u,
          ),
        );
        setMarcajesHoy((prev) =>
          prev.filter(
            (m) => String(m.employeeId || m.empleadoId) !== String(employeeNo),
          ),
        );

        agregarNotificacion({
          tipo: 'warning',
          titulo: 'Empleado desactivado',
          mensaje: `El empleado ${employeeNo} fue desactivado del biométrico.`,
        });
      } catch (error) {
        console.error(error);
        setMensaje('Error al intentar desactivar el usuario.');

        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al desactivar',
          mensaje: `No se pudo desactivar al empleado ${employeeNo}.`,
        });
      }
    },
    [agregarNotificacion],
  );

  // 🟢 Activar usuario (con skipConfirm para evitar doble confirmación)
  const handleActivarUsuario = useCallback(
    async (employeeNo, options = {}) => {
      const { skipConfirm = false } = options;

      if (
        !skipConfirm &&
        !window.confirm(
          `¿Reactivar al usuario con cédula ${employeeNo}? Podrá volver a marcar en el biométrico.`,
        )
      )
        return;

      try {
        setMensaje(`Activando usuario ${employeeNo}...`);
        await api.post(`/biometrico/activate-user/${employeeNo}`);
        setMensaje('Usuario activado con éxito.');

        setUsuarios((prevUsuarios) =>
          prevUsuarios.map((u) =>
            String(u.employeeNo || u.cedula) === String(employeeNo)
              ? { ...u, activo: true }
              : u,
          ),
        );

        cargarDatos();

        agregarNotificacion({
          tipo: 'success',
          titulo: 'Empleado activado',
          mensaje: `El empleado ${employeeNo} fue reactivado correctamente.`,
        });
      } catch (error) {
        console.error(error);
        setMensaje('Error al intentar activar el usuario.');

        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al activar',
          mensaje: `No se pudo activar al empleado ${employeeNo}.`,
        });
      }
    },
    [cargarDatos, agregarNotificacion],
  );

  const handleSubirExcel = useCallback(
    async (e) => {
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

        const creados = res.data.creados || 0;
        const actualizados = res.data.actualizados || 0;
        setMensaje(
          `Carga exitosa: ${creados} creados, ${actualizados} actualizados.`,
        );
        setArchivoExcel(null);
        cargarDatos();

        agregarNotificacion({
          tipo: 'success',
          titulo: 'Importación completada',
          mensaje: `${creados} empleados creados · ${actualizados} actualizados.`,
        });
      } catch {
        setMensaje('Error al procesar el archivo Excel.');

        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al importar Excel',
          mensaje: 'No se pudo procesar el archivo. Revisa el formato.',
        });
      }
    },
    [archivoExcel, cargarDatos, agregarNotificacion],
  );

  const buscarEventosPorCedula = useCallback(
    async (e) => {
      e.preventDefault();
      if (!cedulaBusqueda) return;
      try {
        setLoading(true);
        const res = await api.get(
          `/biometrico/events?employeeId=${cedulaBusqueda}`,
        );
        setEventosEmpleado(res.data);
        setMensaje(`Resultados cargados para la cédula: ${cedulaBusqueda}`);
      } catch {
        setMensaje('No se encontraron eventos para esta cédula.');
        setEventosEmpleado(null);
      } finally {
        setLoading(false);
      }
    },
    [cedulaBusqueda],
  );

  const cargarRegistrosPorFecha = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/biometrico/records-by-date');
      console.log('📦 [cargarRegistrosPorFecha] res.data:', res.data);
      setRegistrosFecha(res.data);
    } catch {
      setMensaje('Error al obtener registros por fecha.');
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarPorFechaEspecifica = useCallback(
    async (e) => {
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
    },
    [fechaUnica],
  );

  // ---------- EFECTOS ----------
  useEffect(() => {
    cargarDatos();
    const timerStatus = setInterval(checkStatusAutomatico, 8000);
    const timerSync = setInterval(cargarMarcajesHoy, 10000);

    const timerHistory = setInterval(() => {
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
  const usuariosActivos = usuarios.filter((u) => u.activo === true);
  const usuariosInactivos = usuarios.filter((u) => u.activo === false);

  const cedulasMarcadasSet = new Set(
    marcajesHoy.map((m) => String(m.employeeId || m.empleadoId || '').trim())
  );

  const usuariosMarcados = usuariosActivos.filter((u) =>
    cedulasMarcadasSet.has(String(u.employeeNo || u.cedula || '').trim())
  );

  const usuariosPendientes = usuariosActivos.filter(
    (u) => !cedulasMarcadasSet.has(String(u.employeeNo || u.cedula || '').trim())
  );

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
    handleActivarUsuario,
    handleSubirExcel,
    buscarEventosPorCedula,
    cargarRegistrosPorFecha,
    buscarPorFechaEspecifica,
  };
}
