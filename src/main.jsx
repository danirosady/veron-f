import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import { AuthProvider } from '@/context/AuthContext';
import { PermissionProvider } from '@/context/PermissionContext';
import i18n from './i18n';
import '@/styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PermissionProvider>
              <App />
            </PermissionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </I18nextProvider>
  </React.StrictMode>
);
