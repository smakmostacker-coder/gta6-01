// Palm Cove: Sunset Heist - boot, game loop and state machine (title, play, pause, busted, wasted, ending).
// Vera Solano works off a debt across a sun-soaked grid city: steal cars, run jobs, dodge the law.
// v2 wires in the side quests (taxi, race, vigilante, courier, repo), the story choice beats and
// the six-ending resolution: every run is scored on cash earned, busts, take-outs and loyalty.
import { STEP, PLAYER, WORLD, FONT } from './config.js';
import { createRandom, clamp } from './random.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { loadSave, storeSave } from './save.js';
import { createWorld, collideCircle, isRoad } from './world.js';
import { spawnTraffic, updateTraffic, driveCar, makeCar } from './vehicles.js';
import { spawnPeds, updatePeds, scarePeds } from './pedestrians.js';
import { createWanted, addCrime, updateWanted, spawnPolice, updatePolice } from './police.js';
import { createCombat, tryPunch, tryShoot, updateCombat } from './combat.js';
import { createMissionState, startMission, advanceDialogue, updateMissions, activateChoice, applyChoice, MISSIONS } from './missions.js';
import { createSideState, updateSideQuests } from './sidequests.js';
import { ENDINGS, endingRecordLine } from './endings.js';
import { createCamera, drawWorld } from './render.js';
import { drawHUD } from './hud.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const seed = parseInt(params.get('seed') || '7', 10) || 7;
const shot = params.get('shot');
const view = { w: 1280, h: 800 };
function resize() { view.w = window.innerWidth; view.h = window.innerHeight; canvas.width = view.w; canvas.height = view.h; }
window.addEventListener('resize', resize); resize();

const save = loadSave();
const rng = createRandom(seed);
const world = createWorld(seed);
const input = createInput(canvas);
const audio = createAudio();

const game = {
  world, input, audio, view, time: 0, shotMode: false,
  screen: shot ? 'play' : 'title',
  player: { x: 760, y: 700, angle: 0, health: PLAYER.health, money: save.money, carId: null },
  cars: [], peds: [], wanted: createWanted(), combat: createCombat(),
  missions: createMissionState(save), camera: createCamera(),
  side: createSideState(save), stats: save.stats, choices: save.choices, endingsUnlocked: save.endings, ending: null,
  floaters: [], bustMeter: 0, playerSeen: false, endTimer: 0, endKind: '', crimeCooldown: 0,
  playerPos() { const c = this.playerCar(); return c ? { x: c.x, y: c.y } : this.player; },
  playerCar() { return this.cars.find((c) => c.id === this.player.carId) || null; },
  persist() { storeSave({ money: this.player.money, mission: this.missions.index, started: true, sideDone: this.side.done, stats: this.stats, choices: this.choices, endings: this.endingsUnlocked }); },
  enterCarSilent(car) { this.player.carId = car.id; car.driver = 'player'; car.parked = false; },
  startCurrentMissionSilent() { const keep = this.missions.index; this.missions = createMissionState({ mission: keep }); startMission(this); this.missions.dialogue = null; this.missions.dialogueQueue = []; },
};

game.cars = spawnTraffic(world, rng, 26);
game.peds = spawnPeds(rng, 42);
// Mission 2's marked sedan waits near the start.
if ((save.mission || 0) <= 1) {
  const sedan = makeCar(760, 810, 0, '#00cec9', { parked: true });
  sedan.missionCar = true; game.cars.push(sedan);
}
if (!shot && save.started && save.mission < MISSIONS.length) startMission(game);
if (shot) stageShot(game, shot);
window.__game = game; // lets the maker's own playtest script stage and inspect a run

let lastCarHealth = new Map();
function nearestCar(pos, r) { let best = null, bd = r; for (const c of game.cars) { const d = Math.hypot(c.x - pos.x, c.y - pos.y); if (d < bd) { bd = d; best = c; } } return best; }

