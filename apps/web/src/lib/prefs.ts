// prefs.ts - preferencias do aparelho (tema, modo mesa/baixa luz, animacoes, dados) em localStorage via Zustand.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Prefs {
  theme: 'dark' | 'paper';
  lowLight: boolean;
  tableMode: boolean;   // modo mesa manual (alem da rota /mesa)
  motion: 'on' | 'off';
  dice: 'auto' | '2d' | '3d';
  rollMode: 'digital' | 'physical';
  wake: boolean;
  vibrate: boolean;
  activeChar: string | null;
  sidebarCollapsed: boolean;
  set: (p: Partial<Omit<Prefs, 'set'>>) => void;
}

const safeStorage = {
  getItem: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem storage */ } },
  removeItem: (k: string) => { try { localStorage.removeItem(k); } catch { /* sem storage */ } },
};

export const usePrefs = create<Prefs>()(persist((set) => ({
  theme: 'dark', lowLight: false, tableMode: false, motion: 'on', dice: 'auto', rollMode: 'digital', wake: true, vibrate: true,
  activeChar: null, sidebarCollapsed: false,
  set: (p) => set(p),
}), { name: 'r2d6.prefs', storage: createJSONStorage(() => safeStorage) }));

/** Aplica as preferencias no <html> (data-theme, data-mode, data-motion). `inMesa` liga o modo calmo. */
export function applyPrefs(p: Pick<Prefs, 'theme' | 'lowLight' | 'tableMode' | 'motion'>, inMesa: boolean) {
  const el = document.documentElement;
  el.dataset.theme = p.theme;
  el.dataset.mode = p.lowLight ? 'lowlight' : p.tableMode || inMesa ? 'mesa' : '';
  el.dataset.motion = p.motion;
}
