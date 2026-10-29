// catalog.ts - carrega o bundle de dados (precache do service worker) e expoe o catalogo e o motor de criacao.
import { createCatalog, type Catalog } from '@r2d6/data';
import { createCreation, type Creation } from '@r2d6/rules';
import bundleUrl from '@r2d6/data/generated/bundle.json?url';
import { useEffect, useState } from 'react';

type CatalogState = { catalog: Catalog; creation: Creation };
let state: CatalogState | null = null;
let loading: Promise<CatalogState> | null = null;
const listeners = new Set<() => void>();

export function loadCatalog(): Promise<CatalogState> {
  if (state) return Promise.resolve(state);
  loading ??= fetch(bundleUrl).then((r) => { if (!r.ok) throw new Error(`bundle: HTTP ${r.status}`); return r.json(); }).then((bundle) => {
    state = { catalog: createCatalog(bundle, { hrefBase: '/consulta' }), creation: createCreation(bundle) };
    listeners.forEach((l) => l());
    return state;
  });
  return loading;
}
export const getCatalog = () => state;

/** Hook: null enquanto carrega. */
export function useCatalog() {
  const [, tick] = useState(0);
  useEffect(() => {
    const l = () => tick((n) => n + 1);
    listeners.add(l);
    void loadCatalog();
    return () => { listeners.delete(l); };
  }, []);
  return state;
}
