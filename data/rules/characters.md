---
id: characters
audience: player
source: { chapter: 2, file: raw-data/02-characters.txt, printed_pages: "18-31" }
status: draft-v1
covers: [template selection, detailing a character, finishing a template, new templates, species/attribute allocation, specializations, advanced skills, advancement and training, optional advantages/disadvantages, contacts and enemies]
data: [tables/character-creation-advancement.json, tables/advantages-disadvantages.json]
depends_on: [rules/skills.md (planned), species.json (planned), templates.json (planned)]
---

# Characters (player view)

Page numbers `(p.N)` are the book's printed pages.

## Overview {#overview}
Start from a **template** (Chapter 23: smuggler, Rebel pilot, merc, Wookiee...) or build a new one. Copy the template's die codes, Move and equipment, name the character, and finish four steps. The gamemaster approves any change. (p.18-19)

## Finishing a template {#finishing}
Give the character a name, height, weight, sex, age and look. Every character starts with **5 Character Points**. (p.21) Then:
1. **Pick skills** 2. **Decide Force sensitivity** 3. **Spend credits** 4. **Pick Force powers**. (p.21)

### 1. Pick skills {#pick-skills}
- Beginning characters have **7D** to place in skills: add **1D or 2D** to any skill shown on the template. Unimproved skills use the attribute's die code. (p.21)
- Other skills may be added with the gamemaster's permission. **Force skills** (control, sense, alter) can be improved only if the template already lists them. (p.21)
- Worked example in the book: Dexterity 4D, +1D blaster = 5D; +2D dodge = 6D; Mechanical 2D+2, +2D space transports = 4D+2; Perception 3D, +1D search = 4D. (p.21)

**Specializations** (p.21): spend **1D** of beginning skill dice to get **three** specializations, each +1D over the base skill (or over the attribute if the skill is unimproved). A specialization is rolled only for its specific item or knowledge. Example: blaster 5D, blaster: blaster pistol 6D; alien species: Wookiees at 3D+2 (Knowledge 2D+2 + 1D).

**Advanced skills** (marked `(A)`; p.22): cannot be attempted without the skill. If the character meets the prerequisite skills, beginning dice may go into them; an advanced skill **starts at 1D**, not at the attribute. When a prerequisite skill is rolled, add the advanced skill's dice. Example: (A) medicine needs first aid 5D; first aid 5D + (A) medicine 1D rolls 6D on first aid, but only 1D on surgery. Cross off unused advanced skills.

### 2. Force sensitivity {#force-sensitivity}
Yes = starts with **2 Force Points**; No = **1**. Force-sensitive characters must behave morally and honorably or the dark side dominates them. (p.22) Becoming Force-sensitive later: 20 Character Points (see Advancement).

### 3. Spend credits {#credits}
Templates with starting credits buy gear from the Equipment chapter; the gamemaster may attach strings (for example a debt on a ship). (p.22)

### 4. Force powers {#force-powers}
A Force-sensitive character who starts with any Force skill knows at least one power; choose with the gamemaster in the Force chapter. (p.22)

## Creating a new template {#new-template}
(p.23-25) Data: `tables/character-creation-advancement.json` (`creation.new_template`).
1. Choose a **type** (short title, include species if alien) and write background and personality.
2. Choose a **species** (Aliens chapter, or droid via the Droids chapter).
3. **Attribute dice** = the species' Attribute Dice **+ 6D** (humans 12D + 6D = 18D).
4. Split them among the six attributes within each species' **minimum/maximum** die codes (humans 2D/4D). A die can be divided into three pips; +3 becomes the next full die. (p.23)
5. Write down **special abilities** that matter in play; creation-only abilities (skill bonuses and limits) only matter now. (p.23-24)
6. **Move**: species list "start/maximum" (humans 10/12); the character starts at the first. (p.24)
7. **Force-sensitive?** yes/no/leave blank. Optional Force skills cost **1D of attribute dice per 1D** and need gamemaster permission; attributes cannot go below the species minimum. (p.24)
8. Optional starting **Dark Side Points** (agree with the gamemaster). (p.24)
9. **List skills** under each attribute (only the ones to pick now; 7D total starting skill dice). (p.24)
10. **Starting credits** (optional, 2D roll): Poor 2D x 100, Average 2D x 250, Wealthy 2D x 400. (p.24)
11. **Starting equipment**: reasonable list; the gamemaster has the final say and may add disadvantages such as debts. (p.24-25)
12. Show the template to the gamemaster for approval, then do "Finishing a template". (p.25)

