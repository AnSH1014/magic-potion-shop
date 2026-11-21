// 저장·불러오기 (순수 JS)
// 저장하는 것: 코인, 도감 발견 상태, 보유 씨앗·재료·물약, 정원 상태 (개인정보 없음)
// 저장소(localStorage)는 밖에서 넘겨받아서 Node 테스트에서는 가짜 저장소를 쓸 수 있다.

import { INGREDIENTS, POTIONS } from '../data.js';
import { PLOT_COUNT, createGarden, createInventory } from './garden.js';
import { createCodex } from './brew.js';

export const SAVE_KEY = 'magic-potion-shop-save';
const VERSION = 1;

const INGREDIENT_IDS = INGREDIENTS.map((i) => i.id);
const SEED_IDS = INGREDIENTS.filter((i) => !i.starter).map((i) => i.id);
const POTION_IDS = POTIONS.map((p) => p.id);

export function newGame(now) {
  return { garden: createGarden(now), inventory: createInventory(), codex: createCodex() };
}

export function serialize(state) {
  return JSON.stringify({
    version: VERSION,
    garden: state.garden,
    inventory: state.inventory,
    codex: state.codex,
  });
}

// ───── 검사 도우미 ─────
const isCount = (n) => Number.isInteger(n) && n >= 0;
const isObj = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);

// { id: 개수 } 표를 알려진 id만 골라 새로 만든다. 하나라도 이상하면 null
function readCounts(obj, ids) {
  if (!isObj(obj)) return null;
  const out = {};
  for (const id of ids) {
    if (!isCount(obj[id])) return null;
    out[id] = obj[id];
  }
  return out;
}

// 저장 글자를 게임 상태로 되돌린다. 깨졌거나 형식이 다르면 null.
// 저장된 값을 그대로 믿지 않고, 아는 칸만 하나씩 검사해 새 객체에 옮겨 담는다.
export function deserialize(text, now) {
  if (!text) return null;
  let d;
  try { d = JSON.parse(text); } catch { return null; }
  if (!isObj(d) || d.version !== VERSION) return null;
  if (!isObj(d.garden) || !isObj(d.inventory) || !isObj(d.codex)) return null;

  // 정원
  const plotsIn = d.garden.plots;
  if (!Array.isArray(plotsIn) || plotsIn.length !== PLOT_COUNT) return null;
  const plots = [];
  for (const p of plotsIn) {
    if (!isObj(p)) return null;
    if (p.crop !== null && !INGREDIENT_IDS.includes(p.crop)) return null;
    if (!Number.isFinite(p.plantedAt)) return null;
    // 기기 시계가 바뀌어 미래 시각이 저장돼 있으면 지금으로 맞춘다 (영원히 안 자라는 일 방지)
    plots.push({ crop: p.crop, plantedAt: Math.min(p.plantedAt, now) });
  }

  // 가방
  const ingredients = readCounts(d.inventory.ingredients, INGREDIENT_IDS);
  const potions = readCounts(d.inventory.potions, POTION_IDS);
  const seeds = readCounts(d.inventory.seeds, SEED_IDS);
  if (!ingredients || !potions || !seeds || !isCount(d.inventory.coins)) return null;

  // 도감
  const disc = d.codex.discovered;
  if (!Array.isArray(disc) || !disc.every((id) => POTION_IDS.includes(id))) return null;
  const discovered = [...new Set(disc)];

  return {
    garden: { plots },
    inventory: { ingredients, potions, coins: d.inventory.coins, seeds },
    codex: { discovered },
  };
}

// 저장소에 쓰기. 저장소를 쓸 수 없으면(사생활 보호 모드 등) false
export function saveGame(storage, state) {
  try {
    storage.setItem(SAVE_KEY, serialize(state));
    return true;
  } catch {
    return false;
  }
}

// 저장소에서 읽기. 없거나 깨졌거나 읽을 수 없으면 새 게임
export function loadGame(storage, now) {
  let text = null;
  try { text = storage.getItem(SAVE_KEY); } catch { /* 읽을 수 없으면 새 게임 */ }
  return deserialize(text, now) ?? newGame(now);
}
