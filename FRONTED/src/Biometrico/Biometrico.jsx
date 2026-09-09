// src/Biometrico/Biometrico.jsx
import { useBiometrico } from './hooks-Biometrico';
import StatsCards from '../Componentes/BiometricoComponent/StastsCards';
import ActionBar from '../Componentes/BiometricoComponent/ActionBar';
import TabsNav from '../Componentes/BiometricoComponent/TabsNav';
import UserTable from '../Componentes/BiometricoComponent/UserTable';
import MarcajesHistory from '../Componentes/BiometricoComponent/MarcajeHistory';
import DateSearchView from '../Componentes/BiometricoComponent/DateSearchView';
import EmployeeSearchView from '../Componentes/BiometricoComponent/EmployeeSearchView';

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
    handleSubirExcel,
    buscarEventosPorCedula,
    cargarRegistrosPorFecha,
    buscarPorFechaEspecifica,
  } = useBiometrico();

  const renderVista = () => {
    switch (vistaActiva) {
      case 'usuarios':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <UserTable
              title="✅ Empleados que Ya Marcaron Hoy"
              users={usuariosMarcados}
              emptyMessage="Ningún empleado ha marcado todavía el día de hoy."
              bgHeader="#f0fff4"
              badgeColor="#c6f6d5"
              badgeTextColor="#22543d"
              onDelete={handleEliminarUsuario}
              showStatus={false}
            />
            <UserTable
              title="⏳ Empleados Pendientes por Marcar Hoy"
              users={usuariosPendientes}
              emptyMessage="¡Excelente! Todos los usuarios activos ya han marcado hoy."
              bgHeader="#fffaf0"
              badgeColor="#feebc8"
              badgeTextColor="#744210"
              onDelete={handleEliminarUsuario}
              showStatus={false}
            />
          </div>
        );
      case 'todos':
        return (
          <UserTable
            title="Lista Completa de Empleados Registrados"
            users={usuarios}
            emptyMessage="No hay usuarios cargados actualmente."
            bgHeader="#f7fafc"
            badgeColor="#e2e8f0"
            badgeTextColor="#4a5568"
            onDelete={handleEliminarUsuario}
            showStatus={true}
          />
        );
      case 'marcajes':
        return (
          <MarcajesHistory
            registrosFecha={registrosFecha}
          />
        );
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
    <div style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif', color: '#2c3e50', background: '#f8f9fa', minHeight: '100vh' }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
        ⚡ Panel de Control - Dispositivo Biométrico
      </h2>

      {mensaje && (
        <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', padding: '12px 18px', margin: '15px 0', borderRadius: '8px', fontSize: '14px', color: '#2b6cb0', fontWeight: '500' }}>
          {mensaje}
        </div>
      )}

      {/* 👇 PASAMOS usuariosActivos, NO usuarios */}
      <StatsCards
        usuariosActivos={usuariosActivos}
        usuariosMarcados={usuariosMarcados}
        usuariosPendientes={usuariosPendientes}
        loading={loading}
        isOnline={isOnline}
      />

      <TabsNav
        activeTab={vistaActiva}
        onTabChange={(tab) => {
            setVistaActiva(tab);
            if (tab === 'marcajes') {
            cargarRegistrosPorFecha(); // ✅ Siempre recarga al entrar
            }
        }}
      />

      <ActionBar
        onSyncToday={handleSincronizarHoy}
        onSyncYesterday={handleSincronizarAyer}
        onCleanDuplicates={handleLimpiarDuplicados}
        onClearCache={handleLimpiarCache}
        onRefresh={cargarDatos}
        archivoExcel={archivoExcel}
        setArchivoExcel={setArchivoExcel}
        onImportExcel={handleSubirExcel}
      />

      {renderVista()}
    </div>
  );
}