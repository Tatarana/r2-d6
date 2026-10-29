---
id: species
audience: player
source: { chapter: 16, file: raw-data/16-aliens.txt, printed_pages: "277-316" }
status: draft-v1
covers: [species information format, attribute dice and ranges, special skills and abilities, story factors, Move and size, era restrictions, list of species]
data: [species.json]
not_covered_phase_2: [species generation system (creating new species, p.317-)]
---

# Species (player view)

Page numbers `(p.N)` are printed pages. Full stat blocks (attribute ranges, special skills, special abilities, story factors, Move, size) for all 47 entries are in `species.json`; each entry's `page` points to the book page.

## How to read an entry {#format}
(p.278)
- **Attribute Dice**: dice for an average member of the species. **Player characters and some gamemaster characters get 6D more** (`characters.md#new-template`).
- **Attribute die ranges**: each attribute has `minimum/maximum`. Members cannot go below the minimum or above the maximum at creation (with a few exceptions); Character Points can later raise attributes above the maximum (the ceiling check in `characters.md#advancement`).
- **Special skills**: skills common to the species, each tied to an attribute; anyone can learn them with instruction.
- **Special abilities**: physiological traits (claws, tails, natural armor, vision...) that others cannot learn. Some matter only at character creation (skill bonuses and limits); write down those that matter in play.
- **Story factors**: culture, life cycle and prejudices that affect most members; roleplaying and gamemaster hooks.
- **Move**: `start/maximum`; a character starts with the first number and can raise it to the second (`characters.md#advancement`). Species with several movement modes list each.
- **Size**: usual adult height.
- **Languages**: everyone can speak Basic; a nonhuman also has their species language as a specialization at **5D** (for example language: Cerean 5D), which does not raise the general languages skill. (p.278)

## Era restrictions {#eras}
(p.280) Old Republic / Rise of the Empire / Dark Times: all species available except ones not yet discovered (no Ewoks). Rebellion: most aliens are enslaved or second-class under the Empire, free Wookiees are rare, Ewoks appear only late. New Republic: aliens regain equal standing. New Jedi Order and later: all species available.

## Humans, near-humans and clones {#humans}
- **Humans**: 12D, every attribute **2D/4D**, Move **10/12**, 1.5-2.0 m, no special abilities. (p.279)
- **Near-humans** usually share human stats, but some races have different ranges or minor abilities. (p.279)
- **Republic Clone** (for player characters and major gamemaster characters): fixed values (Dexterity 3D, Knowledge 2D+1, Mechanical 2D+2, Perception 2D+1, Strength 3D, Technical 2D+1) with **+2D** to add, **no more than 2 pips per attribute**; Military Training (extra 2D for military skills at creation), Obedient and Accelerated Growth story factors; Move 10/12. (p.279)

## Species list {#list}
Attribute dice are the species value; add 6D for a player character. The `species.json` entry has everything else.

| Species | Attribute dice | Move | Page |
|---|---|---|---|
| Humans | 12D | 10/12 | 279 |
| Republic Clone | fixed +2D | 10/12 | 279 |
| Anzat | 14D | 10/12 | 280 |
| Aqualish | 12D | 9/12 (walking), 5/7 (swimming, Aquala only) | 281 |
| Barabel | 12D | 11/14 | 281 |
| Bith | 12D | 5/8 | 282 |
| Bothan | 12D | 10/12 | 283 |
| Caamasi | 12D | 10/12 | 283 |
| Cathar | 12D | 12/14 | 284 |
| Cereans | 12D | 11/12 | 284 |
| Chadra-Fan | 12D | 5/7 | 285 |
| Chiss | 12D | 10/12 | 286 |
| Defel | 12D | 10/13 | 286 |
| Devaronian | 12D | 8/10 | 287 |
| Dug | 12D | 6/8 | 288 |
| Duros | 12D | 10/12 | 288 |
| Ewok | 12D | 7/9 | 289 |
| Falleen | 13D | 9/12 | 289 |
| Gamorrean | 11D | 7/10 | 290 |
| Gand | 12D | 10/12 | 291 |
| Geonosian (Geonosian Worker) | 11D | 10/12 | 292 |
| Geonosian (Geonosian Aristocrat) | 12D | 10/12 (walk), 16 (flight) | 292 |
| Givin | 12D | 8/10 | 293 |
| Gotal | 12D | 10/15 | 293 |
| Gran | 12D | 10/12 | 294 |
| Gungan | 12D | 10/12 | 294 |
| Herglic | 12D | 6/8 | 295 |
| Hutt | 14D | 0/4 | 296 |
| Iktotchi | 12D | 10/12 | 296 |
| Ithorians | 12D | 10/12 | 297 |
| Jawa | 12D | 8/10 | 298 |
| Kaminoan | 12D | 10/12 | 298 |
| Kel Dor | 12D | 10/12 | 299 |
| Mon Calamari | 12D | 9/12 (walking); 8/10 (swimming) | 299 |
| Nautolans | 11D | 10/12 (swimming and walking) | 300 |
| Quarren | 12D | 9/12 | 300 |
| Rodians | 12D | 10/12 | 301 |
| Sullustans | 12D | 10/12 | 301 |
| Talz | 11D | 8/10 | 302 |
| Togruta | 13D | 10/12 | 302 |
| Trandoshans | 12D | 8-10 | 303 |
| Twi’Leks | 12D | 10/12 | 303 |
| Umbaran | 12D | 10/12 | 304 |
| Verpine | 12D | 10/13 | 305 |
| Weequay | 12D | 10/12 | 305 |
| Wookiees | 12D | 11/15 | 306 |
| Yuuzhan Vong | 12D | 10/12 | 307 |
| Zabrak | 12D | 10/12 | 307 |

## Using the data {#using-data}
```
jq '.species[] | select(.name=="Wookiee") | .stat_blocks[0]' data/species.json
jq '.species[] | {name, dice: .stat_blocks[0].attribute_dice, move: .stat_blocks[0].move}' data/species.json
```
Species with two stat blocks (Geonosian: worker and aristocrat) list both in `stat_blocks`.
