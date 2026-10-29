"""Build data/force-powers.json from chapter 10.

Usage: python tools/build_force_powers.py

Reads the power entries of data/raw-data/10-the-force.txt (CONTROL, SENSE, ALTER
and combined sections) and writes one record per power: skills, the difficulty
text of each skill, required powers, time to use, warning, whether it can be
kept "up", and a short effect summary. Cross-checks that every required power
exists and that the skills of the section match the difficulty fields found.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TXT = os.path.join(ROOT, 'data', 'raw-data', '10-the-force.txt')
OUT = os.path.join(ROOT, 'data', 'force-powers.json')

SECTIONS = {
    'CONTROL POWERS': ['control'],
    'SENSE POWERS': ['sense'],
    'ALTER POWERS': ['alter'],
    'CONTROL AND SENSE POWERS': ['control', 'sense'],
    'CONTROL AND ALTER POWERS': ['control', 'alter'],
    'SENSE AND ALTER POWERS': ['sense', 'alter'],
    'CONTROL, SENSE': ['control', 'sense', 'alter'],
    'SPECIAL POWERS': [],
}
LABELS = {
    'Control Difficulty': 'control_difficulty',
    'Sense Difficulty': 'sense_difficulty',
    'Alter Difficulty': 'alter_difficulty',
    'Required Powers': 'required_powers',
    'Time To Use': 'time_to_use',
    'Time to Use': 'time_to_use',
    'Warning': 'warning',
    'Effect': 'effect',
    'Note': 'note',
}


def slug(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def first_sentence(text, limit=260):
    t = re.sub(r'\s+', ' ', text).strip()
    m = re.match(r'(.+?[.!?])(\s|$)', t)
    return (m.group(1) if m else t)[:limit]


def parse():
    lines = open(TXT, encoding='utf-8').read().split('\n')
    page, skills, in_powers, cur, powers = 148, [], False, None, []
    for i, l in enumerate(lines):
        m = re.match(r'\[Página impressa (\d+)', l)
        if m:
            page = int(m.group(1))
            continue
        m = re.match(r'## (.+)$', l)
        if m:
            if m.group(1) in SECTIONS:
                skills, in_powers, cur = SECTIONS[m.group(1)], True, None
            else:
                in_powers, cur = False, None
            continue
        if re.match(r'# ', l):
            if in_powers and not l.startswith('# FORCE POWERS'):
                in_powers, cur = False, None
            continue
        h = re.match(r'### (.+)$', l)
        if h and in_powers:
            name = h.group(1).strip()
            if name == 'AND ALTER POWERS':
                continue
            cur = {'name': name, 'skills': list(skills), 'page': page, 'line': i + 1,
                   'fields': {}, 'body': [], 'last': None}
            powers.append(cur)
            continue
        if h or cur is None:
            continue
        stripped = l.strip()
        lab = re.match(r'(' + '|'.join(re.escape(k) for k in LABELS) + r'):\s*(.*)$', stripped)
        if lab:
            key, val = LABELS[lab.group(1)], lab.group(2).strip()
            inline = re.search(r'\s+Effect:\s*(.*)$', val)
            if key != 'effect' and inline:  # "Required Powers: X. Effect: ..." on one line
                val = val[:inline.start()].strip()
                cur['fields'].setdefault('effect', inline.group(1).strip())
            cur['fields'].setdefault(key, val)
            cur['last'] = key
        elif stripped.startswith('This power may be kept') or 'may be kept “up”' in stripped:
            cur['keep_up_text'] = stripped
            cur['last'] = None
        elif stripped and cur['last'] in ('control_difficulty', 'sense_difficulty', 'alter_difficulty',
                                          'required_powers', 'time_to_use') and not lab:
            pass
        if stripped:
            cur['body'].append(stripped)
        else:
            cur['last'] = None
    return powers


def build():
    powers = parse()
    names = {slug(p['name']) for p in powers}
    out, issues = [], []
    for p in powers:
        f = p['fields']
        eff = f.get('effect', '')
        # the effect text may continue on following lines before the next label
        keep = bool(re.search(r'may be kept\s+[“"]up', ' '.join(p['body'])))
        rec = {'id': slug(p['name']), 'name': p['name'], 'skills': p['skills'], 'page': p['page']}
        for k in ('control_difficulty', 'sense_difficulty', 'alter_difficulty'):
            if k in f:
                rec[k] = f[k]
        if 'required_powers' in f:
            raw_req = f['required_powers'].replace('telepath ,', 'telepathy,')  # typo in the book (E-041)
            req = [r.strip(' .') for r in re.split(r',|\band\b', raw_req) if r.strip(' .')]
            rec['required_powers'] = req
            for r in req:
                if slug(r) not in names:
                    issues.append(f'{p["name"]} (p.{p["page"]}): required power "{r}" is not a listed power')
        if 'time_to_use' in f:
            rec['time_to_use'] = f['time_to_use']
        if 'warning' in f:
            rec['warning'] = f['warning']
        if 'note' in f:
            rec['note'] = f['note']
        rec['can_be_kept_up'] = keep
        rec['effect_summary'] = first_sentence(eff) if eff else ''
        have = [s for s in ('control', 'sense', 'alter') if f.get(s + '_difficulty') is not None]
        if p['skills'] and sorted(have) != sorted(p['skills']):
            issues.append(f'{p["name"]} (p.{p["page"]}): section skills {p["skills"]} but difficulty fields {have}')
        if not eff and p['name'] != 'Force Scream':
            issues.append(f'{p["name"]} (p.{p["page"]}): no Effect field found')
        out.append(rec)
    return out, issues


if __name__ == '__main__':
    powers, issues = build()
    data = {'id': 'force-powers',
            'source': {'chapter': 10, 'pages': [153, 174], 'file': 'raw-data/10-the-force.txt'},
            'notes': 'A Jedi must be taught each power. A power using two skills counts as two powers when being taught, three skills as three. '
                     'Difficulty fields are the book text; see rules/force.md for relationship and proximity modifiers. '
                     'effect_summary is the first sentence only; read the page in the raw chapter for full rules and examples.',
            'powers': powers}
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
    print(len(powers), 'powers written to', os.path.relpath(OUT, ROOT))
    print(len(issues), 'cross-check notes:')
    for i in issues:
        print(' -', i)
