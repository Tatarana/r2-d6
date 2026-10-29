"""Extract the REUP rulebook PDF into one text file per chapter.

Usage (from anywhere):
    python tools/extract_chapters.py run [--out DIR]     write all chapter files
    python tools/extract_chapters.py test PAGE [PAGE..]  print pages (PDF numbering)

Requires PyMuPDF (`pip install pymupdf`). Defaults: reads the PDF and writes the
chapter files in data/raw-data/. Text comes from PyMuPDF blocks in the PDF's own
stream order (right on almost every page), with paragraphs that the stream splits
across columns repaired. Tables are detected from word positions: runs of
three or more aligned rows of narrow cells, found per column, rendered as
"a | b | c" rows (header rows and wrapped cell text stay with the table).
Running headers/footers are dropped and soft hyphens re-joined. Page offsets: printed page = PDF page - 2.
"""
import argparse
import os
import re
import sys

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'data', 'raw-data')
PDF = os.path.join(RAW, 'Star Wars Roleplaying Game_ Revised, Expanded and Updated.pdf')
OUT = RAW

# (id, title, first pdf page, 1-based). printed page = pdf page - 2.
CHAPTERS = [
    ('00', 'Front Matter', 3),
    ('01', 'Introduction', 7), ('02', 'Characters', 20), ('03', 'Attributes & Skills', 34),
    ('04', 'How to Gamemaster', 69), ('05', 'The Rules', 74), ('06', 'Combat & Injuries', 90),
    ('07', 'Movement & Chases', 108), ('08', 'Space Travel & Combat', 121),
    ('09', 'Running Battles', 142), ('10', 'The Force', 148), ('11', 'Running Adventures', 182),
    ('12', 'Designing Adventures', 198), ('13', 'The Pirates of Prexiar', 233),
    ('14', 'The Galaxy', 245), ('15', 'Gamemaster Characters', 265), ('16', 'Aliens', 279),
    ('17', 'Creatures', 320), ('18', 'Equipment & Weapons', 335), ('19', 'Droids', 369),
    ('20', 'Vehicles', 403), ('21', 'Starships', 417), ('22', 'Planets', 455),
    ('23', 'Templates', 477), ('24', 'Character Sheet', 503), ('25', 'Index', 505),
]
LAST_PAGE = 510  # 511-512 are blank

doc = None

PUA = re.compile('[\ue000-\uf8ff\uf000-\uf0ff]')


def line_text(l):
    return ''.join(s['text'] for s in l['spans'])


def is_heading_font(b):
    s = b['lines'][0]['spans'][0]
    return 'ITCSerifGothic' in s['font'], s['size']


def norm(t):
    t = PUA.sub('', t)
    t = t.replace('\u00a0', ' ')
    return t


KEEP = set()


def para(lines, keep=False):
    """Join wrapped lines of a block. A line continues into the next one if it
    reaches close to the block's right edge (justified wrap) -> same sentence."""
    if not lines:
        return ''
    # short lines (stat rows, lists) are entries; but narrow prose wrapped around art continues
    short = len(lines) >= 3 and all(len(norm(line_text(l)).strip()) <= 30 for l in lines)
    right = max(l['bbox'][2] for l in lines)
    out = ''
    for i, l in enumerate(lines):
        t = norm(line_text(l)).rstrip()
        if i == len(lines) - 1:
            out += t
            break
        full = l['bbox'][2] >= right - 14 and not keep
        nxt = norm(line_text(lines[i + 1])).lstrip()
        if short:
            full = ((nxt[:1].islower() or nxt[:1] in '—–')
                    or (re.search(r'[a-z,]$', t) and len(t.split()) >= 3 and ':' not in t)) \
                and not re.search(r'[.:;!?”")\]]$', t)
            if t.endswith('­'):
                out += t[:-1]
            else:
                out += t + (' ' if full else '\n')
            continue
        if not full and not keep and not re.search(r'[.:;!?”")\]]$', t) and nxt[:1].islower():
            full = True
        if t.endswith('\u00ad'):
            out += t[:-1]            # soft hyphen: glue word back together
        elif full and re.search(r'[A-Za-z]-$', t) and re.match(r'[a-z]', nxt) \
                and not re.match(r'(or|and|to|of)\b', nxt):
            out += t                 # real hyphen at a line break: compound word
        elif full:
            out += t + ' '
        else:
            out += t + '\n'
    out = out.replace('\u00ad', '')
    out = re.sub(r'[ \t]{2,}', ' ', out)
    return out.strip()


