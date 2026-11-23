// Side quests: five repeatable GTA-style jobs offered at marked spots around Palm Cove.
// Taxi fares, a street race, vigilante work, timed courier runs and car repossession.
// Each pays cash, counts toward the side-job total in the HUD and the save, and reuses the
// driving, combat and marker systems from the story missions - no parallel machinery.
import { SIDE } from './config.js';
import { roadXs, roadYs } from './world.js';
import { makeCar } from './vehicles.js';
import { addCrime } from './police.js';

// Job boards: stand or drive into a ring to take the job. All sit on road lanes.
export const JOB_SPOTS = [
  { type: 'taxi', label: 'TAXI RANK', letter: 'T', x: 1276, y: 1250, color: '#f1c40f' },
  { type: 'race', label: 'STREET RACE', letter: 'R', x: 2750, y: 276, color: '#fd79a8' },
  { type: 'vigilante', label: 'VIGILANTE', letter: 'V', x: 3276, y: 1750, color: '#e74c3c' },
  { type: 'courier', label: 'COURIER RUN', letter: 'C', x: 276, y: 750, color: '#00cec9' },
  { type: 'repo', label: 'REPO / TOW', letter: 'W', x: 3750, y: 2276, color: '#a29bfe' },
];

const NAMES = { taxi: 'Taxi Fare', race: 'Street Race', vigilante: 'Vigilante', courier: 'Courier Run', repo: 'Repossession' };

export function createSideState(save) {
  return { active: null, done: (save && save.sideDone) | 0, marker: null, spots: JOB_SPOTS };
}

function crossing(minDistFrom) {
  const xs = roadXs(), ys = roadYs();
  for (let tries = 0; tries < 24; tries++) {
    const x = xs[Math.floor(Math.random() * xs.length)] + (Math.random() < 0.5 ? 26 : -26);
    const y = ys[Math.floor(Math.random() * ys.length)] + (Math.random() < 0.5 ? 26 : -26);
    if (!minDistFrom || Math.hypot(x - minDistFrom.x, y - minDistFrom.y) > 700) return { x, y };
  }
  return { x: 2000, y: 1500 };
}
function timeFor(distPx, perPx, min, max) { return Math.max(min, Math.min(max, Math.round(distPx * perPx))); }

export function startSideQuest(game, spot) {
  const sq = game.side, p = game.playerPos();
  const job = { type: spot.type, name: NAMES[spot.type], stage: 0, timer: 0, reward: 0, target: null, ped: null, car: null, checks: [], idx: 0, home: { x: spot.x, y: spot.y } };
  if (spot.type === 'taxi') {
    job.target = crossing(p); job.reward = SIDE.taxiReward;
    job.timer = timeFor(Math.hypot(job.target.x - p.x, job.target.y - p.y), 0.045, 50, 130);
    job.ped = claimPed(game, job.target); // the fare waits at the pickup point
  } else if (spot.type === 'race') {
    let from = p; job.checks = [];
    for (let i = 0; i < SIDE.raceCheckpoints; i++) { const c = crossing(from); job.checks.push(c); from = c; }
    job.target = job.checks[0]; job.reward = SIDE.raceReward; job.timer = SIDE.raceTime;
  } else if (spot.type === 'vigilante') {
    job.target = crossing(p); job.reward = SIDE.vigilanteReward; job.timer = 120;
    job.ped = claimPed(game, job.target); if (job.ped) job.ped.shirt = '#6c5ce7';
  } else if (spot.type === 'courier') {
    job.target = crossing(p); job.reward = SIDE.courierReward;
    job.timer = timeFor(Math.hypot(job.target.x - p.x, job.target.y - p.y), 0.04, 40, 110);
  } else if (spot.type === 'repo') {
    const spotAt = crossing(p); job.reward = SIDE.repoReward; job.timer = 130;
    job.car = makeCar(spotAt.x, spotAt.y, Math.PI / 2, '#ff9f43', { parked: true });
    job.car.repoCar = true; game.cars.push(job.car); job.target = { x: job.car.x, y: job.car.y };
  }
  sq.active = job; sq.marker = { ...job.target };
  game.audio.mission();
  game.floaters.push({ x: p.x, y: p.y - 46, text: job.name.toUpperCase() + ' STARTED', t: 2, color: '#81ecec' });
}
function claimPed(game, at) {
  const ped = game.peds.find((q) => !q.gone && q.down <= 0 && q !== game.missions.targetPed);
  if (ped) { ped.x = at.x; ped.y = at.y; ped.state = 'wait'; ped.wanderX = at.x; ped.wanderY = at.y; }
  return ped || null;
}
function releasePed(job, at) { if (job.ped) { job.ped.gone = false; job.ped.state = 'wander'; if (at) { job.ped.x = at.x; job.ped.y = at.y; } job.ped = null; } }

