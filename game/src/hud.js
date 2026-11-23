// Heads-up display: health, cash, wanted stars, weapon, objective line, bust meter and minimap.
// v2 adds the side-job counter and endings tally to the panel, a cyan banner for the active
// side quest under the story objective, and the two-option choice box for story beats.
import { WORLD, ROAD, FONT } from './config.js';
import { roadXs, roadYs } from './world.js';
import { currentObjective, MISSIONS } from './missions.js';
import { sideObjective } from './sidequests.js';
import { ENDINGS } from './endings.js';

function stars(ctx, x, y, n) {
  ctx.font = '22px ' + FONT; ctx.textAlign = 'right';
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i < n ? '#fdcb6e' : 'rgba(255,255,255,0.25)'; ctx.fillText('★', x - (4 - i) * 24, y); }
}
export function drawHUD(ctx, game, w, h) {
  const p = game.player;
  // Top-left panel.
  ctx.fillStyle = 'rgba(12,16,24,0.72)'; ctx.fillRect(14, 14, 252, 118);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.strokeRect(14, 14, 252, 118);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px ' + FONT; ctx.textAlign = 'left';
  ctx.fillText('PALM COVE', 26, 40);
  ctx.font = '15px ' + FONT; ctx.fillStyle = '#55efc4';
  ctx.fillText('$' + p.money.toLocaleString(), 26, 64);
  ctx.fillStyle = '#dfe6e9'; ctx.font = '13px ' + FONT;
  ctx.fillText(game.playerCar() ? 'Weapon: Pistol (in car)' : 'Weapon: Pistol / Fists (F)', 130, 64);
  // Health bar.
  ctx.fillStyle = '#3d3d3d'; ctx.fillRect(26, 76, 228, 14);
  ctx.fillStyle = p.health > 30 ? '#2ecc71' : '#e74c3c'; ctx.fillRect(26, 76, 228 * Math.max(0, p.health) / 100, 14);
  ctx.fillStyle = '#fff'; ctx.font = '11px ' + FONT; ctx.fillText('HEALTH ' + Math.ceil(Math.max(0, p.health)), 30, 87);
  if (game.playerCar()) { ctx.fillStyle = '#fdcb6e'; ctx.fillText('CAR ' + Math.ceil(game.playerCar().health) + '%', 180, 87); }
  // v2 tallies: side jobs completed and endings unlocked so far.
  ctx.fillStyle = '#81ecec'; ctx.font = '12px ' + FONT; ctx.textAlign = 'left';
  ctx.fillText('Side jobs: ' + game.side.done, 26, 106);
  ctx.fillStyle = '#ffeaa7';
  ctx.fillText('Endings found: ' + game.endingsUnlocked.length + '/' + ENDINGS.length, 130, 106);
  ctx.fillStyle = '#dfe6e9';
  ctx.fillText('Taken out: ' + game.stats.kills + '  Busts: ' + game.stats.busts, 26, 124);
  stars(ctx, w - 20, 42, game.wanted.stars);
  if (game.wanted.stars > 0) { ctx.fillStyle = '#ff7675'; ctx.font = 'bold 13px ' + FONT; ctx.textAlign = 'right'; ctx.fillText(game.playerSeen ? 'POLICE IN PURSUIT' : 'LOSING THEM... ' + Math.ceil(Math.max(0, 7 - game.wanted.hideTimer)) + 's', w - 20, 66); }
  // Objective banner.
  const obj = currentObjective(game);
  if (obj) {
    ctx.font = 'bold 15px ' + FONT;
    const tw = Math.min(w - 340, ctx.measureText(obj).width + 34);
    ctx.fillStyle = 'rgba(12,16,24,0.9)'; ctx.fillRect((w - tw) / 2, 14, tw, 34);
    ctx.fillStyle = '#ffeaa7'; ctx.textAlign = 'center'; ctx.fillText(obj, w / 2, 37);
  }
  if (!game.missions.complete) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '12px ' + FONT; ctx.textAlign = 'right'; ctx.fillText(MISSIONS[game.missions.index]?.title || '', w - 20, h - 196); }
  // Side quest banner under the story objective.
  const sideObj = sideObjective(game);
  if (sideObj) {
    ctx.font = 'bold 14px ' + FONT;
    const tw2 = Math.min(w - 340, ctx.measureText(sideObj).width + 34);
    ctx.fillStyle = 'rgba(8,30,34,0.9)'; ctx.fillRect((w - tw2) / 2, 54, tw2, 32);
    ctx.strokeStyle = '#00cec9'; ctx.strokeRect((w - tw2) / 2, 54, tw2, 32);
    ctx.fillStyle = '#81ecec'; ctx.textAlign = 'center'; ctx.fillText(sideObj, w / 2, 75);
  }
  // Bust meter.
  if (game.bustMeter > 0.02) {
    ctx.fillStyle = 'rgba(12,16,24,0.7)'; ctx.fillRect(w / 2 - 110, h - 120, 220, 22);
    ctx.fillStyle = '#e74c3c'; ctx.fillRect(w / 2 - 106, h - 116, 212 * game.bustMeter, 14);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('BUSTED METER', w / 2, h - 84);
  }
  // Controls hint.
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '12px ' + FONT; ctx.textAlign = 'left';
  ctx.fillText(game.playerCar() ? 'E exit car - Space handbrake - Esc pause' : 'E enter car - Shift sprint - F punch - Click shoot - Esc pause', 16, h - 14);
  drawMinimap(ctx, game, w, h);
  // Choice box: a story beat waits on keys 1 / 2 (or a click on an option).
  if (game.missions.choice) {
    const ch = game.missions.choice;
    ctx.fillStyle = 'rgba(10,12,20,0.92)'; ctx.fillRect(w / 2 - 360, h - 196, 720, 166);
    ctx.strokeStyle = '#fd79a8'; ctx.lineWidth = 2; ctx.strokeRect(w / 2 - 360, h - 196, 720, 166); ctx.lineWidth = 1;
    ctx.fillStyle = '#fff'; ctx.font = '15px ' + FONT; ctx.textAlign = 'left';
    wrapText(ctx, ch.prompt, w / 2 - 340, h - 168, 680, 20);
    ch.options.forEach((opt, i) => {
      const oy = h - 108 + i * 40;
      ctx.fillStyle = 'rgba(253,121,168,0.16)'; ctx.fillRect(w / 2 - 340, oy - 24, 680, 34);
      ctx.strokeStyle = 'rgba(253,121,168,0.7)'; ctx.strokeRect(w / 2 - 340, oy - 24, 680, 34);
      ctx.fillStyle = '#fdcb6e'; ctx.font = 'bold 15px ' + FONT; ctx.fillText('[' + (i + 1) + ']', w / 2 - 330, oy);
      ctx.fillStyle = '#fff'; ctx.font = '15px ' + FONT; ctx.fillText(opt, w / 2 - 296, oy);
    });
  }
  // Dialogue box.
  if (game.missions.dialogue) {
    ctx.fillStyle = 'rgba(10,12,20,0.88)'; ctx.fillRect(w / 2 - 360, h - 108, 720, 78);
    ctx.strokeStyle = '#fdcb6e'; ctx.strokeRect(w / 2 - 360, h - 108, 720, 78);
    ctx.fillStyle = '#fff'; ctx.font = '16px ' + FONT; ctx.textAlign = 'left';
    wrapText(ctx, game.missions.dialogue, w / 2 - 340, h - 76, 680, 21);
    ctx.fillStyle = '#fdcb6e'; ctx.font = 'bold 12px ' + FONT; ctx.textAlign = 'right'; ctx.fillText('CLICK / ENTER ▸', w / 2 + 344, h - 40);
  }
}
function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '', yy = y;
  for (const word of words) { const test = line ? line + ' ' + word : word; if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = word; yy += lh; } else line = test; }
  ctx.fillText(line, x, yy);
}
function drawMinimap(ctx, game, w, h) {
  const mw = 190, mh = 142, mx = w - mw - 14, my = h - mh - 14;
  const sx = mw / WORLD.w, sy = mh / WORLD.h;
  ctx.fillStyle = '#79c24e'; ctx.fillRect(mx, my, mw, mh);
  ctx.fillStyle = '#3a3f46';
  for (const rx of roadXs()) ctx.fillRect(mx + (rx - ROAD.width / 2) * sx, my, ROAD.width * sx, mh);
  for (const ry of roadYs()) ctx.fillRect(mx, my + (ry - ROAD.width / 2) * sy, mw, ROAD.width * sy);
  ctx.fillStyle = '#2f9ec4'; ctx.fillRect(mx, my + (WORLD.h - 300) * sy, mw, 300 * sy);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (const b of game.world.buildings) ctx.fillRect(mx + b.x * sx, my + b.y * sy, Math.max(2, b.w * sx), Math.max(2, b.h * sy));
  const dot = (e, color, r = 3) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(mx + e.x * sx, my + e.y * sy, r, 0, 7); ctx.fill(); };
  for (const c of game.cars) if (!c.police) dot(c, '#dfe6e9', 2);
  for (const c of game.cars) if (c.police && c.driver === 'police') dot(c, '#0984e3', 3.4);
  if (game.missions.marker) { const mk = game.missions.marker; ctx.fillStyle = '#fdcb6e'; ctx.beginPath(); ctx.arc(mx + mk.x * sx, my + mk.y * sy, 5 + Math.sin(game.time * 5) * 1.5, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.stroke(); }
  // Side quests on the map: idle job boards as small letters, the active target in cyan.
  ctx.font = 'bold 8px ' + FONT; ctx.textAlign = 'center';
  if (!game.side.active) for (const s of game.side.spots) { ctx.fillStyle = s.color; ctx.fillText(s.letter, mx + s.x * sx, my + s.y * sy + 3); }
  if (game.side.marker) { const mk = game.side.marker; ctx.fillStyle = '#00cec9'; ctx.beginPath(); ctx.arc(mx + mk.x * sx, my + mk.y * sy, 4.6 + Math.sin(game.time * 5) * 1.3, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.stroke(); }
  dot(game.playerPos(), '#ff2d55', 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.strokeRect(mx, my, mw, mh);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px ' + FONT; ctx.textAlign = 'left'; ctx.fillText('MAP - PALM COVE', mx + 5, my + 12);
}
