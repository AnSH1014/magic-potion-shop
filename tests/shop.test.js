// 손님·판매·씨앗 상점 규칙 테스트. 실행: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGarden, createInventory } from '../js/rules/garden.js';
import {
  craftablePotions, nextCustomer, serveCustomer, canBuySeed, buySeed, plantSeed,
} from '../js/rules/shop.js';

const T0 = 1_000_000;
const ids = (potions) => potions.map((p) => p.id).sort();

test('새 가방: 코인 0, 씨앗 0', () => {
  const inv = createInventory();
  assert.equal(inv.coins, 0);
  assert.deepEqual(inv.seeds, { starberry: 0, moonpumpkin: 0 });
});

test('만들 수 있는 물약 = 정원에 심긴 재료로 레시피를 채울 수 있는 물약', () => {
  const g = createGarden(T0);
  assert.deepEqual(ids(craftablePotions(g)), ['energy', 'healing', 'sleepy']);
  g.plots[3].crop = 'starberry';
  assert.deepEqual(ids(craftablePotions(g)), ['energy', 'healing', 'laugh', 'luck', 'sleepy', 'sparkle']);
  g.plots[4].crop = 'moonpumpkin';
  assert.equal(craftablePotions(g).length, 8);
});

test('손님은 지금 만들 수 있는 물약만 원한다 (영원히 못 만드는 소원으로 막히지 않게)', () => {
  const g = createGarden(T0);
  for (let r = 0; r < 1; r += 0.05) {
    const c = nextCustomer(g, null, () => r);
    assert.ok(['healing', 'sleepy', 'energy'].includes(c.wish));
  }
});

test('바로 앞 손님과 같은 소원은 피한다', () => {
  const g = createGarden(T0);
  for (let r = 0; r < 1; r += 0.05) {
    assert.notEqual(nextCustomer(g, 'healing', () => r).wish, 'healing');
  }
});

test('원하는 물약을 건네면 물약이 하나 줄고 가격만큼 코인을 받는다', () => {
  const inv = createInventory();
  inv.potions.healing = 2;
  const r = serveCustomer(inv, { wish: 'healing' }, 'healing');
  assert.deepEqual(r, { ok: true, coins: 10 });
  assert.equal(inv.potions.healing, 1);
  assert.equal(inv.coins, 10);
});

test('다른 물약을 건네면 받지 않고 아무것도 바뀌지 않는다', () => {
  const inv = createInventory();
  inv.potions.sleepy = 1;
  assert.deepEqual(serveCustomer(inv, { wish: 'healing' }, 'sleepy'), { ok: false, reason: 'wrong' });
  assert.equal(inv.potions.sleepy, 1);
  assert.equal(inv.coins, 0);
});

test('없는 물약은 건넬 수 없다', () => {
  const inv = createInventory();
  assert.deepEqual(serveCustomer(inv, { wish: 'healing' }, 'healing'), { ok: false, reason: 'none' });
});

test('씨앗 사기: 코인이 부족하면 살 수 없다', () => {
  const g = createGarden(T0);
  const inv = createInventory();
  inv.coins = 29;
  assert.deepEqual(canBuySeed(inv, g, 'starberry'), { ok: false, reason: 'coins' });
  assert.deepEqual(buySeed(inv, g, 'starberry'), { ok: false, reason: 'coins' });
  assert.equal(inv.coins, 29);
});

test('씨앗 사기: 코인이 줄고 씨앗 주머니에 들어간다', () => {
  const g = createGarden(T0);
  const inv = createInventory();
  inv.coins = 100;
  assert.deepEqual(buySeed(inv, g, 'starberry'), { ok: true });
  assert.equal(inv.coins, 70);
  assert.equal(inv.seeds.starberry, 1);
});

test('씨앗 사기: 처음 재료 씨앗은 상점에 없다', () => {
  const inv = createInventory();
  inv.coins = 100;
  assert.deepEqual(buySeed(inv, createGarden(T0), 'mint'), { ok: false, reason: 'invalid' });
});

test('씨앗 사기: 심을 빈 밭이 남지 않으면 더 살 수 없다 (가진 씨앗도 자리를 차지)', () => {
  const g = createGarden(T0); // 빈 밭 3칸
  const inv = createInventory();
  inv.coins = 1000;
  buySeed(inv, g, 'starberry');
  buySeed(inv, g, 'moonpumpkin');
  plantSeed(inv, g, 3, 'starberry', T0);
  assert.equal(buySeed(inv, g, 'starberry').ok, true);       // 빈 밭 2칸 - 가진 씨앗 1개 = 1칸 남음
  assert.deepEqual(buySeed(inv, g, 'starberry'), { ok: false, reason: 'noRoom' });
});

test('씨앗 심기: 빈 밭에 심으면 처음부터 자라기 시작하고 씨앗이 줄어든다', () => {
  const g = createGarden(T0);
  const inv = createInventory();
  inv.seeds.moonpumpkin = 1;
  assert.deepEqual(plantSeed(inv, g, 5, 'moonpumpkin', T0 + 5), { ok: true });
  assert.deepEqual(g.plots[5], { crop: 'moonpumpkin', plantedAt: T0 + 5 });
  assert.equal(inv.seeds.moonpumpkin, 0);
});

test('씨앗 심기: 이미 자라는 밭이나 씨앗이 없으면 심을 수 없다', () => {
  const g = createGarden(T0);
  const inv = createInventory();
  inv.seeds.starberry = 1;
  assert.deepEqual(plantSeed(inv, g, 0, 'starberry', T0), { ok: false, reason: 'occupied' });
  assert.deepEqual(plantSeed(inv, g, 3, 'moonpumpkin', T0), { ok: false, reason: 'noSeed' });
  assert.equal(inv.seeds.starberry, 1);
});
