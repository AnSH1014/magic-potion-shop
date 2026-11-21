// 정원 규칙 테스트. 실행: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GROW_TIME, PLOT_COUNT, createGarden, createInventory,
  growthProgress, isReady, harvest,
} from '../js/rules/garden.js';

const T0 = 1_000_000; // 테스트용 시작 시각(ms)

test('새 정원: 밭 6칸, 앞 3칸에 처음 재료 3종이 다 자란 채로 심겨 있다', () => {
  const g = createGarden(T0);
  assert.equal(g.plots.length, PLOT_COUNT);
  assert.deepEqual(g.plots.slice(0, 3).map((p) => p.crop), ['dewflower', 'mushroom', 'mint']);
  assert.deepEqual(g.plots.slice(3).map((p) => p.crop), [null, null, null]);
  for (const p of g.plots.slice(0, 3)) assert.equal(isReady(p, T0), true);
});

test('새 가방: 재료 5종이 모두 0개', () => {
  const inv = createInventory();
  assert.deepEqual(inv.ingredients, { dewflower: 0, mushroom: 0, mint: 0, starberry: 0, moonpumpkin: 0 });
});

test('다 자란 재료를 수확하면 가방에 1개 들어가고, 밭은 처음부터 다시 자란다', () => {
  const g = createGarden(T0);
  const inv = createInventory();
  const result = harvest(g, inv, 0, T0);
  assert.equal(result.ok, true);
  assert.equal(result.crop, 'dewflower');
  assert.equal(inv.ingredients.dewflower, 1);
  assert.equal(g.plots[0].crop, 'dewflower');   // 뽑히지 않고 그대로
  assert.equal(growthProgress(g.plots[0], T0), 0);
  assert.equal(isReady(g.plots[0], T0), false);
});

test('자라는 중에는 진행률이 0~1 사이로 늘고, 자람 시간이 지나면 다시 수확할 수 있다', () => {
  const g = createGarden(T0);
  const inv = createInventory();
  harvest(g, inv, 1, T0);
  const t = GROW_TIME.mushroom;
  assert.equal(growthProgress(g.plots[1], T0 + t / 2), 0.5);
  assert.equal(isReady(g.plots[1], T0 + t - 1), false);
  assert.equal(isReady(g.plots[1], T0 + t), true);
  assert.equal(growthProgress(g.plots[1], T0 + t * 3), 1); // 1을 넘지 않는다
  assert.equal(harvest(g, inv, 1, T0 + t).ok, true);
  assert.equal(inv.ingredients.mushroom, 2);
});

test('덜 자란 재료는 수확할 수 없고 가방도 그대로다', () => {
  const g = createGarden(T0);
  const inv = createInventory();
  harvest(g, inv, 2, T0);
  const r = harvest(g, inv, 2, T0 + 1000);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'growing');
  assert.equal(inv.ingredients.mint, 1);
});

test('빈 밭이나 없는 밭 번호는 수확할 수 없다', () => {
  const g = createGarden(T0);
  const inv = createInventory();
  assert.deepEqual(harvest(g, inv, 4, T0), { ok: false, reason: 'empty' });
  assert.deepEqual(harvest(g, inv, 99, T0), { ok: false, reason: 'empty' });
});

test('빈 밭의 진행률은 0', () => {
  const g = createGarden(T0);
  assert.equal(growthProgress(g.plots[5], T0), 0);
  assert.equal(isReady(g.plots[5], T0), false);
});
