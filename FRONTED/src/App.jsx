// src/App.jsx
import { useState } from 'react';
import AppLayout from './Componentes/Layout/AppLayout';
import { PermisosProvider } from './Componentes/Context/PermisosContext';

// 🎯 Módulos de Asistencia
import Biometrico from './Asistencia/Biometrico/Biometrico';
import ReglasBiometrico from './Asistencia/Reglas-Biometricos/ReglasBiometricos';

// 🎯 Módulos de RRHH
import GestionPersonal from './RHH/GestionPersonal';

function App() {
  // 🎯 Vista activa: { suite, submenu }
  const [vistaActiva, setVistaActiva] = useState({
    suite: 'asistencia',
    submenu: 'biometrico',
  });

  const handleChangeVista = (suite, submenu) => {
    setVistaActiva({ suite, submenu });
  };

  // 🎯 Renderiza el contenido según la suite + submenú activo
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
      // 🆕 Cuando agregues:
      // if (submenu === 'cargos') return <Cargos />;
      // if (submenu === 'departamentos') return <Departamentos />;
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
        <p style={{ fontSize: '15px', margin: 0 }}>
          Módulo en desarrollo
        </p>
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
    </PermisosProvider>
  );
}

export default App;
