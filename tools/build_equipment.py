"""Build data/weapons.json, data/armor.json and data/gear.json from chapter 18.

Usage: python tools/build_equipment.py

Every item stat block ("#### NAME" followed by "Model:/Type:/Cost:..." lines, or a
bare upper-case title for a few items) becomes a record: category (from the
section it sits in), name, the book's fields (model, type, scale, skill, cost,
availability, difficulty, damage, range, ammo, fire rate, blast radius, game notes,
other labelled lines) and the numeric cost when there is one. Armor game notes are
also parsed into physical/energy protection and Dexterity penalty where the text
allows. Cross-checks list items without cost or availability and unparsed fields.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TXT = os.path.join(ROOT, 'data', 'raw-data', '18-equipment-weapons.txt')
DATA = os.path.join(ROOT, 'data')

WEAPON_SECTIONS = {
    'MELEE WEAPONS': 'melee', 'ARCHAIC RANGED WEAPONS': 'archaic-ranged', 'BLASTERS': 'blaster',
    'MISCELLANEOUS WEAPONS': 'miscellaneous', 'BLASTER ARTILLERY': 'artillery', 'EXPLOSIVES': 'explosive',
}
ARMOR_SECTIONS = {'ARMOR': 'armor'}
GEAR_SECTIONS = {
    'COMMUNICATIONS DEVICES': 'communications', 'COMPUTERS AND STORAGE DEVICES': 'computers',
    'DETECTION AND SURVEILLANCE DEVICES': 'detection', 'LIFE SUPPORT': 'life-support',
    'MEDICAL GEAR': 'medical', 'CYBERNETIC PROSTHETICS': 'cybernetics', 'SURVIVAL GEAR': 'survival',
    'TOOLS': 'tools', 'WEAPON AND ARMOR ACCESSORIES': 'accessories',
}
LABELS = ('Model', 'Type', 'Scale', 'Skill', 'Cost', 'Availability', 'Difficulty', 'Damage', 'Range', 'Ammo',
          'Fire Rate', 'Blast Radius', 'Fire Control', 'Body Strength', 'Body', 'Audio Range', 'Game Notes', 'Crew', 'Cover', 'Note')
FOOTNOTE = re.compile(r'^(.*?\S)\s+\*+\s*([A-Z].{25,})$')
MARKER = re.compile(r'^\[Página impressa \d+ \| PDF \d+\]')
LABEL_RE = re.compile(r'(?:^|(?<=\s))(' + '|'.join(LABELS) + r'):')
OTHER = re.compile(r'^([A-Z][A-Za-z0-9 ./\-’\']{1,32}):\s+(.*)$')


def slug(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def parse_items():
    lines = open(TXT, encoding='utf-8').read().split('\n')
    page, section, group = 333, None, None
    items, cur = [], None
    start = next(i for i, l in enumerate(lines) if l.startswith('# EQUIPMENT'))
    stop = next(i for i, l in enumerate(lines) if l.startswith('# SERVICES AND EXPENSES'))
    i = start
    while i < stop:
        l = lines[i]
        m = re.match(r'\[Página impressa (\d+)', l)
        if m:
            page = int(m.group(1))
        h = re.match(r'(#{1,3}) (.+)$', l)
        if h:
            title = h.group(2).strip()
            if len(h.group(1)) <= 2 and title.upper() in {**WEAPON_SECTIONS, **ARMOR_SECTIONS, **GEAR_SECTIONS}:
                section = title.upper()
            if len(h.group(1)) == 3:
                group = title
            cur = None
        h4 = re.match(r'#### (.+)$', l)
        bare = re.match(r'^[A-Z][A-Z /\-,&]{6,}$', l.strip()) and i + 2 < stop and lines[i + 2].startswith('Model:')
        if h4 or bare:
            name = h4.group(1).strip() if h4 else l.strip()
            cur = {'section': section, 'group': group, 'name': name.title() if name.isupper() else name,
                   'page': page, 'fields': {}, 'last': None}
            items.append(cur)
            i += 1
            continue
        if cur is not None and section and MARKER.match(l):
            i += 1
            continue
        if cur is not None and section and ' | ' in l and not split_fields(l):
            cur.setdefault('tables', []).append([c.strip() for c in l.split(' | ')])
            i += 1
            continue
        if cur is not None and section:
            parts = split_fields(l)
            if parts:
                for key, val in parts:
                    cur['fields'].setdefault(key, val)
                    cur['last'] = key
            elif l.strip() == '':
                cur['last'] = cur['last'] if cur['last'] == 'game_notes' else None
            elif cur['last']:
                cur['fields'][cur['last']] += ' ' + l.strip()
            else:
                om = OTHER.match(l)
                if om:
                    cur['fields'].setdefault('other', []).append(f'{om.group(1)}: {om.group(2)}')
        i += 1
    return items


def split_fields(line):
    """A line may carry several labelled fields ("Skill: X Cost: 500"); it must start with one."""
    ms = list(LABEL_RE.finditer(line))
    if not ms or ms[0].start() != 0:
        return []
    out = []
    for k, m in enumerate(ms):
        end = ms[k + 1].start() if k + 1 < len(ms) else len(line)
        k = m.group(1).lower().replace(' ', '_')
        out.append(('body_strength' if k == 'body' else k, line[m.end():end].strip()))
    return out


def price(text):
    m = re.match(r'^\s*([\d,]+)\b', text or '')
    return int(m.group(1).replace(',', '')) if m else None


def armor_protection(notes):
    """Physical / energy bonus to the Strength roll to resist damage, and Dexterity penalty."""
    n = (notes or '').replace('−', '-')
    bonus = r'([+\-]\d+D?(?:\+\d)?)'
    out = {}
    for pat, kinds in (
        (bonus + r'\s+(?:to all )?(?:versus|vs\.?)\s+energy', ('energy',)),
        (bonus + r'\s+(?:to all )?(?:versus|vs\.?)\s+physical', ('physical',)),
        (bonus + r'\s+to all physical and energy', ('physical', 'energy')),
        (bonus + r'\s+to (?:all )?physical(?! and)', ('physical',)),
        (bonus + r'\s+to (?:all )?energy', ('energy',)),
        (bonus + r'\s+physical', ('physical',)),
        (bonus + r'\s+energy', ('energy',)),
        (r'[Pp]rovides ' + bonus + r' to Strength to resist physical and energy', ('physical', 'energy')),
        (bonus + r'\s+to Strength to resist physical damage', ('physical',)),
        (bonus + r'\s+(?:bonus )?to Strength rolls to resist all forms of damage', ('physical', 'energy')),
    ):
        m = re.search(pat, n, re.I)
        if m:
            for k in kinds:
                out.setdefault(k, m.group(1))
    dex = re.search(r'(-\d+D(?:\+\d)?)\s*(?:penalty)?\s*(?:to|from)?\s*(?:all )?Dexterity', n, re.I)         or re.search(r'Dexterity score by (-\d+D)', n, re.I)
    if dex:
        out['dexterity_penalty'] = dex.group(1)
    return out


def record(it):
    f = it['fields']
    rec = {'id': slug(it['name']), 'name': it['name'], 'category': (WEAPON_SECTIONS | ARMOR_SECTIONS | GEAR_SECTIONS)[it['section']],
           'group': it['group'], 'page': it['page']}
    for k in ('model', 'type', 'scale', 'skill', 'cost', 'availability', 'difficulty', 'damage', 'range', 'ammo',
              'fire_rate', 'blast_radius', 'fire_control', 'body_strength', 'audio_range', 'crew', 'cover', 'game_notes', 'note'):
        if k in f:
            rec[k] = f[k]
    for k in list(rec):   # a footnote ("... * This refers to ...") glued to a value goes to its own key
        if isinstance(rec[k], str) and k not in ('game_notes', 'note'):
            m = FOOTNOTE.match(rec[k])
            if m:
                rec[k], rec[k + '_footnote'] = m.group(1).strip(), m.group(2).strip()
    if 'cost' in f:
        rec['cost_credits'] = price(f['cost'])
    if f.get('other'):
        rec['other'] = f['other']
    if it.get('tables'):
        rec['table_rows'] = it['tables']
    if it['section'] in ARMOR_SECTIONS:
        prot = armor_protection(f.get('game_notes', ''))
        if prot:
            rec['protection'] = prot
    return rec


def build():
    items = parse_items()
    out, issues = {'weapons': [], 'armor': [], 'gear': []}, []
    for it in items:
        rec = record(it)
        key = 'weapons' if it['section'] in WEAPON_SECTIONS else 'armor' if it['section'] in ARMOR_SECTIONS else 'gear'
        out[key].append(rec)
        for need in ('cost', 'availability'):
            if need not in rec:
                issues.append(f'{rec["name"]} (p.{rec["page"]}): no {need}')
        if key == 'weapons' and 'damage' not in rec:
            if rec['category'] == 'explosive':
                rec['accessory'] = True    # detonators and fuses carry no damage of their own
            else:
                issues.append(f'{rec["name"]} (p.{rec["page"]}): weapon without damage')
    return out, issues


if __name__ == '__main__':
    out, issues = build()
    src = {'chapter': 18, 'pages': [333, 359], 'file': 'raw-data/18-equipment-weapons.txt'}
    notes = {'weapons': 'Fields are the book text. cost_credits is the leading number of the cost line (null when not for sale). '
                        'Damage codes use the book notation (4D, STR+1D, "5D/4D/3D/2D" for blast bands). Ranges are short-medium-long in metres.',
             'armor': 'Armor adds to the Strength roll to resist damage (see rules/combat-injuries.md#armor). protection is parsed from game_notes where possible; always read game_notes.',
             'gear': 'Equipment grouped by category. Costs in credits.'}
    for k in ('weapons', 'armor', 'gear'):
        with open(os.path.join(DATA, k + '.json'), 'w', encoding='utf-8', newline='\n') as f:
            json.dump({'id': k, 'source': src, 'notes': notes[k], 'items': out[k]}, f, indent=1, ensure_ascii=False)
        print(k, len(out[k]), 'items')
    print(len(issues), 'cross-check notes:')
    for i in issues:
        print(' -', i)
