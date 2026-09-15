// src/Biometrico/Biometrico.jsx
import { useState, useEffect, useRef } from 'react';
import { useBiometrico } from '../Hoosk/hooks-Biometrico';
import {useToast} from '../Hoosk/hoosk'
import StatsCards from '../Componentes/BiometricoComponent/StastsCards';
import ActionBar from '../Componentes/BiometricoComponent/ActionBar';
import TabsNav from '../Componentes/BiometricoComponent/TabsNav';
import UserTable from '../Componentes/BiometricoComponent/UserTable';
import MarcajesHistory from '../Componentes/BiometricoComponent/MarcajeHistory';
import DateSearchView from '../Componentes/BiometricoComponent/DateSearchView';
import EmployeeSearchView from '../Componentes/BiometricoComponent/EmployeeSearchView';
import ConfirmModal from '../Componentes/BiometricoComponent/ConfirmarModal';
import Toast from '../Componentes/UI/Toast';

export default function Biometrico() {
  const {
    usuarios,
    usuariosActivos,
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
  } = useBiometrico();

  const { toast, showToast, clearToast } = useToast();

  const lastMsgRef = useRef({ texto: '', timestamp: 0 });

  // 👇 useEffect para mostrar Toast con anti-duplicado y clasificación mejorada
  useEffect(() => {
    if (!mensaje) return;

    const ahora = Date.now();
    const ultimo = lastMsgRef.current;

    if (mensaje === ultimo.texto && ahora - ultimo.timestamp < 3000) {
      setMensaje('');
      return;
    }

    lastMsgRef.current = { texto: mensaje, timestamp: ahora };

    const timeoutId = setTimeout(() => {
      const msg = mensaje.toLowerCase();

      let tipo = 'info';

      const esExito =
        msg.includes('✅') ||
        msg.includes('éxito') ||
        msg.includes('exitos') ||
        msg.includes('correctamente') ||
        msg.includes('completada') ||
        msg.includes('cargad') ||
        msg.includes('activado') ||
        msg.includes('desactivado') ||
        msg.includes('generad') ||
        msg.includes('importad') ||
        msg.includes('restaurad') ||
        msg.includes('asignad') ||
        msg.includes('limpiad') ||
        msg.includes('sincroniz');

      const esWarning =
        msg.includes('⚠️') ||
        msg.includes('completa') ||
        msg.includes('debes') ||
        msg.includes('selecciona') ||
        msg.includes('atención') ||
        msg.includes('con problemas');

      const esError =
        !esExito &&
        (msg.includes('❌') ||
          msg.includes('error al') ||
          msg.includes('error en') ||
          msg.includes('no se pudo') ||
          msg.includes('no se pudieron') ||
          msg.includes('no existe') ||
          msg.includes('no está activo') ||
          msg.includes('desactivad') ||
          msg.includes('falló'));

      if (esError) tipo = 'error';
      else if (esWarning) tipo = 'warning';
      else if (esExito) tipo = 'success';

      showToast(mensaje, tipo);
      setMensaje('');
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [mensaje, showToast, setMensaje]);

  // Estados para el modal de confirmación
  const [modalConfirm, setModalConfirm] = useState({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    confirmText: 'Confirmar',
    employeeNo: null,
    action: null,
  });
  const [modalLoading, setModalLoading] = useState(false);

  const handleSolicitarDesactivar = (employeeNo) => {
    setModalConfirm({
      isOpen: true,
      type: 'danger',
      title: '¿Desactivar usuario?',
      message: `El usuario con cédula ${employeeNo} ya no podrá marcar en el biométrico. Puedes reactivarlo después.`,
      confirmText: 'Sí, desactivar',
      employeeNo,
      action: 'desactivar',
    });
  };

  const handleSolicitarActivar = (employeeNo) => {
    setModalConfirm({
      isOpen: true,
      type: 'success',
      title: '¿Reactivar usuario?',
      message: `El usuario con cédula ${employeeNo} podrá volver a marcar en el biométrico.`,
      confirmText: 'Sí, activar',
      employeeNo,
      action: 'activar',
    });
  };

  const handleConfirmarModal = async () => {
    if (!modalConfirm.employeeNo) return;
    setModalLoading(true);
    try {
      if (modalConfirm.action === 'desactivar') {
        await handleEliminarUsuario(modalConfirm.employeeNo);
      } else if (modalConfirm.action === 'activar') {
        await handleActivarUsuario(modalConfirm.employeeNo);
      }
      setModalConfirm((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCerrarModal = () => {
    if (modalLoading) return;
    setModalConfirm((prev) => ({ ...prev, isOpen: false }));
  };

  const renderVista = () => {
    switch (vistaActiva) {
      case 'usuarios':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <UserTable
              title="✅ Empleados que Ya Marcaron Hoy"
              users={usuariosMarcados}
              loading={loading && usuarios.length === 0}
              emptyMessage="Ningún empleado ha marcado todavía el día de hoy."
              variant="success"
              onDelete={handleSolicitarDesactivar}
              onActivate={handleSolicitarActivar}
              showStatus={false}
            />
            <UserTable
              title="⏳ Empleados Pendientes por Marcar Hoy"
              users={usuariosPendientes}
              loading={loading && usuarios.length === 0}
              emptyMessage="¡Excelente! Todos los usuarios activos ya han marcado hoy."
              variant="warning"
              onDelete={handleSolicitarDesactivar}
              onActivate={handleSolicitarActivar}
              showStatus={false}
            />
          </div>
        );

      case 'todos':
        return (
          <UserTable
            title="Lista Completa de Empleados Registrados"
            users={usuarios}
            loading={loading && usuarios.length === 0}
            emptyMessage="No hay usuarios cargados actualmente."
            variant="default"
            onDelete={handleSolicitarDesactivar}
            onActivate={handleSolicitarActivar}
            showStatus={true}
          />
        );

      case 'marcajes':
        return <MarcajesHistory registrosFecha={registrosFecha} />;

      case 'fechaEspecifica':
        return (
          <DateSearchView
            fechaUnica={fechaUnica}
            setFechaUnica={setFechaUnica}
            marcajesFechaUnica={marcajesFechaUnica}
            onSearch={buscarPorFechaEspecifica}
            formatearHora={formatearHoraDesdeTimestamp}
          />
        );

      case 'eventos':
        return (
          <EmployeeSearchView
            cedulaBusqueda={cedulaBusqueda}
            setCedulaBusqueda={setCedulaBusqueda}
            eventosEmpleado={eventosEmpleado}
            onSearch={buscarEventosPorCedula}
            formatearHora={formatearHoraDesdeTimestamp}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="content-padding-mobile"
      style={{
        padding: '24px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: 'var(--text-primary)',
        background: 'var(--bg-app)',
        minHeight: '100vh',
      }}
    >
      <style>{`
        @keyframes brilloRecorrido {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulsoRayo {
          0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 0px #f6ad55); }
          50% { transform: scale(1.15) rotate(-8deg); filter: drop-shadow(0 0 12px #f6ad55); }
        }
        @keyframes entradaTitulo {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .titulo-biometrico {
          margin: 0 0 20px 0;
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(
            90deg,
            var(--text-primary) 0%,
            var(--text-primary) 40%,
            #3182ce 50%,
            var(--text-primary) 60%,
            var(--text-primary) 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: brilloRecorrido 4s linear infinite, entradaTitulo 0.6s ease-out;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .titulo-biometrico .rayo {
          display: inline-block;
          font-size: 26px;
          -webkit-text-fill-color: initial;
          animation: pulsoRayo 2s ease-in-out infinite;
        }
      `}</style>

      <h2 className="titulo-biometrico">
        <span className="rayo">⚡</span>
        <span>Panel de Control - Dispositivo Biométrico</span>
      </h2>

      <StatsCards
        usuariosActivos={usuariosActivos}
        usuariosMarcados={usuariosMarcados}
        usuariosPendientes={usuariosPendientes}
        loading={loading && usuarios.length === 0}
        isOnline={isOnline}
      />

      <TabsNav
        activeTab={vistaActiva}
        onTabChange={(tab) => {
          setVistaActiva(tab);
          if (tab === 'marcajes') {
            cargarRegistrosPorFecha();
          }
        }}
      />

      <ActionBar
        onSyncToday={handleSincronizarHoy}
        onSyncYesterday={handleSincronizarAyer}
        onCleanDuplicates={handleLimpiarDuplicados}
        onClearCache={handleLimpiarCache}
        onRefresh={() => cargarDatos(true)}
        archivoExcel={archivoExcel}
        setArchivoExcel={setArchivoExcel}
        onImportExcel={handleSubirExcel}
      />

      {/* ============ VISTA DEL TAB (con transición) ============ */}
      <div key={vistaActiva} className="tab-transition">
        {renderVista()}
      </div>

      {toast.message && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          duration={6000}
          position="top-right"
          onClose={clearToast}
        />
      )}

      <ConfirmModal
        isOpen={modalConfirm.isOpen}
        onClose={handleCerrarModal}
        onConfirm={handleConfirmarModal}
        title={modalConfirm.title}
        message={modalConfirm.message}
        confirmText={modalConfirm.confirmText}
        cancelText="Cancelar"
        type={modalConfirm.type}
        loading={modalLoading}
      />
    </div>
  );
}