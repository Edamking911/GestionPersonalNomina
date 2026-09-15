import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './Componentes/Estilos/theme.css';
import './Componentes/Estilos/Transitions.css'; 
import './Componentes/Estilos/movile.css';
import App from './App.jsx';
import { ThemeProvider } from './Componentes/Context/ThemesContext.jsx';
import { NotificationProvider } from './Componentes/Context/Notificaciones.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </ThemeProvider>
  </StrictMode>,
);