Changing a template's species: re-check attribute dice, limits, special abilities and Move against the new species. (p.23)

## Character advancement {#advancement}
Character Points are awarded after each adventure and spent between adventures. (p.25) Data: `tables/character-creation-advancement.json` (`advancement`).

| Improve | Cost | Limit and notes |
|---|---|---|
| Skill, +1 pip | number before the "D" (3D+2 -> 4D costs 3) | one pip per skill between adventures |
| Specialization, +1 pip | half the number before the "D", rounded up | separate from the base skill (neither raises the other) |
| Advanced skill, +1 pip | 2 x number before the "D" | train always |
| New skill/specialization | enough to reach +1 pip above the attribute (attribute 3D -> 3 points) | training unless the attribute was used for it last adventure |
| Learn advanced skill | usually 2 points for 1D, prerequisites required | training weeks apply |
| Attribute, +1 pip | 10 x number before the "D" | all skills under it (not advanced) also +1 pip; ceiling check below |
| Move, +1 meter | current Move | up to the species maximum |
| Become Force-sensitive | 20 | no training; +1 Force Point; permanent |

**Attribute ceiling check** (p.27): after training, the player rolls the new attribute code; the gamemaster rolls the species' maximum for it. Player roll **<=** gamemaster roll: it increases. Higher: it does not, and half the Character Points are returned. (Example: human Dex 4D -> 4D+1 for 40 points; player 17 vs gamemaster 4D roll 15: fails, 20 points returned.)

**Training time** (p.26):
- Skill or specialization **used in the last adventure**: no training time.
- Otherwise: **1 day per Character Point with a teacher, 2 days without**. Each extra Character Point cuts one day (minimum 1 day). The skill improves only when training finishes; one skill at a time, and not while off adventuring.
- Advanced skill: **1 week per point with a teacher, 2 weeks without**; 1 Character Point per day cut; minimum 1 week.
- Attribute and Move: **1 week per point with a teacher, 2 without**; one extra Character Point per day cut; minimum 1 week.
- **Teacher**: skill (or the exact specialization) at least equal to the value the student will reach. The gamemaster need not provide teachers; rare skills and advanced skills may cost service, favors or payment. (p.26)
- The gamemaster may allow learning during a real lull in an adventure. (p.25)

Special abilities may be improvable under conditions stated in their own description. (p.28)

## Optional rules (only if the gamemaster allows) {#options}
### Advantages and disadvantages (p.28-30)
Add the modifiers of the chosen entries: a positive total **adds** starting skill dice; a negative total **removes** them. Disadvantages give dice (+), advantages cost dice (-). Example: Debt +2D, Quick Draw -2D, Released Convict +1D = +1D. Full list with effects: `tables/advantages-disadvantages.json` (36 entries).

### Contacts (p.30-31)
Optional: up to three starting contacts (**one friend, two acquaintances**). Friends risk much for you; acquaintances give occasional favors when the risk is low. Types: family, conditional, professional, influential. Contacts should be limited in what they can do and must pass the gamemaster's scrutiny.

### Enemies and rivals (p.31)
Built the same way as contacts. Enemies actively oppose you; rivals compete for the same resource and may become allies.

## Detailing a character (roleplaying aids) {#detailing}
The book (p.19-20) suggests defining: physical description, background (known to you and the gamemaster only), personality (good and bad points), objectives (immediate, short or long-term) and connections with other characters (friends, relatives, employees, joint ship ownership, travelling companions, mentors, rivals, same homeworld, classmates, reputation, love; love only if players choose it).
