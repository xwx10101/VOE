import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import { FamilyProvider } from '@/state/FamilyContext';
import '@/styles/index.css';

const container = document.getElementById('root');

if (container) {
  createRoot(container).render(
    <StrictMode>
      <BrowserRouter>
        <FamilyProvider>
          <App />
        </FamilyProvider>
      </BrowserRouter>
    </StrictMode>,
  );
}
