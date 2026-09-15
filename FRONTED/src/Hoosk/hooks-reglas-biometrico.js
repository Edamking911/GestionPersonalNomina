// src/ReglasBiometrico/hooks-reglas-biometrico.js
import { useState, useCallback } from 'react';
import api from '../servicio/Api';
import { useNotificaciones } from '../Componentes/Context/Notificaciones';

export function useReglasBiometrico() {
  // 🔔 Notificaciones
  const { agregarNotificacion } = useNotificaciones();

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [reglas, setReglas] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [diasLibres, setDiasLibres] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [reporteSemanal, setReporteSemanal] = useState(null);
  const [reporteMensual, setReporteMensual] = useState(null);
  const [evaluacion, setEvaluacion] = useState(null);
  const [validacion, setValidacion] = useState(null);
  const [previewExcel, setPreviewExcel] = useState(null);
  const [resultadoImportacion, setResultadoImportacion] = useState(null);
  const [backups, setBackups] = useState([]);

  // 1. Obtener todas las reglas
  const obtenerReglas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/reglas');
      setReglas(res.data);
    } catch (error) {
      setMensaje('Error al cargar las reglas.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Obtener asignaciones
  const obtenerAsignaciones = useCallback(async (semana) => {
    try {
      setLoading(true);
      const params = semana ? { semana } : {};
      const res = await api.get('/reglas/asignaciones', { params });
      const data = res.data?.asignaciones || res.data || [];
      setAsignaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      setMensaje('Error al cargar asignaciones.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Obtener días libres
  const obtenerDiasLibres = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/reglas/dias-libres');
      setDiasLibres(res.data);
    } catch (error) {
      setMensaje('Error al cargar días libres.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 4. Asignar horario
  const asignarHorario = useCallback(
    async (employeeId, horarioId, diasLibresFijos) => {
      try {
        setLoading(true);
        const body = { employeeId, horarioId, diasLibresFijos };
        const res = await api.post('/reglas/asignar', body);

        if (res.data.success === false) {
          throw new Error(res.data.message || 'No se pudo asignar el horario.');
        }

        setMensaje(res.data.message || 'Horario asignado correctamente.');

        agregarNotificacion({
          tipo: 'success',
          titulo: 'Horario asignado',
          mensaje: `Empleado ${employeeId} → ${horarioId}`,
        });

        return res.data;
      } catch (error) {
        setMensaje(error.message || 'Error al asignar horario.');
        console.error(error);

        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al asignar horario',
          mensaje: error.message || `No se pudo asignar a ${employeeId}.`,
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [agregarNotificacion],
  );

  // 5. Asignar días libres
  const asignarDiasLibresSemana = useCallback(
    async (employeeId, semana, diasLibres) => {
      try {
        setLoading(true);
        const body = { employeeId, semana, diasLibres };
        const res = await api.post('/reglas/asignar-dias-libres', body);

        if (res.data.success === false) {
          throw new Error(
            res.data.message || 'No se pudieron asignar los días libres.',
          );
        }

        setMensaje(res.data.message || 'Días libres asignados.');

        agregarNotificacion({
          tipo: 'success',
          titulo: 'Días libres asignados',
          mensaje: `Empleado ${employeeId} · ${diasLibres.length} día(s) para la semana ${semana}.`,
        });

        return res.data;
      } catch (error) {
        setMensaje(error.message || 'Error al asignar días libres.');
        console.error(error);

        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al asignar días libres',
          mensaje: error.message || `No se pudo asignar a ${employeeId}.`,
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [agregarNotificacion],
  );

  // 6. Validar salidas
  const validarSalidas = useCallback(async (fecha) => {
    try {
      setLoading(true);
      const body = fecha ? { fecha } : {};
      const res = await api.post('/reglas/validar-salidas', body);

      if (res.data.success === false) {
        throw new Error(res.data.message || 'No se pudieron validar las salidas.');
      }

      setValidacion(res.data);
      setMensaje('Validación completada.');
      return res.data;
    } catch (error) {
      setMensaje(error.message || 'Error al validar salidas.');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 7. Evaluar empleado
  const evaluarEmpleado = useCallback(async (employeeId, fecha) => {
    try {
      setLoading(true);
      const res = await api.get(`/reglas/evaluar/${employeeId}/${fecha}`);

      if (res.data.success === false) {
        throw new Error(res.data.message || 'No se pudo evaluar al empleado.');
      }

      setEvaluacion(res.data);
      setMensaje(`Evaluación de ${employeeId} para ${fecha} completada.`);
      return res.data;
    } catch (error) {
      setMensaje(error.message || 'Error al evaluar empleado.');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const limpiarEvaluacion = useCallback(() => {
    setEvaluacion(null);
    setMensaje('');
  }, []);

  // 8. Reporte diario
  const obtenerReporte = useCallback(async (fecha) => {
    try {
      setLoading(true);
      const res = await api.get(`/reglas/reporte/${fecha}`);
      setReporte(res.data);
      setMensaje('Reporte generado.');
      return res.data;
    } catch (error) {
      setMensaje(error.message || 'Error al generar reporte.');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 9. Reporte semanal
  const obtenerReporteSemanal = useCallback(async (desde, hasta) => {
    try {
      setLoading(true);
      const res = await api.get('/reglas/reporte-semanal', {
        params: { desde, hasta },
      });
      setReporteSemanal(res.data);
      setMensaje('Reporte semanal generado.');
      return res.data;
    } catch (error) {
      setMensaje(error.message || 'Error al generar reporte semanal.');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 10. Reporte mensual
  const obtenerReporteMensual = useCallback(async (mes) => {
    try {
      setLoading(true);
      const res = await api.get('/reglas/reporte-mensual', {
        params: { mes },
      });
      setReporteMensual(res.data);
      setMensaje('Reporte mensual generado.');
      return res.data;
    } catch (error) {
      setMensaje(error.message || 'Error al generar reporte mensual.');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 11. Descargar plantilla
  const descargarPlantilla = useCallback(
    async (mes) => {
      try {
        setLoading(true);
        const response = await api.get('/reglas/plantilla-asignaciones', {
          params: { mes },
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `plantilla_asignaciones_${mes}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        setMensaje('Plantilla descargada correctamente.');

        agregarNotificacion({
          tipo: 'info',
          titulo: 'Plantilla descargada',
          mensaje: `Plantilla del mes ${mes} generada correctamente.`,
        });

        return true;
      } catch (error) {
        setMensaje('Error al descargar plantilla.');
        console.error(error);

        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al descargar',
          mensaje: 'No se pudo descargar la plantilla.',
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [agregarNotificacion],
  );

  // 12. Validar Excel
  const validarExcel = useCallback(
    async (file) => {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/reglas/validar-excel-asignaciones', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setPreviewExcel(res.data);

        const { filasValidas, filasConError } = res.data;
        if (filasConError === 0) {
          setMensaje(`✅ Validación exitosa: ${filasValidas} filas válidas.`);

          agregarNotificacion({
            tipo: 'success',
            titulo: 'Excel validado',
            mensaje: `${filasValidas} filas válidas, sin errores.`,
          });
        } else {
          setMensaje(
            `⚠️ Validación: ${filasValidas} válidas, ${filasConError} con problemas.`,
          );

          agregarNotificacion({
            tipo: 'warning',
            titulo: 'Validación con observaciones',
            mensaje: `${filasValidas} filas válidas · ${filasConError} con problemas.`,
          });
        }

        return res.data;
      } catch (error) {
        setMensaje(error.message || 'Error al validar el Excel.');
        console.error(error);

        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al validar',
          mensaje: 'No se pudo procesar el archivo Excel.',
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [agregarNotificacion],
  );

  // 13. Importar Excel
  const importarExcel = useCallback(
    async (file) => {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/reglas/importar-excel-asignaciones', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setResultadoImportacion(res.data);
        setMensaje('✅ Excel importado correctamente.');
        await obtenerAsignaciones();
        await obtenerDiasLibres();

        const h = res.data?.horariosActualizados || 0;
        const d = res.data?.diasLibresActualizados || 0;
        agregarNotificacion({
          tipo: 'success',
          titulo: 'Excel importado',
          mensaje: `${h} horarios actualizados · ${d} días libres actualizados.`,
        });

        return res.data;
      } catch (error) {
        setMensaje(error.message || 'Error al importar el Excel.');
        console.error(error);

        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al importar',
          mensaje: error.message || 'No se pudo importar el Excel.',
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [obtenerAsignaciones, obtenerDiasLibres, agregarNotificacion],
  );

  // 14. Listar backups
  const listarBackups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/reglas/backups');
      setBackups(res.data.backups || []);
      return res.data;
    } catch (error) {
      setMensaje('Error al listar backups.');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 15. Restaurar backup
  const restaurarBackup = useCallback(
    async (nombreArchivo) => {
      try {
        setLoading(true);
        const res = await api.post('/reglas/rollback', { nombre: nombreArchivo });
        setMensaje(res.data.message || '✅ Backup restaurado correctamente.');
        await obtenerAsignaciones();
        await obtenerDiasLibres();

        agregarNotificacion({
          tipo: 'success',
          titulo: 'Backup restaurado',
          mensaje: `Se restauró el backup "${nombreArchivo}".`,
        });

        return res.data;
      } catch (error) {
        setMensaje('Error al restaurar backup.');
        console.error(error);

        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al restaurar',
          mensaje: 'No se pudo restaurar el backup.',
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [obtenerAsignaciones, obtenerDiasLibres, agregarNotificacion],
  );

  // 16. Restaurar último backup
  const restaurarUltimoBackup = useCallback(
    async () => {
      try {
        setLoading(true);
        const res = await api.post('/reglas/rollback-ultimo');
        setMensaje(res.data.message || '✅ Último backup restaurado correctamente.');
        await obtenerAsignaciones();
        await obtenerDiasLibres();

        agregarNotificacion({
          tipo: 'success',
          titulo: 'Backup restaurado',
          mensaje: 'Se restauró el último backup disponible.',
        });

        return res.data;
      } catch (error) {
        setMensaje('Error al restaurar último backup.');
        console.error(error);

        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al restaurar',
          mensaje: 'No se pudo restaurar el último backup.',
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [obtenerAsignaciones, obtenerDiasLibres, agregarNotificacion],
  );

  // 17. Limpiar backups
  const limpiarBackups = useCallback(
    async () => {
      try {
        setLoading(true);
        const res = await api.get('/reglas/limpiar-backups');
        setMensaje(res.data.message || '✅ Backups limpiados.');

        agregarNotificacion({
          tipo: 'info',
          titulo: 'Backups limpiados',
          mensaje: res.data.message || 'Se eliminaron los backups antiguos.',
        });

        return res.data;
      } catch (error) {
        setMensaje('Error al limpiar backups.');
        console.error(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [agregarNotificacion],
  );

  // 18. Limpiar preview
  const limpiarPreview = useCallback(() => {
    setPreviewExcel(null);
    setResultadoImportacion(null);
  }, []);

  return {
    loading,
    mensaje,
    setMensaje,
    reglas,
    asignaciones,
    diasLibres,
    reporte,
    reporteSemanal,
    reporteMensual,
    evaluacion,
    validacion,
    previewExcel,
    resultadoImportacion,
    backups,
    obtenerReglas,
    obtenerAsignaciones,
    obtenerDiasLibres,
    asignarHorario,
    asignarDiasLibresSemana,
    validarSalidas,
    evaluarEmpleado,
    limpiarEvaluacion,
    obtenerReporte,
    obtenerReporteSemanal,
    obtenerReporteMensual,
    descargarPlantilla,
    validarExcel,
    importarExcel,
    listarBackups,
    restaurarBackup,
    restaurarUltimoBackup,
    limpiarBackups,
    limpiarPreview,
  };
}