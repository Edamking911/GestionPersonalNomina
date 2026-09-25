// src/Hoosk/hooks-departamentos.js
import { useState, useCallback } from 'react';
import api from '../servicio/Api';
import { useNotificaciones } from '../Componentes/Context/Notificaciones';

export function useDepartamentos() {
  const { agregarNotificacion } = useNotificaciones();

  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  //LISTAR
  const listarDepartamentos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/departamentos/Traer-Todos');
      const lista = res.data?.control || res.data?.departamentos || res.data || [];
      setDepartamentos(Array.isArray(lista) ? lista : []);
      return lista;
    } catch (err) {
      console.error(err);
      setMensaje('Error al cargar departamentos.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // CREAR
  const crearDepartamento = useCallback(
    async (dto) => {
      setLoading(true);
      try {
        const res = await api.post('/departamentos/Agregar-Departamento', dto);
        setMensaje('✅ Departamento creado correctamente.');
        await listarDepartamentos();

        agregarNotificacion({
          tipo: 'success',
          titulo: 'Departamento creado',
          mensaje: `Se creó "${dto.nombre}".`,
        });

        return res.data;
      } catch (err) {
        console.error(err);
        setMensaje('Error al crear departamento.');
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
    [listarDepartamentos, agregarNotificacion],
  );

  //ACTUALIZAR
  const actualizarDepartamento = useCallback(
    async (nombreOriginal, dto) => {
      setLoading(true);
      try {
        const res = await api.patch(
          `/departamentos/Actualizar-Departamento/${encodeURIComponent(nombreOriginal)}`,
          dto,
        );
        setMensaje('✅ Departamento actualizado.');
        await listarDepartamentos();

        agregarNotificacion({
          tipo: 'success',
          titulo: 'Departamento actualizado',
          mensaje: `Se actualizó "${nombreOriginal}".`,
        });

        return res.data;
      } catch (err) {
        console.error(err);
        setMensaje('Error al actualizar departamento.');
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
    [listarDepartamentos, agregarNotificacion],
  );

  //ELIMINAR
  const eliminarDepartamento = useCallback(
    async (nombre) => {
      setLoading(true);
      try {
        const res = await api.delete(
          `/departamentos/Eliminar-Departamento/${encodeURIComponent(nombre)}`,
        );
        setMensaje('✅ Departamento eliminado.');
        await listarDepartamentos();

        agregarNotificacion({
          tipo: 'warning',
          titulo: 'Departamento eliminado',
          mensaje: `Se eliminó "${nombre}".`,
        });

        return res.data;
      } catch (err) {
        console.error(err);
        setMensaje('Error al eliminar departamento.');
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
    [listarDepartamentos, agregarNotificacion],
  );

  return {
    departamentos,
    loading,
    mensaje,
    setMensaje,
    listarDepartamentos,
    crearDepartamento,
    actualizarDepartamento,
    eliminarDepartamento,
  };
}