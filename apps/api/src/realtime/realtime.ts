// realtime.ts - Socket.IO so para distribuir o que ja foi gravado via REST (ADR-0006). Salas:
// user:<id>, campaign:<id>, campaign:<id>:gm, character:<id>. A inscricao confere a autorizacao.
import { and, eq, isNull } from 'drizzle-orm';
import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { Auth } from '../auth/auth';
import { characterRole } from '../authz/policies';
import type { Config } from '../config';
import type { Db } from '../db/client';
import { schema } from '../db/client';

const { characters, campaignMembers } = schema;

export interface Realtime {
  io: Server | null;
  characterChanged(row: any, info: { ops: any[]; actorId: string; deviceId: string; role: string }): void;
  rollCreated(roll: any, visibility: string, campaignId: string | null, authorId: string): void;
  rollUpdated(roll: any, visibility: string, campaignId: string | null, authorId: string): void;
  campaignRound(campaignId: string, round: number): void;
  campaignMembers(campaignId: string): void;
  syncHint(userId: string): void;
  close(): Promise<void>;
}

export function createRealtime(httpServer: HttpServer | null, deps: { cfg: Config; db: Db; auth: Auth }): Realtime {
  if (!httpServer) {
    const noop = () => {};
    return { io: null, characterChanged: noop, rollCreated: noop, rollUpdated: noop, campaignRound: noop, campaignMembers: noop, syncHint: noop, close: async () => {} };
  }
  const { cfg, db, auth } = deps;
  const allowedOrigins = new Set([cfg.APP_URL, `http://localhost:${cfg.PORT}`, 'http://localhost:5173', 'http://127.0.0.1:5173']);
  const io = new Server(httpServer, {
    path: '/socket.io', serveClient: false,
    allowRequest: (req, cb) => {
      const origin = req.headers.origin;
      cb(null, !origin || allowedOrigins.has(origin) || origin === `http://${req.headers.host}`);
    },
  });
  const presence = new Map<string, Map<string, number>>(); // campaignId -> userId -> sockets

  io.use(async (socket, next) => {
    try {
      const headers = new Headers();
      if (socket.handshake.headers.cookie) headers.set('cookie', socket.handshake.headers.cookie);
      const session = await auth.api.getSession({ headers });
      if (!session) return next(new Error('unauthorized'));
      socket.data.user = { id: session.user.id, name: session.user.name };
      next();
    } catch { next(new Error('unauthorized')); }
  });

  const announce = (campaignId: string) => io.to(`campaign:${campaignId}`).emit('presence', { campaignId, online: [...(presence.get(campaignId)?.keys() ?? [])] });

  io.on('connection', (socket) => {
    const user = socket.data.user as { id: string; name: string };
    socket.join(`user:${user.id}`);
    const joined = new Set<string>();

    socket.on('subscribe', async (msg: { campaignId?: string; characterId?: string }, ack?: (r: any) => void) => {
      try {
        const out: Record<string, boolean> = {};
        if (msg?.campaignId) {
          const [m] = await db.select().from(campaignMembers).where(and(eq(campaignMembers.campaignId, msg.campaignId), eq(campaignMembers.userId, user.id)));
          if (m) {
            socket.join(`campaign:${msg.campaignId}`);
            if (m.role === 'gm') socket.join(`campaign:${msg.campaignId}:gm`);
            if (!joined.has(msg.campaignId)) {
              joined.add(msg.campaignId);
              const map = presence.get(msg.campaignId) ?? new Map();
              map.set(user.id, (map.get(user.id) ?? 0) + 1);
              presence.set(msg.campaignId, map);
              announce(msg.campaignId);
            }
            out.campaign = true;
          } else out.campaign = false;
        }
        if (msg?.characterId) {
          const [ch] = await db.select().from(characters).where(and(eq(characters.id, msg.characterId), isNull(characters.deletedAt)));
          let ok = false;
          if (ch) {
            let mem: { role: 'gm' | 'player' } | null = null;
            if (ch.campaignId) { const [m] = await db.select().from(campaignMembers).where(and(eq(campaignMembers.campaignId, ch.campaignId), eq(campaignMembers.userId, user.id))); mem = m ? { role: m.role as any } : null; }
            const role = characterRole(user.id, ch, mem);
            ok = role === 'owner' || role === 'gm'; // peers recebem so party:changed (sem Dark Side Points)
          }
          if (ok) socket.join(`character:${msg.characterId}`);
          out.character = ok;
        }
        ack?.({ ok: true, ...out });
      } catch { ack?.({ ok: false }); }
    });
    socket.on('unsubscribe', (msg: { campaignId?: string; characterId?: string }) => {
      if (msg?.campaignId) { socket.leave(`campaign:${msg.campaignId}`); socket.leave(`campaign:${msg.campaignId}:gm`); }
      if (msg?.characterId) socket.leave(`character:${msg.characterId}`);
    });
    socket.on('disconnect', () => {
      for (const cid of joined) {
        const map = presence.get(cid);
        if (!map) continue;
        const n = (map.get(user.id) ?? 1) - 1;
        if (n <= 0) map.delete(user.id); else map.set(user.id, n);
        announce(cid);
      }
    });
  });

  return {
    io,
    characterChanged(row, info) {
      const payload = { id: row.id, revision: row.revision, ops: info.ops, playState: row.playState, actorId: info.actorId, deviceId: info.deviceId, actorRole: info.role, portraitMediaId: row.portraitMediaId };
      let t = io.to(`user:${row.ownerId}`).to(`character:${row.id}`);
      if (row.campaignId) t = t.to(`campaign:${row.campaignId}:gm`);
      t.emit('character:changed', payload);
      if (row.campaignId) io.to(`campaign:${row.campaignId}`).emit('party:changed', { characterId: row.id });
    },
    rollCreated(roll, visibility, campaignId, authorId) {
      let t = io.to(`user:${authorId}`);
      if (campaignId) t = t.to(visibility === 'table' ? `campaign:${campaignId}` : visibility === 'gm' ? `campaign:${campaignId}:gm` : `user:${authorId}`);
      t.emit('roll:created', roll);
    },
    rollUpdated(roll, visibility, campaignId, authorId) {
      let t = io.to(`user:${authorId}`);
      if (campaignId) t = t.to(visibility === 'table' ? `campaign:${campaignId}` : visibility === 'gm' ? `campaign:${campaignId}:gm` : `user:${authorId}`);
      t.emit('roll:updated', roll);
    },
    campaignRound(campaignId, round) { io.to(`campaign:${campaignId}`).emit('campaign:round', { campaignId, round }); },
    campaignMembers(campaignId) { io.to(`campaign:${campaignId}`).emit('campaign:members', { campaignId }); },
    syncHint(userId) { io.to(`user:${userId}`).emit('sync:hint', {}); },
    async close() { io.disconnectSockets(true); await new Promise<void>((r) => io.close(() => r())); },
  };
}
