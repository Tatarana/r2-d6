"""Build data/skills.json from chapter 3.

Usage: python tools/build_skills.py

Sources: the Skills Summary Table (PDF page 36, read from word positions) gives
name / attribute / time for every skill; the chapter text (data/raw-data/03-*.txt)
gives specializations, prerequisites and a short summary. Both are merged by
name and cross-checked; disagreements are printed (log them in data/errata.md).
"""
import difflib
import json
import os
import re

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'data', 'raw-data')
PDF = os.path.join(RAW, 'Star Wars Roleplaying Game_ Revised, Expanded and Updated.pdf')
TXT = os.path.join(RAW, '03-attributes-skills.txt')
OUT = os.path.join(ROOT, 'data', 'skills.json')
ATTR = {'DEX': 'dexterity', 'KNO': 'knowledge', 'MEC': 'mechanical',
        'PER': 'perception', 'STR': 'strength', 'TEC': 'technical'}
SECTION_ATTR = {'DEXTERITY SKILLS': 'dexterity', 'KNOWLEDGE SKILLS': 'knowledge',
                'MECHANICAL SKILLS': 'mechanical', 'PERCEPTION SKILLS': 'perception',
                'STRENGTH SKILLS': 'strength', 'TECHNICAL SKILLS': 'technical'}
RANGED = {'archaic guns', 'artillery', 'blaster', 'blaster artillery', 'bowcaster', 'bows',
          'firearms', 'flamethrower', 'grenade', 'missile weapons', 'thrown weapons',
          'vehicle blasters', 'starship gunnery', 'capital ship gunnery'}
MELEE = {'melee combat', 'lightsaber', 'brawling'}
REACTION = {'acrobatics', 'brawling parry', 'dodge', 'melee parry'}


