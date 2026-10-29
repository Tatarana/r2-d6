import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import { loadCatalog } from './lib/catalog';
import { applyPrefs, usePrefs } from './lib/prefs';
import { router } from './router';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 5_000, refetchOnWindowFocus: false } } });

applyPrefs(usePrefs.getState(), false);
void loadCatalog().catch(() => { /* offline sem cache: a consulta mostra o estado de erro */ });
if (import.meta.env.PROD) registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
