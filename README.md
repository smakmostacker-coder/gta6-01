[![gta6-01 bounty](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/smakmostacker-coder/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/smakmostacker-coder/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

Bounty page: https://make.fun/bounty/gta6-01

# Palm Cove: Sunset Heist

A top-down 2D open-world crime game in plain canvas JavaScript - no libraries, no build step, no network requests. Courier Vera Solano owes fixer Lucia Marrero a fortune and works it off across Palm Cove, a sun-soaked grid city of about 4000x3000 px with roads, signed buildings, parks and a beach: run a package pickup, deliver a hot sedan, shake down a bookie for his ledger, then grab the ledger bag and lose the police in a sunset getaway. After the finale the city is yours in free roam.

Systems: on-foot movement with sprint and building collision; parked and moving traffic cars that follow the road grid; car stealing with driving physics (acceleration, steering, braking, handbrake) and damage; wandering pedestrians who flee from crimes; a 0-5 star wanted system with police chases, line-of-sight decay, busted and wasted states with respawn; melee punches and a mouse-aimed pistol; a four-mission story chain with dialogue boxes, map markers and cash rewards; a HUD with health, cash, wanted stars, weapon and objective line plus a live minimap; WebAudio synth sound (shots, punches, sirens, engine); pause; and progress (cash + mission) saved to localStorage.

## Controls

- WASD / arrow keys - move on foot, steer and drive in a car
- Shift - sprint
- E - steal / enter / exit a car
- F - punch
- Mouse - aim, click - shoot the pistol
- Space - handbrake while driving
- Esc / P - pause
- Enter / click - start, advance dialogue, respawn

## Run it

```
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Optional screenshot scenes: `?shot=cover|drive|chase|mission&seed=1` stages a frozen deterministic scene.
