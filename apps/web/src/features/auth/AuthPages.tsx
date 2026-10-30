// Entrar, cadastro, esqueci a senha e redefinir. Layout: so o campo de estrelas ao fundo (sem arte), cartao a esquerda no PC.
import { useQuery } from '@tanstack/react-query';
import { Hexagon, LogIn } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Field } from '@/components/ui';
import { get } from '@/lib/api';
import { authClient, signIn, signUp } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { usePrefs } from '@/lib/prefs';
import { HyperspaceField, JUMP_MS } from '@/components/HyperspaceField';

export function useMeta() {
  return useQuery({ queryKey: ['meta'], queryFn: () => get<{ features: { google: boolean; discord: boolean; assistant: boolean }; bundleHash: string }>('/api/meta'), retry: 0 });
}

function AuthLayout({ title, subtitle, children, jumping, onJumped }: { title: string; subtitle?: string; children: ReactNode; jumping?: boolean; onJumped?: () => void }) {
  const lowLight = usePrefs((s) => s.lowLight);
  return (
    <div className={cn('relative min-h-dvh', lowLight && 'lowlight')} data-auth>
      <div className="fixed inset-0 -z-10 bg-[var(--void)]"><HyperspaceField jumping={!!jumping} onDone={onJumped} /></div>
      {/* o fade fica no main: o .rise dos filhos usa fill-mode both e prenderia opacity em 1 */}
      <main className={cn('relative z-10 mx-auto grid min-h-dvh w-full max-w-md gap-4 px-4 py-10 transition-opacity duration-500 content-center lg:ml-[6vw] lg:mr-auto', jumping && 'opacity-0')}>
        <div className="rise grid gap-1">
          <span className="flex items-center gap-2 font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}><Hexagon className="h-7 w-7" style={{ color: 'var(--wild)' }} aria-hidden /><span className="holo-text text-xl">r2-d6</span></span>
          <h1 className="text-2xl font-bold uppercase tracking-wider">{title}</h1>
          {subtitle && <p className="text-muted">{subtitle}</p>}
        </div>
        <div className="glass chamfer rise grid gap-4 p-5">{children}</div>
        <p className="text-xs text-muted">Compatível com o Star Wars Roleplaying Game REUP. Projeto de fãs, privado e sem fins lucrativos.</p>
      </main>
    </div>
  );
}

function Social({ mode }: { mode: 'login' | 'signup' }) {
  const meta = useMeta();
  const f = meta.data?.features;
  const go = (provider: 'google' | 'discord') => authClient.signIn.social({ provider, callbackURL: window.location.origin + '/', newUserCallbackURL: window.location.origin + '/', errorCallbackURL: window.location.origin + '/entrar?error=oauth' });
  const googleOn = !!f?.google;
  const verb = mode === 'login' ? 'Entrar' : 'Cadastrar';
  return (
    <div className="grid gap-2 border-t border-[var(--line)] pt-3">
      {/* Google sempre aparece: desabilitado (com dica ao admin) enquanto GOOGLE_CLIENT_ID/SECRET nao estiverem no .env */}
      <button className="btn" type="button" disabled={!googleOn} onClick={() => go('google')} data-testid="google-button" aria-describedby={googleOn ? undefined : 'google-hint'}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.6 4.1-5.35 4.1a6 6 0 1 1 0-12c1.9 0 3.17.8 3.9 1.5l2.66-2.56A9.6 9.6 0 0 0 12 2.5a9.5 9.5 0 1 0 0 19c5.48 0 9.1-3.85 9.1-9.27 0-.62-.07-1.1-.15-1.13z" /></svg>
        {verb} com Google
      </button>
      {!googleOn && <p id="google-hint" className="text-xs text-muted">Login com Google desligado: quem administra define GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env (ver README).</p>}
      {googleOn && <p className="text-xs text-muted">Usamos só seu nome e e-mail. Se já existe uma conta com o mesmo e-mail, ela é vinculada.</p>}
      {f?.discord && <button className="btn" type="button" onClick={() => go('discord')}>{verb} com Discord</button>}
    </div>
  );
}

function useForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return { error, setError, busy, setBusy };
}

const authMsg = (m?: string, status?: number) => {
  if (!m) return 'Não foi possível concluir. Tente de novo.';
  if (/invalid email or password|invalid password/i.test(m) || status === 401) return 'E-mail ou senha incorretos.';
  if (/already exists/i.test(m)) return 'Já existe uma conta com esse e-mail.';
  return m;
};

export function LoginPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const f = useForm();
  const [warp, setWarp] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    f.setError(null); f.setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await signIn.email({ email: String(fd.get('email')).trim(), password: String(fd.get('password')) });
    f.setBusy(false);
    if (error) return f.setError(authMsg(error.message, error.status));
    setWarp(true);
    // o salto nao bloqueia: se a animacao falhar, o temporizador navega do mesmo jeito
    const go = () => nav(sp.get('next') || '/', { replace: true });
    const calm = usePrefs.getState().motion === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(go, calm ? 150 : JUMP_MS + 150);
  };
  return (
    <AuthLayout title="Entrar" subtitle="Sua ficha, sua mesa, seus dados." jumping={warp}>
      <form onSubmit={submit} className="grid gap-3" noValidate>
        <Field label="E-mail"><input className="input" name="email" type="email" autoComplete="username" required autoFocus /></Field>
        <Field label="Senha"><input className="input" name="password" type="password" autoComplete="current-password" required /></Field>
        {f.error && <p role="alert" className="err">{f.error}</p>}
        <button className="btn primary big" disabled={f.busy}><LogIn className="h-5 w-5" aria-hidden />{f.busy ? 'Entrando…' : 'Entrar'}</button>
        <div className="flex justify-between text-sm"><Link to="/esqueci">Esqueci a senha</Link><Link to="/cadastro">Criar conta</Link></div>
      </form>
      <Social mode="login" />
    </AuthLayout>
  );
}

