// @ts-nocheck - porte direto do JS do v1 (logica testada pelos 56 testes); tipagem estrita fica no backlog.
// v1-store.ts (legado v1) - personagens no localStorage, exportacao/importacao conforme character-sheet.schema.json.
// PD-05: extensoes do app ficam em "x_app" para nao quebrar o schema.
import { parse, toPips } from './dice';
import { ATTRS, stunPenaltyCount } from './rules';
import { toDie, validateSheet, skillCode } from './sheet';

const KEY_INDEX = 'r2d6.index';
const KEY_CHAR = 'r2d6.char.';
const KEY_PREFS = 'r2d6.prefs';

export const newId = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function defaultRound() {
  return { n: 1, actions: 1, cpSpent: 0, fpUsed: false, stuns: [], mortalRounds: 0 };
}

/** Ficha vazia valida. */
export function blankCharacter(name = 'Novo personagem') {
  const attributes = {};
  for (const a of ATTRS) attributes[a] = { value: toDie('2D'), skills: [] };
  return {
    name, type: '', species: '', gender: '', age: '', height: '', weight: '', physical_description: '',
    attributes, force_attributes: {}, force_powers: [], advantages: [], disadvantages: [],
    special_abilities: '', move: 10, force_sensitive: false, force_points: 1, dark_side_points: 0,
    character_points: 5, credits: 0, wound_status: 'healthy',
    armor: [], weapons: [], other_equipment: [],
    background: '', personality: '', objectives: '', languages: '', contacts_and_enemies: '',
    connection_with_characters: '', quote: '',
    x_app: { id: newId(), round: defaultRound(), history: [], created: new Date().toISOString() },
  };
}

// ------------------------------------------------------------------ exportacao/importacao
/** Copia profunda no formato do schema; wound_status 'stunned' quando ha stun ativo e nenhum ferimento. */
export function exportCharacter(char) {
  const out = JSON.parse(JSON.stringify(char));
  const x = out.x_app || {};
  if (out.wound_status === 'healthy' && stunPenaltyCount(x.round?.stuns, x.round?.n ?? 1) > 0) out.wound_status = 'stunned';
  return out;
}
export const exportJSON = (char) => JSON.stringify(exportCharacter(char), null, 2);

/** Importa texto/objeto. Retorna {ok, errors, char}. Nunca lanca. */
export function importCharacter(input) {
  let obj = input;
  if (typeof input === 'string') {
    try { obj = JSON.parse(input); } catch (e) { return { ok: false, errors: [`JSON inválido: ${e.message}`], char: null }; }
  }
  const errors = validateSheet(obj);
  if (errors.length) return { ok: false, errors, char: null };
  const char = JSON.parse(JSON.stringify(obj));
  const hadX = !!char.x_app;
  char.x_app = { round: defaultRound(), history: [], ...(char.x_app || {}) };
  char.x_app.round = { ...defaultRound(), ...(char.x_app.round || {}) };
  char.x_app.id = newId(); // nunca reaproveita id: evita sobrescrever um personagem existente
  if (char.wound_status === 'stunned' && !hadX) {
    char.wound_status = 'healthy';
    char.x_app.round.stuns = [char.x_app.round.n];
  } else if (char.wound_status === 'stunned') {
    char.wound_status = 'healthy';
  }
  return { ok: true, errors: [], char };
}

// ------------------------------------------------------------------ persistencia
export function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
}

export function createStore(storage = globalThis.localStorage) {
  const read = (k, fallback) => {
    try { const v = storage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  };
  const write = (k, v) => storage.setItem(k, JSON.stringify(v));
  const index = () => read(KEY_INDEX, { active: null, ids: [] });

  return {
    list() {
      return index().ids.map((id) => read(KEY_CHAR + id, null)).filter(Boolean);
    },
    get(id) { return read(KEY_CHAR + id, null); },
    save(char) {
      if (!char.x_app) char.x_app = { id: newId(), round: defaultRound(), history: [] };
      const id = char.x_app.id;
      write(KEY_CHAR + id, char);
      const idx = index();
      if (!idx.ids.includes(id)) idx.ids.push(id);
      if (!idx.active) idx.active = id;
      write(KEY_INDEX, idx);
      return char;
    },
    remove(id) {
      storage.removeItem(KEY_CHAR + id);
      const idx = index();
      idx.ids = idx.ids.filter((i) => i !== id);
      if (idx.active === id) idx.active = idx.ids[0] || null;
      write(KEY_INDEX, idx);
    },
    duplicate(id) {
      const src = this.get(id);
      if (!src) return null;
      const copy = JSON.parse(JSON.stringify(src));
      copy.name = `${src.name} (cópia)`;
      copy.x_app.id = newId();
      copy.x_app.history = [];
      return this.save(copy);
    },
    getActiveId() { return index().active; },
    getActive() { const id = index().active; return id ? this.get(id) : null; },
    setActive(id) { const idx = index(); if (idx.ids.includes(id)) { idx.active = id; write(KEY_INDEX, idx); } },
    importText(text) {
      const r = importCharacter(text);
      if (r.ok) this.save(r.char);
      return r;
    },
    getPrefs() { return read(KEY_PREFS, {}); },
    setPref(k, v) { const p = read(KEY_PREFS, {}); p[k] = v; write(KEY_PREFS, p); },
  };
}

