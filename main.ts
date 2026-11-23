// Hand-in program for my gta6-01 entry, Palm Cove: Sunset Heist (Node 22, standard library
// only). The game itself lives in this directory's game/ folder as plain static files a desktop
// browser loads fully offline - game/index.html plus its ES modules under game/src/, no library
// and no network request. This program copies game/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json, the summary the judge reads, using the vendored
// make.fun library in vendor/. The game is a top-down open-world crime game: a grid city with
// traffic and pedestrians, stealable cars, a wanted system with police chases, punches and a
// pistol, and a four-mission story chain with a minimap HUD and synth sound. The v2 upgrade
// adds five repeatable side jobs (taxi fares, a street race, vigilante work, courier runs and
// car repossession), three story choice beats, and six endings resolved from the player's
// choices and lifetime record - all still plain modules under game/src/, nothing vendored.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
