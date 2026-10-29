// schema.ts - Drizzle: tabelas do Better Auth (user, session, account, verification) e do dominio.
import { sql } from 'drizzle-orm';
import { bigint, boolean, index, integer, jsonb, pgSequence, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

// ------------------------------------------------------------------ auth (esquema padrao do Better Auth)
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
}, (t) => [index('session_user_idx').on(t.userId)]);

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('account_user_idx').on(t.userId)]);

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ------------------------------------------------------------------ dominio
export const syncSeq = pgSequence('character_sync_seq');

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // portrait | avatar | campaign_banner
  driver: text('driver').notNull().default('local'),
  storageKey: text('storage_key').notNull(),
  mime: text('mime').notNull(),
  bytes: integer('bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  variants: jsonb('variants').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  settings: jsonb('settings').notNull().default({}),
  currentRound: integer('current_round').notNull().default(1),
  createdBy: text('created_by').notNull().references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
});

export const campaignMembers = pgTable('campaign_members', {
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('player'), // gm | player
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.campaignId, t.userId] }), index('cm_user_idx').on(t.userId)]);

export const campaignInvites = pgTable('campaign_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull().unique(),
  role: text('role').notNull().default('player'),
  createdBy: text('created_by').notNull().references(() => user.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  maxUses: integer('max_uses').notNull().default(10),
  uses: integer('uses').notNull().default(0),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const characters = pgTable('characters', {
  id: uuid('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  speciesId: text('species_id').notNull().default(''),
  templateType: text('template_type').notNull().default(''),
  portraitMediaId: uuid('portrait_media_id').references(() => media.id, { onDelete: 'set null' }),
  sheet: jsonb('sheet').notNull(),
  playState: jsonb('play_state').notNull(),
  revision: integer('revision').notNull().default(1),
  syncSeq: bigint('sync_seq', { mode: 'number' }).notNull().default(sql`nextval('character_sync_seq')`),
  validation: jsonb('validation').notNull().default({}),
  reviewStatus: text('review_status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [index('char_owner_idx').on(t.ownerId), index('char_campaign_idx').on(t.campaignId), index('char_sync_idx').on(t.syncSeq)]);

export const characterChanges = pgTable('character_changes', {
  characterId: uuid('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  revision: integer('revision').notNull(),
  ops: jsonb('ops').notNull(),
  actorId: text('actor_id').notNull(),
  actorRole: text('actor_role').notNull(), // owner | gm
  deviceId: text('device_id').notNull().default('web'),
  mutationId: uuid('mutation_id'),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.characterId, t.revision] }), uniqueIndex('char_changes_mutation_idx').on(t.mutationId)]);

export const characterVersions = pgTable('character_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  revision: integer('revision').notNull(),
  snapshot: jsonb('snapshot').notNull(),
  kind: text('kind').notNull(), // creation | auto | milestone | restore | approval
  label: text('label').notNull().default(''),
  authorId: text('author_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('char_versions_idx').on(t.characterId, t.createdAt)]);

export const rolls = pgTable('rolls', {
  id: uuid('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'set null' }),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  rollType: text('roll_type').notNull(),
  label: text('label').notNull(),
  pool: jsonb('pool').notNull(), // { text, lines[], code }
  mode: text('mode').notNull().default('digital'), // digital | physical
  rng: text('rng').notNull().default('server'), // server | client
  result: jsonb('result').notNull(), // { normals, wild, pips, wildOne, totals }
  cpDice: jsonb('cp_dice').notNull().default([]),
  cpTotal: integer('cp_total').notNull().default(0),
  wildOneChoice: text('wild_one_choice'),
  resolvedBy: text('resolved_by'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  total: integer('total'),
  visibility: text('visibility').notNull().default('table'), // table | gm | private
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('rolls_campaign_idx').on(t.campaignId, t.createdAt), index('rolls_user_idx').on(t.userId, t.createdAt)]);

export const assistantQueries = pgTable('assistant_queries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answer: text('answer').notNull().default(''),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  cachedTokens: integer('cached_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
