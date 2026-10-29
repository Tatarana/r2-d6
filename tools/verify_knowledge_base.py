"""Independent spot-check of the knowledge base against the PDF.

Usage:
    python tools/verify_knowledge_base.py            # full automatic check
    python tools/verify_knowledge_base.py --sample N # also print N random records for manual reading

It does not reuse the extracted .txt files: every check reads the PDF text of the
page the record or sentence cites (printed page + 2 = PDF page), plus the pages on
either side. Two checks:
  1. data records (weapons, armor, gear, vehicles, starships, species, templates,
     skills, force powers, upgrades): each value token (dice codes, numbers with
     units, difficulty words) must appear on the cited page or a neighbour.
  2. rules/*.md: every sentence carrying a "(p.N)" citation: its dice codes and
     numbers must appear on the cited pages or a neighbour.
Misses are not necessarily errors (paraphrases, derived values, page-break
placement), so they are listed for human reading.
"""
import argparse
import glob
import json
import os
import random
import re
import sys

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
PDF = os.path.join(DATA, 'raw-data', 'Star Wars Roleplaying Game_ Revised, Expanded and Updated.pdf')

_pages = {}
doc = None


def norm(t):
    t = t.replace('­', '').replace('−', '-').replace('–', '-').replace('—', '-')
    t = t.replace('’', "'").replace('“', '"').replace('”', '"').replace('\xa0', ' ')
    t = re.sub(r'(\w)-\s+(\w)', r'\1-\2', t)
    return re.sub(r'[\s -​]+', ' ', t).lower()


def page_text(printed):
    pdf = printed + 2
    if pdf < 1 or pdf > doc.page_count:
        return ''
    if pdf not in _pages:
        _pages[pdf] = norm(doc[pdf - 1].get_text())
    return _pages[pdf]


def around(pages, spread=1):
    nums = set()
    for p in pages:
        for q in range(p - spread, p + spread + 1):
            nums.add(q)
    return ' '.join(page_text(q) for q in sorted(nums))


DICE = re.compile(r'(?<![\w+\-])[+\-]?\d+D(?:\+\d+)?(?![\w])')
NUM = re.compile(r'(?<![\w.,/+\-])\d{1,3}(?:,\d{3})+(?![\w])|(?<![\w.,/+\-])\d{2,}(?![\w,])')
RANGE = re.compile(r'\d+(?:-\d+)?/\d+(?:\.\d+)?(?:/\d+(?:\.\d+)?)+')


def tokens(text):
    t = norm(text)
    out = set()
    out |= {m.group(0).lstrip('+').lstrip('-') for m in DICE.finditer(t.upper().replace('D', 'D'))}
    out = {x.lower() for x in out}
    out |= {m.group(0) for m in NUM.finditer(t)}
    out |= {m.group(0) for m in RANGE.finditer(t)}
    return out


def check_tokens(toks, hay):
    return sorted(t for t in toks if t not in hay and t.replace(',', '') not in hay.replace(',', ''))


def record_text(rec, skip=('id', 'page', 'line', 'category', 'group', 'entry', 'cost_credits', 'move_value', 'move_kmh',
                           'space_value', 'atmosphere_value', 'atmosphere_kmh', 'section')):
    parts = []
    for k, v in rec.items():
        if k in skip:
            continue
        parts.append(json.dumps(v, ensure_ascii=False) if not isinstance(v, str) else v)
    return ' '.join(parts)



LABELLED = {'cost': 'cost', 'damage': 'damage', 'range': 'range', 'ammo': 'ammo', 'fire_rate': 'fire rate',
            'availability': 'availability', 'difficulty': 'difficulty', 'scale': 'scale', 'hull': 'hull',
            'shields': 'shields', 'maneuverability': 'maneuverability', 'space': 'space',
            'body_strength': 'body strength', 'move': 'move', 'fire_control': 'fire control',
            'space_range': 'space range', 'atmosphere_range': 'atmosphere range', 'blast_radius': 'blast radius',
            'passengers': 'passengers', 'cargo_capacity': 'cargo capacity', 'hyperdrive_multiplier': 'hyperdrive multiplier'}


def name_re(name):
    return r'\W+'.join(re.escape(w) for w in re.findall(r'\w+', name))


def item_window(rec, pages, next_name=None):
    """Text of the item's own stat block: from its heading (followed by a labelled field) to the next item's heading."""
    hay = ' '.join(page_text(q) for q in range(min(pages) - 1, max(pages) + 2))
    name = norm(rec.get('name') or rec.get('type') or '')
    head = re.compile(r'(?<![\w-])' + name_re(name) + r'\s+(?:model|type|craft|scale|skill|cost)\s*:')
    m0 = head.search(hay)
    start = m0.start() if m0 else None
    if start is None:
        return None
    end = min(len(hay), start + 2600)
    if next_name:
        nhead = re.compile(r'(?<![\w-])' + name_re(norm(next_name)) + r'\s+(?:model|type|craft|scale|skill|cost)\s*:')
        m1 = nhead.search(hay, start + len(name))
        if m1:
            end = min(end, m1.start())
    return hay[start:end]


