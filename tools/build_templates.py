"""Build data/templates.json from chapter 23 (character templates).

Usage: python tools/build_templates.py

The sheet part of each template page (attributes, listed skills, special abilities,
Move, Force Sensitive?, Force Points, Character Points) is read from word
positions in the PDF, because the text export scrambles the skill columns. The
narrative fields (equipment, background, personality, objectives, quote,
connection with characters, notes) come from data/raw-data/23-templates.txt,
matched by the template's type. Cross-checks: six attributes with die codes and a
type per page, skills listed, Force data present.
"""
import json
import os
import re

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'data', 'raw-data')
PDF = os.path.join(RAW, 'Star Wars Roleplaying Game_ Revised, Expanded and Updated.pdf')
TXT = os.path.join(RAW, '23-templates.txt')
OUT = os.path.join(ROOT, 'data', 'templates.json')
FIRST_PDF, LAST_PDF = 477, 502
ATTRS = ['DEXTERITY', 'KNOWLEDGE', 'MECHANICAL', 'PERCEPTION', 'STRENGTH', 'TECHNICAL']
DIE = re.compile(r'^\d+D(?:\+\d)?$')
NARRATIVE = ['Equipment', 'Background', 'Note', 'Personality', 'Objectives', 'A Quote', 'Connection With Characters']


