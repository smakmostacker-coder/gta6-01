// Screenshot staging: ?shot=<scene>&seed=<n> freezes a deterministic, lively scene for capture.
import { makeCar } from './vehicles.js';

export function stageShot(game, scene) {
  game.shotMode = true;
  const p = game.player;
  if (scene === 'cover') {
    p.x = 760; p.y = 690; p.angle = 0.4; game.missions.index = 0;
    game.startCurrentMissionSilent();
    placeCars(game, [[776, 590, Math.PI / 2, '#e74c3c'], [724, 905, -Math.PI / 2, '#3498db'], [560, 776, 0, '#f1c40f'], [960, 724, Math.PI, '#2ecc71']]);
    clusterPeds(game, 700, 660, 8);
  } else if (scene === 'drive') {
    p.x = 1150; p.y = 776;
    const car = makeCar(1150, 776, 0, '#e67e22', { driver: 'player' });
    game.cars.push(car); game.enterCarSilent(car);
    game.missions.index = 1; game.startCurrentMissionSilent(); game.missions.stage = 1; game.missions.marker = { x: 3350, y: 420 };
    placeCars(game, [[1450, 776, 0, '#3498db'], [1620, 724, Math.PI, '#2ecc71'], [880, 724, Math.PI, '#9b59b6']]);
    clusterPeds(game, 1180, 690, 5);
  } else if (scene === 'chase') {
    p.x = 1750; p.y = 1276;
    const car = makeCar(1750, 1276, 0, '#fd79a8', { driver: 'player' });
    game.cars.push(car); game.enterCarSilent(car);
    game.wanted.stars = 4; game.wanted.heat = 0; game.playerSeen = true;
    game.cars.push(makeCar(1600, 1240, 0.15, '#2d3436', { driver: 'police', police: true }));
    game.cars.push(makeCar(1580, 1330, -0.1, '#2d3436', { driver: 'police', police: true }));
    game.cars.push(makeCar(1900, 1310, Math.PI, '#2d3436', { driver: 'police', police: true }));
    game.missions.index = 3; game.startCurrentMissionSilent(); game.missions.stage = 1; game.missions.marker = { x: 290, y: 420 };
    clusterPeds(game, 1660, 1180, 6);
  } else if (scene === 'mission') {
    p.x = 2265; p.y = 1335; p.angle = 0.3;
    game.missions.index = 2; game.startCurrentMissionSilent();
    game.missions.marker = { x: 2330, y: 1345 };
    clusterPeds(game, 2330, 1360, 7);
    placeCars(game, [[2050, 1276, 0, '#1abc9c'], [2450, 1224, Math.PI, '#e74c3c']]);
  }
  game.camera.follow(game.playerPos(), game.view.w, game.view.h);
}
function placeCars(game, list) { for (const [x, y, a, c] of list) { const car = makeCar(x, y, a, c, { driver: 'traffic' }); car.axis = 'h'; game.cars.push(car); } }
function clusterPeds(game, x, y, n) { for (let i = 0; i < n && i < game.peds.length; i++) { const ped = game.peds[i + 2]; ped.x = x + (i % 4) * 34 - 50; ped.y = y + Math.floor(i / 4) * 36; ped.state = 'wander'; ped.wanderX = ped.x; ped.wanderY = ped.y; } }
