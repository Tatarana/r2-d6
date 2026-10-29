"""Audit the chapter extraction against the PDF.

Usage:
    python tools/audit_extraction.py

Checks, over every content page:
  1. Dropped blocks: lists the text patterns the header/footer filter discards
     (expected: running headers and page-number footers only).
  2. Character diff: compares the alphanumeric characters of the kept PDF blocks
     with the generated page text (expected: no pages reported).
  3. Output artefacts in the generated chapter files: replacement characters,
     real hyphens followed by a space, and lowercase paragraph starts after a
     sentence end (candidates for lost drop caps or split paragraphs).
Exit status is 1 when check 2 or the replacement-character check finds problems.
"""
import collections
import glob
import os
import re
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extract_chapters as ex  # noqa: E402

FIRST_PAGE, LAST_PAGE = 3, ex.LAST_PAGE


def alnum(text):
    return collections.Counter(re.findall(r'[A-Za-z0-9]', text))


def audit_pages():
    ex.KEEP.update(range(505, LAST_PAGE + 1))
    dropped = collections.Counter()
    bad = []
    for p in range(FIRST_PAGE, LAST_PAGE + 1):
        page = ex.doc[p - 1]
        kept = ex.page_blocks(p)
        kept_boxes = {tuple(b['bbox']) for b in kept}
        for b in page.get_text('dict')['blocks']:
            if b['type'] == 0 and b['lines'] and tuple(b['bbox']) not in kept_boxes:
                t = ' '.join(ex.line_text(l) for l in b['lines']).strip()
                dropped[re.sub(r'\d+', '#', t)[:70]] += 1
        raw = alnum(' '.join(ex.line_text(l) for b in kept for l in b['lines']))
        got = alnum(ex.page_text(p))
        miss, extra = sum((raw - got).values()), sum((got - raw).values())
        if miss > 3 or extra > 12:
            bad.append((p, miss, extra, dict((raw - got).most_common(5)),
                        dict((got - raw).most_common(5))))
    return dropped, bad


def audit_files():
    problems = {'replacement': [], 'hyphen_space': 0, 'lower_start': []}
    for path in sorted(glob.glob(os.path.join(ex.OUT, '[0-9][0-9]-*.txt'))):
        name = os.path.basename(path)
        lines = open(path, encoding='utf-8').read().split('\n')
        for i, l in enumerate(lines, 1):
            if '�' in l:
                problems['replacement'].append((name, i))
            if re.search(r'[A-Za-z]{2,}- [a-z]{2,}', l):
                problems['hyphen_space'] += 1
            if name.startswith('25-') or not l[:1].islower():
                continue
            if re.match(r'^[a-z][a-z /\-\(\)]*:', l):
                continue  # "skill name: description" entries
            prev = next((x for x in reversed(lines[:i - 1])
                         if x.strip() and not x.startswith('[Página')), '')
            if prev.startswith('#') or re.search(r'[.!?”"…]$', prev.strip()):
                problems['lower_start'].append((name, i, l[:50]))
    return problems


def main():
    ex.doc = fitz.open(ex.PDF)
    dropped, bad = audit_pages()
    print('1. DROPPED BLOCKS (unique patterns, count):')
    for k, v in dropped.most_common(15):
        print(f'   {v:4d}  {k!r}')
    print(f'   ... {len(dropped)} patterns in total')
    print(f'\n2. PAGES WITH CHARACTER DIFFS: {len(bad)}')
    for b in bad:
        print('  ', b)
    pr = audit_files()
    print('\n3. OUTPUT ARTEFACTS')
    print('   replacement characters:', len(pr['replacement']), pr['replacement'][:5])
    print('   "word- word" hyphen+space lines:', pr['hyphen_space'],
          '(suspended hyphens like "speeder- or" are legitimate)')
    print('   lowercase paragraph starts after a sentence end:', len(pr['lower_start']))
    for item in pr['lower_start'][:10]:
        print('     ', item)
    return 1 if bad or pr['replacement'] else 0


if __name__ == '__main__':
    sys.exit(main())