GAP = 14        # pt: a larger horizontal gap inside a text line starts a new table cell
MAXW = 190      # pt: wider segments are prose, not table cells
YTOL = 3        # pt: segments whose centres differ by less than this share a row
MID = 297.0     # page centre; columns are split here
EDGE = 6        # pt tolerance around the gutter
HEAD_TOP, FOOT_Y = 40, 730


def wkey(w):
    return (round(w[0], 1), round(w[1], 1), w[4])


def segments(page):
    """Split every PyMuPDF text line into segments at large horizontal gaps."""
    words = [w for w in page.get_text('words') if HEAD_TOP <= (w[1] + w[3]) / 2 <= FOOT_Y]
    lines = {}
    for w in words:
        lines.setdefault((w[5], w[6]), []).append(w)
    out = []
    for ws in lines.values():
        ws.sort(key=lambda w: w[0])
        cur = [ws[0]]
        groups = []
        for w in ws[1:]:
            if w[0] - cur[-1][2] > GAP:
                groups.append(cur)
                cur = [w]
            else:
                cur.append(w)
        groups.append(cur)
        for g in groups:
            out.append({'x0': g[0][0], 'x1': g[-1][2], 'y0': min(w[1] for w in g),
                        'y1': max(w[3] for w in g), 'text': norm(' '.join(w[4] for w in g)),
                        'keys': {wkey(w) for w in g}})
    return out


def column_of(s):
    if s['x0'] >= 287:          # right column / right-hand table (starts at ~288-290)
        return 'R'
    if s['x1'] <= 310:          # left column / left-hand table
        return 'L'
    return 'W'


def rows_of(segs):
    segs = sorted(segs, key=lambda s: (s['y0'] + s['y1']) / 2)
    rows = []
    for s in segs:
        yc = (s['y0'] + s['y1']) / 2
        for r in rows:
            if abs(r['y'] - yc) <= YTOL:
                r['segs'].append(s)
                r['y'] = (r['y'] + yc) / 2
                break
        else:
            rows.append({'y': yc, 'segs': [s]})
    for r in rows:
        r['segs'].sort(key=lambda s: s['x0'])
    return rows


def aligned(a, b, tol=7):
    xa = [s['x0'] for s in a['segs']]
    xb = [s['x0'] for s in b['segs']]
    return sum(1 for x in xa if any(abs(x - y) <= tol for y in xb)) >= 2


def short_title(row):
    """A header row made of short capitalised labels (no sentence punctuation)."""
    return len(row['segs']) >= 2 and all(len(s['text']) <= 40 and not re.search(r'[.;,]$', s['text']) and
                                         s['text'][:1].isupper() for s in row['segs'])


def find_tables(segs):
    """Tables = runs of >=3 aligned rows of >=2 narrow segments, found per column."""
    tables = []
    for col in ('L', 'R'):
        cs = [s for s in segs if column_of(s) == col]
        rows = rows_of(cs)
        tab = [r for r in rows if len(r['segs']) >= 2 and all(s['x1'] - s['x0'] <= MAXW for s in r['segs'])]
        runs, cur = [], []
        for r in tab:
            if cur and aligned(cur[-1], r) and r['y'] - cur[-1]['y'] < 28:
                cur.append(r)
            else:
                if cur:
                    runs.append(cur)
                cur = [r]
        if cur:
            runs.append(cur)
        runs = [run for run in runs if len(run) >= 3]
        used = {id(r) for run in runs for r in run}
        for run in runs:
            first, last = run[0]['y'], run[-1]['y']
            x0 = min(s['x0'] for r in run for s in r['segs'])
            x1 = max(s['x1'] for r in run for s in r['segs'])
            # header rows directly above (short capitalised labels), not part of another table
            above = [r for r in rows if r['y'] < first and first - r['y'] <= 26 and id(r) not in used
                     and all(x0 - 40 <= s['x0'] and s['x1'] <= x1 + 80 for s in r['segs']) and short_title(r)]
            above.sort(key=lambda r: r['y'])
            for r in above:
                used.add(id(r))
            # wrapped cell text inside the table's vertical range
            wraps = [r for r in rows if first < r['y'] <= last + 13 and id(r) not in used and len(r['segs']) == 1
                     and x0 - 4 <= r['segs'][0]['x0'] and r['segs'][0]['x1'] <= x1 + 4]
            members = above + run
            tables.append({'rows': members, 'body': run, 'wraps': wraps, 'x0': x0, 'x1': x1,
                           'y0': min(r['y'] for r in members) - 6, 'y1': last + 8, 'col': col})
    return tables


