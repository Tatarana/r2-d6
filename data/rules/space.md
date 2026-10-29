---
id: space
audience: player
source: { chapter: 8, file: raw-data/08-space-travel-combat.txt, printed_pages: "119-139" }
status: draft-v1
covers: [starship categories, hyperdrive and astrogation, mishaps, sensors, licenses and starport costs, starship movement, starship combat, shields, weapons, tractor beams, starship damage]
data: [tables/space-travel.json, tables/starship-combat.json]
not_covered_phase_2: [how to get a ship (financing, charter, booking passage), space encounter ideas (pirates, slavers, patrols), spacers' documents lore, starport types, running space combat advice, power control narrative (p.119-121, 125-128, 129-131)]
---

# Space travel and combat (player view)

Page numbers `(p.N)` are printed pages. Ship statistics (hull, shields, Space, maneuverability, weapons) are in the Starships chapter (`starships.json`, planned).

## Starships {#categories}
- **Capital ship**: big combat vessels; skill **capital ship piloting**. **Starfighter**: small combat craft; **starfighter piloting**. **Space transport**: everything else (freighters, shuttles, yachts, liners); **space transports**. (p.120) The text says each can fall back on the Technical attribute, but these skills are Mechanical (E-036).
- All starship combat happens in realspace at sublight speeds. Sublight benchmarks (orbit to jump point 5 min, planet to moon 30 min, planet to planet 2-6 hours) are in the data file. (p.121)

## Hyperspace {#hyperspace}
(p.121-125) Data: `tables/space-travel.json`.
- **Hyperdrive class** is a multiplier on a route's standard duration (x1 = standard; x2 takes twice as long; x0.5 half). Backup drives are x10 or worse. (p.122)
- **Making a jump** (astrogation):
  1. The gamemaster sets a difficulty (most trips Moderate), modified by: **no nav computer or astromech +30**; **hasty entry x2** (one-round jump instead of one minute); lightly damaged ship +5, heavily damaged +10; **-1 per extra hour** added to the trip, **+1 per hour saved**; obstacles +1 to +30. (p.123)
  2. Calculation time: 1 minute on a well-known route or with precalculated coordinates; about half an hour between known systems; a few hours for a new system; 1 day if lost.
  3. Roll astrogation: **>= difficulty** and the jump works; **miss by 1-9** an astrogation mishap (2D table); **miss by 10+** no jump, roll again.
- **Mishaps** (2D, p.124): 2 hyperdrive cut-out and damaged; 3-4 radiation fluctuations (+/-1D hours per point missed); 5-6 cut-out into realspace; 7-8 off course; 9 mynocks (+1D days); 10 close call (a system damaged); 11-12 collision, heavy damage, ship abandoned (survival and stamina rolls for a hull rupture).
- **Stopping a jump**: damage adds to the astrogation difficulty (+5 light, +10 heavy), each ion-cannon controls ionized result +5, a tractor beam adds its damage roll; hasty jumps double the base. All cumulative. (p.125)

## Sensors and communications {#sensors}
(p.126-127) Operator rolls **sensors**; the difficulty depends on range and conditions. Four modes: **passive**, **scan** (all directions), **search** (one fire arc), **focus** (small area). Each is listed `range in Space units / dice added to sensors` (e.g. Scan 25/1D). Countermeasures: hide behind a planet, go passive, run silent (about five minutes max), jam, decoys, sensor masks, false transponder codes. Comms and subspace work only in realspace.

## Licenses and starport costs {#costs}
(p.128-130) Operating license 1,000 credits; captain's license 300 (500 with the expediter fee); arms load-out permit from 250 per weapon or boosted shield system. Docking about 50 credits per day (up to 150 at busy Imperial/Republic ports); restocking = base fee (about 10, up to 35) x crew and passengers x days; overhaul every 20 jumps about 1,000 credits (up to 5,000); traffic fines 50-200 credits.

## Starship movement {#movement}
(p.131-134) Data: `tables/starship-combat.json` (`movement`). Same structure as vehicles in `movement-chases.md#vehicle-movement`, with **Space units** instead of meters.
- A ship has a **Space** score (cruising distance per round; slow 2-3, freighters 5-6, fastest fighters 11-12). Pilot rolls the piloting skill **plus maneuverability**; >= difficulty or a movement failure.
- Speeds: cautious (half, round up; free action in Very Easy/Easy/Moderate space), cruising, high (x2; harder space +1 level), all-out (x4; no other action; +1 level easy space, +2 levels hard space). One level of acceleration per round. Partial moves between half and full.
- Long distance: **hull code** roll every 10 minutes at all-out and every hour at high speed.
- Failures by margin: 1-3 slight slip (-1D), 4-6 slip (half move, -3D then -1D), 7-10 spin, 11-15 minor collision (-3D damage), 16-20 collision, 21+ major collision (+4D); with nothing to hit the ship spins out of control for this round and the next.
- Collisions: cautious 2D, cruise 4D, high 6D, all-out 10D; head-on +3D, sideswipe or rear-end -3D, T-bone 0D.

## Starship combat {#combat}
(p.134-137)
- Same flow as combat: difficulty by the weapon's range in **Space units**, roll **starship gunnery** (starfighter scale) or **capital ship gunnery** (capital scale) **plus fire control**; >= difficulty hits. Every starship gives full cover.
- **Starship dodge**: piloting skill + maneuverability becomes the new difficulty. **Full starship dodge**: only action of the round; the roll is **added** to all attacks' difficulties.
- **Fire-linked weapons**: stats are for the linked group; firing separately reduces damage by the combined-action bonus (four lasers 6D together, each 4D+1 alone).
- **Ion cannons** ignore shields; damage over the hull code roll by 0-3 / 4-8 / 9-12 / 13-15 / 16+ gives 1 / 2 / 3 / 4 controls ionized / controls dead.
- **Missiles, bombs, proton torpedoes**: difficulty +5 / +10 / +15 / +20 against targets with Space 3 / 4 / 5 / 6+.
- **Tractor beams**: a hit, then beam damage against hull code; a captured ship that does not resist is reeled in 5 units per round; resisting, a beam roll equal or higher reels in 1-4 units and costs the target -1 to -4 Move.
- **Called shots on ships** (higher scale cannot target a lower scale's parts): primary section +2D, subsection +4D, specific location +8D. (p.136)
- **Optional power control** (p.137): reroute up to +2D to a system; difficulty Moderate / Difficult / Very Difficult by complexity; time by the operator's roll.

## Shields {#shields}
(p.134-135) Using shields is a **reaction skill** (starship shields; capital ship shields for capital ships). Split the shield dice among the four fire arcs; difficulty is **Easy / Moderate / Difficult / Very Difficult** for 1 / 2 / 3 / 4 arcs. Hits from a covered arc add the shield dice to the **hull code** to resist damage. Particle shields must be dropped to launch fighters, missiles or torpedoes (hull code -2D).

## Starship damage {#damage}
(p.137-139) Roll damage against the **hull code roll**; lower = no damage. Margin **0-3** shields blown or controls ionized, **4-8** lightly, **9-12** heavily, **13-15** severely damaged, **16+** destroyed.
- **Controls ionized**: -1D to maneuverability, shields, fire control and weapon damage for this round and the next; as many results as maneuverability dice freeze the controls for two rounds.
- Lightly, heavily and severely damaged each roll 1D on a system table (maneuverability, weapons, hyperdrive, shields, Move, drives, generator...) in the data file; repeating a worse state escalates it. **Lost Moves** add up: -1 no all-out, -2 cruising max, -3 cautious only, -4 dead in space, -5 destroyed.
- A **hyperdrive hit** doubles calculation times (light) or adds +10 to astrogation (heavy), fixed by one hour and a Moderate repair roll.
