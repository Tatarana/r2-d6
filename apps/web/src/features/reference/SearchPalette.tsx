// SearchPalette - busca global por teclado: "/" ou Ctrl+K abre; setas navegam; Enter abre; Esc fecha (ux-platforms.md).
import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Modal } from '@/components/ui';
import { useSearchOpen } from '@/components/AppShell';
import { useCatalog } from '@/lib/catalog';

export function SearchPalette() {
  const { open, set } = useSearchOpen();
  const cs = useCatalog();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) { e.preventDefault(); set(true); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [set]);

  const flat = useMemo(() => (cs && q.trim().length >= 2 ? cs.catalog.search(q, 5).flatMap((g) => g.results.map((r) => ({ ...r, label: g.label }))) : []), [cs, q]);
  useEffect(() => setIdx(0), [q]);

  const choose = (i: number) => { const r = flat[i]; if (r) { set(false); setQ(''); nav(r.href); } };
  return (
    <Modal open={open} onOpenChange={(o) => { set(o); if (!o) setQ(''); }} title="Buscar">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" aria-hidden />
        <input ref={input} autoFocus className="input pl-9" role="combobox" aria-expanded={flat.length > 0} aria-controls="search-results" aria-label="Buscar regras, perícias, itens e glossário"
          placeholder="wild die, blaster, Wookiee, AT-AT…" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(flat.length - 1, i + 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
            if (e.key === 'Enter') choose(idx);
          }} />
      </div>
      <ul id="search-results" role="listbox" className="mt-3 grid max-h-[55dvh] gap-0.5 overflow-auto">
        {flat.map((r, i) => (
          <li key={r.href + i} role="option" aria-selected={i === idx}>
            <button className="btn ghost w-full justify-between text-left" style={i === idx ? { background: 'color-mix(in srgb, var(--holo) 14%, transparent)' } : undefined} onMouseEnter={() => setIdx(i)} onClick={() => choose(i)}>
              <span><strong>{r.title}</strong> <span className="text-muted">{r.label}</span></span><span className="pg">{r.page}</span>
            </button>
          </li>
        ))}
        {q.trim().length >= 2 && !flat.length && <li className="p-3 text-muted">Nada encontrado.</li>}
        {q.trim().length < 2 && <li className="p-3 text-muted">Digite ao menos 2 letras. Atalho: <kbd className="mono">/</kbd> ou <kbd className="mono">Ctrl+K</kbd>.</li>}
      </ul>
    </Modal>
  );
}
