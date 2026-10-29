"""Build data/vehicles.json (chapter 20) and data/starships.json (chapter 21).

Usage: python tools/build_vehicles.py

Each stat block ("#### NAME" until the next heading) becomes a record: the craft's
labelled fields, structured sensors (passive/scan/search/focus), a list of weapons
(each with fire arc, crew, skill, fire control, ranges, damage) and any extra lines
such as aircraft complements. Several labels can share a line in the book; labels
are matched case-insensitively. Cross-checks: required fields present, die codes
valid, numeric Move/Space/cost.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'data', 'raw-data')
DATA = os.path.join(ROOT, 'data')

LABELS = ['Craft', 'Type', 'Scale', 'Length', 'Skill', 'Unskilled', 'Crew Skill', 'Crew', 'Skeleton', 'Passengers',
          'Cargo Capacity', 'Consumables', 'Cover', 'Altitude Range', 'Cost', 'Hyperdrive Multiplier',
          'Hyperdrive Backup', 'Nav Computer', 'Maneuverability', 'Move', 'Space Range', 'Space',
          'Atmosphere Range', 'Atmosphere', 'Hull', 'Body Strength', 'Shields', 'Sensors', 'Passive', 'Scan',
          'Search', 'Focus', 'Fire Arc', 'Fire Control', 'Range', 'Damage', 'Note', 'Notes', 'Game Notes']
EXTRA = r'[A-Za-z/ ]*Complement'
WEAPONS_RE = re.compile(r'^Weapons(?: [A-Za-z\- ]+)?:\s*(.*)$')
LABEL_RE = re.compile(r'(?:^|(?<=\s))(' + '|'.join(sorted(map(re.escape, LABELS), key=len, reverse=True)) +
                      '|' + EXTRA + r'):', re.I)
BARE = re.compile(r"^[A-Z0-9][A-Z0-9 /\-’'.,()]{5,}$")
MARKER = re.compile(r'^\[Página impressa \d+')
DIE = re.compile(r'^\s*(?:\d+D(?:\+\d)?|\+\d|-\d+D?|0D)\s*$')


def slug(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def key(label):
    return re.sub(r'[^a-z0-9]+', '_', label.lower()).strip('_')


def split_line(line):
    ms = list(LABEL_RE.finditer(line))
    if not ms or ms[0].start() != 0:
        return []
    out = []
    for k, m in enumerate(ms):
        end = ms[k + 1].start() if k + 1 < len(ms) else len(line)
        out.append((key(m.group(1)), m.group(1), line[m.end():end].strip()))
    return out


def parse_blocks(fn, start_pat, stop_pat):
    lines = open(os.path.join(RAW, fn), encoding='utf-8').read().split('\n')
    start = next(i for i, l in enumerate(lines) if l.startswith(start_pat))
    stop = next((i for i, l in enumerate(lines) if i > start and l.startswith(stop_pat)), len(lines))
    page, category, entry, blocks, cur = 400, None, None, [], None
    for i in range(start, stop):
        l = lines[i]
        m = re.match(r'\[Página impressa (\d+)', l)
        if m:
            page = int(m.group(1))
            continue
        h = re.match(r'(#{1,4}) (.+)$', l)
        if h:
            lvl, title = len(h.group(1)), h.group(2).strip()
            if lvl <= 2:
                category = title.title()
                cur = None
            elif lvl == 3:
                entry = title
                cur = None
            elif lvl == 4:
                cur = {'name': title, 'page': page, 'category': category, 'entry': entry,
                       'top': {}, 'weapons': [], 'extras': {}, 'mode': 'craft', 'last': None, 'w': None}
                blocks.append(cur)
            else:
                cur = None
            continue
        # a few stat blocks have a bare upper-case title instead of a "####" heading
        nxt = next((x for x in lines[i + 1:i + 4] if x.strip()), '')
        if BARE.match(l.strip()) and nxt.startswith('Craft:'):
            cur = {'name': l.strip(), 'page': page, 'category': category, 'entry': entry,
                   'top': {}, 'weapons': [], 'extras': {}, 'mode': 'craft', 'last': None, 'w': None}
            blocks.append(cur)
            continue
        if cur is None or not l.strip():
            continue
        feed(cur, l.strip())
    return blocks


def feed(b, line):
    wm = WEAPONS_RE.match(line)
    if wm:
        b['mode'] = 'weapons'
        b['w'] = None
        b['last'] = None
        b['weapon_group'] = line.split(':')[0] if line.split(':')[0] != 'Weapons' else None
        if wm.group(1):
            b['w'] = {'title': wm.group(1), 'fields': {}}
            b['weapons'].append(b['w'])
        return
    parts = split_line(line)
    if not parts:
        ms = list(LABEL_RE.finditer(line))
        if ms and b['mode'] != 'craft' and (b['last'] is not None):
            # a wrapped value followed by labels ("...per round. Crew: 1"): finish the previous field first
            feed(b, line[:ms[0].start()].strip()) if line[:ms[0].start()].strip() else None
            feed(b, line[ms[0].start():])
            return
        # continuation of the previous field, or a new weapon title
        if b['mode'] == 'weapons':
            w = b['w']
            if (w is None or 'damage' in w['fields']) and (len(line) > 90 or line.endswith('.')) and b['weapons']:
                b['extras'].setdefault('notes', '')
                b['extras']['notes'] = (b['extras']['notes'] + ' ' + line).strip()
                b['last'] = None
                b['w'] = w
                return
            if w is None or 'damage' in w['fields']:
                b['w'] = {'title': line, 'fields': {}}
                b['weapons'].append(b['w'])
                b['last'] = None
                return
            if b['last']:
                w['fields'][b['last']] += ' ' + line
        elif b['last'] and b['last'][0] == 'top':
            b['top'][b['last'][1]] += ' ' + line
        return
    for k, label, val in parts:
        if k.startswith('weapons'):
            b['mode'] = 'weapons'
            b['w'] = None
            b['weapon_group'] = label if k != 'weapons' else None
            b['last'] = None
            if val:
                b['w'] = {'title': val, 'fields': {}}
                b['weapons'].append(b['w'])
            continue
        if re.fullmatch(EXTRA, label, re.I):
            b['extras'][k] = val
            b['mode'] = 'extras'
            b['last'] = ('extra', k)
            continue
        if b['mode'] == 'weapons' and k in ('note', 'notes') and (b['w'] is None or 'damage' in b['w']['fields']):
            b['extras']['notes'] = (b['extras'].get('notes', '') + ' ' + val).strip()
            b['last'] = None
            continue
        if b['mode'] == 'weapons' and k in ('fire_arc', 'fire_control', 'space_range', 'atmosphere_range', 'range',
                                            'damage', 'crew', 'skill', 'scale', 'note', 'notes'):
            if b['w'] is None:
                b['w'] = {'title': '(unnamed)', 'fields': {}}
                b['weapons'].append(b['w'])
            b['w']['fields'].setdefault(k, val)
            b['last'] = k
            continue
        if b['mode'] == 'extras':
            b['extras'][k] = val
            continue
        b['top'].setdefault(k, val)
        b['last'] = ('top', k)


def num(text):
    m = re.match(r'\s*([\d,]+(?:\.\d+)?)\s*(million|billion)?', text or '', re.I)
    if not m:
        return None
    v = float(m.group(1).replace(',', ''))
    return int(v * {'million': 1e6, 'billion': 1e9}.get((m.group(2) or '').lower(), 1))


def record(b):
    t = b['top']
    rec = {'id': slug(b['name']), 'name': b['name'], 'entry': b['entry'], 'category': b['category'], 'page': b['page']}
    for k, v in t.items():
        if k == 'sensors':
            continue
        rec[k] = v
    sens = {s: t[s] for s in ('passive', 'scan', 'search', 'focus') if s in t}
    for s in sens:
        rec.pop(s, None)
    if sens:
        rec['sensors'] = sens
    if 'cost' in t:
        rec['cost_credits'] = num(t['cost'])
    for k in ('move', 'atmosphere'):
        if k in t:
            m = re.match(r'\s*(\d+)\s*;\s*([\d,]+)\s*kmh', t[k], re.I)
            if m:
                rec[k + '_value'] = int(m.group(1))
                rec[k + '_kmh'] = int(m.group(2).replace(',', ''))
    if 'space' in t and re.fullmatch(r'\s*\d+\s*', t['space']):
        rec['space_value'] = int(t['space'])
    for k in list(rec):
        if isinstance(rec[k], str):
            rec[k] = rec[k].strip().rstrip(',').strip()
    for k in ('hull', 'shields', 'body_strength', 'maneuverability'):
        m = re.match(r'^(\d+D(?:\+\d)?)(?:\s+|\s*\*)(\(.*\)|.+)$', rec.get(k, ''))
        if m:   # "3D * * footnote text" or "5D+1 (4D+1 if doors are open)"
            rec[k], rec[k + '_note'] = m.group(1), m.group(2).strip('* ').strip()
    rec['weapons'] = []
    for w in b['weapons']:
        item = dict(name=w['title'], **w['fields'])
        for k in list(item):
            if isinstance(item[k], str) and k not in ('note', 'notes'):
                m = re.match(r'^(.*?\S)\s+\*+\s*([A-Z].{25,})$', item[k])
                if m:
                    item[k], item[k + '_footnote'] = m.group(1).strip(), m.group(2).strip()
        rec['weapons'].append(item)
    if b['extras']:
        rec['extras'] = b['extras']
    return rec


def validate(rec, required, issues):
    for r in required:
        if r not in rec:
            issues.append(f'{rec["name"]} (p.{rec["page"]}): missing {r}')
    for d in ('hull', 'body_strength', 'maneuverability'):
        if d in rec and not DIE.match(rec[d]) and not rec[d].lower().startswith(('0', 'none')):
            issues.append(f'{rec["name"]} (p.{rec["page"]}): {d} "{rec[d]}" is not a die code')
    if 'shields' in rec and not DIE.match(rec['shields']) and not rec['shields'].lower().startswith(('none', '0')):
        issues.append(f'{rec["name"]} (p.{rec["page"]}): shields "{rec["shields"]}"')
    for w in rec['weapons']:
        if 'damage' not in w:
            issues.append(f'{rec["name"]} (p.{rec["page"]}): weapon "{w["name"]}" without damage')


def build():
    issues = []
    veh = [record(b) for b in parse_blocks('20-vehicles.txt', '# WALKERS', '# ZZZ')]
    ships = [record(b) for b in parse_blocks('21-starships.txt', '## STARFIGHTERS', '# REPLACEMENT SYSTEMS')]
    for r in veh:
        validate(r, ('craft', 'scale', 'skill', 'move', 'body_strength'), issues)
    for r in ships:
        validate(r, ('craft', 'scale', 'skill', 'space', 'hull'), issues)
    return veh, ships, issues


if __name__ == '__main__':
    veh, ships, issues = build()
    notes_v = ('Stat blocks of chapter 20. Move is "meters per round; km/h all-out"; body_strength is the die code rolled to resist damage; '
               'maneuverability is added to the pilot roll. Weapons list fire arc, crew, skill, fire control, range and damage. '
               'Rules: rules/movement-chases.md.')
    notes_s = ('Stat blocks of chapter 21 (starfighters, capital ships, space transports). Space is the cruising speed in Space units; '
               'hull and shields are die codes; sensors are "range/dice" per mode. Weapons list space and atmosphere ranges. '
               'Rules: rules/space.md.')
    for name, items, src, note in (('vehicles', veh, {'chapter': 20, 'file': 'raw-data/20-vehicles.txt'}, notes_v),
                                   ('starships', ships, {'chapter': 21, 'file': 'raw-data/21-starships.txt'}, notes_s)):
        with open(os.path.join(DATA, name + '.json'), 'w', encoding='utf-8', newline='\n') as f:
            json.dump({'id': name, 'source': src, 'notes': note, 'items': items}, f, indent=1, ensure_ascii=False)
        print(name, len(items), 'items')
    print(len(issues), 'cross-check notes:')
    for i in issues:
        print(' -', i)


# ---------------------------------------------------------------------------
# Replacement systems and upgrades (second half of chapter 21)
# ---------------------------------------------------------------------------
UP_LABELS = ('Model', 'Type', 'Scale', 'Cost', 'Weight', 'Availability', 'Game Notes')
UP_RE = re.compile(r'(?:^|(?<=\s))(' + '|'.join(UP_LABELS) + r'):')
WEAPON_SUMMARY = [   # read from PDF page 452 (the text export separates names from numbers)
    ('Taim & Bak Kd-3 Light Blaster Cannon', '1D', '1D', 1000, 1),
    ('Kuat Vonak Light Laser Cannon', '2D', '2D', 1500, 2),
    ('Arakyd Tomral Heavy Laser Cannon', '2D', '5D', 3000, 4),
    ('Incom W-34t Turbolaser (illegal)', '3D', '7D', 9000, 5),
    ('Comar f-2 Light Ion Cannon', '1D', '2D', 1000, 0.5),
    ('Comar f-4 Medium Ion Cannon', '2D', '3D', 1500, 1),
    ('Comar f-9 Heavy Ion Cannon', '4D', '4D', 3000, 2),
    ('Arakyd Hi-fex Proton Torpedo Launcher (includes 12-torpedo rack)', '2D', '9D', 2500, 2),
    ('Replacement Torpedo', None, None, 800, None),
    ('Arakyd Morne-3 Concussion Missile Launcher (includes 10-missile rack)', '1D', '8D', 3500, 3),
    ('Replacement Missile', None, None, 500, None),
]


def build_upgrades():
    lines = open(os.path.join(RAW, '21-starships.txt'), encoding='utf-8').read().split('\n')
    start = next(i for i, l in enumerate(lines) if l.startswith('# REPLACEMENT SYSTEMS'))
    page, section, items, misc, cur = 447, None, [], [], None
    last = None
    for i in range(start, len(lines)):
        l = lines[i]
        m = re.match(r'\[Página impressa (\d+)', l)
        if m:
            page = int(m.group(1))
            continue
        h = re.match(r'(#{1,4}) (.+)$', l)
        if h:
            lvl, title = len(h.group(1)), h.group(2).strip()
            if lvl == 2:
                section = title.title()
            if lvl == 4:
                cur = {'name': title, 'section': section, 'page': page, 'fields': {}}
                items.append(cur)
                last = None
            elif lvl == 3 and section == 'Miscellaneous':
                cur = {'name': title, 'section': section, 'page': page, 'text': []}
                misc.append(cur)
            else:
                cur = None
            continue
        if cur is None or not l.strip():
            continue
        if 'fields' in cur:
            ms = list(UP_RE.finditer(l))
            if ms and ms[0].start() == 0:
                for k, mm in enumerate(ms):
                    end = ms[k + 1].start() if k + 1 < len(ms) else len(l)
                    last = mm.group(1).lower().replace(' ', '_')
                    cur['fields'].setdefault(last, l[mm.end():end].strip())
            elif ' | ' in l:
                cur.setdefault('table', []).append([c.strip() for c in l.split(' | ')])
            elif last:
                cur['fields'][last] += ' ' + l.strip()
        elif 'text' in cur:
            cur['text'].append(l.strip())
    out_items = []
    for it in items:
        rec = {'id': slug(it['name']), 'name': it['name'], 'section': it['section'], 'page': it['page'], **it['fields']}
        if 'cost' in rec:
            rec['cost_credits'] = num(rec['cost'])
        if it.get('table'):
            rec['table_rows'] = it['table']
        out_items.append(rec)
    out_misc = []
    for it in misc:
        text = ' '.join(it['text'])
        rec = {'id': slug(it['name']), 'name': it['name'], 'page': it['page'], 'text': text}
        cm = re.search(r'Cost:\s*([^.]*?(?:credits[^.]*)?)\.\s*Weight:\s*([^.]*)\.', text)
        if cm:
            rec['cost'], rec['weight'] = cm.group(1).strip(), cm.group(2).strip()
        else:
            only = re.search(r'Cost:\s*([^.]*credits)', text)
            if only:
                rec['cost'] = only.group(1).strip()
        out_misc.append(rec)
    return out_items, out_misc


def write_upgrades():
    items, misc = build_upgrades()
    data = {
        'id': 'ship-upgrades',
        'source': {'chapter': 21, 'file': 'raw-data/21-starships.txt', 'pages': [447, 452]},
        'notes': 'Replacement systems for freighters and space transports (capital ships and starfighters are rarely modified). '
                 'Every system weighs something, subtracted from cargo capacity. Costs exclude installation. '
                 'Linking up to three identical weapons: computer link about 100 credits per weapon, +1D damage for two, +2D for three. '
                 'Weapons need a fee (about 30% of price) and an Imperial or Republic permit; turbolasers are illegal on private vessels.',
        'systems': items,
        'deflector_shields': [{'code': '1D', 'cost': 4000, 'weight_tons': 6}, {'code': '2D', 'cost': 10000, 'weight_tons': 8},
                              {'code': '3D', 'cost': 20000, 'weight_tons': 10}],
        'weapon_summary': {'verified_against': 'PDF page 452', 'note': 'Damage is starfighter-scale. Fire control and damage as dice codes.',
                           'rows': [{'weapon': n, 'fire_control': fc, 'damage': dm, 'cost': c, 'weight_tons': w}
                                    for n, fc, dm, c, w in WEAPON_SUMMARY]},
        'sensor_equipment_costs': {'Electro-Photo Receptors (EPR)': 300, 'Full Spectrum Transceivers (FST)': 500,
                                   'Dedicated Energy Receptors (DER)': 600, 'Life-Form Indicators (LFI)': 800},
        'miscellaneous': misc,
    }
    with open(os.path.join(DATA, 'ship-upgrades.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
    print('ship-upgrades:', len(items), 'systems,', len(misc), 'miscellaneous')
    return items, misc


if __name__ == '__main__':
    write_upgrades()
