# tools

Scripts that build and check the raw text in `data/raw-data/` and derive structured data from it. Both need Python 3 and PyMuPDF (`pip install pymupdf`) and work from any directory.

## extract_chapters.py
Turns the rulebook PDF into one `.txt` per chapter.

```bash
python tools/extract_chapters.py run                 # rewrites data/raw-data/NN-*.txt
python tools/extract_chapters.py run --out some/dir  # write elsewhere (e.g. to compare)
python tools/extract_chapters.py test 340 35         # print PDF pages 340 and 35
```

- Input: `data/raw-data/Star Wars Roleplaying Game_ Revised, Expanded and Updated.pdf` (override with `--pdf`).
- Output: 26 files (`00-front-matter.txt` to `25-index.txt`). Each starts with the chapter title and page range, and has a `[Página impressa N | PDF M]` marker per page. Printed page = PDF page - 2.
- Handling: blocks are read in the PDF's own stream order (right on almost every page); a paragraph that the stream splits across columns is repaired. **Tables** are detected from word positions (three or more aligned rows of narrow cells, per column) and written as `a | b | c` rows, with header rows and wrapped cells kept. Headings become `#`/`##`/`###` (a heading no longer absorbs the next line). Running headers and footers are dropped, soft hyphens re-joined, and the index keeps one entry per line.
- Chapter start pages are in the `CHAPTERS` list at the top of the script.

## audit_extraction.py
Checks the extraction against the PDF.

```bash
python tools/audit_extraction.py
```

Reports (1) which blocks the filter drops (should be only running headers/footers), (2) pages whose alphanumeric characters differ from the PDF (should be none), and (3) artefacts in the generated files. Exit status 1 means check 2 or the replacement-character check failed.

Run the audit after any change to `extract_chapters.py`, then regenerate and diff:
```bash
python tools/extract_chapters.py run --out /tmp/check
```

## build_skills.py
Builds `data/skills.json` from chapter 3.

```bash
python tools/build_skills.py
```

Reads the Skills Summary Table straight from the PDF (word positions, because the text export flattens it) and the skill sections from `data/raw-data/03-attributes-skills.txt`, merges them by name, and prints cross-check notes. Run it again after regenerating the raw text. Anything it reports that is a real inconsistency belongs in `data/errata.md`.

## build_force_powers.py
Builds `data/force-powers.json` (77 powers) from chapter 10.

```bash
python tools/build_force_powers.py
```

Parses each power's skills (from its section), difficulty text, required powers, time to use, warning, "kept up" flag and a first-sentence summary, then checks that every required power exists and that the difficulty fields match the section's skills. Run it again after regenerating the raw text.

## build_species.py
Builds `data/species.json` (47 species) from chapter 16.

```bash
python tools/build_species.py
```

Reads each species' homeworld and languages and its stat block (attribute dice, six attribute ranges, special skills, abilities, story factors, Move, Size). Tolerates the book's typos (listed in `data/errata.md`) and checks that minimum <= maximum for every attribute and that the attribute dice total lies between the sums of the minima and maxima.

## build_equipment.py
Builds `data/weapons.json`, `data/armor.json` and `data/gear.json` (132 items) from chapter 18.

```bash
python tools/build_equipment.py
```

Reads every item stat block (labelled lines, several labels per line allowed), assigns the category from its section, parses the numeric cost, extracts physical/energy protection and Dexterity penalty for armor, and keeps small pipe tables (computer power tables, amphistaff modes) as `table_rows`. Prices, license and service tables are written separately into `data/tables/equipment-tables.json` (general goods checked against the PDF).

## build_vehicles.py
Builds `data/vehicles.json` (24 vehicles, chapter 20), `data/starships.json` (34 starships, chapter 21) and `data/ship-upgrades.json` (replacement systems, second half of chapter 21).

```bash
python tools/build_vehicles.py
```

Parses each stat block (several labels per line, weapon sub-blocks, structured sensors, aircraft complements, footnotes split from die codes) and checks required fields and die codes. The weapon summary and deflector shield tables of the upgrades come from the PDF.

