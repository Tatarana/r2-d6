// AccountPage - conta, preferencias do aparelho (tema, baixa luz, animacoes, dados 3D), aparelhos conectados e "Baixar meus dados" (LGPD).
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Page, Panel, Spinner } from '@/components/ui';
import { authClient, signOut, useSession } from '@/lib/auth';
import { usePrefs } from '@/lib/prefs';
import { disconnectSocket } from '@/lib/socket';
import { stopSync } from '@/lib/sync';

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 border-t border-[var(--line)] py-3 first:border-0">
      <span><span className="font-semibold">{label}</span>{hint && <span className="block text-sm text-muted">{hint}</span>}</span>
      <input type="checkbox" role="switch" className="mt-1 h-6 w-11 shrink-0 cursor-pointer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function AccountPage() {
  const { data: session } = useSession();
  const p = usePrefs();
  const nav = useNavigate();
  const qc = useQueryClient();
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: async () => (await authClient.listSessions()).data ?? [], retry: 0 });
  const out = async () => { await signOut(); disconnectSocket(); await stopSync(); nav('/entrar'); };

  return (
    <Page title="Conta" subtitle={session ? `${session.user.name} · ${session.user.email}` : ''}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="label mb-1">Aparência e mesa</h2>
          <Toggle label="Modo papel (tema claro)" hint="Para luz do dia forte e impressão." checked={p.theme === 'paper'} onChange={(v) => p.set({ theme: v ? 'paper' : 'dark' })} />
          <Toggle label="Baixa luz (cockpit vermelho)" hint="Preserva a visão no escuro e não ilumina o rosto de quem está ao lado." checked={p.lowLight} onChange={(v) => p.set({ lowLight: v })} />
          <Toggle label="Modo mesa sempre ligado" hint="Sem scanlines e brilho em todas as telas." checked={p.tableMode} onChange={(v) => p.set({ tableMode: v })} />
          <Toggle label="Animações" hint="Desligue para reduzir movimento (também respeita o sistema)." checked={p.motion === 'on'} onChange={(v) => p.set({ motion: v ? 'on' : 'off' })} />
          <Toggle label="Tela sempre ligada no modo mesa" checked={p.wake} onChange={(v) => p.set({ wake: v })} />
          <Toggle label="Vibração no Wild Die" hint="30 ms no 6 e 20-40-20 ms no 1 (se o aparelho suportar)." checked={p.vibrate} onChange={(v) => p.set({ vibrate: v })} />
          <label className="field mt-2"><span>Dados</span>
            <select className="input" value={p.dice} onChange={(e) => p.set({ dice: e.target.value as any })}>
              <option value="auto">Automático (3D no tablet e PC, 2D no celular)</option><option value="3d">Sempre 3D (quando houver WebGL)</option><option value="2d">Sempre 2D</option></select></label>
        </Panel>

        <div className="grid content-start gap-4">
          <Panel className="grid gap-2">
            <h2 className="label">Aparelhos conectados</h2>
            {sessions.isLoading ? <Spinner /> : sessions.isError ? <p className="text-muted">Indisponível offline.</p> : (
              <ul className="grid gap-1 text-sm">{(sessions.data as any[]).map((s) => (
                <li key={s.token} className="flex items-center justify-between gap-2"><span className="truncate">{s.userAgent?.slice(0, 60) || 'Aparelho'} {s.token === (session as any)?.session?.token && <span className="chip">este</span>}</span>
                  {s.token !== (session as any)?.session?.token && <button className="btn sm danger" onClick={async () => { await authClient.revokeSession({ token: s.token }); void qc.invalidateQueries({ queryKey: ['sessions'] }); }}>Sair</button>}</li>))}</ul>
            )}
            <button className="btn w-fit" onClick={async () => { await authClient.revokeOtherSessions(); void qc.invalidateQueries({ queryKey: ['sessions'] }); }}>Sair dos outros aparelhos</button>
          </Panel>
          <Panel className="grid gap-2">
            <h2 className="label">Seus dados (LGPD)</h2>
            <p className="text-sm text-muted">Baixe tudo que a conta guarda: fichas, versões, campanhas e rolagens, em JSON.</p>
            <a className="btn w-fit" href="/api/me/export" download><Download className="h-4 w-4" aria-hidden />Baixar meus dados</a>
          </Panel>
          <button className="btn danger w-fit" onClick={out}><LogOut className="h-4 w-4" aria-hidden />Sair deste aparelho</button>
        </div>
      </div>
    </Page>
  );
}
