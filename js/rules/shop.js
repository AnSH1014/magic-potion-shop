// 손님·판매·씨앗 상점 규칙 (순수 JS)

import { INGREDIENTS, POTIONS } from '../data.js';

// 정원에 심긴 재료만으로 레시피를 채울 수 있는 물약들
export function craftablePotions(garden) {
  const grown = new Set(garden.plots.map((p) => p.crop).filter(Boolean));
  return POTIONS.filter((p) => p.recipe.every((id) => grown.has(id)));
}

// 다음 손님의 소원 고르기.
// 손님은 시간 제한 없이 기다리므로, 지금 정원으로 만들 수 있는 물약만 원하게 해서 게임이 막히지 않게 한다.
// rand: 0 이상 1 미만의 수를 돌려주는 함수 (테스트에서 결과를 정해 두려고 밖에서 받는다)
export function nextCustomer(garden, prevWish, rand = Math.random) {
  let options = craftablePotions(garden);
  if (options.length > 1) options = options.filter((p) => p.id !== prevWish);
  const pick = options[Math.floor(rand() * options.length)];
  return { wish: pick.id };
}

// 손님에게 물약 건네기
export function serveCustomer(inventory, customer, potionId) {
  if (!(inventory.potions[potionId] >= 1)) return { ok: false, reason: 'none' };
  if (potionId !== customer.wish) return { ok: false, reason: 'wrong' };
  const price = POTIONS.find((p) => p.id === potionId).price;
  inventory.potions[potionId] -= 1;
  inventory.coins += price;
  return { ok: true, coins: price };
}

// ───── 씨앗 상점 ─────
export const SEEDS = INGREDIENTS.filter((i) => !i.starter);

// 빈 밭 수 - 이미 가진 씨앗 수 = 더 살 수 있는 씨앗 수
function roomForSeeds(inventory, garden) {
  const empty = garden.plots.filter((p) => !p.crop).length;
  const owned = Object.values(inventory.seeds).reduce((a, b) => a + b, 0);
  return empty - owned;
}

export function canBuySeed(inventory, garden, seedId) {
  const seed = SEEDS.find((s) => s.id === seedId);
  if (!seed) return { ok: false, reason: 'invalid' };
  if (inventory.coins < seed.seedPrice) return { ok: false, reason: 'coins' };
  if (roomForSeeds(inventory, garden) <= 0) return { ok: false, reason: 'noRoom' };
  return { ok: true };
}

export function buySeed(inventory, garden, seedId) {
  const check = canBuySeed(inventory, garden, seedId);
  if (!check.ok) return check;
  inventory.coins -= SEEDS.find((s) => s.id === seedId).seedPrice;
  inventory.seeds[seedId] += 1;
  return { ok: true };
}

// 빈 밭에 씨앗 심기: 그때부터 자라기 시작한다
export function plantSeed(inventory, garden, plotIndex, seedId, now) {
  const plot = garden.plots[plotIndex];
  if (!plot || plot.crop) return { ok: false, reason: 'occupied' };
  if (!(inventory.seeds[seedId] >= 1)) return { ok: false, reason: 'noSeed' };
  inventory.seeds[seedId] -= 1;
  plot.crop = seedId;
  plot.plantedAt = now;
  return { ok: true };
}
