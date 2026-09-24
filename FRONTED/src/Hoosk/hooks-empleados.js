// src/Hoosk/hooks-empleados.js
import { useState, useCallback } from 'react';
import api from '../servicio/Api';
import { useNotificaciones } from '../Componentes/Context/Notificaciones';

export function useEmpleados() {
  const { agregarNotificacion } = useNotificaciones();

  const [empleados, setEmpleados] = useState([]);
  const [empleadoActual, setEmpleadoActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // =========================================================
  // 📋 LISTAR TODOS
  // =========================================================
  const listarEmpleados = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/empleados/Obtener-Empleados');
      const lista = res.data?.empleados || res.data || [];
      setEmpleados(Array.isArray(lista) ? lista : []);
      return lista;
    } catch (err) {
      console.error(err);
      setMensaje('Error al cargar empleados.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // 🔍 VER UNO
  // =========================================================
  const verEmpleado = useCallback(async (cedula) => {
    setLoading(true);
    try {
      const res = await api.get(`/empleados/Obtener-Empleado/${cedula}`);
      const data = res.data?.empleado || res.data;
      setEmpleadoActual(data);
      return data;
    } catch (err) {
      console.error(err);
      setMensaje('Error al cargar empleado.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // ✏️ ACTUALIZAR
  // =========================================================
  const actualizarEmpleado = useCallback(
    async (dto) => {
      setLoading(true);
      try {
        const res = await api.patch('/empleados/Actualizar-Empleado', dto);
        setMensaje('✅ Empleado actualizado correctamente.');
        await listarEmpleados();

        agregarNotificacion({
          tipo: 'success',
          titulo: 'Empleado actualizado',
          mensaje: `Se actualizó ${dto.cedula}`,
        });

        return res.data;
      } catch (err) {
        console.error(err);
        setMensaje('Error al actualizar empleado.');
        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al actualizar',
          mensaje: err.response?.data?.message || err.message,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [listarEmpleados, agregarNotificacion],
  );

  // =========================================================
  // 🚫 DESACTIVAR
  // =========================================================
  const desactivarEmpleado = useCallback(
    async (cedula) => {
      setLoading(true);
      try {
        const res = await api.patch(`/empleados/Desactivar-Empleado/${cedula}`);
        setMensaje('✅ Empleado desactivado.');
        await listarEmpleados();

        agregarNotificacion({
          tipo: 'warning',
          titulo: 'Empleado desactivado',
          mensaje: `Cédula ${cedula} fue desactivada.`,
        });

        return res.data;
      } catch (err) {
        console.error(err);
        setMensaje('Error al desactivar empleado.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [listarEmpleados, agregarNotificacion],
  );

  // =========================================================
  // 🗑️ ELIMINAR (soft delete)
  // =========================================================
  const eliminarEmpleado = useCallback(
    async (cedula) => {
      setLoading(true);
      try {
        const res = await api.delete(`/empleados/Eliminar-Empleado/${cedula}`);
        setMensaje('✅ Empleado eliminado (soft delete).');
        await listarEmpleados();

        agregarNotificacion({
          tipo: 'warning',
          titulo: 'Empleado eliminado',
          mensaje: `Cédula ${cedula} fue eliminada.`,
        });

        return res.data;
      } catch (err) {
        console.error(err);
        setMensaje('Error al eliminar empleado.');
        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al eliminar',
          mensaje: err.response?.data?.message || err.message,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [listarEmpleados, agregarNotificacion],
  );

  // =========================================================
  // ➕ CREAR
  // =========================================================
  const crearEmpleado = useCallback(
    async (nombreCargo, dto) => {
      setLoading(true);
      try {
        const res = await api.post(
          `/empleados/crear-empleado/${encodeURIComponent(nombreCargo)}`,
          dto,
        );
        setMensaje('✅ Empleado creado correctamente.');
        await listarEmpleados();

        agregarNotificacion({
          tipo: 'success',
          titulo: 'Empleado creado',
          mensaje: `Se creó ${dto.nombre} ${dto.apellido} (${dto.cedula})`,
        });

        return res.data;
      } catch (err) {
        console.error(err);
        setMensaje('Error al crear empleado.');
        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al crear',
          mensaje: err.response?.data?.message || err.message,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [listarEmpleados, agregarNotificacion],
  );

  const limpiarEmpleadoActual = useCallback(() => {
    setEmpleadoActual(null);
  }, []);

  return {
    loading,
    mensaje,
    setMensaje,
    empleados,
    empleadoActual,
    listarEmpleados,
    verEmpleado,
    actualizarEmpleado,
    desactivarEmpleado,
    eliminarEmpleado,
    crearEmpleado,
    limpiarEmpleadoActual,
  };
}