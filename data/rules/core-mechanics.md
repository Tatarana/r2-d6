---
id: core-mechanics
audience: player
source: { chapter: 5, file: raw-data/05-the-rules.txt, printed_pages: "72-87" }
status: draft-v1
covers: [die codes, wild die, difficulty, opposed rolls, rounds, initiative, multiple actions, reaction skills, free actions, time, combined actions, Character Points, Force Points, Dark Side Points]
data: [tables/difficulty-numbers.json, tables/die-code-simplification.json, tables/character-force-point-limits.json]
dm_only_not_covered: [complications design (p.73-74), secret checks (p.82-83), speeding-play and roleplay tips (p.80), random difficulties as a GM tool (p.76), groups (p.84), temptation/favors (p.87)]
---

# Core mechanics (player view)

Page numbers `(p.N)` are the book's printed pages. English terms are the official ones.

## Die codes {#die-codes}
- A die code `ND+P` means roll N six-sided dice, add them, then add P (the "pips"). `3D+1` = three dice + 1. (p.8-9)
- A skill starts at its attribute's code; trained skills add dice on top. (p.9)
- A bonus written as a die code (`+1D`) adds dice to the pool. A bonus written as a pip (`+2`) is added to the total. (p.73)

## Making a roll {#rolling}
- Roll skill dice (or the attribute if the skill is untrained) when an action is important and failure is possible. No roll for trivial actions. (p.73)
- Success: total **>=** difficulty number. (p.75)
- Opposed roll: both roll, higher wins; **a tie goes to the character who initiated the action**. (p.76)
- Modifiers are added to the character with the advantage for unusual situations, not for simple skill gaps. Guidelines: +1-5 slight, +6-10 good, +11-15 decisive, +16+ overpowering. (p.77) Data: `tables/difficulty-numbers.json`.

## Difficulty numbers {#difficulty}
Very Easy 1-5, Easy 6-10, Moderate 11-15, Difficult 16-20, Very Difficult 21-30, Heroic 31+ (Heroic +10 = 40-49, etc.). (p.75-76) The gamemaster chooses the exact number inside the level's range. Players need not be told the number. (p.77)

## The Wild Die {#wild-die}
Applies to **every** die roll: skill, attribute, damage, initiative. (p.73)
1. On each roll, one die is designated the wild die (a different color; it is one of the dice, not extra).
2. Wild die shows 2-5: add normally.
3. Wild die shows 6: add it and roll it again; keep going while it shows 6.
4. Wild die shows 1 **on the first roll only**: tell the gamemaster, who picks one:
   - add the dice normally;
   - add normally to see whether the roll succeeded, but a *complication* occurs;
   - subtract the 1 **and** the highest other die.
5. When two kinds of dice are rolled at once (for example skill + starship maneuverability), only **one** die is the wild die. (p.73)

Complications are something related to the roll going wrong (even on a success); the gamemaster decides what. (p.73)

## Untrained use {#untrained}
No dice in the skill: roll the governing attribute. Optional rule: the gamemaster may add about +5 to the difficulty (as low as +1 for simple tasks); some tasks are impossible untrained. No untrained modifier when the text gives the attribute directly (resisting wounds), most dodge/brawling in combat, search for clues, or willpower against interaction and Force attacks. (p.75)

## Large dice pools {#die-code-simplification}
Optional. Fast: roll 5 dice (incl. wild die), add the pips and a bonus by die code. Faster: roll only the wild die, add pips and a bonus. Character Point dice are rolled separately. With a Force Point, double the original die code before the lookup. Beyond 50D: 5-dice bonus = ceil((D-5) x 3.5); wild-die bonus = ceil((D-1) x 3.5). Table: `tables/die-code-simplification.json`. (p.75)

## Scenes and rounds {#scenes-rounds}
- **Scene**: ordinary time; the gamemaster narrates, players act, rolls only when needed. Can span minutes to weeks. (p.77)
- **Round**: 5 seconds; used when every second matters (combat, chases, deadlines). Each round = Initiative, then Roll Actions. (p.77)

### Initiative {#initiative}
1. The highest-Perception character on each side rolls Perception; the winner chooses whether their side acts first or last that round. Reroll ties. (p.78)
2. Initiative is not an action. Character Points and Force Points **cannot** be used on it; wound penalties still apply. (p.78)
3. Tie-break order: ability/talent that goes first; Perception; search; Dexterity; dodge; special equipment or situation. (p.78)

### Rolling actions {#round-actions}
- The acting side goes in Perception order (highest first). Each player declares how many actions they will take this round, then rolls the first one. (p.78)
- After everyone has taken a first action, sides take second actions, and so on. Actions cannot be skipped to act later. (p.78)
- A Force Point or Character Points may be declared at any time, but **not both in the same round**. (p.78)

### Multiple actions {#multiple-actions}
- Each action beyond the first gives **-1D to all skill and attribute rolls** that round (not damage, damage resistance or initiative). Four actions = -3D on every roll. (p.78)
- A special ability that raises the base number of actions delays the penalty until the allotment is used. (p.78)
- Only weapons and equipment suited to quick use can be used several times in a round. A skill or attribute reduced to 0 cannot be used. (p.78)

### Reaction skills {#reactions}
- Acrobatics, dodge, melee parry and brawling parry are used when attacked; the player may wait until attacked. (p.79)
- The reaction uses up a remaining action, **or** is taken as an extra action (raising the multiple-action penalty for the rest of the round). (p.79)
- The reaction roll **replaces** the attacker's original difficulty number for the rest of the round, even if lower or higher. (p.79) Details: Combat chapter.