def render_table(t):
    """Pipe-separated rows; columns come from clustering the segments' left edges."""
    # columns = merged x-intervals of the body rows (handles left, centred and right-aligned cells)
    ivs = sorted((s['x0'], s['x1']) for r in t['body'] for s in r['segs'])
    cols = []
    for lo, hi in ivs:
        if cols and lo < cols[-1][1]:
            cols[-1][1] = max(cols[-1][1], hi)
        else:
            cols.append([lo, hi])

    def col_idx(s):
        best, best_ov = 0, -1e9
        for i, (lo, hi) in enumerate(cols):
            ov = min(hi, s['x1']) - max(lo, s['x0'])
            if ov > best_ov:
                best, best_ov = i, ov
        return best

    grid = []
    for r in sorted(t['rows'], key=lambda r: r['y']):
        cells = [''] * len(cols)
        for s in r['segs']:
            i = col_idx(s)
            cells[i] = (cells[i] + ' ' + s['text']).strip()
        grid.append({'y': r['y'], 'cells': cells})
    for w in t['wraps']:   # wrapped cell text joins the row above in the nearest column
        s = w['segs'][0]
        above = [g for g in grid if g['y'] < w['y']]
        if above:
            g = above[-1]
            i = col_idx(s)
            g['cells'][i] = (g['cells'][i] + ' ' + s['text']).strip()
    lines = []
    for g in grid:
        lines.append(' | '.join(g['cells']).rstrip(' |'))
    return '\n'.join(lines)


def page_blocks(pno):
    page = doc[pno - 1]
    blocks = page.get_text('dict', sort=False)['blocks']
    blocks = [b for b in blocks if b['type'] == 0 and b['lines']]
    keep = []
    for b in blocks:
        y0, y1 = b['bbox'][1], b['bbox'][3]
        txt = norm(' '.join(line_text(l) for l in b['lines'])).strip()
        if not txt:
            continue
        # running header (chapter tab) and footer (page number line)
        if y1 < 40 and len(txt) < 60:
            continue
        if y0 > 730:
            continue
        keep.append(b)
    return keep


def heading_split(b):
    """Leading heading-font lines of a block (max 2, same size) and the remaining lines."""
    lines = b['lines']
    if not lines or 'ITCSerifGothic' not in lines[0]['spans'][0]['font']:
        return None, lines
    size = lines[0]['spans'][0]['size']
    n = 0
    while n < len(lines) and n < 2 and 'ITCSerifGothic' in lines[n]['spans'][0]['font'] \
            and abs(lines[n]['spans'][0]['size'] - size) < 0.6:
        n += 1
    if size < 10:
        return None, lines
    return (size, lines[:n]), lines[n:]


def page_items(pno):
    """Blocks and tables of a page in the PDF's own stream order (which follows the
    reading order on almost every page), with each table placed where its first
    cell appeared, then paragraph continuations that were split apart are repaired."""
    page = doc[pno - 1]
    blocks = page_blocks(pno)
    tables = find_tables(segments(page))
    owner = {}
    for ti, t in enumerate(tables):
        for r in t['rows'] + t['wraps']:
            for s in r['segs']:
                for k in s['keys']:
                    owner[k] = ti
    emitted, items = set(), []
    for b in blocks:
        lines, first_table = [], None
        for l in b['lines']:
            ks = [wkey(w) for w in _line_words(page, l)]
            owners = {owner[k] for k in ks if k in owner}
            if ks and len(owners) and all(k in owner for k in ks):
                first_table = owners.copy().pop() if first_table is None else first_table
                continue
            lines.append(l)
        if first_table is not None and first_table not in emitted:
            t = tables[first_table]
            emitted.add(first_table)
            items.append({'kind': 'table', 'table': t, 'x0': t['x0'], 'x1': t['x1'],
                          'y0': t['y0'], 'y1': t['y1']})
        if lines:
            items.append({'kind': 'block', 'block': dict(b, lines=lines),
                          'x0': min(l['bbox'][0] for l in lines), 'x1': max(l['bbox'][2] for l in lines),
                          'y0': min(l['bbox'][1] for l in lines), 'y1': max(l['bbox'][3] for l in lines)})
    for ti, t in enumerate(tables):   # tables whose cells were all inside consumed blocks
        if ti not in emitted:
            items.append({'kind': 'table', 'table': t, 'x0': t['x0'], 'x1': t['x1'],
                          'y0': t['y0'], 'y1': t['y1']})
    return repair_flow(items)