function finishSideQuest(game, job, bonusText) {
  const sq = game.side;
  game.player.money += job.reward; game.stats.earned += job.reward;
  sq.done++; game.audio.cash();
  game.floaters.push({ x: game.player.x, y: game.player.y - 46, text: `+$${job.reward} - ${job.name.toUpperCase()} DONE (${sq.done})`, t: 2.6, color: '#81ecec' });
  if (bonusText) game.floaters.push({ x: game.player.x, y: game.player.y - 68, text: bonusText, t: 2, color: '#ffeaa7' });
  sq.active = null; sq.marker = null; game.persist();
}
function failSideQuest(game, job, why) {
  const sq = game.side;
  game.floaters.push({ x: game.player.x, y: game.player.y - 46, text: `${job.name.toUpperCase()} FAILED - ${why}`, t: 2.4, color: '#ff7675' });
  releasePed(job, job.target);
  if (job.car) job.car.repoCar = false;
  sq.active = null; sq.marker = null;
}

export function sideObjective(game) {
  const job = game.side.active; if (!job) return '';
  const t = Math.max(0, Math.ceil(job.timer));
  if (job.type === 'taxi') return job.stage === 0 ? `TAXI: pick up the fare (${t}s)` : `TAXI: drop the fare off (${t}s)`;
  if (job.type === 'race') return `RACE: checkpoint ${job.idx + 1}/${job.checks.length} (${t}s)`;
  if (job.type === 'vigilante') return `VIGILANTE: take out the marked troublemaker (${t}s)`;
  if (job.type === 'courier') return job.stage === 0 ? `COURIER: grab the package (${t}s)` : `COURIER: deliver it (${t}s)`;
  if (job.type === 'repo') return job.stage === 0 ? `REPO: find the marked car (${t}s)` : `REPO: tow it back to the lockup ring (${t}s)`;
  return '';
}

export function updateSideQuests(game, dt) {
  const sq = game.side;
  if (game.missions.dialogue || game.missions.choice) return;
  const p = game.playerPos();
  const job = sq.active;
  if (!job) {
    // Offer a job when the player steps into a board ring.
    for (const spot of sq.spots) if (Math.hypot(p.x - spot.x, p.y - spot.y) < 42) { startSideQuest(game, spot); return; }
    return;
  }
  job.timer -= dt;
  if (job.timer <= 0) { failSideQuest(game, job, 'OUT OF TIME'); return; }
  const near = (t, r) => Math.hypot(p.x - t.x, p.y - t.y) < r;
  if (job.type === 'taxi') {
    if (job.stage === 0 && game.playerCar() && near(job.target, 62)) {
      if (job.ped) { job.ped.gone = true; }
      job.stage = 1; job.target = crossing(p);
      job.timer = timeFor(Math.hypot(job.target.x - p.x, job.target.y - p.y), 0.045, 45, 120);
      sq.marker = { ...job.target }; game.audio.pickup();
      game.floaters.push({ x: p.x, y: p.y - 40, text: 'FARE ON BOARD', t: 1.4, color: '#f1c40f' });
    } else if (job.stage === 1 && game.playerCar() && near(job.target, 62)) {
      releasePed(job, job.target); finishSideQuest(game, job, 'ANOTHER FARE ALWAYS NEEDS A RIDE');
    }
  } else if (job.type === 'race') {
    if (near(job.target, 78)) {
      job.idx++; game.audio.pickup();
      if (job.idx >= job.checks.length) { finishSideQuest(game, job, 'THE COVE CREW RESPECTS THE TIME'); return; }
      job.target = job.checks[job.idx]; sq.marker = { ...job.target };
    }
  } else if (job.type === 'vigilante') {
    if (job.ped && job.ped.down > 0) { addCrime(game.wanted, 0.3, game); finishSideQuest(game, job, 'THE STREET IS QUIETER'); }
  } else if (job.type === 'courier') {
    if (job.stage === 0 && near(job.target, 46)) {
      job.stage = 1; job.target = crossing(p); game.audio.pickup();
      job.timer = timeFor(Math.hypot(job.target.x - p.x, job.target.y - p.y), 0.04, 40, 110);
      sq.marker = { ...job.target };
    } else if (job.stage === 1 && near(job.target, 52)) finishSideQuest(game, job, 'SIGNED, SEALED, PAID');
  } else if (job.type === 'repo') {
    if (job.stage === 0 && game.playerCar() === job.car) { job.stage = 1; job.target = { ...job.home }; sq.marker = { ...job.target }; game.audio.pickup(); }
    else if (job.stage === 1 && game.playerCar() === job.car && near(job.home, 70)) { job.car.repoCar = false; finishSideQuest(game, job, 'LOCKUP SECURED IT'); }
  }
}
