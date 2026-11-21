// 정원 규칙 (순수 JS: three.js나 화면 코드 없이 Node에서도 돌아간다)
//
// 밭 한 칸은 { crop, plantedAt } 으로 나타낸다.
// - crop: 심어진 재료 id, 비어 있으면 null
// - plantedAt: 마지막으로 자라기 시작한 시각(ms). 지금 시각과 비교해 얼마나 자랐는지 계산한다.
// 시각을 저장해 두는 방식이라 게임을 껐다 켜도 그동안 자란 만큼 그대로 이어진다.

import { INGREDIENTS, POTIONS } from '../data.js';

export const PLOT_COUNT = 6;

// 재료별 다 자라는 데 걸리는 시간(ms)
export const GROW_TIME = {
  dewflower: 15_000,
  mushroom: 20_000,
  mint: 15_000,
  starberry: 30_000,
  moonpumpkin: 40_000,
};

// 새 정원: 앞 3칸에 처음 재료를 다 자란 상태로 심어 두고, 나머지 3칸은 씨앗용 빈 밭
export function createGarden(now) {
  const starters = INGREDIENTS.filter((i) => i.starter).map((i) => i.id);
  const plots = [];
  for (let i = 0; i < PLOT_COUNT; i++) {
    const crop = starters[i] ?? null;
    // 이미 다 자란 상태로 시작하도록 자람 시간만큼 과거에 심은 것으로 둔다
    plots.push({ crop, plantedAt: crop ? now - GROW_TIME[crop] : 0 });
  }
  return { plots };
}

// 새 가방: 재료마다 0개, 물약마다 0개, 코인 0, 상점 씨앗마다 0개
export function createInventory() {
  const ingredients = {};
  for (const i of INGREDIENTS) ingredients[i.id] = 0;
  const potions = {};
  for (const p of POTIONS) potions[p.id] = 0;
  const seeds = {};
  for (const i of INGREDIENTS) if (!i.starter) seeds[i.id] = 0;
  return { ingredients, potions, coins: 0, seeds };
}

// 0(막 심음) ~ 1(다 자람)
export function growthProgress(plot, now) {
  if (!plot || !plot.crop) return 0;
  const p = (now - plot.plantedAt) / GROW_TIME[plot.crop];
  return Math.min(1, Math.max(0, p));
}

export function isReady(plot, now) {
  return growthProgress(plot, now) >= 1;
}

// 수확: 다 자랐으면 가방에 1개 넣고 그 자리에서 다시 자라기 시작한다
export function harvest(garden, inventory, plotIndex, now) {
  const plot = garden.plots[plotIndex];
  if (!plot || !plot.crop) return { ok: false, reason: 'empty' };
  if (!isReady(plot, now)) return { ok: false, reason: 'growing' };
  inventory.ingredients[plot.crop] += 1;
  plot.plantedAt = now;
  return { ok: true, crop: plot.crop };
}
