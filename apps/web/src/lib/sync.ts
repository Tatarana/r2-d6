// sync.ts - offline-first (ADR-0007): a UI le do IndexedDB; edicoes viram operacoes numa fila (outbox) enviada em ordem.
// Contadores usam `inc` (comutam entre aparelhos); mesmo campo dos dois lados vira conflito com escolha do usuario.
import { applyOps, defaultPlayState, diffOps, type Op } from '@r2d6/rules';
import { useLiveQuery } from 'dexie-react-hooks';
import { create } from 'zustand';
import { ApiError, DEVICE_ID, NetworkError, api, get } from './api';
import { db, getMeta, setMeta, wipeLocal, type LocalChar } from './db';
import { connectSocket, onSocketConnect } from './socket';

interface SyncState { online: boolean; pending: number; syncing: boolean; conflicts: number; lastSync: number | null; authLost: boolean; notices: string[] }
export const useSync = create<SyncState>(() => ({ online: typeof navigator === 'undefined' ? true : navigator.onLine, pending: 0, syncing: false, conflicts: 0, lastSync: null, authLost: false, notices: [] }));
const set = (p: Partial<SyncState>) => useSync.setState(p);
const notice = (m: string) => useSync.setState((s) => ({ notices: [...s.notices.slice(-4), m] }));
export const dismissNotice = (i: number) => useSync.setState((s) => ({ notices: s.notices.filter((_, k) => k !== i) }));

let userId: string | null = null;
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let flushing = false;
let retries = 0;
let started = false;

async function refreshCounts() {
  const [pending, conflicts] = await Promise.all([db.outbox.count(), db.characters.filter((c) => !!c.conflict).count()]);
  set({ pending, conflicts });
}

export async function startSync(uid: string) {
  if (userId === uid && started) return;
  userId = uid;
  const prev = await getMeta<string | null>('userId', null);
  if (prev && prev !== uid) await wipeLocal();
  await setMeta('userId', uid);
  if (!started) {
    started = true;
    window.addEventListener('online', () => { set({ online: true }); void syncNow(); });
    window.addEventListener('offline', () => set({ online: false }));
    onSocketConnect(() => { set({ online: true }); void syncNow(); });
    const s = connectSocket();
    s.on('character:changed', (p: { deviceId: string }) => { if (p.deviceId !== DEVICE_ID) schedulePull(); });
    s.on('sync:hint', () => schedulePull());
  }
  await refreshCounts();
  await syncNow();
}

export async function stopSync() {
  userId = null; started = false;
  await wipeLocal();
  set({ pending: 0, conflicts: 0 });
}

export async function syncNow() {
  await flush();
  await pull();
}

let pullTimer: ReturnType<typeof setTimeout> | undefined;
export function schedulePull() { clearTimeout(pullTimer); pullTimer = setTimeout(() => void pull(), 150); }

// ------------------------------------------------------------------ pull
function pendingOpsFor(items: { kind: string; ops?: Op[] }[]) { return items.filter((i) => i.kind === 'patch').flatMap((i) => i.ops ?? []); }

/** base do servidor + edicoes pendentes (aplica uma a uma e ignora a que nao se aplica mais) */
function rebuild(base: any, ops: Op[]) {
  let sheet = base;
  for (const op of ops) { try { sheet = applyOps(sheet, [op]); } catch { /* op obsoleta: descartada na exibicao */ } }
  return sheet;
}

async function upsertServer(c: any) {
  // leitura + escrita na mesma transacao: um flush concorrente (conflito, confirmacao) nao pode ser sobrescrito por um pull atrasado
  await db.transaction('rw', db.characters, db.outbox, async () => {
    const local = await db.characters.get(c.id);
    if (local?.pendingCreate) return;
    const pending = await db.outbox.where('characterId').equals(c.id).toArray();
    const sheet = rebuild(c.sheet, pendingOpsFor(pending));
    await db.characters.put({
      id: c.id, ownerId: c.ownerId, name: sheet.name, speciesId: c.speciesId, templateType: c.templateType, portraitMediaId: c.portraitMediaId, campaignId: c.campaignId,
      sheet, base: c.sheet, revision: c.revision, playState: local?.playDirty ? local.playState : c.playState, playDirty: local?.playDirty, updatedAt: c.updatedAt,
      conflict: local?.conflict ?? null,
    });
  });
}
export const mergeServerCharacter = upsertServer;

export async function pull() {
  if (!userId) return;
  try {
    const since = await getMeta<number>('cursor', 0);
    const r = await get(`/api/sync?since=${since}`);
    for (const c of r.characters) await upsertServer(c);
    for (const id of r.deleted) { await db.characters.delete(id); await db.outbox.where('characterId').equals(id).delete(); }
    await setMeta('cursor', r.cursor);
    set({ online: true, lastSync: Date.now(), authLost: false });
    await refreshCounts();
  } catch (e) {
    if (e instanceof NetworkError) set({ online: false });
    else if (e instanceof ApiError && e.status === 401) set({ authLost: true });
  }
}

