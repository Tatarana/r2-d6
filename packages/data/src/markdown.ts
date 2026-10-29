// @ts-nocheck - porte direto do JS do v1 (logica testada pelos 56 testes); tipagem estrita fica no backlog.
// markdown.js - renderizador minimo (headings, listas, tabelas, negrito, italico, codigo, links internos).
export const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);

const ANCHOR_REF = /^(?:([\w-]+)\.md)?#([\w-]+)$/;       // `file.md#anchor`, `#anchor`
const FILE_ANCHOR = /^([\w-]+)#([\w-]+)$/;               // core-mechanics#die-codes

/** Rota interna para uma referencia de regra. */
export const ruleHref = (file: string, anchor: string, base = '#/regras') => `${base}/rules/${file}/${anchor}`;

function inline(text: string, ctx: MdCtx): string {
  const base = ctx.hrefBase || '#/regras';
  let s = esc(text);
  const codes: string[] = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    const raw = c.replace(/&amp;/g, '&');
    const m = raw.match(ANCHOR_REF) || raw.match(FILE_ANCHOR);
    let html: string;
    if (m && (m[1] || ctx.file)) html = `<a href="${ruleHref(m[1] || ctx.file!, m[2], base)}"><code>${c}</code></a>`;
    else html = `<code>${c}</code>`;
    codes.push(html);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
    const m = u.match(ANCHOR_REF) || u.match(FILE_ANCHOR);
    return m ? `<a href="${ruleHref(m[1] || ctx.file!, m[2], base)}">${t}</a>` : t;
  });
  // paginas citadas sempre visiveis: (p.73), p.84-85
  s = s.replace(/\(p\.\s*\d+(?:[-–,]\s*(?:p\.\s*)?\d+)*\)/g, '<span class="pg">$&</span>');
  // IDs do errata viram links para o registro
  s = s.replace(/\bE-0\d\d\b/g, (id) => `<a class="eref" href="${base}/errata/${id}">${id}</a>`);
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
}

const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isSep = (l: string) => /^\s*\|[\s:|-]+\|\s*$/.test(l);
const cells = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

/** md -> HTML seguro (texto escapado). ctx.file = arquivo de regras atual (para links `#ancora`). */
export interface MdCtx { file?: string; hrefBase?: string }
export function renderMarkdown(md: string, ctx: MdCtx = {}): string {
  const lines = String(md || '').split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const hm = line.match(/^(#{1,4})\s+(.*)$/);
    if (hm) { const lv = Math.min(6, hm[1].length + 2); out.push(`<h${lv}>${inline(hm[2].replace(/\s*\{#[\w-]+\}\s*$/, ''), ctx)}</h${lv}>`); i++; continue; }
    if (isTableRow(line) && i + 1 < lines.length && isSep(lines[i + 1])) {
      const head = cells(line); i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) { rows.push(cells(lines[i])); i++; }
      out.push(`<div class="tbl-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c, ctx)}</th>`).join('')}</tr></thead><tbody>${
        rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c, ctx)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^\s*(?:[-*]|\d+\.)\s+/.test(line)) {
      // lista com aninhamento por indentacao
      const stack: { indent: number; tag: string }[] = []; // {indent, tag}
      let html = '';
      while (i < lines.length && /^\s*(?:[-*]|\d+\.)\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        const indent = m[1].length;
        const tag = /\d/.test(m[2]) ? 'ol' : 'ul';
        while (stack.length && indent < stack[stack.length - 1].indent) { html += `</li></${stack.pop()!.tag}>`; }
        if (!stack.length || indent > stack[stack.length - 1].indent) { html += `<${tag}>`; stack.push({ indent, tag }); } else html += '</li>';
        html += `<li>${inline(m[3], ctx)}`;
        i++;
        // continuacao de linha (indentada, sem marcador)
        while (i < lines.length && lines[i].trim() && !/^\s*(?:[-*]|\d+\.)\s+/.test(lines[i]) && /^\s{2,}/.test(lines[i]) && !isTableRow(lines[i])) {
          html += ' ' + inline(lines[i].trim(), ctx); i++;
        }
      }
      while (stack.length) html += `</li></${stack.pop()!.tag}>`;
      out.push(html);
      continue;
    }
    // paragrafo
    const para: string[] = [line.trim()]; i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*(?:[-*]|\d+\.)\s+)/.test(lines[i]) && !isTableRow(lines[i])) { para.push(lines[i].trim()); i++; }
    out.push(`<p>${inline(para.join(' '), ctx)}</p>`);
  }
  return out.join('\n');
}
