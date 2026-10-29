// auth.ts - Better Auth: e-mail+senha (Argon2id), sessao em banco com cookie httpOnly, OAuth atras de variavel de ambiente.
import { hash, verify } from '@node-rs/argon2';
import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Config } from '../config';
import type { Db } from '../db/client';
import { schema } from '../db/client';
import type { Mailer } from './mail';

// OWASP: m=19 MiB, t=2, p=1 (Argon2id e o algoritmo padrao do @node-rs/argon2)
const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

const COMMON = new Set(['password12', '1234567890', '12345678910', 'qwertyuiop', 'password123', 'senha12345', 'senha123456', 'abcdefghij', '0123456789', 'iloveyou12', 'letmein1234', 'admin12345']);
export function passwordProblem(pw: unknown): string | null {
  if (typeof pw !== 'string') return null;
  if (pw.length < 10) return 'A senha precisa ter pelo menos 10 caracteres.';
  if (COMMON.has(pw.toLowerCase())) return 'Essa senha é comum demais. Escolha outra.';
  if (new Set(pw).size < 4) return 'A senha é repetitiva demais. Escolha outra.';
  return null;
}

export function createAuth(cfg: Config, db: Db, mailer: Mailer) {
  const social: Record<string, any> = {};
  if (cfg.features.google) social.google = { clientId: cfg.GOOGLE_CLIENT_ID, clientSecret: cfg.GOOGLE_CLIENT_SECRET };
  if (cfg.features.discord) social.discord = { clientId: cfg.DISCORD_CLIENT_ID, clientSecret: cfg.DISCORD_CLIENT_SECRET };

  const origins = new Set<string>([cfg.APP_URL, `http://localhost:${cfg.PORT}`, 'http://localhost:5173', 'http://127.0.0.1:5173']);

  return betterAuth({
    appName: 'r2-d6',
    baseURL: cfg.APP_URL,
    secret: cfg.BETTER_AUTH_SECRET,
    trustedOrigins: [...origins],
    database: drizzleAdapter(db, { provider: 'pg', schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification } }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      requireEmailVerification: false, // ligado so em producao (backlog: depende de e-mail de producao)
      resetPasswordTokenExpiresIn: 3600,
      password: {
        hash: (password: string) => hash(password, ARGON),
        verify: ({ hash: h, password }: { hash: string; password: string }) => verify(h, password),
      },
      sendResetPassword: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
        await mailer.send({
          to: user.email,
          subject: 'r2-d6: redefinir sua senha',
          text: `Olá, ${user.name}.\n\nPara escolher uma nova senha, abra o link (vale por 1 hora):\n${url}\n\nSe você não pediu isso, ignore esta mensagem.`,
        });
      },
    },
    socialProviders: social,
    // Google garante e-mail verificado: contas com o mesmo e-mail sao vinculadas (outros provedores nao sao confiaveis por padrao)
    account: { accountLinking: { enabled: true, trustedProviders: ['google'] } },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    advanced: { useSecureCookies: cfg.isProd, defaultCookieAttributes: { sameSite: 'lax', httpOnly: true } },
    rateLimit: { enabled: cfg.isProd, window: 60, max: 30 },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/sign-up/email' || ctx.path === '/reset-password') {
          const body: any = ctx.body || {};
          const problem = passwordProblem(body.password ?? body.newPassword);
          if (problem) throw new APIError('BAD_REQUEST', { message: problem });
        }
      }),
    },
  });
}
export type Auth = ReturnType<typeof createAuth>;
