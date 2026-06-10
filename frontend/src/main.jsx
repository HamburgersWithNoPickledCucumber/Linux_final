import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ServerProvider } from './context/ServerContext';
import { DashboardProvider } from './context/DashboardContext';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ServerProvider>
        <DashboardProvider>
          <App />
        </DashboardProvider>
      </ServerProvider>
    </BrowserRouter>
  </StrictMode>
);
