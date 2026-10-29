import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Client, PASSWORD, makeApp, truncateAll } from './helpers';

let app: FastifyInstance;
beforeAll(async () => { app = await makeApp(); });
afterAll(async () => { await app.close(); });
beforeEach(async () => { await truncateAll(); app.ctx.mailer.outbox.length = 0; });

describe('login', () => {
  it('cadastra, mantém a sessão por cookie httpOnly e sai', async () => {
    const c = new Client(app);
    const res = await c.signUp('Ana', 'ana@t.local');
    const cookies = ([] as string[]).concat(res.headers['set-cookie'] as any);
    expect(cookies.some((x) => /session_token/.test(x) && /HttpOnly/i.test(x) && /SameSite=Lax/i.test(x))).toBe(true);
    const me = await c.get('/api/me');
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe('ana@t.local');
    const out = await c.post('/api/auth/sign-out', {});
    expect(out.statusCode).toBe(200);
    c.cookie = '';
    expect((await c.get('/api/me')).statusCode).toBe(401);
  });

  it('entra com e-mail e senha e recusa senha errada', async () => {
    await new Client(app).signUp('Ana', 'ana@t.local');
    const ok = new Client(app);
    expect((await ok.signIn('ana@t.local')).statusCode).toBe(200);
    expect((await ok.get('/api/me')).statusCode).toBe(200);
    const bad = new Client(app);
    expect((await bad.signIn('ana@t.local', 'outra-senha-errada')).statusCode).toBe(401);
    expect((await bad.get('/api/me')).statusCode).toBe(401);
  });

  it('guarda a senha com Argon2id (nunca em claro)', async () => {
    const { default: pg } = await import('pg');
    await new Client(app).signUp('Ana', 'ana@t.local');
    const db = new pg.Client({ connectionString: app.ctx.cfg.DATABASE_URL_TEST });
    await db.connect();
    const r = await db.query("select password from account where provider_id = 'credential'");
    await db.end();
    expect(r.rows[0].password).toMatch(/^\$argon2id\$/);
    expect(r.rows[0].password).not.toContain(PASSWORD);
  });

  it('recusa senha curta ou comum e origem não confiável', async () => {
    const c = new Client(app);
    await expect(c.signUp('Ana', 'ana@t.local', 'curta')).rejects.toThrow();
    await expect(c.signUp('Ana', 'ana@t.local', 'password123')).rejects.toThrow();
    const res = await app.inject({ method: 'POST', url: '/api/characters', headers: { origin: 'http://evil.example', 'content-type': 'application/json' }, payload: {} });
    expect(res.statusCode).toBe(403);
  });

  it('reset de senha: envia e-mail com link e aceita a nova senha', async () => {
    const c = new Client(app);
    await c.signUp('Ana', 'ana@t.local');
    const res = await c.post('/api/auth/request-password-reset', { email: 'ana@t.local', redirectTo: 'http://localhost:5173/redefinir' });
    expect(res.statusCode).toBe(200);
    const mail = app.ctx.mailer.outbox.at(-1)!;
    expect(mail.to).toBe('ana@t.local');
    const token = mail.text.match(/reset-password\/([A-Za-z0-9_-]+)/)![1];
    const done = await c.post('/api/auth/reset-password', { newPassword: 'nova-senha-forte-456', token });
    expect(done.statusCode).toBe(200);
    expect((await new Client(app).signIn('ana@t.local', PASSWORD)).statusCode).toBe(401);
    expect((await new Client(app).signIn('ana@t.local', 'nova-senha-forte-456')).statusCode).toBe(200);
  });

  it('pedido de reset para e-mail inexistente não revela nada', async () => {
    const res = await new Client(app).post('/api/auth/request-password-reset', { email: 'ninguem@t.local' });
    expect(res.statusCode).toBe(200);
    expect(app.ctx.mailer.outbox.length).toBe(0);
  });

  it('rotas de dados exigem login', async () => {
    for (const url of ['/api/characters', '/api/campaigns', '/api/rolls/mine', '/api/sync']) {
      expect((await app.inject({ method: 'GET', url })).statusCode).toBe(401);
    }
  });

  it('Holocron desligado sem ANTHROPIC_API_KEY', async () => {
    const c = new Client(app);
    await c.signUp('Ana', 'ana@t.local');
    expect((await app.inject({ method: 'GET', url: '/api/meta' })).json().features.assistant).toBe(false);
    const r = await c.post('/api/assistant/ask', { question: 'Como funciona o Wild Die?' });
    expect(r.statusCode).toBe(503);
  });
});

describe('Google OAuth (provedor mockado: só confere o redirecionamento)', () => {
  it('desligado por padrão e sem botão ativo em /api/meta', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/meta' })).json().features.google).toBe(false);
  });
  it('com credenciais gera a URL do Google com o redirect_uri do proxy do Vite', async () => {
    const g = await makeApp({ env: { GOOGLE_CLIENT_ID: 'fake-client-id.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'fake-secret' } });
    try {
      expect((await g.inject({ method: 'GET', url: '/api/meta' })).json().features.google).toBe(true);
      const res = await g.inject({ method: 'POST', url: '/api/auth/sign-in/social', headers: { origin: 'http://localhost:5173', 'content-type': 'application/json' }, payload: { provider: 'google', callbackURL: 'http://localhost:5173/' } });
      expect(res.statusCode).toBe(200);
      const url = new URL(res.json().url);
      expect(url.host).toBe('accounts.google.com');
      expect(url.searchParams.get('client_id')).toBe('fake-client-id.apps.googleusercontent.com');
      expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:5173/api/auth/callback/google');
      expect(url.searchParams.get('scope')).toContain('email');
    } finally { await g.close(); }
  });
});
