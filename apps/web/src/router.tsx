import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Outlet, createBrowserRouter, useLocation, useParams } from 'react-router';
import { AppShell } from '@/components/AppShell';
import { HyperspaceField, JUMP_MS } from '@/components/HyperspaceField';
import { usePrefs } from '@/lib/prefs';
import { ErrorState, Spinner } from '@/components/ui';
import { useSession } from '@/lib/auth';
import { connectSocket } from '@/lib/socket';
import { startSync } from '@/lib/sync';
import { ForgotPage, LoginPage, ResetPage, SignupPage } from '@/features/auth/AuthPages';
import { Hangar } from '@/features/hangar/Hangar';
import { SheetPage } from '@/features/characters/SheetPage';
import { VersionsPage } from '@/features/characters/VersionsPage';
import { CreationWizard } from '@/features/creation/CreationWizard';
import { MesaPage } from '@/features/mesa/MesaPage';
import { CampaignListPage } from '@/features/campaigns/CampaignListPage';
import { CampaignPage } from '@/features/campaigns/CampaignPage';
import { InvitePage } from '@/features/campaigns/InvitePage';
import { ReferencePage } from '@/features/reference/ReferencePage';
import { AccountPage } from '@/features/account/AccountPage';
import { HolocronPage } from '@/features/account/HolocronPage';
import { PrintPage } from '@/features/characters/PrintPage';

const ArtDev = lazy(() => import('@/features/dev/ArtDev'));

// abertura: ao carregar o app pela URL principal (inclusive na volta do login com Google), as estrelas saltam para o
// hiperespaco antes do Hangar. Uma vez por carregamento; navegar de volta para / dentro do app nao repete.
let introPending = typeof window !== 'undefined' && window.location.pathname === '/';
const INTRO_REST_MS = 700;

function RequireAuth() {
  const { data: session, isPending } = useSession();
  const loc = useLocation();
  const uid = session?.user.id;
  const [intro, setIntro] = useState(introPending);
  const [jumping, setJumping] = useState(false);
  useEffect(() => { if (uid) { connectSocket(); void startSync(uid); } }, [uid]);
  useEffect(() => {
    if (!intro || isPending) return;
    const finish = () => { introPending = false; setIntro(false); };
    const calm = !session || usePrefs.getState().motion === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm) return finish();
    // o salto nao bloqueia: se o canvas nao animar (aba oculta, erro), o temporizador entra no app do mesmo jeito
    const rest = setTimeout(() => setJumping(true), INTRO_REST_MS);
    const end = setTimeout(finish, INTRO_REST_MS + JUMP_MS + 300);
    return () => { clearTimeout(rest); clearTimeout(end); };
  }, [intro, isPending, session]);
  if (intro && (isPending || session)) return (
    <div className="fixed inset-0 bg-[var(--void)]" role="status" aria-label="Entrando no hangar…">
      <HyperspaceField jumping={jumping} onDone={() => { introPending = false; setIntro(false); }} />
    </div>
  );
  if (isPending) return <div className="grid min-h-dvh place-items-center"><Spinner label="Entrando no hangar…" /></div>;
  if (!session) return <Navigate to={`/entrar?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <Outlet />;
}

const Redirect = ({ to }: { to: (p: Record<string, string | undefined>) => string }) => <Navigate to={to(useParams())} replace />;

export const router = createBrowserRouter([
  { path: '/entrar', element: <LoginPage /> },
  { path: '/cadastro', element: <SignupPage /> },
  { path: '/esqueci', element: <ForgotPage /> },
  { path: '/redefinir', element: <ResetPage /> },
  { path: '/convite/:code', element: <InvitePage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/imprimir/:id', element: <PrintPage /> },
      {
        element: <AppShell />,
        errorElement: <ErrorState art="error.not-found" title="Algo quebrou nesta tela">Recarregue a página. Se persistir, volte ao Hangar.</ErrorState>,
        children: [
          { path: '/', element: <Hangar /> },
          { path: '/criar', element: <CreationWizard /> },
          { path: '/ficha/:id', element: <SheetPage /> },
          { path: '/ficha/:id/historico', element: <VersionsPage /> },
          { path: '/mesa/:id', element: <MesaPage /> },
          { path: '/mesa', element: <Redirect to={() => '/'} /> },
          { path: '/campanhas', element: <CampaignListPage /> },
          { path: '/campanhas/:id', element: <CampaignPage /> },
          { path: '/consulta/*', element: <ReferencePage /> },
          { path: '/glossario', element: <ReferencePage /> },
          { path: '/holocron', element: <HolocronPage /> },
          { path: '/conta', element: <AccountPage /> },
          { path: '/dev/art', element: <Suspense fallback={<Spinner />}><ArtDev /></Suspense> },
          { path: '*', element: <ErrorState art="error.not-found" title="Página não encontrada">Esse endereço não existe neste datapad.</ErrorState> },
        ],
      },
    ],
  },
]);
