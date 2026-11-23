// Camera and world drawing: ground, roads, beach, buildings with signs, cars, people, effects.
import { WORLD, ROAD, PALETTE, FONT } from './config.js';
import { roadXs, roadYs } from './world.js';

export function createCamera() { return { x: 0, y: 0, follow(target, w, h) { this.x = Math.max(0, Math.min(WORLD.w - w, target.x - w / 2)); this.y = Math.max(0, Math.min(WORLD.h - h, target.y - h / 2)); } }; }

function drawCar(ctx, car) {
  ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-car.w / 2 + 3, -car.h / 2 + 4, car.w, car.h);
  ctx.fillStyle = car.police && car.driver === 'police' ? '#2d3436' : car.color;
  roundRect(ctx, -car.w / 2, -car.h / 2, car.w, car.h, 6); ctx.fill();
  if (car.police && car.driver === 'police') { ctx.fillStyle = '#fff'; ctx.fillRect(-6, -car.h / 2, 12, car.h); ctx.fillStyle = Math.floor(performance.now() / 300) % 2 ? '#ff2d55' : '#0984e3'; ctx.fillRect(-4, -4, 8, 8); }
  ctx.fillStyle = '#aee9ff'; ctx.fillRect(2, -car.h / 2 + 4, 10, car.h - 8); ctx.fillRect(-14, -car.h / 2 + 4, 7, car.h - 8);
  ctx.fillStyle = '#1e272e'; [[-16, -13], [14, -13], [-16, 9], [14, 9]].forEach(([x, y]) => ctx.fillRect(x, y, 9, 5));
  if (car.missionCar) { ctx.fillStyle = '#fdcb6e'; ctx.font = 'bold 15px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('▼', 0, -22); }
  if (car.repoCar) { ctx.fillStyle = '#a29bfe'; ctx.font = 'bold 15px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('▼ REPO', 0, -22); }
  if (car.health < 45) { ctx.fillStyle = 'rgba(90,90,90,0.55)'; ctx.beginPath(); ctx.arc(-16, 0, 8 + Math.random() * 5, 0, 7); ctx.fill(); }
  ctx.restore();
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawPerson(ctx, x, y, angle, shirt, skin, opts = {}) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(2, 3, 11, 8, 0, 0, 7); ctx.fill();
  if (opts.down) ctx.rotate(1.4);
  ctx.rotate(opts.down ? 0 : angle);
  ctx.fillStyle = shirt; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(3, 0, 5.5, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(6, -5, 3, 10);
  ctx.restore();
}

export function drawWorld(ctx, game, w, h) {
  const cam = game.camera;
  ctx.fillStyle = PALETTE.grass; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.translate(-cam.x, -cam.y);
  const vx0 = cam.x - 60, vy0 = cam.y - 60, vx1 = cam.x + w + 60, vy1 = cam.y + h + 60;
  // Parks.
  ctx.fillStyle = PALETTE.park; for (const pk of game.world.parks) ctx.fillRect(pk.x, pk.y, pk.w, pk.h);
  // Beach and water along the south edge.
  ctx.fillStyle = PALETTE.sand; ctx.fillRect(0, WORLD.h - 300, WORLD.w, 110);
  ctx.fillStyle = PALETTE.water; ctx.fillRect(0, WORLD.h - 190, WORLD.w, 190);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let x = 0; x < WORLD.w; x += 90) ctx.fillRect(x + Math.sin(game.time + x) * 6, WORLD.h - 178, 42, 3);
  // Sidewalks then roads.
  ctx.fillStyle = PALETTE.sidewalk;
  for (const rx of roadXs()) ctx.fillRect(rx - ROAD.width / 2 - 13, 0, ROAD.width + 26, WORLD.h - 300);
  for (const ry of roadYs()) ctx.fillRect(0, ry - ROAD.width / 2 - 13, WORLD.w, ROAD.width + 26);
  ctx.fillStyle = PALETTE.road;
  for (const rx of roadXs()) ctx.fillRect(rx - ROAD.width / 2, 0, ROAD.width, WORLD.h - 300);
  for (const ry of roadYs()) ctx.fillRect(0, ry - ROAD.width / 2, WORLD.w, ROAD.width);
  ctx.strokeStyle = PALETTE.roadLine; ctx.lineWidth = 3; ctx.setLineDash([22, 18]);
  for (const rx of roadXs()) { ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx, WORLD.h - 300); ctx.stroke(); }
  for (const ry of roadYs()) { ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(WORLD.w, ry); ctx.stroke(); }
  ctx.setLineDash([]);
  // Trees and lamps.
  for (const t of game.world.trees) { if (t.x < vx0 || t.x > vx1 || t.y < vy0 || t.y > vy1) continue; ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, 7); ctx.fill(); ctx.fillStyle = '#40c057'; ctx.beginPath(); ctx.arc(t.x - 3, t.y - 3, t.r * 0.6, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#636e72'; for (const l of game.world.lamps) { if (l.x > vx0 && l.x < vx1 && l.y > vy0 && l.y < vy1) ctx.fillRect(l.x - 2, l.y - 2, 5, 5); }
  // Buildings: shadow, walls, roof detail, sign and windows.
  for (const b of game.world.buildings) {
    if (b.x + b.w < vx0 || b.x > vx1 || b.y + b.h < vy0 || b.y > vy1) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(b.x + 7, b.y + 9, b.w, b.h);
    ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.roof; ctx.fillRect(b.x + 7, b.y + 7, b.w - 14, b.h - 14);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    const cols = Math.max(2, Math.floor(b.w / 34)), rows = Math.max(2, Math.floor(b.h / 34));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if ((i * 7 + j * 3 + b.floors) % 3) ctx.fillRect(b.x + 13 + i * ((b.w - 20) / cols), b.y + 13 + j * ((b.h - 20) / rows), 8, 6);
    ctx.fillStyle = 'rgba(10,12,20,0.82)'; const label = b.name; ctx.font = 'bold 11px ' + FONT; const tw = ctx.measureText(label).width + 12;
    if (b.w > tw + 8) { ctx.fillRect(b.x + b.w / 2 - tw / 2, b.y + b.h / 2 - 10, tw, 20); ctx.fillStyle = '#ffeaa7'; ctx.textAlign = 'center'; ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 4); }
  }
  // Mission marker pillar.
  if (game.missions.marker && !game.missions.dialogue) {
    const mk = game.missions.marker;
    ctx.fillStyle = 'rgba(253,203,110,0.35)'; ctx.fillRect(mk.x - 20, mk.y - 190, 40, 190);
    ctx.fillStyle = '#fdcb6e'; ctx.beginPath(); ctx.arc(mk.x, mk.y, 17 + Math.sin(game.time * 4) * 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#2d3436'; ctx.font = 'bold 18px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('!', mk.x, mk.y + 6);
  }
  // Side quest markers: idle job boards get a pulsing ring and letter; the active
  // target gets the tall cyan pillar, the side-quest twin of the story marker.
  if (!game.side.active) {
    for (const s of game.side.spots) {
      ctx.strokeStyle = s.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(s.x, s.y, 30 + Math.sin(game.time * 3) * 4, 0, 7); ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = s.color; ctx.font = 'bold 20px ' + FONT; ctx.textAlign = 'center'; ctx.fillText(s.letter, s.x, s.y + 7);
      ctx.font = 'bold 10px ' + FONT; ctx.fillStyle = '#fff'; ctx.fillText(s.label, s.x, s.y + 48);
    }
  }
  if (game.side.marker && !game.missions.dialogue) {
    const mk = game.side.marker;
    ctx.fillStyle = 'rgba(0,206,201,0.32)'; ctx.fillRect(mk.x - 18, mk.y - 170, 36, 170);
    ctx.fillStyle = '#00cec9'; ctx.beginPath(); ctx.arc(mk.x, mk.y, 15 + Math.sin(game.time * 4) * 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#083638'; ctx.font = 'bold 16px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('$', mk.x, mk.y + 5);
  }
  // Cars, peds, player.
  for (const car of game.cars) { if (car.x > vx0 && car.x < vx1 && car.y > vy0 && car.y < vy1) drawCar(ctx, car); }
  for (const ped of game.peds) { if (ped.gone) continue; if (ped.x > vx0 && ped.x < vx1 && ped.y > vy0 && ped.y < vy1) drawPerson(ctx, ped.x, ped.y, ped.angle, ped.shirt, ped.skin, { down: ped.down > 0 }); }
  if (!game.playerCar()) {
    const p = game.player;
    drawPerson(ctx, p.x, p.y, p.angle, '#ff2d55', '#f1c27d', {});
    if (game.input.mouse.down || game.shotMode) { ctx.strokeStyle = 'rgba(255,45,85,0.6)'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(p.angle) * 30, p.y + Math.sin(p.angle) * 30); ctx.stroke(); }
  }
  // Bullets and flashes.
  ctx.fillStyle = '#ffeaa7'; for (const b of game.combat.bullets) ctx.fillRect(b.x - 3, b.y - 1.5, 6, 3);
  for (const f of game.combat.flashes) { ctx.fillStyle = f.color; ctx.globalAlpha = Math.max(0, f.t * 6); ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
  // Floaters in screen space.
  ctx.font = 'bold 15px ' + FONT; ctx.textAlign = 'center';
  for (const fl of game.floaters) { ctx.fillStyle = fl.color; ctx.globalAlpha = Math.min(1, fl.t); ctx.fillText(fl.text, fl.x - cam.x, fl.y - cam.y - (2.6 - fl.t) * 18); }
  ctx.globalAlpha = 1;
  // Warm sun vignette.
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.45, w / 2, h / 2, h * 0.95);
  grad.addColorStop(0, 'rgba(255,170,60,0)'); grad.addColorStop(1, 'rgba(255,120,40,0.13)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
}
