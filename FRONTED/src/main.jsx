import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './Componentes/Estilos/Theme.css';   // NUEVO
import App from './App.jsx';
import { ThemeProvider } from './Componentes/Context/ThemesContext.jsx';   //NUEVO

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);