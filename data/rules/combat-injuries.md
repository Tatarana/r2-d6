---
id: combat-injuries
audience: player
source: { chapter: 6, file: raw-data/06-combat-injuries.txt, printed_pages: "88-105" }
status: draft-v1
covers: [ranged and melee attacks, reaction skills and full reaction, weapon handling, grenades, cover and protection, armor, scale, surprise, combat options, quick draw, damage and wounds, healing]
data: [tables/combat-modifiers.json, tables/damage-healing.json, martial-arts.json]
not_covered_phase_2: [illness and disease result tables (p.104-105), optional poison rules (p.103-104), gamemaster advice on fudging ranges (p.89)]
---

# Combat and injuries (player view)

Page numbers `(p.N)` are printed pages. Combat uses 5-second rounds (`core-mechanics.md#scenes-rounds`).

## An attack in four steps {#attack-steps}
1. Determine the difficulty number (by range or the melee weapon's difficulty, plus modifiers).
2. The attacker rolls the attack skill (or its attribute if the skill is unimproved).
3. Roll **>=** difficulty: the attack hits (the book says "higher" once on p.89 but "equal to or greater" everywhere else, see E-023).
4. Roll damage; the target rolls Strength (plus armor) to resist. (p.89)

## Ranged attacks {#ranged}
Skill by weapon: blaster, bowcaster, firearms (slugthrowers), grenade (grenades, thermal detonators), thrown weapons, missile weapons (launchers), vehicle blasters, blaster artillery. Check the weapon's description for its skill and specialization. (p.89)
- Weapon stats: damage code and three ranges in metres, e.g. blaster pistol `4D, 3-10/30/120`. Closer than the first number is point-blank. (p.89)
- Difficulty by range: **point-blank Very Easy, short Easy, medium Moderate, long Difficult**; beyond long range the weapon cannot hit. Then the gamemaster picks the exact number. (p.89)
- Quick range estimates and the other modifiers: `tables/combat-modifiers.json`.

## Melee and brawling {#melee}
Melee combat and lightsaber use their skills (or Dexterity). Each melee weapon has its own difficulty. Brawling (bare hands, claws) is Very Easy and rolls Strength if unimproved. (p.90)

## Reactions {#reactions}
(p.90-91; also `core-mechanics.md#reactions` and `skills.md#dex-groups`)
- **Dodge**: any ranged attack (Dexterity if unskilled).
- **Melee parry**: you hold a melee weapon and are attacked by melee or brawling. **+5** to the parry if the attacker is unarmed with no sharp natural weapons.
- **Brawling parry**: you are unarmed. If the attacker uses a weapon or sharp natural tools, the attacker gets **+10** to hit.
- **Lightsaber**: parry melee, brawling or lightsaber attacks while wielding one.
- **Vehicle dodge / starship dodge**: roll the vehicle's operation or the starship's piloting skill (Mechanical if unskilled).
- A reaction roll becomes the attacker's **new difficulty** for all attacks of that type for the rest of the round, even if lower than the original (a poor reaction can make you easier to hit). Apply multiple-action penalties. Example: dodge 27 means every ranged attacker needs 27; a brawling attack stays at its own difficulty. (p.90-91)
- **Full reaction**: dodge, parry, lightsaber, vehicle or starship dodge as your **only action all round**; the roll is **added** to the difficulty of **every** attack against you that round (example: dodge 27 on difficulties 13 and 8 gives 40 and 35). You cannot parry a type of attack you did not react to. (p.91)

## Weapon handling {#weapons}
- **Draw / ready / reload**: one action each. Drawing and using in the same round costs the multiple-action penalty. (p.91-92, p.98)
- **Stun setting**: switching is an action (-1D to other actions). Most blasters have normal and stun. (p.92)
- **Fire control**: large weapons add their fire control dice to the attack roll (4D Dexterity + 2D = 6D). (p.92)
- **Ammo**: when shots equal the ammo rating, reload (one action unless stated). **Fire rate**: no rate = unlimited; whole number = maximum shots per round; fraction = fires only some rounds (1/2 = every other round). (p.92)
- **Blast radius**: everything inside takes damage; some weapons list damage by distance band (fragmentation grenade `5D/4D/3D/2D`, radius `0-2/4/6/10` m). (p.92)
- **Multiple weapons**: one-handed weapons can be used in both hands in the same round with the multiple-action penalty. (p.97)

## Grenades and thermal detonators {#grenades}
(p.92-93) Pick a target point; difficulty by range (+5 to +10 if the thrower cannot see the point). Hit: it lands on target. Miss: roll **1D for direction** (diagram on p.92) and distance **1D m** at point-blank/short, **2D** at medium, **3D** at long range.
- Contact grenades explode on impact; timed ones when the timer ends (under 5 seconds: at the end of the round of the throw).
- **Dodging a grenade** only means hitting the deck: the book's example has a throw of 17 and says the dodge needs **18 or higher** (higher than the throw), then no damage (see E-028).
- **Tossing one away**: roll grenade or Dexterity; it goes as far as the roll allows (the roll's range band) or at a chosen spot at normal difficulty.

## Cover and protection {#cover}
(p.93-94) Add cover modifiers to the difficulty to hit: smoke/light (+1D to +4D), partial cover **1/4 +1D, 1/2 +2D, 3/4 +4D**; full cover cannot be hit directly. If your roll beats the base difficulty but not base + cover, the shot hits the cover: roll damage against its **body strength**, find the damage state, and subtract dice from the damage that reaches the target (lightly damaged -4D, heavily -2D, severely -1D, destroyed full damage, not seriously damaged none). Tables: `combat-modifiers.json` (`cover`, `protection`).

## Armor {#armor}
Armor adds only to the **Strength roll to resist damage**, not to other Strength rolls. It can protect differently against physical and energy attacks and can penalize Dexterity and its skills (stormtrooper armor: +2D physical, +1D energy, -1D Dexterity). Armor is damaged when its wearer is: Wounded -1 pip, Incapacitated -1D, Mortally Wounded useless but repairable, Killed destroyed. (p.94)

## Damaged weapons and objects {#damaged-weapons}
Hand weapons have body strength **2D**. Roll damage against it (damage-vs-body-strength table). Lightly damaged: -1D damage; heavily: -2D and +10 to all difficulties; severely: unusable but repairable; destroyed: not repairable. Works for other objects too. (p.95)

## Scale {#scale}
Character < speeder (2D) < walker (4D) < starfighter (6D) < capital (12D) < Death Star (24D). Use the difference ("adjusted modifier") only between different scales. **Lower attacks higher**: attacker adds it to the attack roll; target adds it to the roll to resist damage. **Higher attacks lower**: target adds it to its dodge; attacker adds it to damage. (p.95)

## Surprise {#surprise}
Surprised characters cannot act, nor dodge or parry, against the attackers' first action. Ambushers roll sneak; targets roll search or Perception just before the ambush; equalling or beating **any** attacker's sneak means that attacker is spotted and no surprise. (p.96)

## Combat options {#options}
Data for all numeric modifiers: `tables/combat-modifiers.json`.
- **Acrobatic tricks**: do the trick and the attack the same turn; add half (rounded up) the difference between the trick's difficulty and the roll to the **damage** (not the attack roll); one trick affects one attack. (p.96)
- **Called shots** (small targets): +1D difficulty for a 10-50 cm target, +4D for 1-10 cm, +8D under 1 cm. Success: knock an item away, grab a limb, pin, or +1D damage. (p.96)
- **All attacks**: low gravity -1D, zero-G -2D, heavy gravity +3D difficulty; attacker blind +4D; target blind or attacked from behind -4D. (p.96)
- **Entangle**: on a hit, the target can only try to break free (an action): Strength or lifting >= the weapon's damage, or Dexterity or acrobatics >= its damage to slip free. (p.96)
- **Escape**: opposed Strength or lifting versus the holder; an action. (p.96)
- **Hit locations (optional)**: head +1D difficulty and +12 damage, heart +4D and +12, chest 0, arm +1D and -2, leg +1D and -1, hand +4D and -2; lasting penalties and a random-location table are in the data file. (p.96-97)
- **Knockout**: needs a called shot to the head with brawling or melee. Half damage; if at least two Wound levels remain after resistance, the target is unconscious for hours equal to the margin of the attack over the difficulty and takes half the Wound levels (round down). (p.97)
- **Prone / crouching**: crouched +1D difficulty (+2D if moving, and its Move or running roll is halved); prone -2D at point-blank/short, +2D at medium/long. (p.97)
- **Quick draw** (pistols, hold-outs, throwing knives; you do nothing else that round, not even dodge): split blaster dice into **speed draw** and **accuracy**. Highest speed-draw roll fires first and then rolls accuracy; the other may fire back only if not hurt. Several shots cost multiple-action penalties on both pools, and -1D per extra target. A stunned character loses -3D on later shots that round; a wounded or worse one cannot return fire. Against a dodger, a higher speed-draw roll means the dodge is ignored. (p.97-98)
- **Suppression fire** and **unwieldy weapons**: see the data file. (p.98)
- **Martial arts (optional)**: 20 techniques, one per full 1D of skill increase: `martial-arts.json`. (p.98-100)

## Damage and wounds {#damage}
(p.100-101) Data: `tables/damage-healing.json`.
1. Attacker rolls damage; defender rolls Strength (+ armor). Damage higher than Strength: take the difference to the chart.
2. **Damage - Strength**: 1-3 Stunned, 4-8 Wounded, 9-12 Incapacitated, 13-15 Mortally Wounded, 16+ Killed.
3. **Stunned**: -1D for the rest of the round and the next; unconscious 2D minutes if stuns affecting you equal the number before the "D" in your Strength.
4. **Wounded**: prone, no actions this round, -1D until healed. **Wounded twice**: -2D. Wounded a third time: Incapacitated.
5. **Incapacitated**: prone, unconscious 10D minutes. **Mortally wounded**: unconscious; at the end of each round roll 2D, die if below the number of rounds you have been mortally wounded. **Killed**: dead.
6. Character Points or Force Points can raise the Strength roll to resist (up to 5 Character Points).
7. **Stun weapons**: anything worse than Stunned becomes unconscious for 2D minutes.

Optional damage rules (severe injuries, massive damage) and miscellaneous damage (falling, fire, electricity) are in the data file.

## Healing {#healing}
(p.102-103) Data: `tables/damage-healing.json` (`healing`).
- **Natural**: rest 3 days (wounded or wounded twice), 2 weeks (incapacitated), 35 days (mortally wounded), then roll full Strength on the chart: it can heal, hold or worsen you. -1D if you work or adventure; +1D for doing nothing for twice the time.
- **Medpac**: first aid (or Technical) roll; Very Easy stunned/unconscious, Easy wounded/wounded twice, Moderate incapacitated, Difficult mortally wounded. Success heals one level. Missing by more than 10 locks out medpacs for 24 hours. Each extra use that day raises difficulty one level. Self-use costs an extra -1D.
- **Bacta tank**: needs (A) medicine (Very Easy); wounded 1D hours, incapacitated 4D hours, mortally wounded 1D days. Without (A) medicine a Heroic roll is needed and failure worsens the patient two levels.
- **Surgery**: (A) medicine with a kit and facility; Easy base; fully heals; failure worsens two levels.
