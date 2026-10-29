// app.ts - monta o Fastify: plugins, autenticacao, rotas e Socket.IO. Sem estado global: tudo via AppCtx.
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { createSheetValidator } from '@r2d6/rules';
import { bundleHash, loadBundle } from '@r2d6/data/node';
import { createCatalog } from '@r2d6/data';
import { fromNodeHeaders } from 'better-auth/node';
import Fastify, { type FastifyInstance } from 'fastify';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ZodError } from 'zod';
import { createAuth } from './auth/auth';
import { createMailer } from './auth/mail';
import { ROOT, loadConfig, type Config } from './config';
import type { AppCtx, SessionUser } from './ctx';
import { createDb } from './db/client';
import { HttpError } from './lib/http';
import { registerAssistantRoutes } from './modules/assistant';
import { registerCampaignRoutes } from './modules/campaigns';
import { registerCharacterRoutes } from './modules/characters';
import { registerMeRoutes } from './modules/me';
import { registerRollRoutes } from './modules/rolls';
import { createStorage } from './modules/storage';
import { createRealtime } from './realtime/realtime';

declare module 'fastify' {
  interface FastifyRequest { user: SessionUser | null }
  interface FastifyInstance { requireUser: (req: any, reply: any) => Promise<void>; ctx: AppCtx }
}

export interface BuildOptions { cfg?: Config; databaseUrl?: string; realtime?: boolean; logger?: boolean }

export async function buildApp(opts: BuildOptions = {}): Promise<FastifyInstance> {
  const cfg = opts.cfg ?? loadConfig();
  const app = Fastify({
    logger: opts.logger === false || cfg.isTest ? false : { level: 'info', redact: ['req.headers.cookie', 'req.headers.authorization'] },
    bodyLimit: 256 * 1024, trustProxy: true,
  });

  const { db, pool } = createDb(opts.databaseUrl ?? cfg.DATABASE_URL);
  const mailer = createMailer(cfg);
  const auth = createAuth(cfg, db, mailer);
  const bundle = loadBundle();
  const catalog = createCatalog(bundle);
  const rt = createRealtime(opts.realtime === false ? null : app.server, { cfg, db, auth });
  const ctx: AppCtx = {
    cfg, db, auth, mailer, catalog, bundleHash: bundleHash(), rt,
    validateSheet: createSheetValidator(bundle.schema),
    skillsById: new Map(bundle.entities.skills.map((s: any) => [s.id, s])),
    storage: createStorage(cfg, db),
  };
  app.decorate('ctx', ctx);
  app.decorateRequest('user', null);

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'ws:', 'wss:'], fontSrc: ["'self'", 'data:'], workerSrc: ["'self'", 'blob:'], objectSrc: ["'none'"], frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  });
  await app.register(rateLimit, { global: true, max: 600, timeWindow: '1 minute', allowList: () => cfg.isTest });
  await app.register(multipart);

  // JSON tolerante a corpo vazio (ex.: POST /api/auth/sign-out) e erro claro para JSON invalido
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    try { done(null, body ? JSON.parse(body as string) : {}); } catch { done(new HttpError(400, 'JSON inválido', 'O corpo da requisição não é um JSON válido.') as any); }
  });

  // CSRF: alem do cookie SameSite=Lax, mutacoes so aceitam Origin conhecida
  const origins = new Set([cfg.APP_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', `http://localhost:${cfg.PORT}`, `http://127.0.0.1:${cfg.PORT}`]);
  app.addHook('onRequest', async (req) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return;
    const origin = req.headers.origin;
    if (origin && !origins.has(origin) && origin !== `${req.protocol}://${req.headers.host}`) throw new HttpError(403, 'Origem não permitida', 'Origin não confiável.');
  });

  app.setErrorHandler((err: any, req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).type('application/problem+json').send({ type: 'validation', title: 'Dados inválidos', status: 400, detail: 'Algum campo não passou na validação.', errors: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) });
    }
    if (err instanceof HttpError) {
      return reply.code(err.status).type('application/problem+json').send({ type: 'about:blank', title: err.title, status: err.status, detail: err.detail, ...(err.extra ?? {}) });
    }
    if (err.statusCode && err.statusCode < 500) {
      return reply.code(err.statusCode).type('application/problem+json').send({ type: 'about:blank', title: err.message, status: err.statusCode, detail: err.message });
    }
    req.log.error({ err }, 'unhandled');
    return reply.code(500).type('application/problem+json').send({ type: 'about:blank', title: 'Erro interno', status: 500, detail: 'Algo deu errado no servidor.' });
  });

  // ---- Better Auth montado em /api/auth/*
  app.route({
    method: ['GET', 'POST'], url: '/api/auth/*',
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    handler: async (req, reply) => {
      const url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
      const headers = fromNodeHeaders(req.headers);
      const hasBody = req.method !== 'GET' && req.body !== undefined && req.body !== null;
      const response = await auth.handler(new Request(url, { method: req.method, headers, body: hasBody ? JSON.stringify(req.body) : undefined }));
      reply.status(response.status);
      response.headers.forEach((v, k) => { if (k.toLowerCase() !== 'set-cookie') reply.header(k, v); });
      const cookies = response.headers.getSetCookie();
      if (cookies.length) reply.header('set-cookie', cookies);
      return reply.send(response.body ? await response.text() : null);
    },
  });

  app.decorate('requireUser', async (req: any) => {
    const s = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!s) throw new HttpError(401, 'Não autenticado', 'Entre na sua conta para continuar.');
    req.user = { id: s.user.id, name: s.user.name, email: s.user.email };
  });

  registerMeRoutes(app, ctx);
  registerCharacterRoutes(app, ctx);
  registerCampaignRoutes(app, ctx);
  registerRollRoutes(app, ctx);
  registerAssistantRoutes(app, ctx);

  // producao: a API serve o front estatico (mesma origem, sem CORS)
  const dist = join(ROOT, 'apps', 'web', 'dist');
  if (cfg.isProd && existsSync(dist)) {
    await app.register(fastifyStatic, { root: dist, wildcard: false });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/') || req.url.startsWith('/socket.io')) return reply.code(404).type('application/problem+json').send({ type: 'about:blank', title: 'Não encontrado', status: 404 });
      return reply.sendFile('index.html');
    });
  } else {
    app.setNotFoundHandler((_req, reply) => reply.code(404).type('application/problem+json').send({ type: 'about:blank', title: 'Não encontrado', status: 404 }));
  }

  app.addHook('onClose', async () => { await rt.close(); await pool.end(); });
  return app;
}