def phrase_misses(rec, pages, window=None):
    """Each "Label: value" the record claims must appear verbatim (whitespace-normalised) in the item's own block."""
    hay = window if window is not None else around(pages, 1)
    out = []

    def one(label, value):
        if not isinstance(value, str) or not value.strip():
            return
        v = norm(value).strip(' .')[:60]
        for lab in (label, {'body strength': 'body', 'space': 'space', 'move': 'move'}.get(label, label)):
            if norm(lab + ': ' + v) in hay or norm(lab + ':' + v) in hay:
                return
        if (norm(label) + ':' + v).replace(' ', '') in hay.replace(' ', ''):
            return
        out.append(f'{label}: {v}')
    for k, label in LABELLED.items():
        if k in rec:
            one(label, rec[k])
    for w in rec.get('weapons', []) if isinstance(rec.get('weapons'), list) else []:
        for k in ('fire_control', 'damage', 'space_range', 'atmosphere_range', 'range'):
            if k in w:
                one(LABELLED[k], w[k])
    sens = rec.get('sensors')
    if isinstance(sens, dict):
        for k, val in sens.items():
            one(k, val)
    return out


def check_records():
    results = []
    files = {'weapons.json': 'items', 'armor.json': 'items', 'gear.json': 'items', 'vehicles.json': 'items',
             'starships.json': 'items', 'ship-upgrades.json': 'systems', 'species.json': 'species',
             'templates.json': 'templates', 'skills.json': 'skills', 'force-powers.json': 'powers'}
    total = bad = 0
    for fn, key in files.items():
        data = json.load(open(os.path.join(DATA, fn), encoding='utf-8'))
        for rec in data[key]:
            page = rec.get('page') or (rec.get('stat_blocks') or [{}])[0].get('page')
            if not page:
                continue
            text = record_text(rec)
            if fn == 'templates.json':
                text = json.dumps({k: rec[k] for k in ('attributes', 'listed_skills', 'move') if k in rec}, ensure_ascii=False)
            pages = [page] + ([sb['page'] for sb in rec.get('stat_blocks', [])] if 'stat_blocks' in rec else [])
            if fn in ('vehicles.json', 'starships.json', 'weapons.json', 'armor.json', 'gear.json', 'species.json',
                      'templates.json', 'skills.json', 'force-powers.json', 'ship-upgrades.json'):
                spread = 1
            hay = around(pages, spread)
            miss = check_tokens(tokens(text), hay)
            total += 1
            strict = []
            if fn in ('weapons.json', 'armor.json', 'gear.json', 'vehicles.json', 'starships.json', 'ship-upgrades.json'):
                names = [r.get('name') for r in data[key]]
                i = names.index(rec.get('name'))
                win = item_window(rec, pages, names[i + 1] if i + 1 < len(names) else None)
                strict = phrase_misses(rec, pages, win) if win else ['(block not located on the cited page)']
            if fn == 'templates.json':
                hay0 = page_text(page)
                strict = [f'{k} {v["text"]}' for k, v in rec['attributes'].items()
                          if norm(f'{k} {v["text"]}') not in hay0 and norm(k) + ' ' + norm(v['text']) not in hay0]
            if miss or strict:
                bad += 1
                results.append((fn, rec.get('name') or rec.get('type'), page, miss[:8], strict[:6]))
    return total, bad, results


CITE = re.compile(r'\(p\.(\d+)(?:\s*[-,]\s*(?:p\.)?(\d+))?[^)]*\)')


def check_rules():
    """For each rules line with page citations: its dice codes and numbers (minus those inside the
    citation parentheses and code spans) must appear on the cited pages +/-1."""
    results = []
    total = bad = 0
    for f in sorted(glob.glob(os.path.join(DATA, 'rules', '*.md'))):
        in_front = False
        for ln, line in enumerate(open(f, encoding='utf-8').read().split('\n'), 1):
            if line.strip() == '---':
                in_front = not in_front
                continue
            if in_front or line.startswith('|---'):
                continue
            pages = []
            for m in CITE.finditer(line):
                a_, b_ = int(m.group(1)), m.group(2)
                pages += list(range(a_, int(b_) + 1)) if b_ and 0 < int(b_) - a_ < 20 else [a_]
            if not pages:
                continue
            text = CITE.sub(' ', line)
            text = re.sub(r'`[^`]*`', ' ', text)            # file names and ids
            toks = tokens(text)
            if not toks:
                continue
            total += 1
            hay = around(sorted(set(pages)), 1)
            miss = check_tokens(toks, hay)
            if miss:
                bad += 1
                results.append((os.path.basename(f), ln, sorted(set(pages)), miss[:6], text.strip()[:100]))
    return total, bad, results


def sample_records(n, seed=7):
    rnd = random.Random(seed)
    pool = []
    for fn, key in (('weapons.json', 'items'), ('armor.json', 'items'), ('gear.json', 'items'), ('vehicles.json', 'items'),
                    ('starships.json', 'items'), ('species.json', 'species'), ('templates.json', 'templates'),
                    ('skills.json', 'skills'), ('force-powers.json', 'powers')):
        for rec in json.load(open(os.path.join(DATA, fn), encoding='utf-8'))[key]:
            pool.append((fn, rec))
    return rnd.sample(pool, n)


def main():
    global doc
    ap = argparse.ArgumentParser()
    ap.add_argument('--sample', type=int, default=0)
    a = ap.parse_args()
    doc = fitz.open(PDF)
    t, b, res = check_records()
    print(f'DATA RECORDS: {t} checked, {b} with value tokens not found on the cited page +/-1')
    for r in res:
        print('  ', r)
    t2, b2, res2 = check_rules()
    print(f'\nRULES SENTENCES WITH A PAGE CITATION: {t2} checked, {b2} with tokens not found')
    for r in res2:
        print('  ', r)
    if a.sample:
        print('\nRANDOM RECORDS FOR MANUAL READING')
        for fn, rec in sample_records(a.sample):
            print('\n--', fn, rec.get('name') or rec.get('type'), 'p.', rec.get('page'))
            print(json.dumps({k: v for k, v in rec.items() if k not in ('line',)}, ensure_ascii=False)[:700])
    return 0


if __name__ == '__main__':
    sys.exit(main())
