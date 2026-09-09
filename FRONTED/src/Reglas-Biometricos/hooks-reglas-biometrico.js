// src/hooks/useReglasBiometrico.js
import { useState, useCallback } from 'react';
import api from '../servicio/Api';

export function useReglasBiometrico() {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [reglas, setReglas] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [diasLibres, setDiasLibres] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [evaluacion, setEvaluacion] = useState(null);
  const [validacion, setValidacion] = useState(null);

  const obtenerReglas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/reglas');
      setReglas(res.data);
      setMensaje('Reglas cargadas correctamente.');
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
      setAsignaciones(res.data);
      setMensaje('Asignaciones cargadas.');
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
      setMensaje('Días libres cargados.');
    } catch (error) {
      setMensaje('Error al cargar días libres.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const asignarHorario = useCallback(async (employeeId, horarioId, diasLibresFijos) => {
    try {
      setLoading(true);
      const body = { employeeId, horarioId, diasLibresFijos };
      const res = await api.post('/reglas/asignar', body);
      setMensaje(res.data.message || 'Horario asignado correctamente.');
      return res.data;
    } catch (error) {
      setMensaje('Error al asignar horario.');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const asignarDiasLibresSemana = useCallback(async (employeeId, semana, diasLibres) => {
    try {
      setLoading(true);
      const body = { employeeId, semana, diasLibres };
      const res = await api.post('/reglas/asignar-dias-libres', body);
      setMensaje(res.data.message || 'Días libres asignados.');
      return res.data;
    } catch (error) {
      setMensaje('Error al asignar días libres.');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const validarSalidas = useCallback(async (fecha) => {
    try {
      setLoading(true);
      const body = fecha ? { fecha } : {};
      const res = await api.post('/reglas/validar-salidas', body);
      setValidacion(res.data);
      setMensaje('Validación completada.');
      return res.data;
    } catch (error) {
      setMensaje('Error al validar salidas.');
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
      setEvaluacion(res.data);
      setMensaje(`Evaluación de ${employeeId} para ${fecha} completada.`);
      return res.data;
    } catch (error) {
      setMensaje('Error al evaluar empleado.');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ NUEVA: Función para limpiar la evaluación
  const limpiarEvaluacion = useCallback(() => {
    setEvaluacion(null);
    setMensaje('');
  }, []);

  const obtenerReporte = useCallback(async (fecha) => {
    try {
      setLoading(true);
      const res = await api.get(`/reglas/reporte/${fecha}`);
      setReporte(res.data);
      setMensaje('Reporte generado.');
      return res.data;
    } catch (error) {
      setMensaje('Error al generar reporte.');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    mensaje,
    setMensaje,
    reglas,
    asignaciones,
    diasLibres,
    reporte,
    evaluacion,
    validacion,
    obtenerReglas,
    obtenerAsignaciones,
    obtenerDiasLibres,
    asignarHorario,
    asignarDiasLibresSemana,
    validarSalidas,
    evaluarEmpleado,
    limpiarEvaluacion, // 👈 exportamos la nueva función
    obtenerReporte,
  };
}