### Free actions and non-roll actions {#free-actions}
- **Free actions** need no roll and no real effort: initiative roll, a sentence or two of speech, a quick look around, grabbing something simple, cautious movement in Easy/Very Easy/Moderate terrain, Strength roll to resist damage (always full Strength even when wounded), control/Perception roll to resist Force or mental powers (full dice). (p.80)
- **Non-roll actions** count as an action (so they cost -1D on other rolls) but need no roll: reloading, basic datapad lookup, very slow piloting, anything needing concentration. (p.81)
- The book lists actions that take time in a round (bash, catch, choke, communicate, disarm, dodge, entangle, escape, grab, kick, leap, lunge, move, parry, pin, punch, push, ready a weapon, run away, shoot, slash, switch setting, tackle, throw, trip, use a skill, vehicle maneuver) with a suggested skill each. (p.80-81) Full list with the suggested skills: `raw-data/05-the-rules.txt`, section "Actions That Take Time" (printed p.80-81).

## How long things take {#time}
- Each skill lists a "time taken". One-round skills can be repeated in a round if suited (blaster); some one-round skills (first aid, computer programming/repair, piloting a landspeeder) absorb the whole round. (p.81)
- **Preparing**: spend twice the time for **+1D** per doubling, max **+3D**; nothing else can be done meanwhile. Not for dodges, parries or piloting skills; rarely for survival, hide, stamina, swimming. Aiming a blaster an extra round is a typical use. (p.82)
- **Rushing**: only for tasks that take two rounds or more. Do it in half the time but roll **half** the skill dice. Gamemaster decides if allowed. (p.82)
- **Multiple-roll tasks**: the gamemaster may split a hard task into several easier rolls. (p.81-82)

## Combined actions {#combined-actions}
Several characters cooperating on one task. (p.83-84)
1. All must agree. While combining they can only roll reaction skills.
2. The leader is the character with the highest **command** (or Perception). Leader can command at most as many characters as they have command/Perception dice.
3. Leader rolls command against a gamemaster-set difficulty (task complexity, precision, group size, skill, familiarity, time). If supervising only, full command; if also working, it counts as two actions (-1D).
4. Success: bonus = **+1D per 3 characters**, +1 per one extra, +2 per two extra (8 characters = +2D+2).
5. Failure: reduce the bonus by **1D for each point missed** (minimum 0). Example in book: bonus +2D+2, difficulty 12; roll 11 -> +1D+2; roll 10 -> +2; roll 9 or less -> none.
6. The bonus goes to the highest-skilled character doing the task. In combat it can be split between attack and damage; multi-roll tasks can split it across rolls.

## Character Points {#character-points}
- No limit on how many a character holds. Spend to add **1 extra die per point** to a skill or attribute roll; the die explodes on a 6 like a wild die. (p.84)
- May be spent after the roll, before anyone else acts. **Not in the same round or scene as a Force Point or calling on the dark side.** (p.84)
- Limits per roll: 2 for a skill/attribute roll; 2 for attack damage; 5 for specialization; 5 for acrobatics/dodge/parries (incl. lightsaber parries and vehicle dodges); 5 for Strength to resist damage. Never on another character's actions. (p.85) Data: `tables/character-force-point-limits.json`.
- In scenes, only for one continuous action. (p.85)
- They also buy permanent skill improvement (see Characters chapter).

## Force Points {#force-points}
- Spending one in a round **doubles all skill, attribute and special-ability die codes** for the rest of that round. Things that are not the character (weapon damage dice, hull codes) are not doubled. (p.85)
- Melee damage: double the user's Strength dice, not the weapon bonus. (STR 3D+2, vibro-ax STR+2D -> 6D+4 + 2D.) (p.85)
- One per round. Non-Force-sensitive characters can hold at most 5; Force-sensitive characters have no cap. All player characters start with at least 1. (p.85)
- In scenes, only for one continuous action. Not usable in the same round/scene as Character Points. (p.85)
- **End of adventure**: evil use = lose it permanently **and** gain a Dark Side Point; unheroic use = lose it permanently; heroic use = get it back; heroic at a dramatically appropriate moment = get it back **plus one more**. A character with none can earn one by being heroic at such a moment. (p.86)
- Examples of evil, unheroic and heroic uses are listed on p.86.

## Dark Side Points {#dark-side}
- The gamemaster should warn the player before an action that would give a Dark Side Point. (p.86)
- When one is gained, roll 1D: if the roll is **less than** the total Dark Side Points, the character has turned to the dark side. (p.86) 6 Dark Side Points means fallen. (p.87)
- **Atonement**: possible with 1-5 points; must follow the Jedi code strictly and actively prevent evil; generally two adventures (or 40 game days) to remove one point, at the gamemaster's judgment. (p.87)
- **Calling upon the dark side** (anyone, Force-sensitive or not): you automatically gain a Dark Side Point whether or not it works. Roll control or Perception against Easy (Force-sensitive) or Moderate (not); +2 difficulty levels if no harm is intended; **+3** per additional use in the same adventure. Success grants a Force Point to be spent immediately, in addition to others that round. Failure: roll 1D and lose that many Character Points, or lose 1D from an attribute or Force skill (player chooses); reduced to 0D means consumed by the dark side and death. Not available to characters who deny the Force. (p.87)

## Quick reference
| Situation | Rule |
|---|---|
| Succeed | roll >= difficulty |
| Tie, opposed | initiator wins |
| Extra action | -1D to every roll that round |
| Force Point | double character dice for the round |
| Character Point | +1D (exploding) after the roll |
| FP and CP same round | not allowed |
| Prepare | +1D per doubling of time, max +3D |
| Rush | half time, half dice |
