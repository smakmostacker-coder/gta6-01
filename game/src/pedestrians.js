// Pedestrians: wander the sidewalks and beach, chat in place, and flee from danger.
import { WORLD } from './config.js';
import { isRoad, collideCircle } from './world.js';
import { clamp } from './random.js';

const SHIRTS = ['#ff7675','#74b9ff','#55efc4','#ffeaa7','#fd79a8','#a29bfe','#fdcb6e','#81ecec'];
let nextId = 1;
export function spawnPeds(rng, count) {
  const peds = [];
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, tries = 0;
    do { x = rng.range(60, WORLD.w - 60); y = rng.range(60, WORLD.h - 320); tries++; } while (isRoad(x, y) && tries < 12);
    peds.push({ id: nextId++, x, y, angle: rng.range(0, Math.PI * 2), speed: 0, state: 'wander', timer: rng.range(0, 3), shirt: rng.pick(SHIRTS), skin: rng.pick(['#f1c27d','#e0ac69','#8d5524','#ffdbac']), fleeX: 0, fleeY: 0, down: 0, panic: 0 });
  }
  return peds;
}
export function scarePeds(peds, x, y, radius) {
  for (const p of peds) { if (p.down > 0) continue; const d = Math.hypot(p.x - x, p.y - y); if (d < radius) { p.state = 'flee'; p.panic = 2.4; p.fleeX = p.x + (p.x - x) / (d + 1) * 160; p.fleeY = p.y + (p.y - y) / (d + 1) * 160; } }
}
export function updatePeds(peds, world, dt, danger) {
  for (const p of peds) {
    if (p.gone) continue; // riding in a car (a taxi fare on board) - not in the world
    if (p.down > 0) { p.down -= dt; continue; }
    if (p.state === 'wait') { p.moving = false; continue; } // a fare or a marked target holding position
    p.timer -= dt;
    if (danger && Math.hypot(p.x - danger.x, p.y - danger.y) < 110) { p.state = 'flee'; p.panic = Math.max(p.panic, 0.6); p.fleeX = p.x + (p.x - danger.x) * 2; p.fleeY = p.y + (p.y - danger.y) * 2; }
    let tx = null, ty = null, sp = 52;
    if (p.state === 'flee') { tx = p.fleeX; ty = p.fleeY; sp = 185; p.panic -= dt; if (p.panic <= 0) { p.state = 'wander'; p.timer = 0; } }
    else if (p.timer <= 0) { p.timer = 2 + Math.random() * 3; p.wanderX = clamp(p.x + (Math.random() - 0.5) * 260, 40, WORLD.w - 40); p.wanderY = clamp(p.y + (Math.random() - 0.5) * 260, 40, WORLD.h - 300); }
    if (p.state === 'wander') { tx = p.wanderX ?? p.x; ty = p.wanderY ?? p.y; }
    if (tx !== null) {
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      if (d > 6) { p.angle = Math.atan2(dy, dx); p.x += Math.cos(p.angle) * sp * dt; p.y += Math.sin(p.angle) * sp * dt; p.moving = true; } else p.moving = false;
    }
    collideCircle(world, p, 10);
  }
}
