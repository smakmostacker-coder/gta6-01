// Cars: parked cars to steal, traffic that follows the road grid, and player driving physics.
import { WORLD, ROAD, CAR_COLORS } from './config.js';
import { roadXs, roadYs, rectHitsBuilding } from './world.js';
import { clamp } from './random.js';

let nextId = 1;
export function makeCar(x, y, angle, color, opts = {}) {
  return { id: nextId++, x, y, angle, speed: 0, color, w: 48, h: 24, health: 100, parked: !!opts.parked, police: !!opts.police, driver: opts.driver || null, lane: opts.lane || 0, targetSpeed: opts.targetSpeed || 0, stuck: 0, smoke: 0, cruise: opts.cruise || 165, missionCar: !!opts.missionCar, repoCar: !!opts.repoCar, sideCar: !!opts.sideCar };
}

export function spawnTraffic(world, rng, count) {
  const cars = [], xs = roadXs(), ys = roadYs();
  for (let i = 0; i < count; i++) {
    if (rng.chance(0.55)) { const rx = rng.pick(xs); cars.push(makeCar(rx + (rng.chance(0.5) ? 26 : -26), rng.range(80, WORLD.h - 380), 0, rng.pick(CAR_COLORS), { driver: 'traffic' })); const c = cars[cars.length - 1]; c.angle = c.x > rx ? Math.PI / 2 : -Math.PI / 2; c.dirY = c.x > rx ? 1 : -1; c.roadX = rx; c.axis = 'v'; }
    else { const ry = rng.pick(ys); const c = makeCar(rng.range(80, WORLD.w - 80), ry + (rng.chance(0.5) ? 26 : -26), 0, rng.pick(CAR_COLORS), { driver: 'traffic' }); c.axis = 'h'; c.roadY = ry; c.dirX = c.y > ry ? -1 : 1; c.angle = c.dirX > 0 ? 0 : Math.PI; cars.push(c); }
  }
  // Parked cars along block edges.
  for (let i = 0; i < 46; i++) {
    const rx = rng.pick(xs), y = rng.range(120, WORLD.h - 420);
    const c = makeCar(rx - ROAD.width / 2 - 22, y, Math.PI / 2, rng.pick(CAR_COLORS), { parked: true });
    if (!rectHitsBuilding(world, c.x, c.y, 14, 26)) cars.push(c);
  }
  return cars;
}

export function updateTraffic(car, dt, allCars, playerPos) {
  if (car.parked || car.driver !== 'traffic') return;
  const cruise = car.cruise || 165;
  let want = cruise;
  // Stop when something is ahead.
  for (const o of allCars) {
    if (o === car) continue;
    const fx = car.x + Math.cos(car.angle) * 58, fy = car.y + Math.sin(car.angle) * 58;
    if (Math.hypot(o.x - fx, o.y - fy) < 34) { want = 0; break; }
  }
  if (playerPos && Math.hypot(playerPos.x - (car.x + Math.cos(car.angle) * 55), playerPos.y - (car.y + Math.sin(car.angle) * 55)) < 30) want = 0;
  car.speed += clamp(want - car.speed, -320 * dt, 130 * dt);
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  // Turn at intersections: occasionally switch axis at a crossing.
  const xs = roadXs(), ys = roadYs();
  if (car.axis === 'v') {
    const nearY = ys.find((ry) => Math.abs(car.y - ry) < 8 && Math.abs(car.speed) > 20);
    if (nearY !== undefined && Math.random() < 0.006) { car.axis = 'h'; car.roadY = nearY; car.dirX = Math.random() < 0.5 ? 1 : -1; car.y = nearY + (car.dirX > 0 ? -26 : 26); car.angle = car.dirX > 0 ? 0 : Math.PI; }
    if (car.y < 60) { car.dirY = 1; car.angle = Math.PI / 2; car.x = car.roadX + 26; }
    if (car.y > WORLD.h - 340) { car.dirY = -1; car.angle = -Math.PI / 2; car.x = car.roadX - 26; }
  } else {
    const nearX = xs.find((rx) => Math.abs(car.x - rx) < 8 && Math.abs(car.speed) > 20);
    if (nearX !== undefined && Math.random() < 0.006) { car.axis = 'v'; car.roadX = nearX; car.dirY = Math.random() < 0.5 ? 1 : -1; car.x = nearX + (car.dirY > 0 ? 26 : -26); car.angle = car.dirY > 0 ? Math.PI / 2 : -Math.PI / 2; }
    if (car.x < 60) { car.dirX = 1; car.angle = 0; car.y = car.roadY - 26; }
    if (car.x > WORLD.w - 60) { car.dirX = -1; car.angle = Math.PI; car.y = car.roadY + 26; }
  }
}

export function driveCar(car, input, dt) {
  const accel = input.down('KeyW', 'ArrowUp') ? 430 : 0;
  const brake = input.down('KeyS', 'ArrowDown');
  const steer = (input.down('KeyD', 'ArrowRight') ? 1 : 0) - (input.down('KeyA', 'ArrowLeft') ? 1 : 0);
  const hand = input.keys.has('Space');
  if (accel) car.speed += accel * dt;
  if (brake) car.speed += (car.speed > 12 ? -560 : -190) * dt;
  car.speed -= car.speed * (hand ? 1.9 : 0.55) * dt;
  car.speed = clamp(car.speed, -150, 430);
  if (Math.abs(car.speed) > 4) car.angle += steer * dt * 1.9 * Math.sign(car.speed) * clamp(Math.abs(car.speed) / 130, 0.25, 1) * (hand ? 1.5 : 1);
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  car.x = clamp(car.x, 26, WORLD.w - 26); car.y = clamp(car.y, 26, WORLD.h - 26);
  return hand && Math.abs(car.speed) > 90;
}
