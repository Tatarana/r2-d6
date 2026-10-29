// Hangar - tela inicial: holocartas dos personagens (baias) e cartoes das campanhas.
import { useQuery } from '@tanstack/react-query';
import { Plus, Swords, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { ArtSlot, artItem } from '@/components/ArtSlot';
import { EmptyState, Page, PortraitFrame, Spinner, WOUND_PT, woundTone } from '@/components/ui';
import { useSession } from '@/lib/auth';
import { get } from '@/lib/api';
import { useCatalog } from '@/lib/catalog';
import { usePrefs } from '@/lib/prefs';
import { useChars } from '@/lib/sync';
import type { LocalChar } from '@/lib/db';

export const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function templateArt(templateType: string) {
  const id = `template.${slugify(templateType)}`;
  return artItem(id) ? id : 'portrait.default';
}

function HoloCard({ c, i }: { c: LocalChar; i: number }) {
  const cs = useCatalog();
  const nav = useNavigate();
  const setPref = usePrefs((s) => s.set);
  const s = c.sheet;
  const species = cs?.catalog.getEntity('species', c.speciesId)?.name ?? '';
  const wound = s.wound_status as string;
  return (
    <button
      className="glass chamfer-2 reticle holo-in group relative grid w-full overflow-hidden text-left transition-transform hover:-translate-y-1" style={{ animationDelay: `${i * 60}ms` }}
      onClick={() => { setPref({ activeChar: c.id }); nav(`/ficha/${c.id}`); }} aria-label={`Abrir ficha de ${c.name}`} data-testid="holocard"
    >
      <div className="relative h-28 overflow-hidden">
        <ArtSlot id={templateArt(c.templateType)} ratio="auto" className="absolute inset-0 h-full w-full opacity-60 blur-[2px]" decorative />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, var(--glass-solid))' }} />
        <PortraitFrame mediaId={c.portraitMediaId} size={64} alt={`Retrato de ${c.name}`} fallback={templateArt(c.templateType)} className="absolute bottom-[-18px] left-4" />
        {c.pendingCreate && <span className="chip absolute right-2 top-2" style={{ color: 'var(--warn)' }}>na fila</span>}
      </div>
      <div className="grid gap-2 p-4 pt-6">
        <div>
          <div className="text-lg font-bold leading-tight">{c.name}</div>
          <div className="text-sm text-muted">{c.templateType}{species ? ` · ${species}` : ''}</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="chip" style={{ color: woundTone(wound), borderColor: woundTone(wound) }}>{WOUND_PT[wound]}</span>
          <span className="chip" style={{ color: 'var(--cp)' }}>CP {s.character_points}</span>
          <span className="chip" style={{ color: 'var(--fp)' }}>FP {s.force_points}</span>
          {c.campaignId && <span className="chip"><Users className="h-3 w-3" aria-hidden />em campanha</span>}
        </div>
      </div>
    </button>
  );
}

export function Hangar() {
  const { data: session } = useSession();
  const chars = useChars();
  const camps = useQuery({ queryKey: ['campaigns'], queryFn: () => get<{ campaigns: any[] }>('/api/campaigns'), retry: 0 });
  const first = session?.user.name?.split(' ')[0] ?? '';

  return (
    <div>
      <div className="relative h-40 overflow-hidden md:h-52 lg:h-60">
        <ArtSlot id="hero.hangar" ratio="auto" className="absolute inset-0 h-full w-full" decorative eager />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,7,12,.2), var(--space))' }} />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-4 md:px-6">
          <p className="label">Hangar</p>
          <h1 className="holo-text text-2xl font-bold uppercase tracking-wider md:text-4xl">Bem-vindo de volta{first ? `, ${first}` : ''}</h1>
        </div>
      </div>
      <Page className="pt-2">
        <section aria-labelledby="h-chars" className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="h-chars" className="text-lg font-bold uppercase tracking-wider">Seus personagens</h2>
            <Link to="/criar" className="btn primary"><Plus className="h-4 w-4" aria-hidden />Novo personagem</Link>
          </div>
          {chars === undefined ? <Spinner /> : chars.length === 0 ? (
            <EmptyState art="empty.characters" title="Nenhum personagem no hangar" action={<Link className="btn primary" to="/criar">Criar o primeiro</Link>}>Monte um personagem por template em poucos minutos.</EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {chars.map((c, i) => <HoloCard key={c.id} c={c} i={i} />)}
              <Link to="/criar" className="glass chamfer-2 grid min-h-48 place-items-center overflow-hidden text-center text-muted hover:text-[var(--holo)]">
                <div className="grid justify-items-center gap-2"><ArtSlot id="hangar.bay.empty" className="w-24" decorative /><span className="font-semibold">Baia livre</span></div>
              </Link>
            </div>
          )}
        </section>

        <section aria-labelledby="h-camps">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="h-camps" className="text-lg font-bold uppercase tracking-wider">Campanhas</h2>
            <Link to="/campanhas" className="btn sm">Gerenciar</Link>
          </div>
          {camps.isLoading ? <Spinner /> : !camps.data?.campaigns.length ? (
            <EmptyState art="empty.campaigns" title="Sem campanhas ainda" action={<Link className="btn" to="/campanhas">Criar ou entrar com convite</Link>}>Crie uma mesa como mestre ou entre com um convite.</EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {camps.data.campaigns.map((c) => (
                <Link key={c.id} to={`/campanhas/${c.id}`} className="glass chamfer overflow-hidden text-[var(--text)] hover:no-underline" style={{ textDecoration: 'none' }}>
                  <ArtSlot id="hero.campaign" className="w-full" ratio="21 / 9" decorative />
                  <div className="p-4"><div className="text-lg font-bold">{c.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-sm text-muted"><span className="chip"><Swords className="h-3 w-3" aria-hidden />{c.myRole === 'gm' ? 'Mestre' : 'Jogador'}</span><span className="chip"><Users className="h-3 w-3" aria-hidden />{c.memberCount}</span><span className="chip">Round {c.currentRound}</span></div>
                    <p className="mt-1 text-sm text-muted">Mestre: {c.gmName}</p></div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </Page>
    </div>
  );
}
