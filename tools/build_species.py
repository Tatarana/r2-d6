"""Build data/species.json from chapter 16 (Aliens).

Usage: python tools/build_species.py

For every species section ("## NAME") it reads the game information paragraphs
(homeworld, languages) and the stat block ("#### NAME": attribute dice, six
attribute ranges, special skills, special abilities, story factors, Move, Size).
Some species have several stat blocks (Geonosian worker / aristocrat) and the
Republic Clone uses fixed values instead of ranges. Cross-checks: minimum <=
maximum, and the attribute dice total lies between the sum of the minima and the
sum of the maxima.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TXT = os.path.join(ROOT, 'data', 'raw-data', '16-aliens.txt')
OUT = os.path.join(ROOT, 'data', 'species.json')
TYPOS = {'MECHANCIAL': 'MECHANICAL', 'PECEPTION': 'PERCEPTION'}
ATTRS = ['DEXTERITY', 'KNOWLEDGE', 'MECHANICAL', 'PERCEPTION', 'STRENGTH', 'TECHNICAL']


def slug(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def die(code):
    m = re.fullmatch(r'(\d+)D(?:\+(\d+))?', code.strip())
    if not m:
        return None
    return {'text': code.strip(), 'dice': int(m.group(1)), 'pips': int(m.group(2) or 0)}


def pips(code):
    d = die(code)
    return None if d is None else d['dice'] * 3 + d['pips']


def parse():
    lines = open(TXT, encoding='utf-8').read().split('\n')
    first = next(i + 1 for i, l in enumerate(lines) if l.startswith('## HUMANS'))
    last = next(i + 1 for i, l in enumerate(lines) if l.startswith('# SPECIES GENERATION'))
    page, species, cur, block = 279, [], None, None
    for i, l in enumerate(lines):
        m = re.match(r'\[Página impressa (\d+)', l)
        if m:
            page = int(m.group(1))
            continue
        n = i + 1
        if n < first or n >= last:
            continue
        h = re.match(r'(#{1,4}) (.+)$', l)
        if h:
            level, title = len(h.group(1)), h.group(2).strip()
            if level == 2 and title not in ('GAME INFORMATION',):
                cur = {'name': title.title() if title.isupper() else title, 'page': page,
                       'info': [], 'blocks': []}
                species.append(cur)
                block = None
            elif level == 3 and title in ('Republic Clone',):
                cur = {'name': 'Republic Clone', 'page': page, 'info': [], 'blocks': []}
                species.append(cur)
                block = None
            elif level == 3 and cur is not None and title in ('Near-Humans', 'ERA NOTES: SPECIES'):
                cur = None if title.startswith('ERA') else cur
                block = None
            elif level == 4 and cur is not None:
                block = {'title': title, 'page': page, 'lines': []}
                cur['blocks'].append(block)
            continue
        if cur is None:
            continue
        if block is not None:
            block['lines'].append(l)
        else:
            cur['info'].append(l)
    return species


def parse_block(b):
    rec = {'stat_block': b['title'].title() if b['title'].isupper() else b['title'], 'page': b['page']}
    attrs, section, sections = {}, None, {'special_skills': [], 'special_abilities': [], 'story_factors': []}
    for l in b['lines']:
        s = l.strip().replace(' | ', ' ')   # table-style attribute rows: "DEXTERITY | 2D/4D"
        if not s:
            continue
        s = re.sub(r'^([A-Z]{6,})(\d)', r'\1 \2', s)   # "MECHANICAL1D/4D" without a space (E-051)
        for typo, fix in TYPOS.items():   # misspelled attribute names in the book (E-049, E-050)
            if s.startswith(typo):
                s = fix + ' ' + s[len(typo):].lstrip()
        m = re.search(r'\s+(Move:\s*\S.*)$', s)   # Move glued to the previous paragraph (Cathar, E-052)
        if m and not s.startswith(('Move:', 'Size:')):
            pending, s = m.group(1), s[:m.start()]
        else:
            pending = None
        m = re.match(r'Attribute Dice:\s*(.*)$', s)
        if m:
            rec['attribute_dice'] = m.group(1)
            d = die(m.group(1))
            if d:
                rec['attribute_dice_value'] = d
            section = None
            continue
        m = re.match(r'(' + '|'.join(ATTRS) + r')\s+(\S+?)(?:/(\S+))?$', s)
        if m:
            a = m.group(1).lower()
            lo, hi = m.group(2), m.group(3)
            attrs[a] = {'min': die(lo) or lo, 'max': die(hi) if hi else None} if hi else {'fixed': die(lo) or lo}
            section = None
            continue
        if re.match(r'Special Skills:?$', s):
            section = 'special_skills'; continue
        if re.match(r'Special Abilities:?$', s):
            section = 'special_abilities'; continue
        if re.match(r'Story Factors:?$', s):
            section = 'story_factors'; continue
        m = re.match(r'Move:\s*(.*)$', s)
        if m:
            rec['move'] = m.group(1); section = None; continue
        m = re.match(r'Size:\s*(.*)$', s)
        if m:
            rec['size'] = m.group(1); section = None; continue
        if section:
            sections[section].append(s)
        if pending:
            mm = re.match(r'Move:\s*(.*)$', pending)
            rec['move'] = mm.group(1)
            section = None
    rec['attributes'] = attrs
    for k, v in sections.items():
        if v:
            rec[k] = v
    return rec


def info_fields(info):
    text = [x.strip() for x in info if x.strip()]
    out = {}
    for t in text:
        m = re.match(r'(Homeworlds?|Languages?):\s*(.*)$', t)
        if m:
            out['homeworlds' if m.group(1).startswith('Home') else 'languages'] = m.group(2)
    return out


def build():
    species, issues, out = parse(), [], []
    for sp in species:
        rec = {'id': slug(sp['name']), 'name': sp['name'], 'page': sp['page']}
        rec.update(info_fields(sp['info']))
        stat_blocks = [parse_block(b) for b in sp['blocks']]
        if not stat_blocks:
            issues.append(f'{sp["name"]} (p.{sp["page"]}): no stat block found')
        rec['stat_blocks'] = stat_blocks
        for sb in stat_blocks:
            attrs = sb['attributes']
            if len(attrs) != 6:
                issues.append(f'{sp["name"]}/{sb["stat_block"]}: {len(attrs)} attributes found')
                continue
            tot = pips(sb.get('attribute_dice', '')) if sb.get('attribute_dice') else None
            mins = maxs = 0
            for a, v in attrs.items():
                if 'fixed' in v:
                    continue
                lo, hi = v['min'], v['max']
                lp = pips(lo['text']) if isinstance(lo, dict) else None
                hp = pips(hi['text']) if isinstance(hi, dict) else None
                if lp is None or hp is None:
                    issues.append(f'{sp["name"]}/{sb["stat_block"]}: cannot read {a} {lo}/{hi}')
                    continue
                if lp > hp:
                    issues.append(f'{sp["name"]}/{sb["stat_block"]}: {a} minimum above maximum')
                mins += lp; maxs += hp
            if tot is not None and mins and not (mins <= tot <= maxs):
                issues.append(f'{sp["name"]}/{sb["stat_block"]}: attribute dice {sb["attribute_dice"]} outside minima/maxima sums '
                              f'({mins // 3}D+{mins % 3} .. {maxs // 3}D+{maxs % 3})')
            if 'move' not in sb:
                issues.append(f'{sp["name"]}/{sb["stat_block"]}: no Move')
        out.append(rec)
    return out, issues


if __name__ == '__main__':
    sp, issues = build()
    data = {'id': 'species',
            'source': {'chapter': 16, 'pages': [278, 316], 'file': 'raw-data/16-aliens.txt'},
            'notes': 'Attribute ranges are minimum/maximum die codes. Player characters get 6D more attribute dice than the species value (rules/characters.md). '
                     'Move is "start/maximum". special_skills / special_abilities / story_factors keep the book paragraphs verbatim. '
                     'Nonhuman availability depends on the campaign era (see era notes in the chapter, p.280).',
            'species': sp}
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
    blocks = sum(len(s['stat_blocks']) for s in sp)
    print(len(sp), 'species,', blocks, 'stat blocks written to', os.path.relpath(OUT, ROOT))
    print(len(issues), 'cross-check notes:')
    for i in issues:
        print(' -', i)