def slug(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def rows(words, tol=3.5):
    out = []
    for w in sorted(words, key=lambda w: (w[1] + w[3]) / 2):
        yc = (w[1] + w[3]) / 2
        if out and abs(out[-1]['y'] - yc) <= tol:
            out[-1]['w'].append(w)
        else:
            out.append({'y': yc, 'w': [w]})
    for r in out:
        r['w'].sort(key=lambda w: w[0])
    return out


def die_value(s):
    m = re.match(r'^(\d+)D(?:\+(\d))?$', s)
    return {'text': s, 'dice': int(m.group(1)), 'pips': int(m.group(2) or 0)}


def parse_page(page):
    words = [w for w in page.get_text('words') if 20 < w[1] < 745]
    hdr = {}
    for w in words:
        if w[4] in ATTRS and w[4] not in hdr:
            hdr[w[4]] = w
    if len(hdr) != 6:
        return None, 'attribute headers found: %d' % len(hdr)
    xl, xr = hdr['DEXTERITY'][0], hdr['PERCEPTION'][0]
    sheet_right = xr + 118   # skill names are narrower than this; narrative text starts further right
    rec = {'attributes': {}, 'skills': {}}
    # type: the row starting with "Type:" (words after it)
    for r in rows([w for w in words if w[0] < sheet_right and w[1] < 200]):
        if r['w'][0][4] == 'Type:':
            rec['type'] = ' '.join(w[4] for w in r['w'][1:])
    # attribute die codes
    for a, w in hdr.items():
        row = [x for x in words if abs((x[1] + x[3]) / 2 - (w[1] + w[3]) / 2) <= 3.5 and x[0] > w[2]]
        row.sort(key=lambda x: x[0])
        code = next((x[4] for x in row if DIE.match(x[4])), None)
        rec['attributes'][a.lower()] = die_value(code) if code else None
    special = next((w for w in words if w[4] == 'SPECIAL'), None)
    y_special = special[1] if special else 745
    # listed skills below each header, same column, until the next header of that column
    cols = {'L': [a for a in ATTRS if abs(hdr[a][0] - xl) < 6], 'R': [a for a in ATTRS if abs(hdr[a][0] - xr) < 6]}
    for side, names in cols.items():
        names.sort(key=lambda a: hdr[a][1])
        x_lo, x_hi = (xl - 3, xr - 3) if side == 'L' else (xr - 3, sheet_right)
        for k, a in enumerate(names):
            y_lo = hdr[a][3] + 1
            y_hi = hdr[names[k + 1]][1] - 1 if k + 1 < len(names) else y_special - 2
            band = [w for w in words if x_lo <= w[0] < x_hi and y_lo <= (w[1] + w[3]) / 2 < y_hi and w[4] not in ATTRS]
            skills = []
            for r in rows(band):
                text = ' '.join(w[4] for w in r['w'])
                text = re.sub(r'\s+', ' ', text).strip()
                if text:
                    skills.append(text)
            rec['skills'][a.lower()] = skills
    # lower part of the sheet
    lower = [w for w in words if w[0] < sheet_right and w[1] >= y_special - 2]
    for r in rows(lower):
        t = ' '.join(w[4] for w in r['w'])
        m = re.search(r'Move:\s*(\S+)', t)
        if m:
            rec['move'] = m.group(1)
        if 'Force Sensitive?' in t:   # blank on templates where the player chooses
            m = re.search(r'Force Sensitive\?\s*(\S+)', t)
            rec['force_sensitive'] = m.group(1) if m else None
        m = re.search(r'Force Points:\s*(\d+)?', t)
        if m and 'Force Points' in t and 'Dark' not in t:
            rec['force_points'] = int(m.group(1)) if m.group(1) else None
        m = re.search(r'Dark Side Points:\s*(\d+)?', t)
        if m:
            rec['dark_side_points'] = int(m.group(1)) if m.group(1) else 0
        m = re.search(r'Character Points:\s*(\d+)?', t)
        if m:
            rec['character_points'] = int(m.group(1)) if m.group(1) else None
    # special abilities text: left part of the lower area, between the header and the wound status
    wound = next((w for w in words if w[4] == 'WOUND'), None)
    y_end = wound[1] - 2 if wound else 745
    sa = [w for w in words if w[0] < xl + 125 and y_special + 8 <= w[1] < y_end]
    rec['special_abilities'] = re.sub(r'\s+', ' ', ' '.join(w[4] for r in rows(sa) for w in r['w'])).strip()
    return rec, None


def narrative():
    """Narrative paragraphs by template type, from the text file."""
    text = open(TXT, encoding='utf-8').read()
    chunks = re.split(r'\nCharacter Name:', text)[1:]
    out = {}
    for ch in chunks:
        m = re.search(r'Type:\s*([^\n]+?)\s*(?:\n|$)', ch)
        if not m:
            continue
        name = m.group(1).strip()
        fields = {}
        for label in NARRATIVE:
            fm = re.search(r'(?:^|\n)' + re.escape(label) + r':\s*(.+?)(?=\n(?:' + '|'.join(map(re.escape, NARRATIVE)) +
                           r'):|\n# CHARACTER|\Z)', ch, re.S)
            if fm:
                fields[slug(label).replace('-', '_')] = re.sub(r'\s*\n\s*', ' ', fm.group(1)).strip()
        out[name] = fields
    return out


def build():
    doc = fitz.open(PDF)
    narr = narrative()
    templates, issues = [], []
    for pno in range(FIRST_PDF, LAST_PDF + 1):
        rec, err = parse_page(doc[pno - 1])
        if err:
            issues.append(f'PDF page {pno}: {err}')
            continue
        name = rec.get('type', '')
        t = {'id': slug(name), 'type': name, 'page': pno - 2}
        t['attributes'] = rec['attributes']
        total = sum(a['dice'] * 3 + a['pips'] for a in rec['attributes'].values() if a)
        t['attribute_total'] = f'{total // 3}D+{total % 3}' if total % 3 else f'{total // 3}D'
        t['listed_skills'] = rec['skills']
        for k in ('move', 'force_sensitive', 'force_points', 'dark_side_points', 'character_points'):
            if k in rec:
                t[k] = rec[k]
        t['special_abilities'] = rec['special_abilities']
        fs = {m.group(1).lower(): m.group(2) for m in
              re.finditer(r'(Control|Sense|Alter)\s+(\d+D(?:\+\d)?)', rec['special_abilities'], re.I)}
        if fs:
            t['force_skills'] = fs
            pm = re.search(r'select (\w+) Force powers?', rec['special_abilities'])
            words = {'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5}
            if pm:
                t['force_powers_to_select'] = words.get(pm.group(1).lower(), pm.group(1))
        t.update(narr.get(name, {}))
        if name not in narr:
            issues.append(f'{name} (p.{pno - 2}): no narrative paragraphs matched')
        if any(v is None for v in rec['attributes'].values()):
            issues.append(f'{name} (p.{pno - 2}): attribute die code missing')
        if not any(rec['skills'].values()):
            issues.append(f'{name} (p.{pno - 2}): no listed skills')
        if 'force_sensitive' not in rec:
            issues.append(f'{name} (p.{pno - 2}): no Force Sensitive? line')
        templates.append(t)
    return templates, issues


if __name__ == '__main__':
    templates, issues = build()
    data = {'id': 'templates',
            'source': {'chapter': 23, 'pages': [475, 500], 'file': 'raw-data/23-templates.txt'},
            'notes': 'Starting templates (rules/characters.md). listed_skills are the skills printed on the template under each attribute: '
                     'the player adds 7D of beginning skill dice to them. Attribute codes are the template values. '
                     'force_points is the starting number printed on the template.',
            'templates': templates}
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
    print(len(templates), 'templates written to', os.path.relpath(OUT, ROOT))
    print(len(issues), 'cross-check notes:')
    for i in issues:
        print(' -', i)
