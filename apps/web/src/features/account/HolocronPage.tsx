// HolocronPage - assistente de regras (IA) atras de feature flag. Sem ANTHROPIC_API_KEY mostra "em breve".
import { Send, Sparkles } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { ArtSlot } from '@/components/ArtSlot';
import { Page, Panel, Spinner } from '@/components/ui';
import { useMeta } from '../auth/AuthPages';
import { Link } from 'react-router';

// transforma "(p.73)" em link para a consulta (a pagina e citada pelo modelo; a busca leva ao trecho)
function Answer({ text }: { text: string }) {
  const parts = text.split(/(\(p\.\s*\d+(?:[-–,]\s*\d+)*\))/g);
  return <p className="whitespace-pre-wrap">{parts.map((s, i) => (/^\(p\./.test(s) ? <Link key={i} className="pg" to={`/consulta`} title="Abrir a consulta">{s}</Link> : <span key={i}>{s}</span>))}</p>;
}

export function HolocronPage() {
  const meta = useMeta();
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const ask = async (e: FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 3) return;
    setBusy(true); setErr(null); setAnswer('');
    abort.current = new AbortController();
    try {
      const res = await fetch('/api/assistant/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: q }), signal: abort.current.signal });
      if (!res.ok || !res.body) { const j = await res.json().catch(() => ({})); throw new Error(j.detail || 'O Holocron não respondeu.'); }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const chunks = buf.split('\n\n'); buf = chunks.pop() ?? '';
        for (const c of chunks) {
          const ev = /event: (\w+)/.exec(c)?.[1]; const data = /data: (.*)/.exec(c)?.[1];
          if (!data) continue;
          const j = JSON.parse(data);
          if (ev === 'delta') setAnswer((a) => a + j.text); else if (ev === 'error') throw new Error(j.message);
        }
      }
    } catch (e2: any) { if (e2.name !== 'AbortError') setErr(e2.message); } finally { setBusy(false); }
  };

  const on = meta.data?.features.assistant;
  return (
    <div>
      <div className="relative h-40 overflow-hidden md:h-56">
        <ArtSlot id="hero.holocron" ratio="auto" className="absolute inset-0 h-full w-full" decorative eager />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,7,12,.2), var(--space))' }} />
        <div className="relative mx-auto flex h-full max-w-6xl items-end px-4 pb-3 md:px-6"><h1 className="holo-text flex items-center gap-2 text-2xl font-bold uppercase tracking-wider md:text-4xl"><Sparkles className="h-7 w-7" style={{ color: 'var(--wild)' }} aria-hidden />Holocron</h1></div>
      </div>
      <Page className="pt-2">
        {meta.isLoading ? <Spinner /> : !on ? (
          <Panel className="mx-auto grid max-w-xl gap-2 text-center" data-testid="holocron-soon"><h2 className="text-xl font-bold">Em breve</h2>
            <p className="text-muted">O Holocron responderá perguntas de regras em português, sempre citando a página do livro. Ele está desligado neste servidor.</p>
            <p className="text-sm text-muted">Enquanto isso, use a <Link to="/consulta">consulta</Link> e a busca (<kbd className="mono">/</kbd>).</p></Panel>
        ) : (
          <div className="mx-auto grid max-w-2xl gap-4">
            <form onSubmit={ask} className="glass chamfer flex gap-2 p-3"><input className="input" aria-label="Pergunta ao Holocron" placeholder="Posso gastar CP numa esquiva com Force Point ativo?" value={q} onChange={(e) => setQ(e.target.value)} maxLength={600} /><button className="btn primary" disabled={busy}><Send className="h-4 w-4" aria-hidden />Perguntar</button></form>
            {err && <p role="alert" className="err">{err}</p>}
            {(answer || busy) && <Panel scan aria-live="polite">{answer ? <Answer text={answer} /> : <Spinner label="O Holocron está consultando o livro…" />}</Panel>}
            <p className="text-xs text-muted">Respostas baseadas só nas regras destiladas do projeto, com página citada. Em caso de dúvida, vale a decisão do mestre.</p>
          </div>
        )}
      </Page>
    </div>
  );
}
