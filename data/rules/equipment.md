---
id: equipment
audience: player
source: { chapter: 18, file: raw-data/18-equipment-weapons.txt, printed_pages: "333-366" }
status: draft-v1
covers: [availability and restriction codes, licenses, buying and selling, weapons, armor, gear, cybernetics, services and expenses]
data: [weapons.json, armor.json, gear.json, tables/equipment-tables.json]
not_covered_phase_2: [gamemaster notes on creating new artifacts and devices (p.360-366)]
---

# Equipment, weapons and armor (player view)

Page numbers `(p.N)` are printed pages. Items are in `weapons.json` (63 items), `armor.json` (15) and `gear.json` (54); prices, codes and licenses are in `tables/equipment-tables.json`. Each item record keeps the book's fields (`model`, `type`, `scale`, `skill`, `cost`, `availability`, `difficulty`, `damage`, `range`, `ammo`, `fire_rate`, `blast_radius`, `game_notes`...) plus `cost_credits` (null when not for sale) and `page`.

## Availability and restrictions {#availability}
(p.334) Availability **1** readily available everywhere; **2** large cities, spaceports or the item's home planet; **3** specialized, normally only on its home planet; **4** rare, hard to obtain. Restriction codes: **F** fee or permit often required, **R** restricted (cannot normally be sold without a license), **X** illegal on most planets.