function enterCar(car) {
  game.enterCarSilent(car); audio.enterCar(); audio.setEngine(true, 0);
  if (car.wasParked || car.parked) addCrime(game.wanted, 0.65, game);
  scarePeds(game.peds, car.x, car.y, 120);
}
function exitCar() {
  const car = game.playerCar(); if (!car) return;
  car.driver = null; car.speed = 0; game.player.carId = null;
  game.player.x = car.x + Math.cos(car.angle + Math.PI / 2) * 34; game.player.y = car.y + Math.sin(car.angle + Math.PI / 2) * 34;
  audio.setEngine(false);
}
function endRun(kind) {
  if (game.screen !== 'play') return;
  game.screen = kind; game.endTimer = 0; audio.busted(); audio.setEngine(false); audio.setSiren(false);
  if (kind === 'busted') { game.stats.busts++; } // busts are on Vera's permanent record - they steer the ending
  game.player.money = Math.max(0, game.player.money - (kind === 'busted' ? 150 : 100));
  game.persist();
}
function respawn() {
  game.player.health = PLAYER.health; game.player.x = 760; game.player.y = 700; game.player.carId = null;
  game.wanted.stars = 0; game.wanted.heat = 0; game.bustMeter = 0;
  game.cars = game.cars.filter((c) => !(c.police && c.driver === 'police'));
  game.screen = 'play'; game.persist();
}

function update(dt) {
  game.time += dt;
  for (const f of game.floaters) f.t -= dt;
  game.floaters = game.floaters.filter((f) => f.t > 0);
  if (game.screen === 'title') { if (input.wasPressed('Enter') || input.mouse.clicked) { audio.unlock(); game.screen = 'play'; if (!save.started && game.missions.index === 0 && !game.missions.dialogue) startMission(game); game.persist(); } return; }
  if (game.screen === 'busted' || game.screen === 'wasted') { game.endTimer += dt; if (game.endTimer > 1.6 && (input.wasPressed('Enter') || input.mouse.clicked)) respawn(); return; }
  if (game.screen === 'ending') { game.endTimer += dt; if (game.endTimer > 1.2 && (input.wasPressed('Enter') || input.mouse.clicked)) { game.screen = 'play'; game.ending = null; } return; }
  if (game.screen === 'paused') { if (input.wasPressed('Escape') || input.wasPressed('KeyP')) game.screen = 'play'; return; }
  if (input.wasPressed('Escape') || input.wasPressed('KeyP')) { game.screen = 'paused'; return; }
  if (game.missions.dialogue) { if (input.wasPressed('Enter') || input.mouse.clicked) advanceDialogue(game); return; }
  // Story choice beats freeze the action until Vera decides (keys 1/2 or click an option).
  if (!game.missions.choice && game.missions.pendingChoices.length && !game.missions.complete) activateChoice(game, game.missions.pendingChoices.shift());
  if (game.missions.choice) {
    let pick = input.choiceIndex();
    if (pick < 0 && input.mouse.clicked) pick = input.mouse.y > view.h - 88 ? 1 : 0;
    if (pick >= 0) { applyChoice(game, pick); input.endFrame(); } // consume the press: one keypress must never answer two beats in the same frame's later ticks
    return;
  }

  const p = game.player, car = game.playerCar();
  game.crimeCooldown = Math.max(0, game.crimeCooldown - dt);
  // Movement.
  if (car) {
    const drifting = driveCar(car, input, dt);
    if (drifting && Math.random() < 0.3) scarePeds(game.peds, car.x, car.y, 130);
    audio.setEngine(true, car.speed);
    // Collisions with buildings: bounce and damage.
    if (game.world.buildings.some((b) => car.x + 22 > b.x && car.x - 22 < b.x + b.w && car.y + 12 > b.y && car.y - 12 < b.y + b.h)) {
      if (Math.abs(car.speed) > 120) { car.health -= 16; p.health -= 4; audio.crash(); addCrime(game.wanted, 0.15, game); }
      car.x -= Math.cos(car.angle) * car.speed * dt * 1.4; car.y -= Math.sin(car.angle) * car.speed * dt * 1.4; car.speed *= -0.25;
    }
    // Running over peds and hitting cars.
    for (const ped of game.peds) {
      if (ped.down <= 0 && Math.abs(car.speed) > 55 && Math.hypot(ped.x - car.x, ped.y - car.y) < 26) {
        ped.down = 6; audio.hit(); p.health -= 1; game.stats.kills++; addCrime(game.wanted, 0.9, game); scarePeds(game.peds, car.x, car.y, 220);
        game.floaters.push({ x: ped.x, y: ped.y - 26, text: 'PEDESTRIAN HIT!', t: 1.2, color: '#ff7675' });
      }
    }
    for (const o of game.cars) {
      if (o !== car && Math.hypot(o.x - car.x, o.y - car.y) < 40 && Math.abs(car.speed) > 90) {
        if (game.crimeCooldown <= 0) { addCrime(game.wanted, 0.3, game); game.crimeCooldown = 1.2; audio.crash(); }
        o.health -= 8; car.health -= 6; car.speed *= 0.55;
      }
    }
    if (car.health <= 0) { p.health -= 25; car.health = 30; audio.crash(); game.floaters.push({ x: car.x, y: car.y - 30, text: 'ENGINE SMOKING!', t: 1.4, color: '#ff7675' }); }
  } else {
    const mv = input.moveVector();
    const sprint = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
    const sp = sprint ? PLAYER.sprint : PLAYER.walk;
    if (mv.active) { p.x += mv.x * sp * dt; p.y += mv.y * sp * dt; p.angle = Math.atan2(mv.y, mv.x); }
    collideCircle(world, p, PLAYER.radius);
    // Aim follows the mouse.
    const aim = { x: input.mouse.x + game.camera.x, y: input.mouse.y + game.camera.y };
    if (input.mouse.down || mv.active) p.angle = Math.atan2(aim.y - p.y, aim.x - p.x);
    if (input.wasPressed('KeyF')) tryPunch(game);
    if (input.mouse.down) tryShoot(game, aim);
  }
  if (input.wasPressed('KeyE')) { if (car) exitCar(); else { const near = nearestCar(p, 52); if (near) enterCar(near); } }
  // Traffic, peds, police, combat, missions.
  for (const c of game.cars) updateTraffic(c, dt, game.cars, game.playerPos());
  const danger = game.wanted.stars > 0 || car ? game.playerPos() : null;
  updatePeds(game.peds, world, dt, (game.wanted.stars > 0 || input.mouse.down) ? game.playerPos() : null);
  spawnPolice(game);
  const pos = game.playerPos();
  game.playerSeen = game.cars.some((c) => c.police && c.driver === 'police' && Math.hypot(c.x - pos.x, c.y - pos.y) < 430);
  updateWanted(game.wanted, dt, game.playerSeen);
  updatePolice(game, dt);
  audio.setSiren(game.wanted.stars > 0 && game.playerSeen);
  updateCombat(game, dt);
  updateMissions(game, dt);
  if (game.screen === 'play') updateSideQuests(game, dt);
  // Health regen, bust and wasted checks.
  if (p.health < PLAYER.health && game.wanted.stars === 0) p.health = Math.min(PLAYER.health, p.health + dt * 3);
  if (game.bustMeter >= 1) endRun('busted');
  if (p.health <= 0) endRun('wasted');
  game.camera.follow(pos, view.w, view.h);
}

