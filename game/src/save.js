// Progress persistence: money, mission index, side-job count, lifetime stats, story
// choices and unlocked endings, kept in localStorage only. v2 fields default cleanly
// so a v1 save (money/mission/started only) still loads.
import { SAVE_KEY } from './config.js';

export function defaultStats() { return { earned: 0, busts: 0, kills: 0, knockouts: 0 }; }
export function defaultChoices() { return { sparedRico: false, sharedCut: false, rivalDeal: false }; }

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return {
        money: d.money | 0, mission: d.mission | 0, started: !!d.started,
        sideDone: d.sideDone | 0,
        stats: { ...defaultStats(), ...(d.stats || {}) },
        choices: { ...defaultChoices(), ...(d.choices || {}) },
        endings: Array.isArray(d.endings) ? d.endings.filter((e) => typeof e === 'string') : [],
      };
    }
  } catch {}
  return { money: 50, mission: 0, started: false, sideDone: 0, stats: defaultStats(), choices: defaultChoices(), endings: [] };
}
export function storeSave(data) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {} }
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch {} }
