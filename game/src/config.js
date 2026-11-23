// Central tuning for Palm Cove: world size, speeds, colours and economy in one place.
export const WORLD = { w: 4000, h: 3000 };
export const STEP = 1 / 60;
export const ROAD = { spacingX: 500, spacingY: 500, width: 110 };
export const PLAYER = { radius: 14, walk: 175, sprint: 295, health: 100 };
export const SAVE_KEY = 'palm-cove-save-v1';
// v2 tuning: side-job payouts and race shape, plus the story's money stakes.
// The debt is what Vera's four story jobs must clear; the cut and the rival's
// bribe are the two money choices that steer the ending (see endings.js).
export const SIDE = { taxiReward: 180, raceReward: 300, vigilanteReward: 350, courierReward: 220, repoReward: 280, raceCheckpoints: 5, raceTime: 95 };
export const STORY_MONEY = { debtTotal: 2550, luciaCut: 200, rivalBribe: 800 };
export const PALETTE = { grass:'#79c24e', park:'#55b345', water:'#2f9ec4', sand:'#f2d492', road:'#3a3f46', roadLine:'#f7d154', sidewalk:'#d6cfbc' };
export const CAR_COLORS = ['#e74c3c','#3498db','#f1c40f','#2ecc71','#e67e22','#9b59b6','#ecf0f1','#1abc9c','#fd79a8','#00b894'];
export const BUILDING_COLORS = ['#f6b352','#f49fbc','#a8d8ea','#ffeaa7','#dfe6e9','#fab1a0','#81ecec','#fdcb6e','#e17055','#74b9ff'];
export const FONT = 'system-ui, "Segoe UI", sans-serif';
