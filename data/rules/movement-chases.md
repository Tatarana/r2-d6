---
id: movement-chases
audience: player
source: { chapter: 7, file: raw-data/07-movement-chases.txt, printed_pages: "106-118" }
status: draft-v1
covers: [character movement, speeds, terrain difficulty, movement failures, encumbrance, long-distance movement, vehicle movement, vehicle combat, ramming, vehicle damage, speeds in km/h, cinematic chases]
data: [tables/movement.json, tables/vehicle-movement-damage.json, tables/speed-conversion.json]
not_covered_phase_2: [cinematic chase staging advice, encounter and prop ideas (p.117-118)]
---

# Movement and chases (player view)

Page numbers `(p.N)` are printed pages. Starship movement and combat is a separate chapter (`space.md`, planned).

## Character movement {#character-movement}
(p.107-108) Data: `tables/movement.json`.
- Every character has a **Move** (meters per round walking; humans usually 10). Moving is **one action per round**. Roll **running** (or Dexterity); swimming uses swimming/Strength and climbing uses climbing/jumping/Strength, normally at **one-third** Move.
- Terrain gives a difficulty level (Very Easy 1-5 ... Heroic 31+); the gamemaster picks the number. Roll >= it or have a **movement failure**.
- Four speeds (pick one per round):

| Speed | Distance | Very Easy / Easy / Moderate terrain | Difficult / Very Difficult / Heroic terrain |
|---|---|---|---|
| Cautious | Move x 1/2 | **free action**, no roll | roll, difficulty **-1 level** |
| Cruising | Move x 1 | an action, automatic | roll |
| High speed | Move x 2 | roll | difficulty **+1 level** (Heroic becomes Heroic +10) |
| All-out | Move x 4 | roll, difficulty **+1 level**; do nothing else (no dodge or parry) | roll, difficulty **+2 levels** |

- **Partial moves**: between half and the full distance of the chosen speed.
- **Acceleration**: characters change speed **up to two levels per round**; vehicles one level (E-034).

### Encumbrance (optional) {#encumbrance}
One medium-sized object per **pip** of Strength (3D+2 = 11). Over that, apply long-distance movement and stamina. (p.108)

### Long-distance movement {#long-distance}
(p.109) Stamina roll every **minute** at all-out and every **10 minutes** at high speed (first Very Easy, +1 level each roll); on failure rest twice as long as you moved. Marching at cruising speed: Very Easy stamina check every 3 hours (every 2 if continuous), +1 level each; one hour of sleep per check made restores vigor.

### Movement failures {#movement-failures}
(p.109-110) Margin = difficulty - roll.

| Missed by | Result |
|---|---|
| 1-3 | Slight slip: -1D to all actions for the rest of the round |
| 4-6 | Slip: half Move; -3D rest of round, -1D next round |
| 7-10 | Fall: halfway, kneeling; no actions this round; -2D next round |
| 11-15 | Minor tumble: no actions this and next round; collision damage -3D |
| 16-20 | Tumble: normal collision damage |
| 21+ | Major tumble: collision damage +2D |

Collision damage: cautious 1D, cruise 2D, high 3D, all-out 4D, rolled against Strength (`combat-injuries.md#damage`).

## Vehicle movement {#vehicle-movement}
(p.110-112) Data: `tables/vehicle-movement-damage.json`.
- A vehicle's **Move** is its cruising distance per round. Pilot rolls the vehicle's operation skill (repulsorlift operation for most speeders; walker, ground vehicle, hover vehicle or swoop operation otherwise; Mechanical if unskilled) **plus the vehicle's maneuverability code**.
- Same four speeds and terrain shifts as characters (cautious is free in easy terrain; all-out x4, no other action, no vehicle dodges or weapons).
- Vehicles accelerate or decelerate **one level per round**; partial moves between half and full.
- Long distance: body strength roll every 10 minutes at all-out and every hour at high speed (first Very Easy, +1 level each); failure by 1-10 means strain and rest, by 11+ a mechanical failure (Moderate repair roll, at least an hour).
- **Terrain examples and maneuver modifiers** (bootlegger turn, extreme climb/dive/turn, jump, loop, rotate) are in the data file. (p.111-112)

### Vehicle movement failures {#vehicle-failures}
| Missed by | Result |
|---|---|
| 1-3 | Slight slip: pilot -1D rest of round |
| 4-6 | Slip: half Move; pilot -3D this round, -1D next |
| 7-10 | Spin: a quarter of its Move, no movement this and next round |
| 11-15 | Minor collision: collision damage -3D (or spin if nothing to hit) |
| 16-20 | Collision: normal collision damage |
| 21+ | Major collision: collision damage +4D |

**Collision damage** by speed: cautious 2D, cruise 4D, high 6D, all-out 10D. Angle against another vehicle: head-on **+3D**, rear-end/sideswipe **-3D**, T-bone 0D. Soft obstacles may reduce it by -1D or more. Roll against the vehicle's body strength. (p.113)

## Vehicle combat {#vehicle-combat}
(p.113-115)
- Same as regular combat: difficulty by range, roll vehicle blasters (or Dexterity) **plus fire control**, >= difficulty hits. All Combat chapter modifiers, scale and cover (None, 1/4, 1/2, 3/4, Full) apply.
- **Vehicle dodge**: pilot's operation skill + maneuverability becomes the new difficulty. **Full vehicle dodge**: only action of the round (not even moving); the roll is **added** to every attack's difficulty (example: 25 turns difficulty 12 into 37). (p.113)
- **Weapon ranges**: with four ranges, the first is point-blank (Very Easy); closer than that is Very Difficult. **Crew** N means N gunners are needed but only one rolls. **Fire arcs**: front, back, left, right, turret. (p.114-115)
- **Ramming**: pass close to the target; difficulty **+10** and a separate action (extra -1D). Roll above the new difficulty: the ram hits; below the original: movement failure; in between: you complete the move but miss. The attacker takes sideswipe damage (-3D), the victim T-bone (normal). The target may vehicle dodge. (p.115; E-033 for the tie case)
- **Complex maneuvers**: Attack Pattern Delta (each pilot Easy repulsorlift operation to form up; followers +1D against attackers dead ahead) and Bantha Decoy (opposed tactics or Perception for the walker's commander; if fooled, +1D+2 to the trailing speeder and +5 difficulty for the walker's gunners). (p.114)

## Vehicle damage {#vehicle-damage}
(p.115-116) Damage roll vs body strength roll: lower = none. Margin **0-3** shields blown or controls ionized, **4-8** lightly, **9-12** heavily, **13-15** severely damaged, **16+** destroyed.
- **Shields blown**: -1D shields (if none, controls ionized). **Controls ionized**: -1D to maneuverability, fire control, weapon damage and shields for this round and the next; as many ionized results as maneuverability dice freezes the controls for two rounds.
- **Lightly / heavily / severely damaged** roll 1D for the system hit (tables in the data file); repeating a worse state escalates it. **Lost Moves** add up: -1 no all-out, -2 cruising max, -3 cautious only, -4 immobile, -5 destroyed.
- **Passengers** (character-scale damage, gamemaster's judgment): lightly 1D, heavily 3D, severely 6D, destroyed 12D.
- **Falling**: damage matches the faller's scale; same distance table as characters (`damage-healing.json`).

## Speeds in kilometers per hour {#speeds}
(p.117) All-out km/h = Move x 2.88 (rounded table in `tables/speed-conversion.json`). High speed = half of that, cruising = one quarter, cautious = one eighth. Example: Move 350 -> 1,000 / 500 / 250 / 125 km/h.
