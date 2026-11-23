// City generation for Palm Cove: a road grid, city blocks with buildings, parks and a beach edge.
import { WORLD, ROAD, PALETTE, BUILDING_COLORS } from './config.js';
import { createRandom } from './random.js';

export function roadXs() { const xs = []; for (let x = 250; x < WORLD.w; x += ROAD.spacingX) xs.push(x); return xs; }
export function roadYs() { const ys = []; for (let y = 250; y < WORLD.h - 300; y += ROAD.spacingY) ys.push(y); return ys; }
export function onRoadX(x) { return roadXs().some((rx) => Math.abs(x - rx) < ROAD.width / 2); }
export function onRoadY(y) { return roadYs().some((ry) => Math.abs(y - ry) < ROAD.width / 2); }
export function isRoad(x, y) { return onRoadX(x) || onRoadY(y) || y > WORLD.h - 260; }

export function createWorld(seed) {
  const rng = createRandom(seed * 7919 + 13);
  const buildings = [], parks = [], trees = [], lamps = [];
  const xs = [0, ...roadXs().map((x) => x + ROAD.width / 2 + 14), WORLD.w];
  const ys = [0, ...roadYs().map((y) => y + ROAD.width / 2 + 14), WORLD.h - 300];
  const edgesX = [0]; roadXs().forEach((x) => { edgesX.push(x - ROAD.width / 2 - 14, x + ROAD.width / 2 + 14); }); edgesX.push(WORLD.w);
  const edgesY = [0]; roadYs().forEach((y) => { edgesY.push(y - ROAD.width / 2 - 14, y + ROAD.width / 2 + 14); }); edgesY.push(WORLD.h - 300);
  for (let i = 0; i + 1 < edgesX.length; i += 2) {
    for (let j = 0; j + 1 < edgesY.length; j += 2) {
      const bx = edgesX[i], by = edgesY[j], bw = edgesX[i + 1] - bx, bh = edgesY[j + 1] - by;
      if (bw < 80 || bh < 80) continue;
      if (rng.chance(0.16)) {
        parks.push({ x: bx, y: by, w: bw, h: bh });
        for (let t = 0; t < 14; t++) trees.push({ x: bx + rng.range(16, bw - 16), y: by + rng.range(16, bh - 16), r: rng.range(10, 18) });
        continue;
      }
      // Split block into 1-4 buildings with alleys between them.
      const cols = bw > 260 ? 2 : 1, rows = bh > 260 ? 2 : 1;
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
        const w = bw / cols - 18, h = bh / rows - 18;
        buildings.push({
          x: bx + c * (bw / cols) + 9, y: by + r * (bh / rows) + 9, w, h,
          color: rng.pick(BUILDING_COLORS), roof: rng.pick(['#8d6e63','#6d4c41','#546e7a','#795548']),
          floors: rng.int(2, 9), name: rng.pick(['PALM HOTEL','COVE BANK','NOODLE BAR','GYM 24H','PAWN SHOP','TACO PALM','BOOKS','CLINIC','ARCADE','DINER','MARKET','STUDIO','GARAGE','CAFE SOL']),
        });
      }
    }
  }
  roadXs().forEach((x) => { for (let y = 90; y < WORLD.h - 260; y += 170) lamps.push({ x: x - ROAD.width / 2 - 8, y }); });
  roadYs().forEach((y) => { for (let x = 90; x < WORLD.w; x += 170) lamps.push({ x, y: y - ROAD.width / 2 - 8 }); });
  for (let t = 0; t < 60; t++) trees.push({ x: rng.range(30, WORLD.w - 30), y: WORLD.h - rng.range(215, 285), r: rng.range(9, 15) });
  return { buildings, parks, trees, lamps, rng };
}

export function collideCircle(world, pos, radius) {
  for (const b of world.buildings) {
    const nx = Math.max(b.x, Math.min(pos.x, b.x + b.w));
    const ny = Math.max(b.y, Math.min(pos.y, b.y + b.h));
    const dx = pos.x - nx, dy = pos.y - ny, d2 = dx * dx + dy * dy;
    if (d2 < radius * radius) {
      if (d2 < 0.01) { pos.x = b.x - radius; continue; }
      const d = Math.sqrt(d2); pos.x = nx + (dx / d) * radius; pos.y = ny + (dy / d) * radius;
    }
  }
  pos.x = Math.max(radius, Math.min(WORLD.w - radius, pos.x));
  pos.y = Math.max(radius, Math.min(WORLD.h - radius, pos.y));
}
export function rectHitsBuilding(world, x, y, hw, hh) {
  return world.buildings.some((b) => x + hw > b.x && x - hw < b.x + b.w && y + hh > b.y && y - hh < b.y + b.h);
}
export { PALETTE };
