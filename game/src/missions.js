// Story chain: four missions for fixer Lucia Marrero, told through dialogue boxes and map markers.
// Vera Solano, a dockside courier who owes money all over Palm Cove, works off her debt one job at a time.
// v2: three choice beats (spare or take out Rico, share or short Lucia's cut, take or refuse a
// rival's deal) plus lifetime stats steer the finale into one of six endings (see endings.js).
import { addCrime } from './police.js';
import { STORY_MONEY } from './config.js';
import { resolveEnding } from './endings.js';

// The choice beats: prompt plus the two options the player picks with keys 1 and 2 (or a click).
export const CHOICE_BEATS = {
  rico: {
    prompt: 'RICO FENN, cornered: "Take the ledger, it is yours, Vera. Just let me walk."',
    options: ['SPARE RICO - take the ledger and let him run', 'TAKE RICO OUT - no witnesses, no loose ends'],
  },
  cut: {
    prompt: 'LUCIA: "The ledger money cleared. My cut is $200 off the top - unless some of it got lost on the way."',
    options: ['SHARE FAIRLY - pay Lucia her $200 cut', 'SHORT HER - quietly keep an extra $300'],
  },
  rival: {
    prompt: 'DANTE VALE, rival fixer, by phone: "Bring ME the ledger bag tonight, Vera. $800 cash. Lucia never has to know."',
    options: ['REFUSE DANTE - stay loyal to Lucia', 'TAKE THE DEAL - sell Dante the bag (+$800)'],
  },
};
export function activateChoice(game, id) {
  game.missions.choice = { id, ...CHOICE_BEATS[id] };
  game.audio.choice();
}
export function applyChoice(game, idx) {
  const ms = game.missions; if (!ms.choice) return;
  const id = ms.choice.id; ms.choice = null; game.audio.choice();
  if (id === 'rico') {
    if (idx === 0) {
      game.choices.sparedRico = true; game.persist();
      game.floaters.push({ x: game.player.x, y: game.player.y - 44, text: 'RICO SPARED - HE OWES YOU ONE', t: 2.2, color: '#55efc4' });
      finishMission(game);
    } else {
      game.choices.sparedRico = false; ms.stage = 2; game.persist();
      game.floaters.push({ x: game.player.x, y: game.player.y - 44, text: 'NO WITNESSES - TAKE RICO DOWN', t: 2.2, color: '#ff7675' });
    }
  } else if (id === 'cut') {
    if (idx === 0) { game.player.money = Math.max(0, game.player.money - STORY_MONEY.luciaCut); game.choices.sharedCut = true; }
    else { game.player.money += 300; game.stats.earned += 300; game.choices.sharedCut = false; }
    game.persist();
  } else if (id === 'rival') {
    if (idx === 1) { game.player.money += STORY_MONEY.rivalBribe; game.stats.earned += STORY_MONEY.rivalBribe; game.choices.rivalDeal = true; }
    else game.choices.rivalDeal = false;
    game.persist();
  }
}

export const MISSIONS = [
  {
    title: 'M1 - First Favour', reward: 250,
    intro: ['LUCIA: Vera. You owe me, so you work. Simple maths.', 'LUCIA: My cousin left a package at the beach kiosk, south shore.', 'LUCIA: Pick it up. Do not open it. Do not be late.'],
    objective: 'Pick up the package at the beach kiosk',
    type: 'pickup', target: { x: 2050, y: 2790 },
    done: 'Package collected. Lucia wires you $250.',
  },
  {
    title: 'M2 - Hot Delivery', reward: 450,
    intro: ['LUCIA: Good hands. Now a driving job.', 'LUCIA: Take the marked sedan and deliver it to the Palm Hotel garage, north-east.', 'LUCIA: The client pays for speed, not for dents. Mostly.'],
    objective: 'Enter the marked sedan, then deliver it to the Palm Hotel',
    type: 'delivery', target: { x: 3350, y: 420 }, carSpot: { x: 760, y: 810 },
    done: 'Delivered. The client tips well: $450.',
  },
  {
    title: 'M3 - Debt Collection', reward: 650,
    intro: ['LUCIA: A bookie named Rico Fenn skipped town with my ledger.', 'LUCIA: He is hiding near the central park. Shake him down - fists or worse.', 'LUCIA: Bring me the ledger. He can keep the bruises.'],
    objective: 'Find Rico Fenn by the park - then decide his fate (choice: spare him or take him out)',
    type: 'shakedown', target: { x: 2330, y: 1345 },
    done: 'Ledger recovered. Rico reconsiders his career. $650.',
  },
  {
    title: 'M4 - Sunset Getaway', reward: 1200,
    intro: ['LUCIA: Last job, Vera. The ledger names half the docks - the police want it too.', 'LUCIA: Grab the ledger bag from the old pier office and lose the heat.', 'LUCIA: Reach my safehouse on the west side with no stars and we are square.'],
    objective: 'Grab the bag at the pier office, lose the police, reach the safehouse',
    type: 'finale', target: { x: 290, y: 2560 }, safehouse: { x: 290, y: 420 },
    done: 'Square at last. Lucia pays $1,200 and burns the ledger. Palm Cove is yours now.',
  },
];

