// config.ts - variaveis de ambiente com defaults de dev (o .env na raiz e opcional).
import { config as loadDotenv } from 'dotenv';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
loadDotenv({ path: join(ROOT, '.env'), quiet: true } as any);

const str = (def = '') => z.string().default(def).transform((s) => s.trim());

const schema = z.object({
  NODE_ENV: str('development'),
  PORT: z.coerce.number().default(3000),
  HOST: str('127.0.0.1'),
  DATABASE_URL: str('postgres://r2d6:r2d6@127.0.0.1:5432/r2d6'),
  DATABASE_URL_TEST: str('postgres://r2d6:r2d6@127.0.0.1:5432/r2d6_test'),
  APP_URL: str('http://localhost:5173'),
  BETTER_AUTH_SECRET: str('dev-only-change-me-dev-only-change-me'),
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
});

export type Config = z.infer<typeof schema> & { isProd: boolean; isTest: boolean; mediaDir: string; features: { google: boolean; discord: boolean; assistant: boolean } };

export function loadConfig(overrides: Record<string, string | undefined> = {}): Config {
  const env = { ...process.env, ...overrides };
  // chave em branco no .env.example = desligado
  const c = schema.parse(Object.fromEntries(Object.entries(env).filter(([, v]) => v !== undefined)));
  return {
    ...c,
    isProd: c.NODE_ENV === 'production',
    isTest: c.NODE_ENV === 'test',
    mediaDir: resolve(ROOT, c.MEDIA_DIR),
    features: {
      google: !!(c.GOOGLE_CLIENT_ID && c.GOOGLE_CLIENT_SECRET),
      discord: !!(c.DISCORD_CLIENT_ID && c.DISCORD_CLIENT_SECRET),
      assistant: !!c.ANTHROPIC_API_KEY,
    },
  };
}
