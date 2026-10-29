// ctx.ts - dependencias compartilhadas pelos modulos (injetadas em buildApp; nada global).
import type { Catalog } from '@r2d6/data';
import type { SheetValidator } from '@r2d6/rules';
import type { Auth } from './auth/auth';
import type { Mailer } from './auth/mail';
import type { Config } from './config';
import type { Db } from './db/client';
import type { Realtime } from './realtime/realtime';
import type { Storage } from './modules/storage';

export interface AppCtx {
  cfg: Config;
  db: Db;
  auth: Auth;
  mailer: Mailer;
  catalog: Catalog;
  bundleHash: string;
  validateSheet: SheetValidator;
  skillsById: Map<string, any>;
  rt: Realtime;
  storage: Storage;
}

export interface SessionUser { id: string; name: string; email: string }
