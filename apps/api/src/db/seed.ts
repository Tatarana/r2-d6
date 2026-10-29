// seed.ts - usuarios e campanha de demonstracao (so desenvolvimento). Idempotente.
// Contas: mestre@r2d6.local e jogador@r2d6.local; senha em SEED_PASSWORD (.env.example) - ver README.
import { createCreation, createSheetValidator, defaultPlayState } from '@r2d6/rules';
import { loadBundle } from '@r2d6/data/node';
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'node:url';
import { createAuth } from '../auth/auth';
import { createMailer } from '../auth/mail';
import { loadConfig, type Config } from '../config';
import { hashCode } from '../modules/campaigns';
import { createDb, schema } from './client';

export const DEMO_INVITE = 'DEMO-R2D6';

export async function seed(cfg: Config) {
  if (cfg.isProd && !process.env.SEED_FORCE) throw new Error('Seed recusado em produção (defina SEED_FORCE para forçar).');
  const { db, pool } = createDb(cfg.DATABASE_URL);
  try {
    const existing = await db.select().from(schema.user).where(eq(schema.user.email, 'mestre@r2d6.local'));
    if (existing.length) { console.log('[seed] já existe; nada a fazer.'); return; }
    const auth = createAuth(cfg, db, createMailer({ ...cfg, isTest: true }));
    const mk = async (name: string, email: string) => {
      const r: any = await auth.api.signUpEmail({ body: { name, email, password: cfg.SEED_PASSWORD } });
      return r.user.id as string;
    };
    const mestreId = await mk('Mestra Aurek', 'mestre@r2d6.local');
    const jogadorId = await mk('Jogador Dax', 'jogador@r2d6.local');

    const bundle = loadBundle();
    const creation = createCreation(bundle);
    const validate = createSheetValidator(bundle.schema);
    // personagens de demonstracao montados pelo mesmo assistente da UI (7D de pericias, arma do catalogo)
    const weapon = bundle.entities.weapons.find((x: any) => x.id === 'blaster-pistol') ?? bundle.entities.weapons[0];
    const build = (tpl: string, name: string, skills: Record<string, number>) => {
      const w = creation.pickTemplate(creation.templatesById.get(tpl));
      w.speciesId = 'humans'; w.details.name = name;
      for (const [id, dice] of Object.entries(skills)) w.skills[id] = { dice, pips: 0 };
      w.cart.push({ cat: 'weapons', id: weapon.id, name: weapon.name, charged: 0 });
      const v = creation.validation(w);
      if (v.errors.length) throw new Error(`seed ${name}: ${v.errors.map((e: any) => e.msg).join('; ')}`);
      return creation.buildCharacter(w);
    };
    const kael = build('smuggler', 'Kael Varn', { blaster: 2, dodge: 1, 'space-transports': 2, 'starship-gunnery': 1, con: 1 });
    const zia = build('brash-pilot', 'Zia Marn', { 'starfighter-piloting': 2, 'starship-gunnery': 2, blaster: 1, dodge: 1, astrogation: 1 });
    for (const s of [kael, zia]) { const v = validate(s); if (!v.ok) throw new Error(`ficha de seed inválida: ${JSON.stringify(v.errors)}`); }

    const [campaign] = await db.insert(schema.campaigns).values({
      name: 'Demo: Fuga de Tatooine', description: 'Campanha de demonstração: um contrabandista, uma piloto e uma carga que ninguém deveria ter aceitado.',
      createdBy: mestreId, settings: { wildOneResolver: 'gm', partyVisibility: 'full', rollVisibilityDefault: 'table', houseRules: {} },
    }).returning();
    await db.insert(schema.campaignMembers).values([
      { campaignId: campaign.id, userId: mestreId, role: 'gm' },
      { campaignId: campaign.id, userId: jogadorId, role: 'player' },
    ]);
    for (const [owner, sheet, tpl] of [[jogadorId, kael, 'Smuggler'], [mestreId, zia, 'Brash Pilot']] as const) {
      const id = crypto.randomUUID();
      await db.insert(schema.characters).values({ id, ownerId: owner, campaignId: campaign.id, name: sheet.name, speciesId: sheet.species, templateType: tpl, sheet, playState: defaultPlayState() as any, revision: 1 });
      await db.insert(schema.characterVersions).values({ characterId: id, revision: 1, snapshot: sheet, kind: 'creation', label: 'Criação (seed)', authorId: owner });
    }
    await db.insert(schema.campaignInvites).values({
      campaignId: campaign.id, codeHash: hashCode(DEMO_INVITE), createdBy: mestreId, role: 'player', maxUses: 100, expiresAt: new Date(Date.now() + 365 * 86400_000),
    });
    console.log(`[seed] ok: mestre@r2d6.local e jogador@r2d6.local; campanha "${campaign.name}"; convite ${DEMO_INVITE}.`);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seed(loadConfig()).catch((e) => { console.error('[seed] falha:', e.message); process.exit(1); });
}