export function createMissionState(save) {
  return { index: save.mission || 0, phase: 'intro', stage: 0, dialogue: null, dialogueQueue: [], marker: null, targetPed: null, choice: null, pendingChoices: [], complete: (save.mission || 0) >= MISSIONS.length };
}

export function startMission(game) {
  const ms = game.missions;
  if (ms.index >= MISSIONS.length) { ms.complete = true; ms.marker = null; return; }
  const m = MISSIONS[ms.index];
  ms.phase = 'active'; ms.stage = 0; ms.dialogueQueue = [...m.intro]; ms.dialogue = ms.dialogueQueue.shift();
  // Before the finale, two accounts come due: Lucia's cut, and a rival's phone call.
  if (m.type === 'finale') ms.pendingChoices = ['cut', 'rival'];
  ms.marker = { ...m.target };
  if (m.type === 'delivery') ms.marker = { ...m.carSpot };
  if (m.type === 'shakedown') spawnTargetPed(game, m.target);
  game.audio.mission();
}
function spawnTargetPed(game, t) {
  const ped = game.peds[0];
  if (ped) { ped.x = t.x; ped.y = t.y; ped.shirt = '#d63031'; ped.state = 'wander'; ped.wanderX = t.x; ped.wanderY = t.y; game.missions.targetPed = ped; }
}
export function advanceDialogue(game) {
  const ms = game.missions;
  ms.dialogue = ms.dialogueQueue.length ? ms.dialogueQueue.shift() : null;
}
export function currentObjective(game) {
  const ms = game.missions;
  if (ms.complete) return 'Free roam - Palm Cove is yours. Earn cash, cause chaos, stay free.';
  const m = MISSIONS[ms.index]; if (!m) return '';
  if (m.type === 'delivery' && ms.stage === 1) return 'Deliver the sedan to the Palm Hotel garage';
  if (m.type === 'shakedown' && ms.stage === 2) return 'Take Rico down - no witnesses';
  if (m.type === 'finale' && ms.stage === 1) return game.wanted.stars > 0 ? 'Lose the police! (break their line of sight)' : 'Reach Lucia\'s safehouse on the west side';
  return m.objective;
}
function finishMission(game) {
  const ms = game.missions, m = MISSIONS[ms.index];
  game.player.money += m.reward; game.stats.earned += m.reward; game.audio.cash();
  game.floaters.push({ x: game.player.x, y: game.player.y - 44, text: `+$${m.reward} - ${m.title} COMPLETE`, t: 2.6, color: '#55efc4' });
  ms.index++; ms.marker = null; ms.targetPed = null;
  if (m.type === 'finale') {
    // The story resolves here: choices and the lifetime record pick one of six endings.
    ms.complete = true; ms.dialogue = null; ms.dialogueQueue = [];
    const ending = resolveEnding(game);
    game.ending = ending;
    if (!game.endingsUnlocked.includes(ending.id)) game.endingsUnlocked.push(ending.id);
    game.screen = 'ending'; game.audio.ending();
  } else {
    ms.dialogueQueue = [m.done]; ms.dialogue = ms.dialogueQueue.shift();
  }
  game.persist();
  if (ms.index >= MISSIONS.length) { ms.complete = true; }
}
export function updateMissions(game, dt) {
  const ms = game.missions;
  if (ms.complete || ms.phase !== 'active' || ms.dialogue || ms.choice) return;
  const m = MISSIONS[ms.index]; if (!m) return;
  const p = game.playerPos();
  const near = (t, r) => Math.hypot(p.x - t.x, p.y - t.y) < r;
  if (m.type === 'pickup' && near(m.target, 46)) { game.audio.pickup(); addCrime(game.wanted, 0.2, game); finishMission(game); }
  else if (m.type === 'delivery') {
    if (ms.stage === 0 && game.playerCar() && game.playerCar().missionCar) { ms.stage = 1; ms.marker = { ...m.target }; game.audio.pickup(); }
    else if (ms.stage === 1 && game.playerCar() && near(m.target, 85)) finishMission(game);
  } else if (m.type === 'shakedown') {
    const tp = ms.targetPed;
    if (tp && tp.down > 0 && !ms.choice) { game.choices.sparedRico = false; finishMission(game); }
    else if (tp && ms.stage === 0 && !ms.choice && near(tp, 85)) { ms.stage = 1; activateChoice(game, 'rico'); }
  } else if (m.type === 'finale') {
    if (ms.stage === 0 && near(m.target, 52)) { ms.stage = 1; ms.marker = { ...m.safehouse }; addCrime(game.wanted, 2.6, game); game.audio.pickup(); game.floaters.push({ x: p.x, y: p.y - 40, text: 'THE POLICE ARE ON YOU!', t: 2, color: '#ff7675' }); }
    else if (ms.stage === 1 && game.wanted.stars === 0 && near(m.safehouse, 80)) finishMission(game);
  }
}
