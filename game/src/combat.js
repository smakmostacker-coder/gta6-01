// Combat: a short-range punch and a mouse-aimed pistol with tracers, flashes and hit reactions.
import { scarePeds } from './pedestrians.js';
import { addCrime } from './police.js';

export function createCombat() { return { bullets: [], flashes: [], cooldown: 0, punchCooldown: 0 }; }

export function tryPunch(game) {
  const c = game.combat; if (c.punchCooldown > 0 || game.playerCar()) return;
  c.punchCooldown = 0.34; game.audio.punch();
  const p = game.player, fx = p.x + Math.cos(p.angle) * 26, fy = p.y + Math.sin(p.angle) * 26;
  c.flashes.push({ x: fx, y: fy, r: 16, t: 0.1, color: '#ffeaa7' });
  for (const ped of game.peds) {
    if (ped.down <= 0 && Math.hypot(ped.x - fx, ped.y - fy) < 30) {
      ped.down = 4; ped.state = 'down'; game.audio.hit();
      addCrime(game.wanted, 0.7, game); scarePeds(game.peds, p.x, p.y, 190);
      game.floaters.push({ x: ped.x, y: ped.y - 24, text: 'KNOCKED OUT', t: 1.1, color: '#ff7675' });
    }
  }
}

export function tryShoot(game, aimWorld) {
  const c = game.combat; if (c.cooldown > 0) return;
  c.cooldown = 0.19; game.audio.shot();
  const p = game.playerPos();
  const a = Math.atan2(aimWorld.y - p.y, aimWorld.x - p.x) + (Math.random() - 0.5) * 0.03;
  c.bullets.push({ x: p.x, y: p.y, vx: Math.cos(a) * 950, vy: Math.sin(a) * 950, life: 0.55 });
  c.flashes.push({ x: p.x + Math.cos(a) * 22, y: p.y + Math.sin(a) * 22, r: 12, t: 0.06, color: '#fdcb6e' });
  addCrime(game.wanted, 0.55, game); scarePeds(game.peds, p.x, p.y, 260);
  if (!game.playerCar()) game.player.angle = a;
}

export function updateCombat(game, dt) {
  const c = game.combat;
  c.cooldown = Math.max(0, c.cooldown - dt); c.punchCooldown = Math.max(0, c.punchCooldown - dt);
  for (const f of c.flashes) f.t -= dt;
  c.flashes = c.flashes.filter((f) => f.t > 0);
  for (const b of c.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const ped of game.peds) {
      if (ped.down <= 0 && b.life > 0 && Math.hypot(ped.x - b.x, ped.y - b.y) < 13) {
        ped.down = 5; b.life = 0; game.audio.hit(); addCrime(game.wanted, 0.8, game);
        game.floaters.push({ x: ped.x, y: ped.y - 24, text: 'DOWN', t: 1, color: '#ff7675' });
      }
    }
    for (const car of game.cars) {
      if (b.life > 0 && Math.abs(car.x - b.x) < 26 && Math.abs(car.y - b.y) < 16) { car.health -= 14; b.life = 0; game.audio.hit(); }
    }
    if (game.world.buildings.some((bd) => b.x > bd.x && b.x < bd.x + bd.w && b.y > bd.y && b.y < bd.y + bd.h)) b.life = 0;
  }
  c.bullets = c.bullets.filter((b) => b.life > 0);
}
