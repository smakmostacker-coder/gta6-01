// Progress persistence: money, mission index and best cash kept in localStorage only.
import { SAVE_KEY } from './config.js';
export function loadSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const d = JSON.parse(raw); return { money: d.money | 0, mission: d.mission | 0, started: !!d.started }; } } catch {}
  return { money: 50, mission: 0, started: false };
}
export function storeSave(data) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {} }
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch {} }
