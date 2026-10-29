---
id: templates
audience: player
source: { chapters: [23, 24], files: [raw-data/23-templates.txt, raw-data/24-character-sheet.txt], printed_pages: "475-502" }
status: draft-v1
covers: [the 26 starting templates, how to use them, the character sheet]
data: [templates.json, character-sheet.schema.json]
---

# Character templates and sheet (player view)

Page numbers `(p.N)` are printed pages. Rules for finishing a template (7D of skill dice, specializations, Force sensitivity, credits, Force powers) are in `characters.md#finishing`; this file lists what the templates contain. `templates.json` has, for each template: the attribute codes, the skills printed under each attribute (`listed_skills`), Move, the Force Sensitive? answer, Force Points when printed, special abilities, and the narrative fields (`equipment`, `background`, `personality`, `objectives`, `a_quote`, `connection_with_characters`, `note`).

## How a template is used {#using}
1. Start from the attribute codes (the template's total is in `attribute_total`).
2. Put **7D** of beginning skill dice into the skills listed on the template (1D or 2D each; more skills only with the gamemaster's permission); unimproved skills use the attribute (`characters.md#pick-skills`).
3. Decide Force sensitivity where the template leaves it blank: yes = 2 Force Points, no = 1. Templates that begin with Force skills must be Force-sensitive and choose Force powers (`force.md`).
4. Equipment and credits come from the template; every character starts with 5 Character Points.
5. Droids use the Droids chapter's rules (the Protocol Droid template is the exception: 17D to allocate, not more than 2D per skill).

## Templates (26) {#list}
| Template | Page | DEX | KNO | MEC | PER | STR | TEC | Total | Move | Force sensitive | Force Points |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Alien Student of the Force | 475 | 2D+1 | 3D+1 | 2D | 2D+1 | 3D | 2D | 15D | 10 | yes | 2 |
| Armchair Historian | 476 | 3D | 4D | 2D+2 | 3D+2 | 2D+2 | 2D | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Arrogant Noble | 477 | 3D+1 | 3D+1 | 2D+2 | 4D | 2D+2 | 2D | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Bounty Hunter | 478 | 4D | 2D+2 | 2D+2 | 3D | 3D+2 | 2D | 18D | 10 | no | 1 or 2 (by choice) |
| Brash Pilot | 479 | 3D | 2D | 4D | 3D | 3D | 3D | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Ewok | 480 | 3D+2 | 2D | 2D+2 | 4D | 3D | 2D+2 | 18D | 7 | player chooses | 1 or 2 (by choice) |
| Failed Jedi | 481 | 2D+2 | 3D+1 | 2D | 3D+1 | 2D+2 | 2D | 16D | 10 | yes | 2 |
| Gambler | 482 | 3D+2 | 3D | 2D+1 | 4D | 2D+2 | 2D+1 | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Kid | 483 | 3D+2 | 2D+2 | 3D | 3D+2 | 2D+1 | 2D+2 | 18D | 8 | player chooses | 1 or 2 (by choice) |
| Laconic Scout | 484 | 2D+2 | 4D | 3D | 2D | 3D | 3D+1 | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Loyal Retainer | 485 | 3D | 2D+2 | 3D | 3D | 3D+1 | 3D | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Merc | 486 | 3D+2 | 2D+2 | 2D+2 | 2D+1 | 3D+2 | 3D | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Minor Jedi | 487 | 3D | 3D+2 | 2D | 3D+1 | 2D+2 | 2D+1 | 17D | 10 | yes | 2 |
| Mon Calamari | 488 | 3D+1 | 3D+1 | 2D+1 | 2D+1 | 3D | 3D+2 | 18D | 9 | player chooses | 1 or 2 (by choice) |
| Old Senatorial | 489 | 3D | 4D | 3D | 4D | 2D | 2D | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Outlaw | 490 | 4D | 3D | 2D+2 | 2D | 3D+1 | 3D | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Pirate | 491 | 3D+2 | 2D | 3D+2 | 3D | 2D+2 | 3D | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Protocol Droid | 492 | 1D | 3D | 1D | 1D | 1D | 1D | 8D | 7 | player chooses | 1 or 2 (by choice) |
| Quixotic Jedi | 493 | 3D+2 | 2D+1 | 2D+2 | 3D | 3D | 2D+1 | 17D | 10 | yes | 2 |
| Retired Captain | 494 | 2D+2 | 3D | 3D+2 | 3D+1 | 2D+1 | 3D | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Smuggler | 495 | 3D+1 | 2D+1 | 3D+2 | 3D | 3D | 2D+2 | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Tongue-Tied Engineer | 496 | 2D+1 | 4D | 2D+2 | 2D+1 | 2D+2 | 4D | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Tough Native | 497 | 3D+2 | 2D | 2D+1 | 3D+2 | 4D | 2D+1 | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Wookiee | 498 | 2D+2 | 2D | 3D | 2D | 5D | 3D+1 | 18D | 10 | player chooses | 1 or 2 (by choice) |
| Young Jedi | 499 | 3D | 2D | 2D | 4D | 2D | 2D | 15D | 10 | yes | 2 |
| Young Senatorial | 500 | 3D | 4D | 2D+2 | 3D+1 | 3D | 2D | 18D | 10 | player chooses | 1 or 2 (by choice) |

Special abilities printed on templates:
- **Alien Student of the Force**: Control 1D, sense 1D, alter 1D. You may select three Force powers.
- **Ewok**: Skill Bonus: +2D for every 1D placed in hide, search, sneak. Skill Limits: May not place skill dice in vehicle, starship or repair skills. Smell: +1D to search when
- **Failed Jedi**: Control 1D, sense 1D. You may select two Force powers.
- **Minor Jedi**: Control 1D. You may select one Force power.
- **Mon Calamari**: Moist Environments: In moist environments, +1D to all Dex, Per and Str attribute and skill checks. Dry Environments: In dry envi­ ronments, Mon Calamari seem depressed and withdrawn. They
- **Protocol Droid**: Skills: You start with 17D to allo­ cate to skills, but may not place more than 2D in any one skill. Life Preservation Programming: Your programming prevents you from injuring a sentient being,
- **Quixotic Jedi**: Sense 1D. You may select one Force power.
- **Wookiee**: Berserker Rage: If a Wookiee becomes enraged, +2D to Strength for brawling damage. −2D to all non-Strength attribute and skill checks. Must make a Moderate Perception total to
- **Young Jedi**: Control 1D, sense 1D, alter 1D. You may select three Force powers

## The character sheet {#sheet}
(p.501-502) Page 1: name, type, gender/species, age, height, weight, description; the six attributes with their skills; **Force attributes** (control, sense, alter); advantages and disadvantages; special abilities; Move; Force Sensitive?; Force Points; Dark Side Points; Character Points; credits; **wound status** boxes (Stunned 1, Wounded 2, Incapacitated 1, Mortally Wounded 1). Page 2: armor (type, AV, notes), weapons (type, damage, S/M/L range, an 18-box ammo track per weapon), Force powers and other information, other equipment, personality, objectives, languages, contacts and enemies. `character-sheet.schema.json` is a JSON Schema for a character record built from this layout; dice are `{ "dice", "pips" }` objects and references use the ids of the other data files.

## Using the data {#using-data}
```
jq '.templates[] | select(.force_skills) | {type, force_skills, force_powers_to_select}' data/templates.json
jq '.templates[] | select(.type=="Smuggler") | {attributes, listed_skills, equipment}' data/templates.json
```
