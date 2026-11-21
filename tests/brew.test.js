// 솥 조합 규칙 테스트. 실행: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POTIONS } from '../js/data.js';
import { createInventory } from '../js/rules/garden.js';
import { findRecipe, brew, createCodex, isCodexComplete } from '../js/rules/brew.js';

// 재료를 원하는 만큼 넣어 둔 가방
function bagWith(counts) {
  const inv = createInventory();
  Object.assign(inv.ingredients, counts);
  return inv;
}

test('새 가방에는 물약 8종이 모두 0개', () => {
  const inv = createInventory();
  assert.deepEqual(Object.keys(inv.potions).sort(), POTIONS.map((p) => p.id).sort());
  assert.ok(Object.values(inv.potions).every((n) => n === 0));
});

test('레시피 찾기: 순서와 상관없이 같은 물약', () => {
  assert.equal(findRecipe(['dewflower', 'mint']).id, 'healing');
  assert.equal(findRecipe(['mint', 'dewflower']).id, 'healing');
  assert.equal(findRecipe(['mushroom', 'starberry', 'mint']).id, 'luck');
});

test('레시피 찾기: 8종 레시피가 모두 찾아진다', () => {
  for (const p of POTIONS) assert.equal(findRecipe([...p.recipe].reverse()).id, p.id);
});

test('레시피 찾기: 없는 조합이면 null (처음 재료 3개를 다 넣은 조합 포함)', () => {
  assert.equal(findRecipe(['dewflower', 'mushroom', 'mint']), null);
  assert.equal(findRecipe(['moonpumpkin', 'mushroom']), null);
  // 맞는 레시피에 재료를 하나 더 넣으면 다른 조합이다
  assert.equal(findRecipe(['moonpumpkin', 'starberry', 'mint']), null);
});

test('맞는 조합을 끓이면 재료가 줄고 물약이 생기며 도감에 새로 등록된다', () => {
  const inv = bagWith({ dewflower: 2, mint: 1 });
  const codex = createCodex();
  const r = brew(inv, codex, ['dewflower', 'mint']);
  assert.equal(r.ok, true);
  assert.equal(r.failed, false);
  assert.equal(r.potion.id, 'healing');
  assert.equal(r.isNew, true);
  assert.deepEqual(codex.discovered, ['healing']);
  assert.equal(inv.potions.healing, 1);
  assert.equal(inv.ingredients.dewflower, 1);
  assert.equal(inv.ingredients.mint, 0);
});

test('이미 발견한 물약을 또 만들면 isNew는 false, 도감은 그대로', () => {
  const inv = bagWith({ dewflower: 2, mint: 2 });
  const codex = createCodex();
  brew(inv, codex, ['dewflower', 'mint']);
  const r = brew(inv, codex, ['mint', 'dewflower']);
  assert.equal(r.isNew, false);
  assert.deepEqual(codex.discovered, ['healing']);
  assert.equal(inv.potions.healing, 2);
});

test('레시피에 없는 조합은 실패작이 되고 넣은 재료는 사라진다', () => {
  const inv = bagWith({ dewflower: 1, mushroom: 1, mint: 1 });
  const codex = createCodex();
  const r = brew(inv, codex, ['dewflower', 'mushroom', 'mint']);
  assert.equal(r.ok, true);
  assert.equal(r.failed, true);
  assert.deepEqual(inv.ingredients, { dewflower: 0, mushroom: 0, mint: 0, starberry: 0, moonpumpkin: 0 });
  assert.ok(Object.values(inv.potions).every((n) => n === 0));
  assert.deepEqual(codex.discovered, []);
});

test('재료가 부족하면 끓일 수 없고 아무것도 바뀌지 않는다', () => {
  const inv = bagWith({ dewflower: 1 });
  const codex = createCodex();
  const r = brew(inv, codex, ['dewflower', 'mint']);
  assert.deepEqual(r, { ok: false, reason: 'notEnough' });
  assert.equal(inv.ingredients.dewflower, 1);
});

test('재료는 2~3개만, 같은 재료는 한 번만 넣을 수 있다', () => {
  const inv = bagWith({ dewflower: 5, mint: 5, mushroom: 5, starberry: 5 });
  const codex = createCodex();
  assert.equal(brew(inv, codex, ['dewflower']).reason, 'count');
  assert.equal(brew(inv, codex, ['dewflower', 'mint', 'mushroom', 'starberry']).reason, 'count');
  assert.equal(brew(inv, codex, ['dewflower', 'dewflower']).reason, 'duplicate');
  assert.equal(inv.ingredients.dewflower, 5);
});

test('8종을 모두 발견하면 도감 완성', () => {
  const codex = createCodex();
  const inv = bagWith({ dewflower: 9, mushroom: 9, mint: 9, starberry: 9, moonpumpkin: 9 });
  POTIONS.forEach((p, i) => {
    assert.equal(isCodexComplete(codex), false);
    brew(inv, codex, p.recipe);
    assert.equal(codex.discovered.length, i + 1);
  });
  assert.equal(isCodexComplete(codex), true);
});
