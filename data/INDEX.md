---
id: index
status: draft-v1
audience: agent
---

# r2-d6 reference index

Distilled reference for the Star Wars RPG REUP (D6 / OpenD6). **Phase 1 serves players; Phase 2 adds the gamemaster.**

## How to use (agents)
1. Find the topic below and open only that file.
2. Structured values (tables, stats) live in `tables/` and the entity `*.json` files next to this index; query them with `jq` or `grep`, do not load whole files.
3. Cite `(p.N)` printed pages. To verify or get detail, open the matching raw chapter in `raw-data/` (`NN-chapter-name.txt`; printed page = PDF page - 2; the `.txt` files have a `[Página impressa N | PDF M]` marker per page; tables are written as `a | b | c` rows).
4. Inconsistencies in the book or our pipeline, with provisional readings and open items for human review: `errata.md`. Terms: `glossary.md`.

## Phase 1: players
| Topic | File | Status | Raw source |
|---|---|---|---|
| Rolls, wild die, difficulty, rounds, initiative, multiple actions, Character/Force/Dark Side points | `rules/core-mechanics.md` | **done (v1)** | `raw-data/05-the-rules.txt` |
| Character creation and advancement | `rules/characters.md` | **done (v1)** | `raw-data/02-characters.txt` |
| Attributes and skills | `rules/skills.md` + `skills.json` | **done (v1)**: skills.json complete; skills.md covers general rules, combat groups, acrobatics. Per-skill difficulty tables are only in the raw chapter | `raw-data/03-attributes-skills.txt` |
| Combat, wounds, healing | `rules/combat-injuries.md` + `martial-arts.json` | **done (v1)**; illness and poison result tables deferred to Phase 2 | `raw-data/06-combat-injuries.txt` |
| Movement and chases (characters and vehicles) | `rules/movement-chases.md` | **done (v1)**; chase staging advice deferred to Phase 2 | `raw-data/07-movement-chases.txt` |
| Space travel and combat | `rules/space.md` | **done (v1)**; GM-facing narrative sections deferred to Phase 2 | `raw-data/08-space-travel-combat.txt` |
| The Force (powers, Jedi) | `rules/force.md` + `force-powers.json` (77 powers) + `tables/force.json` | **done (v1)**; lore, gamemastering Jedi and dark side characters deferred to Phase 2 | `raw-data/10-the-force.txt` |
| Species | `rules/species.md` + `species.json` (47 species, 48 stat blocks) | **done (v1)**; species generation system deferred to Phase 2 | `raw-data/16-aliens.txt` |
| Equipment, weapons, armor | `rules/equipment.md` + `weapons.json` (63) + `armor.json` (15) + `gear.json` (54) + `tables/equipment-tables.json` | **done (v1)**; gamemaster notes on creating devices deferred to Phase 2 | `raw-data/18-equipment-weapons.txt` |
| Vehicles, starships, ship upgrades | `rules/vehicles-starships.md` + `vehicles.json` (24) + `starships.json` (34) + `ship-upgrades.json` | **done (v1)**; craft background text deferred to Phase 2 | `raw-data/20-vehicles.txt`, `raw-data/21-starships.txt` |
| Templates, character sheet | `rules/templates.md` + `templates.json` (26) + `character-sheet.schema.json` | **done (v1)** | `raw-data/23-templates.txt`, `raw-data/24-character-sheet.txt` |

## Phase 2: gamemaster
Chapters 4, 9, 11-15, 17, 19 and 22 (`raw-data/04-*`, `09-*`, `11-*` to `15-*`, `17-*`, `19-*`, `22-*`). Not started. `core-mechanics.md` lists the DM-only parts of Chapter 5 it left out (`dm_only_not_covered` in its front matter).

## Data tables available now
| File | Contents |
|---|---|
| `tables/difficulty-numbers.json` | difficulty levels, random-difficulty dice, modifier guidelines |
| `tables/die-code-simplification.json` | 5-dice and wild-die bonuses, 1D to 50D (validated against the book's formula) |
| `tables/character-force-point-limits.json` | Character Point caps, Force Point rules and recovery, multiple-action penalty |
| `tables/character-creation-advancement.json` | starting values, specializations, advanced skills, new-template rules, starting credits, advancement costs and training times |
| `tables/advantages-disadvantages.json` | optional advantages/disadvantages: 36 entries with modifier and effect |
| `tables/combat-modifiers.json` | range difficulties, cover, protection, armor, scale, called shots, hit locations, attack modifiers |
| `tables/damage-healing.json` | damage chart, wound levels, stun, misc damage, natural healing, medpac, bacta, surgery |
| `tables/movement.json` | character speeds, terrain, encumbrance, long distance, movement failures, collision damage |
| `tables/vehicle-movement-damage.json` | vehicle speeds, terrain, maneuvers, failures, collisions, ramming, vehicle damage chart and system results, passenger damage |
| `tables/space-travel.json` | starship categories, hyperdrive and astrogation (modifiers verified), mishaps, sensors, licenses and starport costs |
| `tables/starship-combat.json` | starship movement, failures, collisions, combat, ion cannons, missiles, tractor beams, shields, called shots, power control, damage chart and system tables |
| `tables/force.json` | Force skills, learning and teaching, modifiers, dark side, atonement, optional rules |
| `force-powers.json` | 77 Force powers with skills, difficulty text, prerequisites, warning, summary, page |
| `species.json` | 47 species: attribute dice and ranges, special skills and abilities, story factors, Move, size |
| `tables/equipment-tables.json` | availability and restriction codes, licenses, general goods, services and expenses, cybernetics |
| `weapons.json`, `armor.json`, `gear.json` | 132 items with the book's fields, numeric cost, page; armor protection parsed |
| `vehicles.json`, `starships.json` | 24 vehicles and 34 starships: stats, sensors, weapons, complements |
| `ship-upgrades.json` | replacement drives, hyperdrives, shields, weapons, sensors, miscellaneous ship systems |
| `templates.json` | 26 starting templates: attributes, listed skills, Move, Force data, special abilities, narrative fields |
| `character-sheet.schema.json` | JSON Schema of the character sheet (dice as objects, ids as references) |
| `tables/speed-conversion.json` | Move to all-out km/h (43 rows, validated) |
| `martial-arts.json` | 20 optional martial arts techniques |
| `skills.json` | 110 skills (17 advanced): attribute, time, specializations, summary, page, prerequisites |

## Conventions
- Rules files: front matter (`id`, `audience`, `source`, `status`), `{#anchor}` ids, `(p.N)` citations, English official terms.
- Data files: one JSON per entity type, stable slug `id`, `source` with chapter and page; dice codes as both text (`"4D+1"`) and `{ "dice": 4, "pips": 1 }`.
- Never alter a rule silently; record defects and readings in `errata.md`.