// ------------------------------------------------------------------ edicao local (otimista)
export async function createLocal(sheet: any, templateType = ''): Promise<string> {
  if (!userId) throw new Error('Entre na sua conta primeiro.');
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.transaction('rw', db.characters, db.outbox, async () => {
    await db.characters.put({ id, ownerId: userId!, name: sheet.name, speciesId: sheet.species ?? '', templateType: templateType || sheet.type || '', portraitMediaId: null, campaignId: null,
      sheet, base: sheet, revision: 1, playState: defaultPlayState(), pendingCreate: true, updatedAt: now });
    await db.outbox.add({ mutationId: crypto.randomUUID(), kind: 'create', characterId: id, createdAt: Date.now(), tries: 0, ops: [{ op: 'add', path: '/__sheet', value: sheet }] as any });
  });
  await refreshCounts();
  scheduleFlush(50);
  return id;
}

/** Edita a ficha: `fn` altera uma copia; a diferenca vira operacoes na fila. */
export async function editSheet(id: string, fn: (draft: any) => void) {
  const ch = await db.characters.get(id);
  if (!ch) return;
  const next = structuredClone(ch.sheet);
  fn(next);
  const ops = diffOps(ch.sheet, next);
  if (!ops.length) return;
  await db.transaction('rw', db.characters, db.outbox, async () => {
    await db.characters.update(id, { sheet: next, name: next.name, speciesId: next.species ?? '', updatedAt: new Date().toISOString() });
    await db.outbox.add({ mutationId: crypto.randomUUID(), kind: 'patch', characterId: id, ops, createdAt: Date.now(), tries: 0 });
  });
  await refreshCounts();
  scheduleFlush();
}

/** Estado de mesa (round, acoes, stuns): ultimo a escrever vence. */
export async function setPlayState(id: string, fn: (ps: any) => any) {
  const ch = await db.characters.get(id);
  if (!ch) return;
  const next = fn(structuredClone(ch.playState));
  await db.transaction('rw', db.characters, db.outbox, async () => {
    await db.characters.update(id, { playState: next, playDirty: true });
    await db.outbox.where('characterId').equals(id).filter((i) => i.kind === 'play-state').delete();
    await db.outbox.add({ mutationId: crypto.randomUUID(), kind: 'play-state', characterId: id, createdAt: Date.now(), tries: 0 });
  });
  await refreshCounts();
  scheduleFlush(250);
}

/** Aplica no local uma ficha devolvida pelo servidor (ex.: apos gastar FP/CP online). */
export async function applyServerResult(c: any) { await upsertServer(c); await refreshCounts(); }

// ------------------------------------------------------------------ flush (envio em ordem)
export function scheduleFlush(ms = 600) { clearTimeout(flushTimer); flushTimer = setTimeout(() => void flush(), ms); }

