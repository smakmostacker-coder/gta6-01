[![gta6-01 bounty](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/smakmostacker-coder/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/smakmostacker-coder/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

Bounty page: https://make.fun/bounty/gta6-01

# Palm Cove: Sunset Heist

A top-down 2D open-world crime game in plain canvas JavaScript - no libraries, no build step, no network requests. Courier Vera Solano owes fixer Lucia Marrero a fortune and works it off across Palm Cove, a sun-soaked grid city of about 4000x3000 px with roads, signed buildings, parks and a beach: run a package pickup, deliver a hot sedan, shake down a bookie for his ledger, then grab the ledger bag and lose the police in a sunset getaway. After the finale the city is yours in free roam.

Systems: on-foot movement with sprint and building collision; parked and moving traffic cars that follow the road grid; car stealing with driving physics (acceleration, steering, braking, handbrake) and damage; wandering pedestrians who flee from crimes; a 0-5 star wanted system with police chases, line-of-sight decay, busted and wasted states with respawn; melee punches and a mouse-aimed pistol; a four-mission story chain with dialogue boxes, map markers and cash rewards; a HUD with health, cash, wanted stars, weapon and objective line plus a live minimap; WebAudio synth sound (shots, punches, sirens, engine); pause; and progress saved to localStorage.

## Side jobs (v2)

Five repeatable jobs are offered at lettered rings around the city (also dotted on the minimap). Step or drive into a ring to take the job; each pays cash, and the HUD panel counts your completed side jobs:

- **TAXI (T)** - pick up a waiting fare in a car and drop them across town against the clock ($180)
- **RACE (R)** - five checkpoints against a 95-second target time ($300)
- **VIGILANTE (V)** - take out a marked troublemaker ($350)
- **COURIER (C)** - timed package pickup and delivery ($220)
- **REPO (W)** - find the marked car, steal it and tow it back to the lockup ring ($280)

## Choices and six endings (v2)

The story now branches. At three beats Vera chooses with keys **1 / 2** (or a click): spare the bookie Rico Fenn or take him out; share Lucia's cut fairly or short her; and take or refuse a rival fixer's $800 side deal for the ledger bag. The game tracks your lifetime record - cash earned, take-outs vs knockouts, busts, side jobs done - and the finale resolves into one of **six endings**:

1. **CLEAN GETAWAY** (good) - debts settled fairly and loyally
2. **KINGPIN OF PALM COVE** - rich and ruthless enough that Lucia steps aside
3. **GHOST** - spared Rico, never busted, never killed: the courier who never existed
4. **BETRAYED** (bad) - Dante's deal was a plant, and Lucia always knows
5. **BUSTED FOR GOOD** (bad) - a record of busts finally catches up in court
6. **BROKE AND BURNED** (bad) - square with Lucia, but flat broke

An ending screen names and narrates the ending you reached and shows the record that earned it. Unlocked endings persist in the save - the title screen, pause screen and HUD show how many of the 6 you have found.

## Controls

- WASD / arrow keys - move on foot, steer and drive in a car
- Shift - sprint
- E - steal / enter / exit a car
- F - punch
- Mouse - aim, click - shoot the pistol
- 1 / 2 - choose at a story choice beat
- Space - handbrake while driving
- Esc / P - pause
- Enter / click - start, advance dialogue, respawn

## Run it

```
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Optional screenshot scenes: `?shot=cover|drive|chase|mission|side|ending&seed=1` stages a frozen deterministic scene.
