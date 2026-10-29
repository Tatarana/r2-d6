---
id: vehicles-starships
audience: player
source: { chapters: [20, 21], files: [raw-data/20-vehicles.txt, raw-data/21-starships.txt], printed_pages: "401-414, 415-452" }
status: draft-v1
covers: [how to read vehicle and starship statistics, list of vehicles and starships, replacement systems and ship upgrades]
data: [vehicles.json, starships.json, ship-upgrades.json]
not_covered_phase_2: [spacecraft systems background (hyperdrives, sublight drives, armament lore, p.415-427), long descriptive text of each craft]
---

# Vehicles and starships (player view)

Page numbers `(p.N)` are printed pages. Vehicle rules are in `movement-chases.md`, starship rules in `space.md`; this file explains the statistics and lists what is in the data files. Records keep the book's labelled fields (`craft`, `type`, `scale`, `skill`, `crew`, `crew_skill`, `passengers`, `cargo_capacity`, `cost`, `maneuverability`, `move`/`space`, `body_strength`/`hull`, `shields`, `sensors`, `weapons`...), numeric helpers (`cost_credits`, `move_value`, `move_kmh`, `space_value`, `atmosphere_value`, `atmosphere_kmh`) and the page.

## Reading a vehicle entry {#vehicle-stats}
(p.401-402)
- **Craft / Type / Scale**: manufacturer and model, classification, and scale (used by the scale rules in `combat-injuries.md#scale`).
- **Skill**: the operation skill and specialization (for example repulsorlift operation: airspeeder). Some vehicles list an **unskilled** penalty for pilots without the specialization.
- **Crew**: standard crew plus gunners; `skeleton` is the minimum crew and the penalty added to piloting difficulties. **Crew Skill**: typical die codes.
- **Passengers, Cargo Capacity**, **Cover** (Full, 3/4, 1/2, 1/4 or none; `combat-modifiers.json`), **Altitude Range** (flying vehicles), **Cost** (new).
- **Maneuverability**: dice added to the pilot's roll for movement and vehicle dodges. **Move**: meters per round at cruising speed; the all-out speed in km/h follows after the semicolon. **Body Strength**: the die code rolled to resist damage.
- **Weapons**: type and number, fire arc, crew, skill, fire control (added to the gunner's roll), range (four numbers mean point-blank/short/medium/long; closer than point-blank is Very Difficult) and damage. "Fire-linked" weapons are listed as a group.

## Reading a starship entry {#starship-stats}
Same layout plus: **Hyperdrive Multiplier** and **Backup**, **Nav Computer**, **Consumables**, **Space** (Space units per round at cruising speed), **Atmosphere** (Move and km/h in atmosphere), **Hull** (die code to resist damage), **Shields**, and **Sensors** with four modes written `range/dice` (passive, scan, search, focus). Weapons list **Space Range** and **Atmosphere Range**. Capital ships also list their starfighter, ground or other complements under `extras`. Entries with `hull_note` or `shields_note` carry a footnote from the book (for example back-up shield dice on the MC80).

## Vehicles (24) {#vehicles}
**Walkers**

| Name | Scale | Skill | Move | Body | Shields | Cost |
|---|---|---|---|---|---|---|
| AT-AT | Walker | Walker operation | 21; 60 kmh | 6D | - | Not available for sale |
| AT-PT | Walker | Walker operation | 21; 60 kmh | 2D | - | 15,000 (used) |
| AT-ST | Walker | Walker operation | 30; 90 kmh | 3D | - | Not available for sale |
| AT-TE | Walker | Walker operation | 21; 60 kmh | 4D+1 | - | Not available for sale |

**Landspeeders**

| Name | Scale | Skill | Move | Body | Shields | Cost |
|---|---|---|---|---|---|---|
| UBRIKKIAN 9000 Z004 | Speeder | Repulsorlift operation | 105; 300 kmh | 1D+2 | - | 8,000 (new), 2,500 (used) |
| V-35 COURIER | Speeder | Repulsorlift operation | 40; 120 kmh | 2D | - | 8,500 (new), 1,500 (used) |
| X-34 LANDSPEEDER | Speeder | Repulsorlift operation | 115; 330 kmh | 2D | - | 10,550 (new), 2,500 (used) |

**Speeder Bikes**

| Name | Scale | Skill | Move | Body | Shields | Cost |
|---|---|---|---|---|---|---|
| ARATECH 74-Z MILITARY SPEEDER BIKE | Speeder | Repulsorlift operation | 175; 500 kmh | 2D | - | 6,750 (new), 1,200 (used) |
| IKAS-ADNO NIGHTFALCON | Speeder | Repulsorlift operation | 160; 400 kmh | 1D+2 | - | 6,250 (new), 1,000 (used) |
| RAZALON FC-20 | Speeder | Repulsorlift operation | 60; 180 kmh | 2D | - | 4,000 (new), 1,000 (used) |
| STAP | Speeder | Repulsorlift operation | 140; 400 kmh | 1D | - | Not available for sale |

**Swoops**

| Name | Scale | Skill | Move | Body | Shields | Cost |
|---|---|---|---|---|---|---|
| AIR-2 RACING SWOOP | Speeder | Swoop operation | 242; 700 kmh | 1D+1 | - | 7,000 (new), 2,500 (used) |
| FLARE-S | Speeder | Swoop operation | 225; 650 kmh | 1D+1 | - | 5,750 (new), 1,500 (used) |

**Armored Assault Vehicles**

| Name | Scale | Skill | Move | Body | Shields | Cost |
|---|---|---|---|---|---|---|
| AAT-1 | Walker | Repulsorlift operation | 21; 60 kmh | 6D | - |  |
| MULTI-TROOP TRANSPORT | Walker | Repulsorlift operation | 12; 35 kmh | 4D | - |  |

**Airspeeders**

| Name | Scale | Skill | Move | Body | Shields | Cost |
|---|---|---|---|---|---|---|
| INCOM T-47I AIRSPEEDER | Speeder | Repulsorlift operation | 225; 650 kmh | 2D | - | 38,000 (new), 10,000 (used) |
| LAAT/I GUNSHIP | Speeder | Repulsorlift operation | 216; 620 kmh | 4D | - | 65,000 (new), 40,000 (used) |
| REBEL ALLIANCE COMBAT SNOWSPEEDER | Speeder | Repulsorlift operation | 350; 1,000 kmh | 3D | - | 50,000 (used only; black market only) |

**Cloud Cars**

| Name | Scale | Skill | Move | Body | Shields | Cost |
|---|---|---|---|---|---|---|
| BESPIN MOTORS STORM IV | Speeder | Repulsorlift operation | 520; 1,500 kmh | 4D | - | 75,000 (new), 28,000 (used) |

**Podracers**

| Name | Scale | Skill | Move | Body | Shields | Cost |
|---|---|---|---|---|---|---|
| RADON-ULZER PODRACER | Speeder | (A) Podracer operation | 325; 945 kmh | 2D | - | 8,000 (new), 6,000 (used) |

**Sail Barges**

| Name | Scale | Skill | Move | Body | Shields | Cost |
|---|---|---|---|---|---|---|
| SAIL BARGE | Walker | Repulsorlift operation | 35; 100 kmh | 2D | - | 285,000 (new), 150,000 (used) |

**Skiffs**

| Name | Scale | Skill | Move | Body | Shields | Cost |
|---|---|---|---|---|---|---|
| CARGO SKIFF | Speeder | Repulsorlift operation | 70; 200 kmh | 1D | - | 8,000 (new), 3,000 (used) |

**Ground Vehicles**

| Name | Scale | Skill | Move | Body | Shields | Cost |
|---|---|---|---|---|---|---|
| A5 JUGGERNAUT | Walker | Ground vehicle operation | 70; 200 kmh, slows to 8; 25 kmh when turning | 5D | - | Not available for sale |

**Hover Vehicles**

| Name | Scale | Skill | Move | Body | Shields | Cost |
|---|---|---|---|---|---|---|
| WAVESKIMMER | Walker | Hover vehicle operation | 55; 160 kmh | 3D | - | Not available for sale (285,000 credits on the invisible market) |

## Starships (34) {#starships}
**Starfighters**

| Name | Scale | Skill | Space | Hull | Shields | Cost |
|---|---|---|---|---|---|---|
| DELTA-7 AETHERSPRITE STARFIGHTER | Starfighter | Starfighter piloting | 10 | 2D | 1D | 180,000 (new), 145,000 (used), both prices are black market value |
| ARC-170 | Starfighter | Starfighter piloting | 7 | 4D+2 | 1D | 155,000 (new), 70,000 (used) |
| A-WING | Starfighter | Starfighter Piloting | 12 | 2D+2 | 1D | 175,000 (new) 70,000 (used) |
| B-WING | Starfighter | Starfighter piloting | 6 | 3D | 2D | 220,000 (new) 120,000 (used_ |
| VULTURE-CLASS DROID STARFIGHTER | Starfighter | Starfighter piloting | 9 | 2D | - | 19,000 (new), 5000 (used) |
| TRI-FIGHTER | Starfighter | Starfighter piloting | 8 | 2D+2 | - | 20,000 (new), 8,000 (used) |
| ETA-2 ACTIS INTERCEPTOR | Starfighter | Starfighter piloting | 12 | 2D+1 | - | 290,000 (new), 140,000 (used) |
| N-1 ROYAL STARFIGHTER | Starfighter | Starfighter piloting | 8 | 2D | 1D | Not available for sale |
| TIE FIGHTER | Starfighter | Starfighter piloting | 10 | 2D | - | 60,000 (new), 25,000 (used) |
| TIE BOMBER | Starfighter | Starfighter piloting | 6 | 4D+1 | - | 150,000 (new), 75,000 (used) |
| TIE INTERCEPTOR | Starfighter | Starfighter piloting | 11 | 3D | - | 120,000 (new), 75,000 (used) |
| X-WING | Starfighter | Starfighter piloting | 8 | 4D | 1D | 150,000 (new), 65,000 (used) |
| Y-WING-S3 | Starfighter | Starfighter piloting | 7 | 4D | 1D+2 | 135,000 (new), 60,000 (used) |
| Y-WING-A4 | Starfighter | Starfighter piloting | 7 | 4D | 1D+2 | 145,000 (new), 70,500 (used) |
| Z-95 HEADHUNTER | Starfighter | Starfighter piloting | 7 | 4D | 1D | 80,000 (new), 45,000 (used) |

**Capital Ships**

| Name | Scale | Skill | Space | Hull | Shields | Cost |
|---|---|---|---|---|---|---|
| ACCLAMATOR ASSAULT SHIP | Capital | Capital ship piloting | 6 | 4D+1 | 2D+1 | 29 million (new), 19 million (used) |
| BANKING CLAN FRIGATE | Capital | Capital ship piloting | 6 | 3D+2 | 2D+1 | Not available for sale (valued at 57 millions) |
| CORELLIAN CORVETTE | Capital | Capital ship piloting | 6 | 4D | 2D | 3.5 million (new), 1.5 million (used) |
| IMPERIAL STAR DESTROYER | Capital | Capital ship piloting | 6 | 7D | 3D |  |
| INTERDICTOR CRUISER | Capital | Capital ship piloting | 6 | 5D | 3D | Not available for sale |
| MON CALAMARI MC80 STAR CRUISER | Capital | Capital ship piloting | 6 | 6D | 3D |  |
| NEBULON-B FRIGATE | Capital | Capital ship piloting | 4 | 3D+2 | 2D | Not available for sale |
| REPUBLIC CRUISER | Capital | Capital ship piloting | 6 | 3D+1 | 2D | 1.25 million |
| TRADE FEDERATION BATTLESHIP | Capital | Capital ship piloting | 3 | 6D | 3D | Not available for sale |
| VENATOR STAR DESTROYER | Capital | Capital ship piloting | 6 | 5D+1 | 3D+1 | Not available for sale (valued at 59 millions) |

**Space Transports**

| Name | Scale | Skill | Space | Hull | Shields | Cost |
|---|---|---|---|---|---|---|
| FIRESPRAY PATROL/ATTACK CRAFT | Starfighter | Space transports | 5 | 4D | 1D | 120,000 (new); 45,000 (used) |
| GHTROC 720 FREIGHTER | Starfighter | Space transports | 3 | 3D+2 | 1D | 98,500 (new), 23,000 (used) |
| J-TYPE STAR SKIFF | Personal Starship | Space transports | 7 | 5D | 2D+1 | not for sale (5,000,000 used on black market) |
| LAMBDA SHUTTLE | Starfighter | Space transports | 5 | 4D | 1D+2 | No available for sale (valued at 240,000 credits) |
| GALLOFREE MEDIUM TRANSPORT | Capital | Space transports | 2 | 2D | 1D | 350,000 (new), 125,000 (used) |
| GUARDIAN LIGHT CRUISER | Starfighter | Space transports | 9 | 5D | 2D | Not available for sale |
| YT-1300 TRANSPORT | Starfighter | Space transports | 4 | 4D | - | 100,000 (new), 25,000 (used) |
| YT-2000 TRANSPORT | Starfighter | Space transports | 4 | 4D | 1D | 150,000 (new), 45,000 (used |
| YT-2400 TRANSPORT | Starfighter | Space transports | 4 | 3D | 2D | 130,000 (new), 32,000 (used) |

## Replacement systems and upgrades {#upgrades}
(p.447-452) `ship-upgrades.json`. Meant for freighters and space transports: capital ships are rarely modified and starfighters are already at their limits. Every system has a weight subtracted from cargo capacity; costs do not include installation.
- **Drives**: replacement ion drives (Space ratings 4 to 12, 10,000 to 500,000 credits; military ones are illegal and doubly hard to modify) and a baffled stealth drive.
- **Hyperdrives**: x1 (15,000), x2 (10,000), x3 (7,000), x4 (4,000), x5 (2,500) plus the very illegal x1/2. Any hyperdrive fits a freighter with room; brand affects installation difficulty.
- **Deflector shields**: 1D (4,000 credits, 6 tons), 2D (10,000, 8), 3D (20,000, 10).
- **Weapons**: eleven sample weapons (blaster, laser and ion cannons, a turbolaser, torpedo and missile launchers) with fire control, damage, cost and weight. Weapons need a fee (about 30% of the price) and a permit; up to three identical weapons can be linked (+1D for two, +2D for three; about 100 credits per weapon).
- **Sensors and countermeasures**: sensor jammer (4,000), decoys (2,000), sensor equipment costs; no working cloaking device is known.
- **Miscellaneous**: fuel and solar converters, scoops, tractor beam (8,000 credits, 2D fire control and damage), secret compartments (200 / 400 / 1,000 credits per ton by grade), cargo jettison, passenger conversion, refrigeration, navigation computer (2,000), escape pods (1,200), environmental converters.

## Using the data {#using-data}
```
jq '.items[] | select(.scale=="Starfighter") | {name, space, hull, shields, cost_credits}' data/starships.json
jq '.items[] | select(.name=="AT-AT") | .weapons' data/vehicles.json
jq '.systems[] | {name, cost_credits, weight}' data/ship-upgrades.json
```
