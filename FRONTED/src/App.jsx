// src/App.jsx
import { useState } from 'react';
import AppLayout from './Componentes/Layout/AppLayout';
import { PermisosProvider } from './Componentes/Context/PermisosContext';
import { usePersistedState } from './Hoosk/usePersistedState';
import BotonActualizar from './Componentes/UI/BotonActualizar';

// Módulos de Asistencia
import Biometrico from './Asistencia/Biometrico/Biometrico';
import ReglasBiometrico from './Asistencia/Reglas-Biometricos/ReglasBiometricos';

// Módulos de RRHH
import GestionPersonal from './RHH/GestionPersonal';
import Cargos from './RHH/Cargos/Cargos';                       
import Departamentos from './RHH/Departamentos/Departamentos';


function App() {
  // Vista activa: { suite, submenu }
  const [vistaActiva, setVistaActiva] = usePersistedState(
    'app.vistaActiva',
    { suite: 'asistencia', submenu: 'biometrico' },
    { storage: 'local' }, // se guarda entre sesiones
  );

  const handleChangeVista = (suite, submenu) => {
    setVistaActiva({ suite, submenu });
  };

  //  Renderiza el contenido según la suite + submenú activo
  const renderContenido = () => {
    const { suite, submenu } = vistaActiva;

    // ============ ASISTENCIA ============
    if (suite === 'asistencia') {
      if (submenu === 'biometrico') return <Biometrico />;
      if (submenu === 'reglas') return <ReglasBiometrico />;
    }

    // ============ RRHH ============
    if (suite === 'rrhh') {
      if (submenu === 'empleados') return <GestionPersonal />;
      if (submenu === 'cargos') return <Cargos />;
      if (submenu === 'departamentos') return <Departamentos />;
    }

    return (
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚧</div>
        <p style={{ fontSize: '15px', margin: 0 }}>Módulo en desarrollo</p>
      </div>
    );
  };

  return (
    <PermisosProvider>
      <AppLayout
        vistaActiva={vistaActiva}
        onChangeVista={handleChangeVista}
      >
        {renderContenido()}
      </AppLayout>

      {/* 🆕 Botón flotante cuando hay nueva versión */}
      <BotonActualizar />
    </PermisosProvider>
  );
}

export default App;