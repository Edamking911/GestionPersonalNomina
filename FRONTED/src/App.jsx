// App.jsx
import { useState } from 'react';
import Biometrico from './Biometrico/Biometrico';
import ReglasBiometrico from './Reglas-Biometricos/ReglasBiometricos';

function App() {
  const [vista, setVista] = useState('biometrico');

  return (
    <div>
      <nav style={{ padding: '10px 20px', background: '#2d3748', display: 'flex', gap: '20px' }}>
        <button onClick={() => setVista('biometrico')} style={{ background: 'transparent', color: '#fff', border: 'none', fontSize: '16px', cursor: 'pointer' }}>
          📊 Biométrico
        </button>
        <button onClick={() => setVista('reglas')} style={{ background: 'transparent', color: '#fff', border: 'none', fontSize: '16px', cursor: 'pointer' }}>
          ⚙️ Reglas
        </button>
      </nav>
      {vista === 'biometrico' ? <Biometrico /> : <ReglasBiometrico />}
    </div>
  );
}

export default App;