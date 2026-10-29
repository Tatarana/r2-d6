// AppShell - layout por plataforma: barra lateral (PC), abas no topo + split (tablet), barra inferior (celular).
import { BookOpen, Dices, Eye, Hexagon, LogOut, MoonStar, PanelRightClose, PanelRightOpen, ScrollText, Search, Sparkles, SunMedium, User, Users, Warehouse } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router';
import { create } from 'zustand';
import { signOut, useSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { applyPrefs, usePrefs } from '@/lib/prefs';
import { disconnectSocket } from '@/lib/socket';
import { stopSync, useChars } from '@/lib/sync';
import { RefBrowser } from '@/features/reference/RefBrowser';
import { SearchPalette } from '@/features/reference/SearchPalette';
import { Modal, SyncIndicator, SyncNotices } from './ui';

export type Platform = 'phone' | 'tablet' | 'pc';
export function usePlatform(): { platform: Platform; landscape: boolean } {
  const calc = () => {
    const w = window.innerWidth, h = window.innerHeight;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    return { platform: (w < 700 ? 'phone' : w < 1100 || coarse ? 'tablet' : 'pc') as Platform, landscape: w > h };
  };
  const [v, setV] = useState(calc);
  useEffect(() => {
    const on = () => setV(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return v;
}

/** Painel de regras ao lado da ficha (tablet paisagem / PC) ou em tela cheia (celular). */
export const useRefPane = create<{ open: boolean; path: string; toggle: () => void; openAt: (p?: string) => void; close: () => void }>((set) => ({
  open: false, path: '/consulta', toggle: () => set((s) => ({ open: !s.open })), openAt: (p) => set((s) => ({ open: true, path: p ?? s.path })), close: () => set({ open: false }),
}));
/** Abre uma entidade/regra no painel lateral sem sair da tela atual. */
export const openRef = (cat: string, id: string) => useRefPane.getState().openAt(`/consulta/${cat}/${id}`);

function useWakeLock(active: boolean) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let lock: any = null;
    let cancelled = false;
    const req = async () => {
      try { if (active && 'wakeLock' in navigator && document.visibilityState === 'visible') { lock = await (navigator as any).wakeLock.request('screen'); if (!cancelled) setOn(true); lock.addEventListener?.('release', () => setOn(false)); } } catch { setOn(false); }
    };
    void req();
    const vis = () => { if (document.visibilityState === 'visible') void req(); };
    document.addEventListener('visibilitychange', vis);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', vis); void lock?.release?.(); setOn(false); };
  }, [active]);
  return on;
}

const Logo = () => (
  <span className="flex items-center gap-2 font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
    <Hexagon className="h-6 w-6" style={{ color: 'var(--wild)' }} aria-hidden /> <span className="holo-text text-lg">r2-d6</span>
  </span>
);

export function AppShell() {
  const { platform, landscape } = usePlatform();
  const loc = useLocation();
  const nav = useNavigate();
  const prefs = usePrefs();
  const { data: session } = useSession();
  const chars = useChars();
  const pane = useRefPane();
  const inMesa = loc.pathname.startsWith('/mesa');
  const wake = useWakeLock(prefs.wake && inMesa);

  useEffect(() => { applyPrefs(prefs, inMesa); }, [prefs.theme, prefs.lowLight, prefs.tableMode, prefs.motion, inMesa]);

  const activeId = useMemo(() => {
    const ids = (chars ?? []).map((c) => c.id);
    return prefs.activeChar && ids.includes(prefs.activeChar) ? prefs.activeChar : ids[0] ?? null;
  }, [chars, prefs.activeChar]);

  const items: { to: string; label: string; icon: ReactNode; match?: (p: string) => boolean }[] = [
    { to: '/', label: 'Hangar', icon: <Warehouse />, match: (p) => p === '/' || p.startsWith('/criar') },
    { to: activeId ? `/ficha/${activeId}` : '/criar', label: 'Ficha', icon: <ScrollText />, match: (p) => p.startsWith('/ficha') },
    { to: activeId ? `/mesa/${activeId}` : '/criar', label: 'Mesa', icon: <Dices />, match: (p) => p.startsWith('/mesa') },
    { to: '/campanhas', label: 'Campanha', icon: <Users />, match: (p) => p.startsWith('/campanhas') },
    { to: '/consulta', label: 'Consulta', icon: <BookOpen />, match: (p) => p.startsWith('/consulta') || p.startsWith('/glossario') },
  ];
  const secondary = [
    { to: '/holocron', label: 'Holocron', icon: <Sparkles /> },
    { to: '/conta', label: 'Conta', icon: <User /> },
  ];

  const doSignOut = async () => {
    await signOut();
    disconnectSocket();
    await stopSync();
    nav('/entrar');
  };
  const showPane = pane.open && platform !== 'phone';
  const splitOk = platform === 'pc' || (platform === 'tablet' && landscape);

  const linkCls = (active: boolean) => cn('flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors', active ? 'bg-white/5 text-[var(--holo)]' : 'text-muted hover:text-[var(--text)]');

  return (
    <div className="min-h-dvh" data-platform={platform}>
      <div className="stars layer2" aria-hidden />
      <SyncNotices />
      <SearchPalette />

      {/* ---- PC: barra lateral */}
      {platform === 'pc' && (
        <aside className={cn('glass fixed inset-y-0 left-0 z-30 flex flex-col gap-1 rounded-none border-y-0 border-l-0 p-3', prefs.sidebarCollapsed ? 'w-[4.5rem]' : 'w-60')} aria-label="Navegação principal">
          <div className="mb-3 flex items-center justify-between px-1"><Logo />{!prefs.sidebarCollapsed && null}</div>
          <nav className="grid gap-1">
            {items.map((it) => (
              <NavLink key={it.label} to={it.to} className={() => linkCls(!!it.match?.(loc.pathname))} title={it.label} aria-current={it.match?.(loc.pathname) ? 'page' : undefined}>
                <span className="h-5 w-5 [&>svg]:h-5 [&>svg]:w-5">{it.icon}</span>{!prefs.sidebarCollapsed && it.label}
              </NavLink>
            ))}
          </nav>
          <div className="my-2 h-px bg-[var(--line)]" />
          <nav className="grid gap-1">
            {secondary.map((it) => (
              <NavLink key={it.label} to={it.to} className={({ isActive }) => linkCls(isActive)} title={it.label}>
                <span className="h-5 w-5 [&>svg]:h-5 [&>svg]:w-5">{it.icon}</span>{!prefs.sidebarCollapsed && it.label}
              </NavLink>
            ))}
            <button className={linkCls(false)} onClick={() => useSearchOpen.getState().set(true)} title="Buscar (/ ou Ctrl+K)"><Search className="h-5 w-5" />{!prefs.sidebarCollapsed && <>Buscar <kbd className="mono ml-auto text-xs text-muted">/</kbd></>}</button>
          </nav>
          <div className="mt-auto grid gap-2">
            {!prefs.sidebarCollapsed && <div className="px-2 text-sm text-muted">{session?.user.name}</div>}
            <button className={linkCls(false)} onClick={() => prefs.set({ sidebarCollapsed: !prefs.sidebarCollapsed })} aria-label="Recolher barra lateral">{prefs.sidebarCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}{!prefs.sidebarCollapsed && 'Recolher'}</button>
            <button className={linkCls(false)} onClick={doSignOut}><LogOut className="h-5 w-5" />{!prefs.sidebarCollapsed && 'Sair'}</button>
          </div>
        </aside>
      )}

      {/* ---- topo (tablet/celular) */}
      {platform !== 'pc' && (
        <header className="glass sticky top-0 z-30 flex items-center gap-2 rounded-none border-x-0 border-t-0 px-3 py-2" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
          <Logo />
          <div className="ml-auto flex items-center gap-1.5">
            <SyncIndicator compact={platform === 'phone'} />
            {wake && <span className="chip" title="Tela sempre ligada" aria-label="Tela sempre ligada"><Eye className="h-3.5 w-3.5" aria-hidden /></span>}
            <button className="btn icon sm ghost" aria-label="Buscar" onClick={() => useSearchOpen.getState().set(true)}><Search className="h-4 w-4" /></button>
            <button className="btn icon sm ghost" aria-label={prefs.lowLight ? 'Desligar baixa luz' : 'Ligar baixa luz'} aria-pressed={prefs.lowLight} onClick={() => prefs.set({ lowLight: !prefs.lowLight })}>{prefs.lowLight ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}</button>
            {splitOk && <button className="btn icon sm ghost" aria-label="Painel de regras" aria-pressed={pane.open} onClick={pane.toggle}><BookOpen className="h-4 w-4" /></button>}
            <UserMenu name={session?.user.name ?? ''} onSignOut={doSignOut} />
          </div>
        </header>
      )}
      {platform === 'tablet' && (
        <nav className="glass sticky top-[3.1rem] z-20 flex gap-1 rounded-none border-x-0 border-t-0 px-3" aria-label="Navegação principal">
          {items.map((it) => (
            <NavLink key={it.label} to={it.to} aria-current={it.match?.(loc.pathname) ? 'page' : undefined}
              className={() => cn('flex items-center gap-2 border-b-2 px-4 py-3 font-semibold', it.match?.(loc.pathname) ? 'border-[var(--holo)] text-[var(--holo)]' : 'border-transparent text-muted')}>
              <span className="[&>svg]:h-5 [&>svg]:w-5">{it.icon}</span>{it.label}
            </NavLink>
          ))}
        </nav>
      )}

      {/* ---- PC: barra superior fina com estado */}
      {platform === 'pc' && (
        <div className={cn('fixed right-4 top-3 z-20 flex items-center gap-2', showPane && 'right-[26rem]')}>
          <SyncIndicator />
          {wake && <span className="chip" title="Tela sempre ligada"><Eye className="h-3.5 w-3.5" aria-hidden />tela ligada</span>}
          <button className="btn icon sm ghost" aria-label={prefs.lowLight ? 'Desligar baixa luz' : 'Ligar baixa luz'} aria-pressed={prefs.lowLight} onClick={() => prefs.set({ lowLight: !prefs.lowLight })}>{prefs.lowLight ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}</button>
          <button className="btn sm" aria-pressed={pane.open} onClick={pane.toggle}><BookOpen className="h-4 w-4" aria-hidden />Regras</button>
        </div>
      )}

      <div className={cn(platform === 'pc' && (prefs.sidebarCollapsed ? 'pl-[4.5rem] pt-12' : 'pl-60 pt-12'), showPane && (platform === 'pc' ? 'pr-[25rem]' : 'pr-[45%]'))}>
        <main id="conteudo"><Outlet /></main>
        <ScrollRestoration />{/* nova pagina abre no topo; "Voltar" devolve a rolagem da lista */}
      </div>

      {/* ---- painel de regras (split) */}
      {showPane && splitOk && (
        <aside className={cn('glass fixed inset-y-0 right-0 z-30 overflow-auto rounded-none border-y-0 border-r-0 p-3', platform === 'pc' ? 'w-[25rem]' : 'w-[45%]')} aria-label="Painel de regras">
          <div className="mb-2 flex items-center justify-between"><span className="label">Consulta rápida</span><button className="btn icon sm ghost" aria-label="Fechar painel" onClick={pane.close}><PanelRightClose className="h-4 w-4" /></button></div>
          <RefBrowser path={pane.path} onNavigate={(p) => pane.openAt(p)} compact />
        </aside>
      )}
      {platform === 'phone' && (
        <Modal open={pane.open} onOpenChange={(o) => (o ? null : pane.close())} title="Consulta rápida" wide>
          <RefBrowser path={pane.path} onNavigate={(p) => pane.openAt(p)} compact />
        </Modal>
      )}

      {/* ---- celular: barra inferior */}
      {platform === 'phone' && (
        <nav className="glass fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 rounded-none border-x-0 border-b-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="Navegação principal">
          {items.map((it) => {
            const active = !!it.match?.(loc.pathname);
            return (
              <NavLink key={it.label} to={it.to} aria-current={active ? 'page' : undefined} className={() => cn('grid justify-items-center gap-0.5 py-2 text-[0.7rem] font-semibold', active ? 'text-[var(--holo)]' : 'text-muted')}>
                <span className="[&>svg]:h-6 [&>svg]:w-6">{it.icon}</span>{it.label}
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export const useSearchOpen = create<{ open: boolean; set: (o: boolean) => void }>((set) => ({ open: false, set: (open) => set({ open }) }));

function UserMenu({ name, onSignOut }: { name: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  return (
    <>
      <button className="btn icon sm" aria-label="Menu da conta" onClick={() => setOpen(true)}><User className="h-4 w-4" /></button>
      <Modal open={open} onOpenChange={setOpen} title={name || 'Conta'}>
        <div className="grid gap-2">
          {[['/conta', 'Conta e preferências'], ['/glossario', 'Glossário'], ['/holocron', 'Holocron']].map(([to, l]) => (
            <button key={to} className="btn" onClick={() => { setOpen(false); nav(to); }}>{l}</button>
          ))}
          <button className="btn danger" onClick={onSignOut}><LogOut className="h-4 w-4" aria-hidden />Sair</button>
        </div>
      </Modal>
    </>
  );
}
