// helpers.ts - app de teste (banco r2d6_test), cadastro de usuarios e cliente HTTP via inject.
import { createCreation } from '@r2d6/rules';
import { loadBundle } from '@r2d6/data/node';
import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { buildApp } from '../src/app';
import { loadConfig } from '../src/config';

export const PASSWORD = 'uma-senha-forte-123';
const cfg = () => loadConfig({ NODE_ENV: 'test' });

export async function makeApp(opts: { realtime?: boolean; env?: Record<string, string> } = {}) {
  const c = loadConfig({ NODE_ENV: 'test', ...(opts.env ?? {}) });
  return buildApp({ cfg: c, databaseUrl: c.DATABASE_URL_TEST, realtime: opts.realtime ?? false, logger: false });
}

export async function truncateAll() {
  const c = cfg();
  const client = new pg.Client({ connectionString: c.DATABASE_URL_TEST });
  await client.connect();
  await client.query('TRUNCATE "user", session, account, verification, media, campaigns, campaign_members, campaign_invites, characters, character_changes, character_versions, rolls, assistant_queries RESTART IDENTITY CASCADE');
  await client.end();
}

export const ORIGIN = 'http://localhost:5173';

export class Client {
  cookie = '';
  userId = '';
  constructor(public app: FastifyInstance, public name = '') {}
  private headers(extra: Record<string, string> = {}) {
    return { origin: ORIGIN, ...(this.cookie ? { cookie: this.cookie } : {}), ...extra };
  }
  async signUp(name: string, email: string, password = PASSWORD) {
    const res = await this.app.inject({ method: 'POST', url: '/api/auth/sign-up/email', headers: this.headers({ 'content-type': 'application/json' }), payload: { name, email, password } });
    this.name = name;
    this.capture(res);
    if (res.statusCode !== 200) throw new Error(`sign-up falhou: ${res.statusCode} ${res.body}`);
    this.userId = res.json().user.id;
    return res;
  }
  async signIn(email: string, password = PASSWORD) {
    const res = await this.app.inject({ method: 'POST', url: '/api/auth/sign-in/email', headers: this.headers({ 'content-type': 'application/json' }), payload: { email, password } });
    this.capture(res);
    if (res.statusCode === 200) this.userId = res.json().user.id;
    return res;
  }
  private capture(res: any) {
    const sc = res.headers['set-cookie'];
    if (!sc) return;
    const jar = new Map<string, string>(this.cookie ? this.cookie.split('; ').map((p) => p.split('=') as [string, string]) : []);
    for (const c of Array.isArray(sc) ? sc : [sc]) { const [kv] = c.split(';'); const i = kv.indexOf('='); jar.set(kv.slice(0, i), kv.slice(i + 1)); }
    this.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
  }
  req(method: string, url: string, payload?: any) {
    return this.app.inject({ method: method as any, url, headers: this.headers(payload !== undefined ? { 'content-type': 'application/json' } : {}), payload });
  }
  get = (url: string) => this.req('GET', url);
  post = (url: string, body: any = {}) => this.req('POST', url, body);
  patch = (url: string, body: any = {}) => this.req('PATCH', url, body);
  put = (url: string, body: any = {}) => this.req('PUT', url, body);
  del = (url: string) => this.req('DELETE', url);
  async upload(url: string, buf: Buffer, filename: string, type: string) {
    const fd = new FormData();
    fd.append('file', new Blob([new Uint8Array(buf)], { type }), filename);
    const r = new Response(fd);
    const payload = Buffer.from(await r.arrayBuffer());
    return this.app.inject({ method: 'POST', url, headers: this.headers({ 'content-type': r.headers.get('content-type')! }), payload });
  }
}

export const creation = () => createCreation(loadBundle());
export const newSheet = (name = 'Kael', tpl = 'smuggler') => creation().fromTemplate(tpl, name, 'humans');
export const uuid = () => crypto.randomUUID();

/** Cria um personagem do usuario via API e devolve o corpo. */
export async function createChar(c: Client, name = 'Kael', tpl = 'smuggler') {
  const res = await c.post('/api/characters', { id: uuid(), sheet: newSheet(name, tpl) });
  if (res.statusCode !== 201) throw new Error(`criar ficha falhou: ${res.statusCode} ${res.body}`);
  return res.json().character;
}

/** Mestre + 2 jogadores em uma campanha com um personagem cada (jogador A e B). */
export async function campaignWithParty(app: FastifyInstance) {
  const gm = new Client(app), a = new Client(app), b = new Client(app);
  await gm.signUp('Mestra', 'gm@t.local'); await a.signUp('Ana', 'ana@t.local'); await b.signUp('Beto', 'beto@t.local');
  const camp = (await gm.post('/api/campaigns', { name: 'Mesa de teste' })).json().campaign;
  const inv = (await gm.post(`/api/campaigns/${camp.id}/invites`, {})).json();
  for (const p of [a, b]) await p.post(`/api/invites/${inv.code}/accept`);
  const ca = await createChar(a, 'Kael', 'smuggler');
  const cb = await createChar(b, 'Zia', 'brash-pilot');
  await a.post(`/api/campaigns/${camp.id}/characters`, { characterId: ca.id });
  await b.post(`/api/campaigns/${camp.id}/characters`, { characterId: cb.id });
  return { gm, a, b, camp, ca, cb, invite: inv };
}