### Licenses {#licenses}
Pay a fee (a percentage of the item's base cost, in addition to the item) then roll bureaucracy or a Knowledge skill: **Fee/Permit 5%, Moderate, 1 day; Restricted 10%, Difficult, 1D days; Military/Illegal 50%, Very Difficult, 2D days.** Success grants the license after that time; failure costs the time and the fee, and you may retry. Bribery uses persuasion, a false or stolen identity uses forgery; failing by 5 or more alerts the authorities. Every application leaves a record. (p.334) Most restricted items can be found on the black market for effort and money.

### Buying and selling {#trade}
Listed costs are averages; the gamemaster may vary them. A merchant generally buys used equipment at **half** its listed price (commodities excluded). Commodity prices, services and expenses (meals, lodging, medical treatment, passage, rentals, upkeep) are in `tables/equipment-tables.json`. (p.334-335, p.359)

## Weapons {#weapons}
(p.346-356) Records in `weapons.json`; `category` is one of melee, archaic-ranged, blaster, miscellaneous, artillery or explosive. How to use the fields in combat: `combat-injuries.md` (range bands from the three range numbers, fire rate, ammo, blast radius, stun settings, scale).
- **Damage**: a die code (`4D`), `STR+1D` for melee (roll Strength plus the dice; a `maximum` caps it), or blast bands such as `5D/4D/3D/2D` with a matching `blast_radius`.
- **Skill**: the skill and specialization used (for example "Blaster: blaster pistol"); an unimproved skill uses its attribute.
- **Difficulty**: melee weapons carry their own difficulty to use; ranged weapons use the range bands instead.
- Explosive accessories (detonators, fuses) have no damage and are flagged `accessory`.

- **Melee (18)**: Amphistaff, Atlatl, Bayonet, Cesta, Club, Electrostaff, Force Pike, Gaderffii Stick, Hatchet, Knife, Spear, Staff, Stun Gauntlets, Vibro-Ax, Vibroblade, Lightsaber, Double-Bladed Lightsaber, Short Lightsaber.
- **Archaic ranged (10)**: Crossbow, Longbow, Net, Sling, Throwing Knife, Black-Powder Pistol, Musket, Slugthrower Pistol, Slugthrower Rifle, Submachine Gun.
- **Blasters (12)**: Hold-Out Blaster, Sporting Blaster, Blaster Pistol, Heavy Blaster Pistol, Hunting Blaster, Blaster Carbine, Blaster Rifle, Heavy Blaster Rifle, Sporting Blaster Rifle, Light Repeating Blaster, Heavy Repeating Blaster, E-Web Repeating Blaster.
- **Miscellaneous (6)**: Bowcaster, Flamethrower, Ion Pistol, Ion Rifle, Riot Gun, Stun Pistol.
- **Blaster artillery (4)**: Anti-Infantry Laser Battery, Anti-Vehicle Laser Cannon, Heavy Anti-Orbital Ion Cannon, Turbolaser Battery.
- **Explosives (13)**: Fragmentation Grenade, Ion Grenade, Stun Grenade, Grenade Launcher, Rocket Launcher, Antipersonnel Mine, Vehicle Mine, Explosive Charge, Standard Detonator, Timer Fuse, Remote Fuse, Detonite, Thermal Detonator.

## Armor {#armor}
(p.356-358) Armor adds its die code to the **Strength roll to resist damage** for the covered body location (head, torso, left/right arm, left/right leg; front and back may differ). `armor.json` has `protection` parsed from the notes (`physical`, `energy`, `dexterity_penalty`), but read `game_notes` for coverage, helmet systems and special equipment (comlink, MFTAS, utility belts). Rules for armor damage and how it interacts with attacks: `combat-injuries.md#armor`.

Armor items (15): Armored Spacesuit, Medium Battle Armor, Heavy Battle Armor, Blast Helmet, Blast Vest, Royal Guard Armor, Combat Jumpsuit, Corellian Powersuit, Armored Flight Suit, Padded Flight Suit, Clone Trooper Armor, Stormtrooper Armor, Scout Trooper Armor, Snowtrooper Armor, Vonduun Crabshell Armor.

## Gear {#gear}
(p.335-345) Records in `gear.json` by category. Computer entries carry `table_rows` (bonus to computer programming/repair rolls and cost by power).

- **Communications (9)**: Personal Comlink, Military Comlink, Vehicle Comlink, Subspace Transceiver (Small), Subspace Transceiver (Large), Pocket Scrambler, Jammer Pack, Alien Enhancer Vox-Box, Transliterator.
- **Computers and storage (7)**: Code Cylinder, Credit Chip, Datacard, Datapad, Mainframe, Portable Computer, Personal Computer.
- **Detection and surveillance (6)**: Macrobinoculars, Glow Rod, Fusion Lantern, Recording Rod, Portable Sensor Pack, Military Sensor Pack.
- **Life support (4)**: Aquata Breather, Breath Mask, Vacuum Suit, Space Suit.
- **Medical (4)**: Bacta Tank, Customized Medical Backpack, Medpac, Surgery Kit.
- **Cybernetic prosthetics (1)**: Replacement Prosthetics.
- **Survival (8)**: All-Temperature Cloak, Chain, Field Kit, Jet Pack, Liquid Cable Dispenser, Ration Pack, Rocket Pack, Syntherope.
- **Tools (10)**: Binder Cuffs, Energy Cell, Fire Extinguisher, Mesh Tape, Blaster Power Pack, Power Recharger, Security Kit, Standard Tool Kit, Enhanced Tool Kit, Utility Belt.
- **Weapon and armor accessories (5)**: Bandolier, Helmet Package, Holster, Standard Scope, Enhanced Macroscope.

## Cybernetics {#cybernetics}
(p.341-342) Replacement prosthetics duplicate the natural part (1 cyber point each) at fixed prices; enhancements raise an attribute and its improved skills at cost `base x pips x starting die code` and add Dark Side Points (+1 per transgression for 1-2 enhancements, +2 for 3-4, +3 for 5-6). A replacement counts as half an enhancement for that purpose. Optional: cyber points reduce Force skills. Details and examples: `tables/equipment-tables.json` (`cybernetics`). The book says cybernetics are not a shopping list for player characters.

## Using the data {#using-data}
```
jq '.items[] | select(.category=="blaster") | {name, damage, range, cost_credits, availability}' data/weapons.json
jq '.items[] | {name, protection, cost_credits}' data/armor.json
```