export async function flush() {
  if (flushing || !userId) return;
  flushing = true;
  set({ syncing: true });
  try {
    const blocked = new Set<string>();
    for (;;) {
      const items = await db.outbox.orderBy('seq').toArray();
      const item = items.find((i) => !blocked.has(i.characterId));
      if (!item) break;
      const ch = await db.characters.get(item.characterId);
      if (!ch) { await db.outbox.delete(item.seq!); continue; }
      try {
        if (item.kind === 'create') {
          const sheet = (item.ops as any)[0].value;
          const r = await api('POST', '/api/characters', { id: ch.id, sheet });
          await db.transaction('rw', db.characters, db.outbox, async () => {
            await db.outbox.delete(item.seq!);
            const rest = await db.outbox.where('characterId').equals(ch.id).toArray();
            await db.characters.update(ch.id, { pendingCreate: false, base: r.character.sheet, revision: r.character.revision, sheet: rebuild(r.character.sheet, pendingOpsFor(rest)) });
          });
        } else if (item.kind === 'patch') {
          const r = await api('PATCH', `/api/characters/${ch.id}`, { mutationId: item.mutationId, deviceId: DEVICE_ID, baseRevision: ch.revision, ops: item.ops });
          await db.transaction('rw', db.characters, db.outbox, async () => {
            await db.outbox.delete(item.seq!);
            const rest = await db.outbox.where('characterId').equals(ch.id).toArray();
            await db.characters.update(ch.id, { base: r.character.sheet, revision: r.character.revision, sheet: rebuild(r.character.sheet, pendingOpsFor(rest)) });
          });
          if (r.warnings?.length) notice(`Ajustado pelo servidor: ${r.warnings.join('; ')}`);
        } else {
          const latest = await db.characters.get(ch.id);
          await api('PUT', `/api/characters/${ch.id}/play-state`, { playState: latest!.playState });
          await db.outbox.delete(item.seq!);
          const still = await db.outbox.where('characterId').equals(ch.id).filter((i) => i.kind === 'play-state').count();
          if (!still) await db.characters.update(ch.id, { playDirty: false });
        }
        retries = 0;
        set({ online: true, lastSync: Date.now() });
      } catch (e) {
        if (e instanceof NetworkError || (e instanceof ApiError && e.status >= 500)) { set({ online: false }); scheduleRetry(); break; }
        if (e instanceof ApiError && e.status === 401) { set({ authLost: true }); break; }
        if (e instanceof ApiError && e.status === 409 && item.kind === 'patch') {
          await db.transaction('rw', db.characters, db.outbox, async () => {
            await db.outbox.delete(item.seq!);
            await db.characters.update(ch.id, { conflict: { mutationId: item.mutationId, conflicts: e.body?.conflicts ?? [], mine: item.ops ?? [], current: e.body?.current } });
          });
          blocked.add(ch.id);
          continue;
        }
        if (e instanceof ApiError && e.status === 404) {
          await db.outbox.where('characterId').equals(ch.id).delete();
          await db.characters.delete(ch.id);
          notice('Um personagem não existe mais no servidor e foi removido deste aparelho.');
          continue;
        }
        // 400/403/422: o servidor recusou; nunca descartamos em silencio
        await db.outbox.delete(item.seq!);
        const rest = await db.outbox.where('characterId').equals(ch.id).toArray();
        await db.characters.update(ch.id, { sheet: rebuild(ch.base, pendingOpsFor(rest)), name: rebuild(ch.base, pendingOpsFor(rest)).name });
        notice(`Alteração recusada pelo servidor (${ch.name}): ${e instanceof ApiError ? e.detail || e.title : 'erro'}`);
      }
    }
    await uploadOfflineRolls();
  } finally {
    flushing = false;
    set({ syncing: false });
    await refreshCounts();
  }
}

/** Rolagens feitas sem rede sobem com o selo "offline" (o servidor revalida a contagem de dados). */
async function uploadOfflineRolls() {
  const rows = (await db.rolls.toArray()).filter((r) => !r.synced);
  for (const r of rows) {
    const pending = await db.outbox.where('characterId').equals(r.characterId).count();
    if (pending) return; // a ficha precisa estar em dia antes (o servidor recalcula a parada)
    try {
      const vals = r.result.values ?? { normals: r.result.normals, wild: r.result.wild };
      await api('POST', '/api/rolls', { id: r.id, characterId: r.characterId, targetKey: r.targetKey, mode: 'physical', rng: 'client', visibility: r.campaignId ? 'table' : 'private', values: vals });
      await db.rolls.update(r.id, { synced: true });
    } catch (e) {
      if (e instanceof NetworkError || (e instanceof ApiError && e.status >= 500)) return;
      await db.rolls.update(r.id, { synced: true });
      notice(`Uma rolagem offline (${r.label}) não pôde ser enviada: ${e instanceof ApiError ? e.detail || e.title : 'erro'}`);
    }
  }
}

function scheduleRetry() {
  clearTimeout(retryTimer);
  retries = Math.min(retries + 1, 6);
  retryTimer = setTimeout(() => void syncNow(), Math.min(30000, 1000 * 2 ** retries));
}

// ------------------------------------------------------------------ conflitos
export async function resolveConflict(id: string, choice: Record<string, 'mine' | 'theirs'>) {
  const ch = await db.characters.get(id);
  if (!ch?.conflict) return;
  const c = ch.conflict;
  const paths = new Set(c.conflicts.map((x) => x.path));
  const keep = c.mine.filter((op) => !paths.has(op.path) || choice[op.path] === 'mine');
  const base = c.current.sheet;
  await db.transaction('rw', db.characters, db.outbox, async () => {
    const rest = await db.outbox.where('characterId').equals(id).toArray();
    await db.characters.update(id, { base, revision: c.current.revision, conflict: null, sheet: rebuild(rebuild(base, keep), pendingOpsFor(rest)), name: base.name });
    if (keep.length) await db.outbox.add({ mutationId: crypto.randomUUID(), kind: 'patch', characterId: id, ops: keep, createdAt: Date.now(), tries: 0 });
  });
  await refreshCounts();
  scheduleFlush(50);
}

// ------------------------------------------------------------------ hooks de leitura
export const useChars = () => useLiveQuery(() => db.characters.orderBy('updatedAt').reverse().toArray(), [], undefined as LocalChar[] | undefined);
/** undefined = carregando; null = nao existe neste aparelho */
export const useChar = (id: string | null | undefined) => useLiveQuery(async () => (id ? (await db.characters.get(id)) ?? null : null), [id]);
