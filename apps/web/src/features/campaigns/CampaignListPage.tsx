// CampaignListPage - minhas campanhas, criar campanha e entrar com codigo de convite.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArtSlot } from '@/components/ArtSlot';
import { EmptyState, ErrorState, Field, Page, Panel, Spinner } from '@/components/ui';
import { errText, get, post } from '@/lib/api';

export function CampaignListPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const list = useQuery({ queryKey: ['campaigns'], queryFn: () => get<{ campaigns: any[] }>('/api/campaigns'), retry: 0 });
  const [err, setErr] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: (body: { name: string; description: string }) => post('/api/campaigns', body),
    onSuccess: (r) => { void qc.invalidateQueries({ queryKey: ['campaigns'] }); nav(`/campanhas/${r.campaign.id}`); },
    onError: (e) => setErr(errText(e)),
  });
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr(null);
    const fd = new FormData(e.currentTarget);
    create.mutate({ name: String(fd.get('name')), description: String(fd.get('description') || '') });
  };
  const join = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code')).trim().replace(/\s+/g, '');
    if (code) nav(`/convite/${encodeURIComponent(code)}`);
  };

  return (
    <div>
      <div className="relative h-36 overflow-hidden md:h-48">
        <ArtSlot id="hero.campaign" ratio="auto" className="absolute inset-0 h-full w-full" decorative eager />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,7,12,.2), var(--space))' }} />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-3 md:px-6"><p className="label">Mesas</p><h1 className="holo-text text-2xl font-bold uppercase tracking-wider md:text-4xl">Campanhas</h1></div>
      </div>
      <Page className="grid gap-4 pt-2 lg:grid-cols-[1.4fr_1fr]">
        <section aria-label="Minhas campanhas" className="grid content-start gap-3">
          {list.isLoading ? <Spinner /> : list.isError ? <ErrorState art="error.offline" title="Campanhas indisponíveis offline" onRetry={() => list.refetch()}>Campanhas e rolagens compartilhadas precisam de conexão.</ErrorState> : !list.data!.campaigns.length ? (
            <EmptyState art="empty.campaigns" title="Você ainda não está em nenhuma campanha">Crie uma mesa como mestre ou entre com o código que seu mestre enviou.</EmptyState>
          ) : list.data!.campaigns.map((c) => (
            <Link key={c.id} to={`/campanhas/${c.id}`} className="glass chamfer flex items-center gap-4 p-4 text-[var(--text)] hover:no-underline" data-testid="campaign-link">
              <ArtSlot id="campaign.cover.outer-rim" className="hidden w-28 shrink-0 sm:block" decorative />
              <div className="min-w-0 flex-1"><div className="text-lg font-bold">{c.name}</div><p className="truncate text-sm text-muted">{c.description || 'Sem descrição.'}</p>
                <div className="mt-1 flex flex-wrap gap-1.5"><span className="chip">{c.myRole === 'gm' ? 'Você é o mestre' : `Mestre: ${c.gmName}`}</span><span className="chip"><Users className="h-3 w-3" aria-hidden />{c.memberCount}</span><span className="chip">Round {c.currentRound}</span></div></div>
            </Link>
          ))}
        </section>
        <div className="grid content-start gap-4">
          <Panel><h2 className="label mb-2">Entrar com convite</h2>
            <form onSubmit={join} className="flex gap-2"><input className="input mono uppercase" name="code" aria-label="Código do convite" placeholder="XXXX-XXXX" autoComplete="off" /><button className="btn">Entrar</button></form></Panel>
          <Panel><h2 className="label mb-2">Nova campanha</h2>
            <form onSubmit={submit} className="grid gap-3">
              <Field label="Nome"><input className="input" name="name" required minLength={2} maxLength={80} placeholder="ex.: Fuga de Tatooine" /></Field>
              <Field label="Descrição (opcional)"><textarea className="input" name="description" maxLength={2000} /></Field>
              {err && <p role="alert" className="err">{err}</p>}
              <button className="btn primary" disabled={create.isPending}><Plus className="h-4 w-4" aria-hidden />Criar como mestre</button>
            </form></Panel>
        </div>
      </Page>
    </div>
  );
}
