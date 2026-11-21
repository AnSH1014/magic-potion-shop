// 솥 조합 규칙 (순수 JS)
// - 재료 2~3개, 같은 재료는 한 번만, 순서는 상관없음
// - 레시피와 맞으면 물약 1개 + 도감 등록, 아니면 실패작(재료만 사라짐)

import { POTIONS } from '../data.js';

// 재료 목록을 정렬해 "dewflower+mint" 같은 열쇠 문자열로 만든다 → 순서가 달라도 같은 열쇠
const keyOf = (ids) => [...ids].sort().join('+');
const RECIPE_BOOK = new Map(POTIONS.map((p) => [keyOf(p.recipe), p]));

export function findRecipe(ids) {
  return RECIPE_BOOK.get(keyOf(ids)) ?? null;
}

// 도감: 발견한 물약 id를 발견한 순서대로 담는다
export function createCodex() {
  return { discovered: [] };
}

export function isCodexComplete(codex) {
  return POTIONS.every((p) => codex.discovered.includes(p.id));
}

export function brew(inventory, codex, ids) {
  if (ids.length < 2 || ids.length > 3) return { ok: false, reason: 'count' };
  if (new Set(ids).size !== ids.length) return { ok: false, reason: 'duplicate' };
  if (ids.some((id) => !(inventory.ingredients[id] >= 1))) return { ok: false, reason: 'notEnough' };

  // 넣은 재료는 성공·실패와 상관없이 사라진다
  for (const id of ids) inventory.ingredients[id] -= 1;

  const potion = findRecipe(ids);
  if (!potion) return { ok: true, failed: true };

  inventory.potions[potion.id] += 1;
  const isNew = !codex.discovered.includes(potion.id);
  if (isNew) codex.discovered.push(potion.id);
  return { ok: true, failed: false, potion, isNew };
}
