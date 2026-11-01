// InvitePage - pagina do convite: previa publica (nome da campanha e do mestre) e aceite apos login.
import { useQuery } from '@tanstack/react-query';
import { Hexagon } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArtSlot } from '@/components/ArtSlot';
import { ErrorState, Spinner } from '@/components/ui';
import { ApiError, errText, get, post } from '@/lib/api';
import { useSession } from '@/lib/auth';
import { socialSignIn, useMeta } from '@/features/auth/AuthPages';

export function InvitePage() {
  const { code = '' } = useParams();
  const nav = useNavigate();
  const { data: session } = useSession();
  const q = useQuery({ queryKey: ['invite', code], queryFn: () => get<{ campaign: { name: string; description: string }; gmName: string }>(`/api/invites/${encodeURIComponent(code)}`), retry: 0 });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = encodeURIComponent(`/convite/${code}`);

  const meta = useMeta();
  const googleOnly = meta.data?.features.emailLogin === false;
  // sem conta ainda: guarda o convite num cookie (vale para o cadastro por convite) e volta para esta pagina depois do Google
  const google = async () => {
    setBusy(true); setErr(null);
    try { await post(`/api/invites/${encodeURIComponent(code)}/hold`); await socialSignIn('google', `/convite/${code}`); } catch (e) { setErr(errText(e)); setBusy(false); }
  };

  const accept = async () => {
    setBusy(true); setErr(null);
    try { const r = await post(`/api/invites/${encodeURIComponent(code)}/accept`); nav(`/campanhas/${r.campaignId}`); } catch (e) { setErr(errText(e)); setBusy(false); }
  };

  if (q.isLoading) return <div className="grid min-h-dvh place-items-center"><Spinner /></div>;
  if (q.isError) return (
    <div className="grid min-h-dvh place-items-center"><div className="stars" /><ErrorState art="error.invite-expired" title="Convite indisponível">{q.error instanceof ApiError ? q.error.detail : 'Não foi possível abrir o convite.'}<br /><Link to="/">Ir para o início</Link></ErrorState></div>
  );
  return (
    <div className="relative grid min-h-dvh place-items-center p-4">
      <div className="stars" aria-hidden />
      <ArtSlot id="hero.invite" ratio="auto" className="pointer-events-none absolute inset-0 h-full w-full opacity-60" decorative eager />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(70% 60% at 50% 45%, transparent, var(--void))' }} />
      <main className="glass chamfer scan rise relative grid w-full max-w-md gap-4 p-6 text-center">
        <Hexagon className="mx-auto h-10 w-10" style={{ color: 'var(--wild)' }} aria-hidden />
        <p className="label">Mensagem holográfica · convite</p>
        <h1 className="holo-text text-3xl font-bold uppercase tracking-wider">{q.data!.campaign.name}</h1>
        <p className="text-muted">{q.data!.gmName} chama você para a mesa.</p>
        {q.data!.campaign.description && <p>{q.data!.campaign.description}</p>}
        {err && <p role="alert" className="err">{err}</p>}
        {session ? <button className="btn primary big" onClick={accept} disabled={busy} data-testid="accept-invite">{busy ? 'Entrando…' : 'Entrar na campanha'}</button> : googleOnly ? (
          <button className="btn primary big" onClick={google} disabled={busy || !meta.data?.features.google}>{busy ? 'Abrindo o Google…' : 'Entrar com Google para aceitar'}</button>
        ) : (
          <div className="grid gap-2"><Link className="btn primary big" to={`/entrar?next=${next}`}>Entrar para aceitar</Link><Link className="btn" to={`/cadastro?next=${next}`}>Criar conta</Link></div>
        )}
      </main>
    </div>
  );
}
