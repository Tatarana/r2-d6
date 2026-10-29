---
id: force
audience: player
source: { chapter: 10, file: raw-data/10-the-force.txt, printed_pages: "146-179" }
status: draft-v1
covers: [Jedi Code, Force training, Force skills, learning and using powers, modifiers, dark side rules, atonement]
data: [force-powers.json, tables/force.json]
not_covered_phase_2: [history and nature of the Force (p.146-149), gamemastering Jedi (p.174-175), dark side costs and dark side characters (p.176-177), Force traditions beyond the Tyia example]
---

# The Force (player view)

Page numbers `(p.N)` are printed pages. All 77 powers (skills, difficulty text, prerequisites, time, warning, first-sentence summary, page) are in `force-powers.json`; for full effects and examples open the raw chapter at the power's page. Other numbers: `tables/force.json`.

## Who can use the Force {#who}
Only **Force-sensitive** characters learn Force skills and powers (see `characters.md#force-sensitivity`). Several templates start with them (alien student of the Force, failed Jedi, minor Jedi, quixotic Jedi, young Jedi). Everyone else must find a teacher. (p.150)

## The Jedi Code (summary) {#jedi-code}
(p.149) Peace over emotion, knowledge over ignorance, serenity over passion, the Force over death. The Jedi preserves life; killing is permitted only in self-defense or defense of others and is still a stain. Act calm, never from fear, hatred or anger. Seek nonviolent solutions first. Use Force powers responsibly, for the light, **never for personal gain, power or convenience**. Do not allow evil by inaction, and do not associate with those who willfully do evil. Each use of the Force sends a tremor that others can detect; frequent use makes you easy to find.

## Force skills {#skills}
Three skills: **control** (your own body), **sense** (the world and others), **alter** (changing the Force and things). (p.151)
- **First learning**: a teacher with at least 3D (higher than your skill) and Force-sensitivity; **10 Character Points**, one week (a day less per extra point, minimum one day). You start at **1D** and are taught one power of that skill. Control is usually taught first, alter last. (p.151)
- **Improving**: cost per pip = the number before the "D" (double without a teacher); training 1 day per point with a teacher, 2 without. (p.151)
- **Teaching others**: needs 3D in the skill and the power known; teaching someone with Dark Side Points gives the teacher a Dark Side Point. (p.150-151)

## Learning powers {#learning}
(p.152) A power must be taught. One power on first learning a skill; **one new power per pip** of Force skill improvement (chosen by the teacher, using the improved skill); or **5 Character Points** for a power without improving a skill. A power using two skills counts as **two** powers, three skills as **three**. You must already know the **Required Powers**. Optional: willpower against a learning difficulty (5 + 5 per prerequisite) instead of prerequisites. (p.175)

## Using powers {#using}
(p.152-153)
- Each Force skill a power needs is a **separate action**. Roll them in consecutive rounds at full dice, or all in one round with the multiple-action penalty (two skills: -1D each).
- Each power lists a difficulty per skill; the gamemaster may add modifiers. The target may resist with control or Perception where stated.
- **Relationship** adds to difficulty: close relatives +0, close friends +2, friends +5, acquaintances +7, slight acquaintances +10, met once +12, known by reputation +15, strangers +20, strangers of another species +30.
- **Proximity** adds: touching +0, line of sight +2, out of sight 1-100 m +5, 101 m-10 km +7, 11-1,000 km +10, same planet farther +15, same system +20, other system +30.
- **Keeping a power "up"** (only if the entry says so; announce it when activating): no new rolls each round, but you lose dice as if taking actions (-1D per Force skill the power uses; lightsaber combat -2D). Stunned, wounded or worse drops every "up" power. Otherwise a power ends at the end of the round (some, like combat sense, have their own duration).
- No Time to Use listed = one round. **Warning** powers give a Dark Side Point on every use.
- **Stretching a power** beyond its text is up to the gamemaster (a modest stretch +1 or 2 levels).

## Powers by skill {#powers}
- **Control (20)**: Absorb/Dissipate Energy, Accelerate Healing, Burst of Speed, Concentration, Contort/Escape, Control Disease, Control Pain, Detoxify Poison, Emptiness, Enhance Attribute, Force of Will, Hibernation Trance, Instinctive Astrogation Control, Rage, Reduce Injury, Remain Conscious, Remove Fatigue, Resist Stun, Short-Term Memory Enhancement, Up the Walls.
- **Sense (19)**: Beast Languages, Combat Sense, Danger Sense, Direction Sense, Instinctive Astrogation, Life Detection, Life Sense, Life Web, Magnify Senses, Merge Senses, Postcognition, Predict Natural Disaster, Receptive Telepathy, Sense Force, Sense Force Potential, Sense Path, Shift Sense, Translation, Weather Sense.
- **Alter (4)**: Force Push, Injure/Kill, Kinetic Combat, Telekinesis.
- **Control and sense (5)**: Farseeing, Life Bond, Lifemerge, Lightsaber Combat, Projective Telepathy.
- **Control and alter (14)**: Accelerate Another's Healing, Control Another's Disease, Control Another's Pain, Control Breathing, Detoxify Another's Poison, Feed on Dark Side, Force Jump, Force Lightning, Inflict Pain, Place Another in Hibernation Trance, Redirect Energy, Remove Another's Fatigue, Return Another to Consciousness, Transfer Force.
- **Sense and alter (3)**: Dim Another's Senses, Greater Force Shield, Lesser Force Shield.
- **Control, sense and alter (11)**: Affect Mind, Battle Meditation, Control Mind, Create Force Storms, Doppleganger, Drain Life Essence, Enhanced Coordination, Force Harmony, Projected Fighting, Telekinetic Kill, Transfer Life.
- **Special (1)**: Force Scream (an involuntary dark side reflex).
- Powers with a Warning (dark side on every use): Rage, Injure/Kill, Feed on Dark Side, Force Lightning, Inflict Pain, Control Mind, Create Force Storms, Doppleganger, Drain Life Essence, Telekinetic Kill, Transfer Life.

Query examples:
```
jq '.powers[] | select(.skills==["control"]) | {name, control_difficulty, required_powers, page}' data/force-powers.json
jq '.powers[] | select(.warning) | .name' data/force-powers.json
```

## The dark side {#dark-side}
(p.152, p.177-178; basic rules in `core-mechanics.md#dark-side`)
- **Bonus**: with Dark Side Points you add **+1D per point** to Force skill rolls. You may refuse it, but then every Force power's difficulty rises at least one level. A fallen character no longer gets it. (p.152)
- **Gaining points**: by **action** (knowingly breaking the Jedi Code, hate- or anger-fueled violence, evil acts, dark side powers, a Force Point used for evil), **inaction** (standing by while evil is done) or **calling upon the dark side**. (p.177)
- **Falling**: normally a character with more than six points becomes a gamemaster character; optional rules allow continuing play (no normal Character Points, only one per Dark Side Point gained). (p.177; see E-044)
- **Returning to the light**: spend a Force Point selflessly at a dramatically appropriate moment (usually a heroic sacrifice). Cost: all Force Points and Character Points; Dark Side Points drop to **5**. (p.178)
- **Atonement** (1-5 points): act to preserve life, knowledge, peace and the defenseless, non-violently where possible. Time to remove: **40 / 60 / 80 / 100 / 120 days** for 1 / 2 / 3 / 4 / 5 points; restart if a new point is gained. (p.178)
