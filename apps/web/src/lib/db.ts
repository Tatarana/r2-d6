// db.ts - IndexedDB (Dexie): fichas locais (fonte de leitura da UI), fila de edicoes (outbox) e rolagens offline.
import Dexie, { type EntityTable } from 'dexie';
import type { Op } from '@r2d6/rules';

export interface LocalChar {
  id: string; ownerId: string; name: string; speciesId: string; templateType: string; portraitMediaId: string | null; campaignId: string | null;
  sheet: any;       // o que a UI mostra (base do servidor + edicoes pendentes)
  base: any;        // ultimo estado confirmado pelo servidor
  revision: number; // revisao do servidor correspondente a `base`
  playState: any; playDirty?: boolean; pendingCreate?: boolean; updatedAt: string;
  conflict?: { mutationId: string; conflicts: { path: string; mine: Op; theirs?: Op }[]; mine: Op[]; current: any } | null;
}
export interface OutboxItem {
  seq?: number; mutationId: string; kind: 'create' | 'patch' | 'play-state'; characterId: string; ops?: Op[]; createdAt: number; tries: number; error?: string;
}
export interface LocalRoll {
  id: string; characterId: string; campaignId: string | null; label: string; poolText: string; result: any; total: number | null; origin: 'offline' | 'server' | 'physical';
  cpDice: number[][]; createdAt: number; synced: boolean; targetKey?: string;
}
export interface Meta { key: string; value: any }

class R2Db extends Dexie {
  characters!: EntityTable<LocalChar, 'id'>;
  outbox!: EntityTable<OutboxItem, 'seq'>;
  rolls!: EntityTable<LocalRoll, 'id'>;
  meta!: EntityTable<Meta, 'key'>;
  constructor() {
    super('r2d6');
    this.version(1).stores({ characters: 'id, ownerId, updatedAt', outbox: '++seq, characterId, mutationId', rolls: 'id, characterId, createdAt, synced', meta: 'key' });
  }
}
export const db = new R2Db();

export const getMeta = async <T = any>(key: string, def?: T): Promise<T> => ((await db.meta.get(key))?.value ?? def) as T;
export const setMeta = (key: string, value: any) => db.meta.put({ key, value });
export async function wipeLocal() {
  await Promise.all([db.characters.clear(), db.outbox.clear(), db.rolls.clear(), db.meta.clear()]);
}
