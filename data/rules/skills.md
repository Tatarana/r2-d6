---
id: skills
audience: player
source: { chapter: 3, file: raw-data/03-attributes-skills.txt, printed_pages: "32-66" }
status: draft-v1
covers: [attributes, how skills work, skill descriptions format, ranged/melee/reaction skill groups, full reaction, acrobatics, special notes for combat skills]
data: [skills.json]
not_covered: [per-skill difficulty guidelines and example tables (read the raw chapter by the page in skills.json), vehicle and starship operation details (see space.md and movement-chases.md, planned)]
---

# Attributes and skills (player view)

Page numbers `(p.N)` are the book's printed pages. The per-skill list is in `skills.json` (110 skills: attribute, time taken, specializations, summary, page, advanced prerequisites). For difficulty tables and examples of a given skill, open `raw-data/03-attributes-skills.txt` at the page given in `skills.json`.

## The one rule {#rule-of-thumb}
The gamemaster picks a difficulty number; if the roll is **equal or higher**, the character succeeds. (p.33) See `core-mechanics.md#difficulty`.

## Attributes {#attributes}
Six attributes: **Dexterity, Knowledge, Mechanical, Perception, Strength, Technical**. Each covers many skills; an unimproved skill uses its attribute's die code. (p.32)

| Attribute | Skills in `skills.json` |
|---|---|
| Dexterity | 20 (combat, reactions, running, pick pocket) |
| Knowledge | 14 |
| Mechanical | 23 (vehicle and starship operation, sensors, communications) |
| Perception | 10 |
| Strength | 5 (brawling, climbing/jumping, lifting, stamina, swimming) |
| Technical | 21 plus 17 advanced (A) skills (repair, programming, engineering, medicine) |

## How a skill entry reads {#entry-format}
- **Time Taken**: how long using the skill generally takes (one round, minutes, hours, days). A guideline; the gamemaster can change it. Many combat skills can be used in one round (so they can be repeated with the multiple-action penalty). (p.33)
- **Specializations**: examples of narrower focuses (see `characters.md#pick-skills` for cost and use). Some skills list none.
- **Advanced skills** are marked `(A)` (`advanced: true` in the data), start at 1D, need prerequisite skills and cost double to improve. `prerequisites_text` holds the requirement; the engineering list is on p.62-63.

## Skill groups in Dexterity {#dex-groups}
### Ranged combat skills (p.33)
Archaic guns, artillery, blaster, blaster artillery, bowcaster, bows, firearms, flamethrower, grenade, missile weapons, thrown weapons, vehicle blasters. Starship gunnery and capital ship gunnery are also ranged combat skills but belong to Mechanical.
- Difficulty depends on **range**: farther = harder (each weapon lists its ranges; see the equipment chapter).
- Roll >= difficulty hits, but the target may use a reaction skill or have cover (see `combat-injuries.md`, planned).
- Use the right skill for the weapon: for example, `blaster` covers hand-held character-scale blasters, not fixed or multi-crew weapons (blaster artillery), vehicle-mounted weapons (vehicle blasters) or starship weapons (starship/capital ship gunnery). (p.35)

### Melee combat skills (p.33)
Melee combat and lightsaber; brawling (Strength) is also a melee combat skill. Each melee weapon has its own difficulty number; roll >= it to hit; the target may parry or have cover.
- **Lightsaber danger** (p.36): if an attacker misses the difficulty by **10 or more**, they hurt themselves and roll the weapon's damage against their own Strength. (The book's example: difficulty 20, roll of 10 or lower, 5D self-damage.)

### Reaction skills (p.33)
Acrobatics, brawling parry, dodge, melee parry; lightsaber can also parry (brawling, lightsaber and melee attacks; parrying blaster bolts needs the lightsaber combat Force power). Mechanical vehicle and starship skills can be used for **vehicle dodges**.
- Which reaction against what: **dodge** = any ranged attack; **melee parry** = melee, brawling or lightsaber attacks when you hold a melee weapon (not blasters); **brawling parry** = brawling or melee attacks while unarmed. (p.36)
- When attacked, the reaction roll **becomes** the attacker's difficulty number. (p.33; see `core-mechanics.md#reactions`)
- **Full reaction** (p.33): roll the reaction skill and **add** the roll to the attackers' difficulty numbers; the character **cannot do anything else** that round.
- The reaction-skill Character Point cap is 5 (see `core-mechanics.md#character-points`).

## Acrobatics {#acrobatics}
(p.33-35) One round; specializations: type of acrobatics (diving, trapeze, tumbling).
- Tumble, leap and roll to avoid falling damage, entertain, or surprise an opponent.
- **Boosting other skills**: the gamemaster sets the stunt's difficulty; **half the difference (rounded up)** between the difficulty and the acrobatics roll is added to the complementary climbing/jumping or running roll. Both must be done on the same turn, so the multiple-action penalty applies. The same bonus can be added to an intimidation attempt, on the same turn or the next round.
- Instead of raising a running or swimming difficulty for an obstacle course, the gamemaster may ask for an acrobatics roll in addition.
- During a fall, acrobatics may reduce damage if the character still has declared actions to spend this round.
- Combined maneuvers: use the hardest maneuver's difficulty and **+5** for each additional maneuver.
- Difficulty examples (p.35): Very Easy somersault or pirouette; Easy handspring, cartwheel, handstand; Moderate round-off, back-flip, vaulting an obstacle; Very Difficult bouncing off a surface to a specific destination. Modifiers to the difficulty: -3 unlimited landing area; +3 limited, rough or unsteady landing area, high to low surface, slippery or strong wind; +6 almost no landing area, low to high surface, or narrow surface. Penalties to the roll: -3 or more per twist, backwards or underwater; -9 or more in the air (trapeze, bars).

## Using the data {#using-data}
```
jq '.skills[] | select(.attribute=="dexterity") | {name, time_taken, specializations, page}' data/skills.json
jq '.skills[] | select(.advanced) | {name, prerequisites_text}' data/skills.json
```
