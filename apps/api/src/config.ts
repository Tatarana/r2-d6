// config.ts - variaveis de ambiente com defaults de dev (o .env na raiz e opcional).
import { config as loadDotenv } from 'dotenv';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
loadDotenv({ path: join(ROOT, '.env'), quiet: true } as any);

const str = (def = '') => z.string().default(def).transform((s) => s.trim());
const DEV_SECRET_DEFAULT = 'dev-only-change-me-dev-only-change-me';

const schema = z.object({
  NODE_ENV: str('development'),
  PORT: z.coerce.number().default(3000),
  HOST: str('127.0.0.1'),
  DATABASE_URL: str('postgres://r2d6:r2d6@127.0.0.1:5432/r2d6'),
  DATABASE_URL_TEST: str('postgres://r2d6:r2d6@127.0.0.1:5432/r2d6_test'),
  APP_URL: str('http://localhost:5173'),
  BETTER_AUTH_SECRET: str(DEV_SECRET_DEFAULT),
  SMTP_URL: str('smtp://127.0.0.1:1025'),
  MAIL_FROM: str('r2-d6 <no-reply@r2d6.local>'),
  STORAGE_DRIVER: str('local'),
  MEDIA_DIR: str('.data/media'),
  DISCORD_CLIENT_ID: str(), DISCORD_CLIENT_SECRET: str(),
  GOOGLE_CLIENT_ID: str(), GOOGLE_CLIENT_SECRET: str(),
  ANTHROPIC_API_KEY: str(),
  ASSISTANT_MODEL: str('claude-haiku-5-5'),
  ASSISTANT_DAILY_LIMIT: z.coerce.number().default(40),
  SEED_PASSWORD: str('r2d6-demo-2026'),
  // cadastro: open = qualquer um; invite = so com codigo de convite de campanha (ou e-mail da lista abaixo)
  SIGNUP_MODE: z.enum(['open', 'invite']).default('open'),
  SIGNUP_ALLOWLIST: str(), // e-mails separados por virgula (ex.: o primeiro mestre)
  // login por e-mail e senha: padrao ligado no dev/teste (seed, testes) e desligado em producao (so Google)
  EMAIL_LOGIN: z.enum(['on', 'off']).optional(),
});

export type Config = z.infer<typeof schema> & {
  isProd: boolean; isTest: boolean; mediaDir: string; signupAllowlist: Set<string>;
  features: { google: boolean; discord: boolean; assistant: boolean; signupOpen: boolean; emailLogin: boolean };
};

export function loadConfig(overrides: Record<string, string | undefined> = {}): Config {
  const env = { ...process.env, ...overrides };
  // chave em branco no .env.example = desligado
  const c = schema.parse(Object.fromEntries(Object.entries(env).filter(([, v]) => v !== undefined && v !== '')));
  const isProd = c.NODE_ENV === 'production';
  // producao nao sobe com segredo de dev nem apontando para localhost
  if (isProd && (c.BETTER_AUTH_SECRET === DEV_SECRET_DEFAULT || c.BETTER_AUTH_SECRET.length < 32)) throw new Error('BETTER_AUTH_SECRET de produção ausente ou curto (mínimo 32 caracteres).');
  if (isProd && !c.APP_URL.startsWith('https://')) throw new Error('APP_URL de produção precisa ser https://.');
  const google = !!(c.GOOGLE_CLIENT_ID && c.GOOGLE_CLIENT_SECRET);
  const emailLogin = (c.EMAIL_LOGIN ?? (isProd ? 'off' : 'on')) === 'on';
  if (isProd && !emailLogin && !google) throw new Error('Sem login: com EMAIL_LOGIN=off, configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.');
  return {
    ...c,
    isProd,
    isTest: c.NODE_ENV === 'test',
    mediaDir: resolve(ROOT, c.MEDIA_DIR),
    signupAllowlist: new Set(c.SIGNUP_ALLOWLIST.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)),
    features: {
      google,
      discord: !!(c.DISCORD_CLIENT_ID && c.DISCORD_CLIENT_SECRET),
      assistant: !!c.ANTHROPIC_API_KEY,
      signupOpen: c.SIGNUP_MODE === 'open',
      emailLogin,
    },
  };
}
