// src/Hoosk/hooks-empleados-excel.js
import { useState, useCallback } from 'react';
import api from '../servicio/Api';
import { useNotificaciones } from '../Componentes/Context/Notificaciones';

export function useEmpleadosExcel() {
  const { agregarNotificacion } = useNotificaciones();

  const [loading, setLoading] = useState(false);
  const [previewExcel, setPreviewExcel] = useState(null);
  const [resultadoImportacion, setResultadoImportacion] = useState(null);

  // =========================================================
  // 📥 DESCARGAR PLANTILLA
  // =========================================================
  const descargarPlantilla = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/empleados/plantilla', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `plantilla_empleados_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      agregarNotificacion({
        tipo: 'info',
        titulo: 'Plantilla descargada',
        mensaje: 'La plantilla de empleados se generó correctamente.',
      });

      return true;
    } catch (err) {
      console.error(err);
      agregarNotificacion({
        tipo: 'error',
        titulo: 'Error al descargar',
        mensaje: 'No se pudo descargar la plantilla.',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [agregarNotificacion]);

  // =========================================================
  // 🔍 VALIDAR EXCEL
  // =========================================================
  const validarExcel = useCallback(
    async (file) => {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await api.post('/empleados/validar-excel', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setPreviewExcel(res.data);

        const { filasValidas, filasConError } = res.data;
        if (filasConError === 0) {
          agregarNotificacion({
            tipo: 'success',
            titulo: 'Excel validado',
            mensaje: `${filasValidas} filas válidas, sin errores.`,
          });
        } else {
          agregarNotificacion({
            tipo: 'warning',
            titulo: 'Validación con observaciones',
            mensaje: `${filasValidas} filas válidas · ${filasConError} con problemas.`,
          });
        }

        return res.data;
      } catch (err) {
        console.error(err);
        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al validar',
          mensaje: 'No se pudo procesar el archivo Excel.',
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [agregarNotificacion],
  );

  // =========================================================
  // 📥 IMPORTAR EXCEL
  // =========================================================
  const importarExcel = useCallback(
    async (file) => {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await api.post('/empleados/importar-excel', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setResultadoImportacion(res.data);

        const creados = res.data?.creados || 0;
        agregarNotificacion({
          tipo: 'success',
          titulo: 'Excel importado',
          mensaje: `${creados} empleados creados correctamente.`,
        });

        return res.data;
      } catch (err) {
        console.error(err);
        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al importar',
          mensaje: err.response?.data?.message || 'No se pudo importar el Excel.',
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [agregarNotificacion],
  );

  const limpiarPreview = useCallback(() => {
    setPreviewExcel(null);
    setResultadoImportacion(null);
  }, []);

  return {
    loading,
    previewExcel,
    resultadoImportacion,
    descargarPlantilla,
    validarExcel,
    importarExcel,
    limpiarPreview,
  };
}