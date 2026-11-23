// Wanted system and police: stars rise with crimes, decay out of sight, cops chase and bust.
import { WORLD } from './config.js';
import { makeCar } from './vehicles.js';
import { rectHitsBuilding } from './world.js';
import { clamp } from './random.js';

export function createWanted() { return { stars: 0, heat: 0, hideTimer: 0, seenTimer: 0 }; }

export function addCrime(wanted, amount, game) {
  wanted.heat += amount;
  const before = wanted.stars;
  while (wanted.heat >= 1 && wanted.stars < 5) { wanted.stars++; wanted.heat -= 1; }
  if (wanted.stars > before && game) game.audio.cash();
  wanted.hideTimer = 0;
}

export function updateWanted(wanted, dt, playerVisible) {
  if (wanted.stars <= 0) return;
  if (playerVisible) { wanted.hideTimer = 0; wanted.seenTimer += dt; }
  else { wanted.hideTimer += dt; wanted.seenTimer = 0; if (wanted.hideTimer > 7) { wanted.stars--; wanted.heat = 0; wanted.hideTimer = 3.5; } }
}

export function spawnPolice(game) {
  const want = game.wanted.stars === 0 ? 0 : game.wanted.stars + 1;
  const current = game.cars.filter((c) => c.police && c.driver === 'police');
  if (current.length >= want) return;
  const p = game.playerPos();
  const a = Math.random() * Math.PI * 2, d = 620;
  const x = clamp(p.x + Math.cos(a) * d, 60, WORLD.w - 60), y = clamp(p.y + Math.sin(a) * d, 60, WORLD.h - 340);
  const cop = makeCar(x, y, a + Math.PI, '#dfe6e9', { driver: 'police', police: true });
  cop.color = '#2d3436'; game.cars.push(cop);
}

export function updatePolice(game, dt) {
  const p = game.playerPos();
  let anyClose = false;
  for (const cop of [...game.cars]) {
    if (!cop.police || cop.driver !== 'police') continue;
    if (game.wanted.stars === 0) { cop.driver = 'traffic'; cop.axis = 'v'; cop.roadX = cop.x; cop.dirY = 1; cop.angle = Math.PI / 2; continue; }
    const d = Math.hypot(p.x - cop.x, p.y - cop.y);
    if (d > 1500) { game.cars.splice(game.cars.indexOf(cop), 1); continue; }
    if (d < 70) anyClose = true;
    const targetAngle = Math.atan2(p.y - cop.y, p.x - cop.x);
    let diff = targetAngle - cop.angle;
    while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
    cop.angle += clamp(diff, -2.4 * dt, 2.4 * dt);
    const top = game.playerCar() ? 395 : 265;
    const want = d > 46 ? top : 0;
    cop.speed += clamp(want - cop.speed, -420 * dt, 260 * dt);
    cop.x += Math.cos(cop.angle) * cop.speed * dt;
    cop.y += Math.sin(cop.angle) * cop.speed * dt;
    // Cop cars respect buildings too: back out and shed speed instead of ghosting through.
    if (rectHitsBuilding(game.world, cop.x, cop.y, 24, 13)) {
      cop.x -= Math.cos(cop.angle) * cop.speed * dt * 1.6; cop.y -= Math.sin(cop.angle) * cop.speed * dt * 1.6;
      cop.speed *= -0.2; cop.health -= 3;
    }
    cop.x = clamp(cop.x, 26, WORLD.w - 26); cop.y = clamp(cop.y, 26, WORLD.h - 26);
  }
  // Bust meter fills while a cop is right on top of a slow or on-foot player.
  if (anyClose && (!game.playerCar() || Math.abs(game.playerCar().speed) < 40)) {
    game.bustMeter = Math.min(1, game.bustMeter + dt / 2.2);
  } else game.bustMeter = Math.max(0, game.bustMeter - dt * 0.7);
  return anyClose;
}