def slug(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def norm(name):
    n = re.sub(r'^\(a\)\s*', '', name.lower())
    return re.sub(r'[^a-z0-9]', '', n)


def summary_table():
    """Rows (name, attribute code, time) of the two-column summary table."""
    doc = fitz.open(PDF)
    words = [w for w in doc[35].get_text('words') if 74 < w[1] < 735]
    rows = {}
    for w in words:
        side = 0 if w[0] < 285 else 1
        rows.setdefault((side, round((w[1] + w[3]) / 2 / 3)), []).append(w)
    out = []
    for side in (0, 1):
        xs = (0, 180, 225, 285) if side == 0 else (285, 420, 465, 600)
        for k in sorted(k for k in rows if k[0] == side):
            ws = sorted(rows[k], key=lambda w: w[0])
            name = ' '.join(w[4] for w in ws if xs[0] <= w[0] < xs[1])
            attr = ' '.join(w[4] for w in ws if xs[1] <= w[0] < xs[2])
            time = ' '.join(w[4] for w in ws if xs[2] <= w[0] < xs[3])
            if name == 'Skill' or not name:
                continue
            out.append((name, attr, time))
    return out


def chapter_entries():
    """Every '### Heading' section of the chapter with page, section attribute and body."""
    lines = open(TXT, encoding='utf-8').read().split('\n')
    page, section, entries, cur = 32, None, [], None
    for i, l in enumerate(lines):
        m = re.match(r'\[Página impressa (\d+)', l)
        if m:
            page = int(m.group(1))
            continue
        m = re.match(r'# (.+)$', l)
        if m:
            section = SECTION_ATTR.get(m.group(1), section)
            cur = None
            continue
        if l.startswith('## '):
            cur = None
            continue
        h = re.match(r'### (.+)$', l)
        if h:
            cur = {'name': h.group(1).strip(), 'page': page, 'line': i + 1,
                   'section': section, 'body': []}
            entries.append(cur)
        elif cur is not None:
            cur['body'].append(l)
    return lines, entries


def first_sentence(body):
    for l in body:
        t = l.strip()
        if not t or t.startswith(('Time Taken', 'Specialization', 'Advanced skill', 'Modifiers', '•')):
            continue
        m = re.match(r'(.+?[.!?])(\s|$)', t)
        return (m.group(1) if m else t)[:240]
    return ''


def parse_entry(e):
    name, body, quirk = e['name'], list(e['body']), False
    m = re.match(r'(.+?)\s+(Time Taken:.*)$', name)
    if m:  # heading and metadata merged by the extraction
        name, quirk = m.group(1), True
        body.insert(0, m.group(2))
    time = spec = None
    for l in body:
        if l.startswith('Time Taken:') and time is None:
            t = l.split(':', 1)[1].strip()
            m = re.search(r'\s+Specializations?:\s*(.*)$', t)
            if m:  # both fields on one line
                t, spec = t[:m.start()].strip(), m.group(1).strip()
            time = t
        elif re.match(r'Specializations?:', l) and spec is None:
            spec = l.split(':', 1)[1].strip()
    adv = next((l.strip() for l in body if l.strip().lower().startswith('advanced skill')), None)
    return {'name': name, 'page': e['page'], 'section': e['section'], 'time': time,
            'spec': spec, 'adv_line': adv, 'summary': first_sentence(body), 'quirk': quirk}


def engineering_prereqs(lines):
    out = {}
    for l in lines:
        m = re.match(r'\(A\) ([^:]+): (Requires.*)$', l)
        if m:
            out[norm(m.group(1))] = re.sub(r'\s+', ' ', m.group(2))
    return out


def build():
    tab = summary_table()
    lines, raw_entries = chapter_entries()
    ents = [parse_entry(e) for e in raw_entries]
    by = {norm(e['name']): e for e in ents}
    eng = engineering_prereqs(lines)
    issues, skills = [], []
    for name, attr, time in tab:
        adv = name.startswith('(A)')
        clean = re.sub(r'^\(A\)\s*', '', name)
        key = norm(name)
        e, how = by.get(key), 'exact'
        if e is None and not adv:
            cand = difflib.get_close_matches(key, list(by), n=1, cutoff=0.88)
            if cand:
                e, how = by[cand[0]], 'fuzzy'
        sk = {'id': slug(clean) + ('-advanced' if adv else ''), 'name': clean,
              'advanced': adv, 'attribute': ATTR.get(attr, attr),
              'time_taken_summary': time}
        if e:
            sk.update({'time_taken': e['time'], 'specializations': e['spec'],
                       'summary': e['summary'], 'page': e['page']})
            if e['section'] and e['section'] != sk['attribute'] and not adv:
                issues.append(f'{clean}: summary table says {sk["attribute"]}, chapter section says {e["section"]} (p.{e["page"]})')
            if how == 'fuzzy':
                issues.append(f'{clean}: matched chapter heading "{e["name"]}" by name similarity (p.{e["page"]})')
            if e['quirk']:
                issues.append(f'{clean}: heading and "Time Taken" were merged by the text extraction (p.{e["page"]})')
        elif not adv:
            issues.append(f'{clean}: in the summary table but has no skill section')
        if adv:
            if key in eng:
                sk['prerequisites_text'] = eng[key]
                sk['page'] = 63
            elif e and e['adv_line']:
                sk['prerequisites_text'] = e['adv_line']
        tags = [t for t, group in (('ranged-combat', RANGED), ('melee-combat', MELEE),
                                   ('reaction', REACTION)) if clean.lower() in group]
        if tags:
            sk['tags'] = tags
        skills.append(sk)
    known = {norm(s['name']) for s in skills}
    for e in ents:
        if norm(e['name']) not in known:
            issues.append(f'section "{e["name"]}" (p.{e["page"]}) is not in the summary table')
    return skills, issues


if __name__ == '__main__':
    skills, issues = build()
    data = {'id': 'skills',
            'source': {'chapter': 3, 'pages': [32, 66], 'file': 'raw-data/03-attributes-skills.txt',
                       'summary_table_page': 34},
            'notes': 'Advanced skills have advanced=true and start at 1D (see rules/characters.md). '
                     'time_taken_summary is from the summary table; time_taken from the skill section.',
            'skills': skills}
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
    print(len(skills), 'skills written to', os.path.relpath(OUT, ROOT))
    print(len(issues), 'cross-check notes:')
    for i in issues:
        print(' -', i)