## build_templates.py
Builds `data/templates.json` (26 templates) from chapter 23.

```bash
python tools/build_templates.py
```

Reads the sheet part of each template page from PDF word positions (attributes, listed skills per column, Move, Force data, special abilities) and the narrative paragraphs from `23-templates.txt`, matched by template type. Checks six attributes with codes, listed skills and Force lines. `data/character-sheet.schema.json` (chapter 24) is written by hand.

## verify_knowledge_base.py
Independent spot-check of the knowledge base against the PDF.

```bash
python tools/verify_knowledge_base.py              # full automatic check
python tools/verify_knowledge_base.py --sample 12  # also print 12 random records to read by hand
```

Reads the PDF page cited by each data record and each cited rule line (it does not use the extracted `.txt`). Records: every dice code, number and range must appear on the cited page; for item stat blocks each "Label: value" must appear inside the item's own block. Rules: numbers on lines with `(p.N)` citations must appear on the cited pages. Misses are listed for a human to read: some are checker limits (headings split over lines, blocks crossing page breaks) or derived values. Run it after regenerating any data file.

## Known source defects
Problems that come from the book itself (for example the missing "C" in "aught the sentry's eye") are listed in `data/errata.md`; the audit will not flag them.

## build_app_data.py
Gera `app/data/bundle.json`, o unico arquivo de dados que o app web carrega (só stdlib do Python; não altera `data/`).

```bash
python tools/build_app_data.py
```

- Copia as entidades (`skills`, `force_powers`, `species`, `weapons`, `armor`, `gear`, `vehicles`, `starships`, `templates`, `ship_upgrades`, `martial_arts`), as 14 tabelas de `data/tables/` e o schema da ficha.
- `rules`: cada `data/rules/*.md` dividido em seções por heading (h2/h3) com `id` (`arquivo#âncora`), `anchor` (de `{#anchor}`; sem âncora, gerada do título), `title`, `text` (markdown), `pages` (todas as `p.N` citadas, intervalos expandidos) e `errata` (IDs `E-0xx` citados).
- `glossary` (tabela de `glossary.md`) e `errata` (tabela "Register" de `errata.md`: id, kind, where, problem, provisional, status, human_action).
- `derived`: `template_skill_map` (RD-35, com `alias` = selo E-061 e `species_special_skill` para Glider/Primitive construction), `template_species` (RD-34), `advanced_prereqs` (RD-31; `manual: true` quando composto), `force_power_required_ids`, `species_move_start` (RD-42, por stat block) e `entity_errata` (entidades que citam um E-0xx; como `data/` não cita nenhum nas entidades, há uma pequena lista de dicas no script, ver `ENTITY_ERRATA_HINTS`).
- Ao final imprime contagens e um relatório de pendências de mapeamento (nomes de perícia, exigências de poderes, linhas de tabela que precisaram de remontagem).

## build_app_data.py (bundle de dados)
Gera o bundle JSON consumido pelo app a partir de `data/` (só stdlib; nada em `data/` é alterado).

```bash
python tools/build_app_data.py                                   # padrão: app/data/bundle.json (usado pelo v1)
python tools/build_app_data.py --out packages/data/generated/bundle.json   # v2 (feito por `npm run data:build`)
```

O argumento `--out` é aditivo: sem ele o v1 continua recebendo o mesmo arquivo. No v2, `packages/data/scripts/build.mjs` chama o script com `--out`, grava `bundle.meta.json` (hash) e, sem Python, copia o bundle do v1.

## gen_image_briefs.py
Gera `docs/image-manifest.json` (144 espaços de imagem com id estável, proporção, tamanhos, placeholder por família e texto alternativo) e `docs/image-briefs.md` a partir de uma única fonte no próprio script.

```bash
python tools/gen_image_briefs.py
```

**Não edite o JSON à mão**: altere o script e gere de novo. O app lê o manifesto direto de `docs/` (componente `ArtSlot`, página `/dev/art`). Para colocar as imagens: `apps/web/public/art/<id>.webp` (ver `README.md`).
