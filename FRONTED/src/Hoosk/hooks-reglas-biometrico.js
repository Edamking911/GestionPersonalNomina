// src/Hoosk/hooks-reglas-biometrico.js
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

  // 🆕 NOVEDADES
  const [novedades, setNovedades] = useState([]);
  const [novedadActual, setNovedadActual] = useState(null);
  const [estadisticasNovedades, setEstadisticasNovedades] = useState(null);

  // =========================================================
  // 🔧 UTILIDAD: Parseo de fechas (evita timezone bug)
  // =========================================================
  const normalizarRangoFechas = useCallback((desde, hasta) => {
    let fechaDesde = desde;
    let fechaHasta = hasta;

    if (desde instanceof Date) {
      const y = desde.getFullYear();
      const m = String(desde.getMonth() + 1).padStart(2, '0');
      const d = String(desde.getDate()).padStart(2, '0');
      fechaDesde = `${y}-${m}-${d}`;
    }
    if (hasta instanceof Date) {
      const y = hasta.getFullYear();
      const m = String(hasta.getMonth() + 1).padStart(2, '0');
      const d = String(hasta.getDate()).padStart(2, '0');
      fechaHasta = `${y}-${m}-${d}`;
    }

    return { desde: fechaDesde, hasta: fechaHasta };
  }, []);

  // =========================================================
  // 1. REGLAS BASE
  // =========================================================
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

  // =========================================================
  // 2. ASIGNACIONES
  // =========================================================
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

  // =========================================================
  // 3. VALIDAR Y EVALUAR
  // =========================================================
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

  // =========================================================
  // 4. REPORTES
  // =========================================================
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

  const obtenerReporteSemanal = useCallback(
    async (desde, hasta) => {
      try {
        setLoading(true);
        const { desde: d, hasta: h } = normalizarRangoFechas(desde, hasta);
        const res = await api.get('/reglas/reporte-semanal', {
          params: { desde: d, hasta: h },
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
    },
    [normalizarRangoFechas],
  );

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

  // =========================================================
  // 5. IMPORTAR / EXPORTAR EXCEL
  // =========================================================
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

  const validarExcel = useCallback(
    async (file) => {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post(
          '/reglas/validar-excel-asignaciones',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          },
        );
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

  const importarExcel = useCallback(
    async (file) => {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post(
          '/reglas/importar-excel-asignaciones',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          },
        );
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

  const limpiarPreview = useCallback(() => {
    setPreviewExcel(null);
    setResultadoImportacion(null);
  }, []);

  // =========================================================
  // 🆕 6. NOVEDADES
  // =========================================================

  const listarNovedades = useCallback(async (filtros = {}) => {
    try {
      setLoading(true);
      const params = {};
      if (filtros.desde) params.desde = filtros.desde;
      if (filtros.hasta) params.hasta = filtros.hasta;
      if (filtros.cedula) params.cedula = filtros.cedula;
      if (filtros.incluirInactivas) params.incluirInactivas = 'true';

      const res = await api.get('/reglas/novedades', { params });
      const data = res.data?.novedades || res.data || [];
      setNovedades(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      setMensaje('Error al cargar novedades.');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerNovedad = useCallback(async (id) => {
    try {
      setLoading(true);
      const res = await api.get(`/reglas/novedades/${id}`);
      const data = res.data?.novedad || res.data;
      setNovedadActual(data);
      return data;
    } catch (error) {
      setMensaje('Error al cargar la novedad.');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const crearNovedad = useCallback(
    async (dto) => {
      try {
        setLoading(true);
        const res = await api.post('/reglas/novedades', dto);

        if (res.data.success === false) {
          throw new Error(res.data.message || 'No se pudo crear la novedad.');
        }

        setMensaje('✅ Novedad registrada correctamente.');
        await listarNovedades();

        agregarNotificacion({
          tipo: 'success',
          titulo: 'Novedad registrada',
          mensaje: `${dto.tipo} · ${dto.employeeId} (${dto.fechaInicio} → ${dto.fechaFin})`,
        });

        return res.data;
      } catch (error) {
        setMensaje(error.message || 'Error al crear la novedad.');
        console.error(error);

        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al crear novedad',
          mensaje: error.message || 'No se pudo registrar la novedad.',
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [listarNovedades, agregarNotificacion],
  );

  const actualizarNovedad = useCallback(
    async (id, dto) => {
      try {
        setLoading(true);
        const res = await api.patch(`/reglas/novedades/${id}`, dto);

        if (res.data.success === false) {
          throw new Error(res.data.message || 'No se pudo actualizar.');
        }

        setMensaje('✅ Novedad actualizada correctamente.');
        await listarNovedades();

        agregarNotificacion({
          tipo: 'success',
          titulo: 'Novedad actualizada',
          mensaje: `ID ${id} actualizado correctamente.`,
        });

        return res.data;
      } catch (error) {
        setMensaje(error.message || 'Error al actualizar la novedad.');
        console.error(error);

        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al actualizar',
          mensaje: error.message || 'No se pudo actualizar la novedad.',
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [listarNovedades, agregarNotificacion],
  );

  const eliminarNovedad = useCallback(
    async (id) => {
      try {
        setLoading(true);
        const res = await api.delete(`/reglas/novedades/${id}`);

        if (res.data.success === false) {
          throw new Error(res.data.message || 'No se pudo eliminar.');
        }

        setMensaje('✅ Novedad desactivada.');
        await listarNovedades();

        agregarNotificacion({
          tipo: 'warning',
          titulo: 'Novedad desactivada',
          mensaje: `ID ${id} fue desactivada.`,
        });

        return res.data;
      } catch (error) {
        setMensaje(error.message || 'Error al eliminar la novedad.');
        console.error(error);

        agregarNotificacion({
          tipo: 'error',
          titulo: 'Error al eliminar',
          mensaje: error.message || 'No se pudo desactivar la novedad.',
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [listarNovedades, agregarNotificacion],
  );

  const reporteNovedadesEmpleado = useCallback(
    async (cedula, desde, hasta) => {
      try {
        setLoading(true);
        const params = {};
        if (desde) params.desde = desde;
        if (hasta) params.hasta = hasta;

        const res = await api.get(
          `/reglas/novedades/reporte-empleado/${cedula}`,
          { params },
        );
        return res.data;
      } catch (error) {
        setMensaje('Error al cargar reporte de novedades.');
        console.error(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const descargarReporteNovedadesPDF = useCallback(
    async (cedula, desde, hasta) => {
      try {
        setLoading(true);
        const params = {};
        if (desde) params.desde = desde;
        if (hasta) params.hasta = hasta;

        const response = await api.get(
          `/reglas/novedades/reporte-empleado/${cedula}/pdf`,
          {
            params,
            responseType: 'blob',
          },
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `reporte_novedades_${cedula}_${desde || 'inicio'}_${hasta || 'hoy'}.pdf`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setMensaje('✅ Reporte PDF descargado.');

        agregarNotificacion({
          tipo: 'info',
          titulo: 'Reporte PDF',
          mensaje: `Reporte de novedades de ${cedula} descargado.`,
        });

        return true;
      } catch (error) {
        setMensaje('Error al descargar reporte PDF.');
        console.error(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [agregarNotificacion],
  );

  const descargarConstanciaNovedad = useCallback(
    async (id) => {
      try {
        setLoading(true);
        const response = await api.get(
          `/reglas/novedades/${id}/constancia.pdf`,
          { responseType: 'blob' },
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `constancia_novedad_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setMensaje('✅ Constancia descargada.');

        agregarNotificacion({
          tipo: 'info',
          titulo: 'Constancia PDF',
          mensaje: `Constancia de novedad ${id} descargada.`,
        });

        return true;
      } catch (error) {
        setMensaje('Error al descargar constancia.');
        console.error(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [agregarNotificacion],
  );

  const obtenerEstadisticasNovedades = useCallback(
    async (desde, hasta) => {
      try {
        setLoading(true);
        const params = {};
        if (desde) params.desde = desde;
        if (hasta) params.hasta = hasta;

        const res = await api.get('/reglas/novedades/estadisticas', { params });
        setEstadisticasNovedades(res.data);
        return res.data;
      } catch (error) {
        setMensaje('Error al cargar estadísticas de novedades.');
        console.error(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // =========================================================
  // RETURN
  // =========================================================
  return {
    // Estado
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

    // 🆕 Novedades
    novedades,
    novedadActual,
    estadisticasNovedades,

    // Acciones Reglas
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
    limpiarPreview,

    // 🆕 Acciones Novedades
    listarNovedades,
    obtenerNovedad,
    crearNovedad,
    actualizarNovedad,
    eliminarNovedad,
    reporteNovedadesEmpleado,
    descargarReporteNovedadesPDF,
    descargarConstanciaNovedad,
    obtenerEstadisticasNovedades,
  };
}