function draw() {
  ctx.clearRect(0, 0, view.w, view.h);
  if (game.screen === 'title') { drawTitle(); return; }
  drawWorld(ctx, game, view.w, view.h);
  drawHUD(ctx, game, view.w, view.h);
  if (!game.playerCar() && game.screen === 'play') {
    const near = nearestCar(game.player, 52);
    if (near) { ctx.fillStyle = 'rgba(12,16,24,0.8)'; ctx.fillRect(view.w / 2 - 90, view.h - 170, 180, 28); ctx.fillStyle = '#fff'; ctx.font = 'bold 14px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('Press E to steal car', view.w / 2, view.h - 151); }
  }
  if (game.screen === 'paused') { overlay('PAUSED', 'Esc / P to resume - your progress is saved'); drawRecord(); }
  if (game.screen === 'busted') overlay('BUSTED', 'The Palm Cove police take $150. Press Enter to walk free.');
  if (game.screen === 'wasted') overlay('WASTED', 'You wake up at Cove Clinic, $100 lighter. Press Enter.');
  if (game.screen === 'ending' && game.ending) drawEnding();
}
// The ending screen: names the ending, narrates it, shows the record that earned it.
function drawEnding() {
  const e = game.ending;
  ctx.fillStyle = 'rgba(8,8,18,0.82)'; ctx.fillRect(0, 0, view.w, view.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = e.color; ctx.font = 'bold 22px ' + FONT; ctx.fillText('— ' + e.tag + ' —', view.w / 2, view.h / 2 - 128);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 58px ' + FONT; ctx.fillText(e.name, view.w / 2, view.h / 2 - 62);
  ctx.font = '17px ' + FONT; ctx.fillStyle = '#ffeaa7';
  e.lines.forEach((line, i) => ctx.fillText(line, view.w / 2, view.h / 2 - 8 + i * 26));
  ctx.font = '14px ' + FONT; ctx.fillStyle = '#dfe6e9';
  ctx.fillText('YOUR RECORD: ' + endingRecordLine(game), view.w / 2, view.h / 2 + 84);
  ctx.fillStyle = '#55efc4'; ctx.font = 'bold 16px ' + FONT;
  ctx.fillText('Endings found: ' + game.endingsUnlocked.length + ' / ' + ENDINGS.length + '   —   Press Enter: free roam Palm Cove', view.w / 2, view.h / 2 + 122);
}
function drawRecord() {
  ctx.fillStyle = '#dfe6e9'; ctx.font = '15px ' + FONT; ctx.textAlign = 'center';
  ctx.fillText(endingRecordLine(game), view.w / 2, view.h / 2 + 66);
  ctx.fillText('Endings found: ' + game.endingsUnlocked.length + ' / ' + ENDINGS.length, view.w / 2, view.h / 2 + 92);
}
function overlay(title, sub) {
  ctx.fillStyle = title === 'BUSTED' ? 'rgba(9,60,140,0.55)' : 'rgba(10,10,16,0.6)'; ctx.fillRect(0, 0, view.w, view.h);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 64px ' + FONT; ctx.textAlign = 'center'; ctx.fillText(title, view.w / 2, view.h / 2 - 10);
  ctx.font = '17px ' + FONT; ctx.fillStyle = '#ffeaa7'; ctx.fillText(sub, view.w / 2, view.h / 2 + 30);
}
function drawTitle() {
  const g = ctx.createLinearGradient(0, 0, 0, view.h); g.addColorStop(0, '#ff9a56'); g.addColorStop(0.55, '#fd79a8'); g.addColorStop(1, '#6c5ce7');
  ctx.fillStyle = g; ctx.fillRect(0, 0, view.w, view.h);
  ctx.fillStyle = 'rgba(20,16,40,0.9)';
  for (let i = 0; i < 14; i++) { const bw = 60 + (i * 53) % 70, bh = 90 + (i * 97) % 190; ctx.fillRect(i * (view.w / 14), view.h - bh, bw, bh); }
  ctx.fillStyle = '#ffeaa7'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 173) % view.w, view.h - 40 - (i * 61) % 150, 5, 5);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff'; ctx.font = 'bold 74px ' + FONT; ctx.fillText('PALM COVE', view.w / 2, 150);
  ctx.fillStyle = '#fdcb6e'; ctx.font = 'bold 40px ' + FONT; ctx.fillText('SUNSET HEIST', view.w / 2, 200);
  ctx.fillStyle = '#fff'; ctx.font = '17px ' + FONT;
  ctx.fillText('Vera Solano owes fixer Lucia Marrero a fortune. Work it off across a sun-soaked city:', view.w / 2, 252);
  ctx.fillText('run packages, deliver hot cars, shake down a bookie and outrun the law - then the city is yours.', view.w / 2, 276);
  ctx.fillStyle = '#81ecec';
  ctx.fillText('Side jobs pay extra: taxi fares, street races, vigilante work, courier runs, repo jobs.', view.w / 2, 300);
  ctx.fillText('Your choices and your record decide the ending - there are ' + ENDINGS.length + ' of them. Endings found: ' + game.endingsUnlocked.length + '/' + ENDINGS.length, view.w / 2, 322);
  ctx.font = '16px ' + FONT; ctx.fillStyle = '#ffeaa7';
  const controls = ['WASD / Arrows - move & drive', 'Shift - sprint    Space - handbrake', 'E - steal / enter / exit car', 'F - punch    Mouse - aim, Click - shoot', '1 / 2 - make a story choice    Esc / P - pause'];
  controls.forEach((c, i) => ctx.fillText(c, view.w / 2, 356 + i * 26));
  ctx.fillStyle = 'rgba(12,16,24,0.75)'; ctx.fillRect(view.w / 2 - 170, 486, 340, 56);
  ctx.fillStyle = '#55efc4'; ctx.font = 'bold 24px ' + FONT;
  ctx.fillText(save.started ? '▶  CONTINUE  (Enter)' : '▶  START STORY  (Enter)', view.w / 2, 522);
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '13px ' + FONT;
  ctx.fillText('Progress (cash + missions) saves automatically in this browser.', view.w / 2, 566);
}

let acc = 0, last = performance.now();
function frame(now) {
  const elapsed = Math.min(0.1, (now - last) / 1000); last = now; acc += elapsed;
  if (!game.shotMode) { while (acc >= STEP) { update(STEP); acc -= STEP; } }
  else { game.camera.follow(game.playerPos(), view.w, view.h); }
  draw();
  input.endFrame();
  if (game.shotMode && !window.__shotReady) { window.__shotReady = true; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
