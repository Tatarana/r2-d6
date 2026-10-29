// state.js - estado do app: store de personagens, personagem ativo, notificacao de mudancas.
import { createStore, memoryStorage } from './store.js';

export const app = { store: null, listeners: new Set(), persistent: true };

export function initState() {
  let storage;
  try {
    storage = window.localStorage;
    storage.setItem('r2d6.probe', '1'); storage.removeItem('r2d6.probe');
  } catch {
    storage = memoryStorage(); app.persistent = false; // modo privado: funciona, mas nao persiste
  }
  app.store = createStore(storage);
}

export const activeChar = () => app.store.getActive();
export const subscribe = (fn) => { app.listeners.add(fn); return () => app.listeners.delete(fn); };
export const notify = () => app.listeners.forEach((fn) => fn());

/** Altera o personagem ativo, salva e re-renderiza. */
export function mutate(fn) {
  const c = activeChar();
  if (!c) return null;
  fn(c);
  app.store.save(c);
  notify();
  return c;
}

/** Registra no historico (maximo 20 rolagens/eventos). */
export function pushHistory(c, entry) {
  c.x_app.history = [{ ...entry, at: Date.now(), round: c.x_app.round.n }, ...(c.x_app.history || [])].slice(0, 20);
}

export const prefs = () => app.store.getPrefs();
export const setPref = (k, v) => app.store.setPref(k, v);
