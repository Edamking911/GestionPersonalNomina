// src/Hoosk/hooks-cargos.js
import { useState, useCallback } from 'react';
import api from '../servicio/Api';
import { useNotificaciones } from '../Componentes/Context/Notificaciones';

export function useCargos() {
  const { agregarNotificacion } = useNotificaciones();

  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // LISTAR
  const listarCargos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/cargos/Traer-cargos');
      const lista = res.data?.control || res.data?.cargos || res.data || [];
      setCargos(Array.isArray(lista) ? lista : []);
      return lista;
    } catch (err) {
      console.error(err);
      setMensaje('Error al cargar cargos.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // CREAR (nombre param = nombre del DEPARTAMENTO)
  const crearCargo = useCallback(
    async (nombreDepartamento, dto) => {
      setLoading(true);
      try {
        const res = await api.post(
          `/cargos/Crear-Cargo/${encodeURIComponent(nombreDepartamento)}`,
          dto,
        );
        setMensaje('Cargo creado correctamente.');
        await listarCargos();

        agregarNotificacion({
          tipo: 'success',
          titulo: 'Cargo creado',
          mensaje: `Se creó "${dto.nombre}" en ${nombreDepartamento}.`,
        });

        return res.data;
      } catch (err) {
        console.error(err);
        setMensaje('Error al crear cargo.');
        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al crear cargo',
          mensaje: err.response?.data?.message || err.message,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [listarCargos, agregarNotificacion],
  );

  // ACTUALIZAR
  const actualizarCargo = useCallback(
    async (dto) => {
        setLoading(true);
        try {
        // 🎯 El DTO solo acepta { nombre, sueldo }
        const payload = {
            nombre: dto.nombre,
            sueldo: dto.sueldo !== null && dto.sueldo !== undefined
            ? Number(dto.sueldo)
            : undefined,
        };

        const res = await api.patch('/cargos/Actualizar-Cargo', payload);
        setMensaje('✅ Cargo actualizado correctamente.');
        await listarCargos();

        agregarNotificacion({
            tipo: 'success',
            titulo: 'Cargo actualizado',
            mensaje: `Se actualizó "${dto.nombre}".`,
        });

        return res.data;
        } catch (err) {
        console.error(err);
        setMensaje('Error al actualizar cargo.');
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
        [listarCargos, agregarNotificacion],
    );

  // 🗑️ ELIMINAR
  const eliminarCargo = useCallback(
    async (nombre) => {
      setLoading(true);
      try {
        const res = await api.delete(
          `/cargos/Eliminar-Cargo/${encodeURIComponent(nombre)}`,
        );
        setMensaje('✅ Cargo eliminado.');
        await listarCargos();

        agregarNotificacion({
          tipo: 'warning',
          titulo: 'Cargo eliminado',
          mensaje: `Se eliminó "${nombre}".`,
        });

        return res.data;
      } catch (err) {
        console.error(err);
        setMensaje('Error al eliminar cargo.');
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
    [listarCargos, agregarNotificacion],
  );

  return {
    cargos,
    loading,
    mensaje,
    setMensaje,
    listarCargos,
    crearCargo,
    actualizarCargo,
    eliminarCargo,
  };
}