import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import Navbar from './components/Navbar';
import { SocketProvider } from './context/SocketContext';
import { MlsProvider } from './context/MlsContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <SocketProvider>
      <MlsProvider>
        <BrowserRouter>
          <Navbar />
          <App />
        </BrowserRouter>
      </MlsProvider>
    </SocketProvider>
  </StrictMode>
);