export function SignupPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const f = useForm();
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    f.setError(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get('password'));
    if (password.length < 10) return f.setError('A senha precisa ter pelo menos 10 caracteres.');
    if (password !== String(fd.get('password2'))) return f.setError('As senhas não conferem.');
    f.setBusy(true);
    const { error } = await signUp.email({ name: String(fd.get('name')).trim(), email: String(fd.get('email')).trim(), password });
    f.setBusy(false);
    if (error) return f.setError(authMsg(error.message, error.status));
    nav(sp.get('next') || '/', { replace: true });
  };
  return (
    <AuthLayout title="Criar conta" subtitle="Leva um minuto. Sem e-mail de confirmação no protótipo.">
      <form onSubmit={submit} className="grid gap-3" noValidate>
        <Field label="Nome de exibição"><input className="input" name="name" autoComplete="nickname" required minLength={2} maxLength={60} autoFocus /></Field>
        <Field label="E-mail"><input className="input" name="email" type="email" autoComplete="username" required /></Field>
        <Field label="Senha" hint="Mínimo de 10 caracteres."><input className="input" name="password" type="password" autoComplete="new-password" required minLength={10} /></Field>
        <Field label="Repita a senha"><input className="input" name="password2" type="password" autoComplete="new-password" required /></Field>
        {f.error && <p role="alert" className="err">{f.error}</p>}
        <button className="btn primary big" disabled={f.busy}>{f.busy ? 'Criando…' : 'Criar conta'}</button>
        <p className="text-sm">Já tem conta? <Link to="/entrar">Entrar</Link></p>
      </form>
      <Social mode="signup" />
    </AuthLayout>
  );
}

export function ForgotPage() {
  const f = useForm();
  const [sent, setSent] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    f.setError(null); f.setBusy(true);
    const email = String(new FormData(e.currentTarget).get('email')).trim();
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/redefinir` });
    f.setBusy(false);
    if (error && error.status && error.status >= 500) return f.setError('Não foi possível enviar agora. Tente mais tarde.');
    setSent(true); // mesma resposta exista ou nao o e-mail
  };
  return (
    <AuthLayout title="Esqueci a senha" subtitle="Enviaremos um link para você escolher outra.">
      {sent ? (
        <div className="grid gap-3" role="status">
          <p>Se existir uma conta com esse e-mail, o link já está a caminho. Ele vale por 1 hora.</p>
          {import.meta.env.DEV && <p className="text-sm text-muted">Em desenvolvimento os e-mails ficam no Mailpit: <a href="http://localhost:8025" target="_blank" rel="noreferrer">http://localhost:8025</a>.</p>}
          <Link className="btn" to="/entrar">Voltar para entrar</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-3">
          <Field label="E-mail"><input className="input" name="email" type="email" autoComplete="username" required autoFocus /></Field>
          {f.error && <p role="alert" className="err">{f.error}</p>}
          <button className="btn primary big" disabled={f.busy}>{f.busy ? 'Enviando…' : 'Enviar link'}</button>
          <Link to="/entrar" className="text-sm">Voltar</Link>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPage() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const token = sp.get('token');
  const f = useForm();
  const [done, setDone] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    f.setError(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get('password'));
    if (password.length < 10) return f.setError('A senha precisa ter pelo menos 10 caracteres.');
    if (password !== String(fd.get('password2'))) return f.setError('As senhas não conferem.');
    f.setBusy(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
    f.setBusy(false);
    if (error) return f.setError(error.message || 'Link inválido ou expirado. Peça outro.');
    setDone(true);
    setTimeout(() => nav('/entrar'), 1500);
  };
  return (
    <AuthLayout title="Nova senha">
      {!token || sp.get('error') ? (
        <div className="grid gap-3"><p role="alert" className="err">Link inválido ou expirado.</p><Link className="btn" to="/esqueci">Pedir outro link</Link></div>
      ) : done ? (
        <p role="status" className="okc">Senha alterada. Redirecionando para o login…</p>
      ) : (
        <form onSubmit={submit} className="grid gap-3">
          <Field label="Nova senha" hint="Mínimo de 10 caracteres."><input className="input" name="password" type="password" autoComplete="new-password" required minLength={10} autoFocus /></Field>
          <Field label="Repita a nova senha"><input className="input" name="password2" type="password" autoComplete="new-password" required /></Field>
          {f.error && <p role="alert" className="err">{f.error}</p>}
          <button className="btn primary big" disabled={f.busy}>Salvar senha</button>
        </form>
      )}
    </AuthLayout>
  );
}