_WORDS_CACHE = {}


def _line_words(page, l):
    key = page.number
    if key not in _WORDS_CACHE:
        _WORDS_CACHE.clear()
        _WORDS_CACHE[key] = page.get_text('words')
    x0, y0, x1, y1 = l['bbox']
    return [w for w in _WORDS_CACHE[key]
            if w[0] >= x0 - 1 and w[2] <= x1 + 1 and w[1] >= y0 - 1 and w[3] <= y1 + 1]


def item_text(it):
    if it['kind'] != 'block':
        return ''
    return norm(' '.join(line_text(l) for l in it['block']['lines'])).strip()


def is_heading_item(it):
    return it['kind'] == 'block' and heading_split(it['block'])[0] is not None


def repair_flow(items):
    """A lowercase paragraph (not a "skill: text" list entry) in the next column, higher on
    the page, continues the *last* earlier paragraph that stops mid-sentence. If other text
    sits between them in the stream, move the continuation (and the text after it, up to
    the next heading) right behind that paragraph and put the in-between text after them."""
    def mid(it):
        t = item_text(it)
        return it['kind'] == 'block' and len(t) > 40 and not is_heading_item(it) and re.search(r'[a-z,;]$', t)

    j = 0
    while j < len(items):
        c, ct = items[j], item_text(items[j])
        if (c['kind'] == 'block' and ct[:1].islower() and not re.match(r'^[a-z][a-z /\-\(\)]*:', ct)
                and not is_heading_item(c)):
            p = max((i for i in range(j) if mid(items[i])), default=None)
            if p is not None and p < j - 1:
                a = items[p]
                gap = items[p + 1]['y0'] - a['y1']
                if 15 < gap < 60 and c['x0'] > a['x0'] + 100 and c['y0'] < a['y0']:
                    k = j
                    while k < len(items) and items[k]['kind'] == 'block' and not is_heading_item(items[k]):
                        k += 1
                    items = items[:p + 1] + items[j:k] + items[p + 1:j] + items[k:]
                    j = k
                    continue
        j += 1
    return items


def heading_prefix(size):
    if size >= 17:
        return '# '
    if size >= 13:
        return '## '
    return '### '


def page_text(pno):
    out = []
    for it in page_items(pno):
        if it['kind'] == 'table':
            out.append(render_table(it['table']))
            continue
        b = it['block']
        head, rest = heading_split(b)
        if head:
            size, hl = head
            t = re.sub(r'\s+', ' ', norm(' '.join(line_text(l) for l in hl))).strip()
            out.append(heading_prefix(size) + t)
            if rest:
                out.append(para(rest, pno in KEEP))
            continue
        if b['lines'][0]['spans'][0]['font'].startswith('Wingdings') and len(b['lines']) == 1:
            out.append('#### ' + norm(line_text(b['lines'][0])).strip())
            continue
        out.append(para(b['lines'], pno in KEEP))
    return '\n\n'.join(o for o in out if o.strip())


def build(first, last):
    parts = []
    for p in range(first, last + 1):
        parts.append(f'[Página impressa {p - 2} | PDF {p}]\n\n' + page_text(p))
    return '\n\n'.join(parts) + '\n'


def slug(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def main():
    global doc, OUT
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('mode', choices=['run', 'test'])
    ap.add_argument('pages', nargs='*', type=int)
    ap.add_argument('--out', default=OUT)
    ap.add_argument('--pdf', default=PDF)
    a = ap.parse_args()
    doc = fitz.open(a.pdf)
    if a.mode == 'test':
        for p in a.pages:
            print(f'======== PDF page {p} ========')
            print(page_text(p))
        return
    os.makedirs(a.out, exist_ok=True)
    KEEP.update(range(505, 511))  # index pages: keep one entry per line
    starts = [c[2] for c in CHAPTERS] + [LAST_PAGE + 1]
    for k, (cid, title, first) in enumerate(CHAPTERS):
        last = starts[k + 1] - 1
        name = f'{cid}-{slug(title)}.txt'
        numbered = cid not in ('00', '23', '24', '25')
        head = f'{"CHAPTER " + str(int(cid)) + ": " if numbered else ""}{title}'.upper()
        text = build(first, last)
        with open(os.path.join(a.out, name), 'w', encoding='utf-8', newline='\n') as f:
            f.write(f'{head}\n(Páginas impressas {first - 2}-{last - 2} | PDF {first}-{last})\n\n')
            f.write(text)
        print(name, first, last, len(text))


if __name__ == '__main__':
    sys.exit(main())
