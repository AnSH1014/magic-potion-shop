// 저장·불러오기 규칙 테스트. 실행: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_KEY, newGame, serialize, deserialize, saveGame, loadGame } from '../js/rules/save.js';
import { GROW_TIME, isReady, harvest } from '../js/rules/garden.js';
import { brew } from '../js/rules/brew.js';

const T0 = 1_000_000;

// 브라우저 localStorage 흉내
function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
  };
}

// 이것저것 해 본 게임 상태
function playedGame() {
  const s = newGame(T0);
  harvest(s.garden, s.inventory, 0, T0);
  harvest(s.garden, s.inventory, 2, T0);
  brew(s.inventory, s.codex, ['dewflower', 'mint']);
  s.inventory.coins = 42;
  s.inventory.seeds.starberry = 1;
  s.garden.plots[4] = { crop: 'moonpumpkin', plantedAt: T0 - 5000 };
  return s;
}

test('새 게임: 정원·가방·도감이 처음 상태', () => {
  const s = newGame(T0);
  assert.equal(s.garden.plots.length, 6);
  assert.equal(s.inventory.coins, 0);
  assert.deepEqual(s.codex.discovered, []);
});

test('저장한 것을 그대로 불러온다 (코인, 도감, 씨앗·재료·물약, 정원)', () => {
  const s = playedGame();
  const loaded = deserialize(serialize(s), T0);
  assert.deepEqual(loaded.garden, s.garden);
  assert.deepEqual(loaded.inventory, s.inventory);
  assert.deepEqual(loaded.codex, s.codex);
});

test('게임을 꺼 둔 동안에도 재료가 자란다 (심은 시각을 저장하므로)', () => {
  const s = newGame(T0);
  harvest(s.garden, s.inventory, 1, T0);
  const text = serialize(s);
  assert.equal(isReady(deserialize(text, T0 + 1000).garden.plots[1], T0 + 1000), false);
  const later = T0 + GROW_TIME.mushroom;
  assert.equal(isReady(deserialize(text, later).garden.plots[1], later), true);
});

test('심은 시각이 지금보다 미래면(기기 시계가 바뀐 경우) 지금으로 맞춘다', () => {
  const s = newGame(T0);
  s.garden.plots[0].plantedAt = T0 + 999_999;
  assert.equal(deserialize(serialize(s), T0).garden.plots[0].plantedAt, T0);
});

test('저장 데이터가 없거나 깨졌으면 null (→ 새 게임)', () => {
  assert.equal(deserialize(null, T0), null);
  assert.equal(deserialize('', T0), null);
  assert.equal(deserialize('{이건 JSON이 아님', T0), null);
  assert.equal(deserialize('123', T0), null);
  assert.equal(deserialize('null', T0), null);
});

test('형식이 다르면 null (→ 새 게임)', () => {
  const good = JSON.parse(serialize(playedGame()));
  const broken = [
    (d) => { d.version = 99; },
    (d) => { delete d.inventory; },
    (d) => { d.inventory.coins = -5; },
    (d) => { d.inventory.coins = '많이'; },
    (d) => { d.inventory.ingredients.mint = 1.5; },
    (d) => { delete d.inventory.potions.dream; },
    (d) => { d.inventory.seeds.starberry = null; },
    (d) => { d.garden.plots.pop(); },
    (d) => { d.garden.plots[0].crop = '독버섯'; },
    (d) => { d.garden.plots[0].plantedAt = 'yesterday'; },
    (d) => { d.codex.discovered.push('없는물약'); },
    (d) => { d.codex.discovered = 'healing'; },
  ];
  for (const breakIt of broken) {
    const d = structuredClone(good);
    breakIt(d);
    assert.equal(deserialize(JSON.stringify(d), T0), null, breakIt.toString());
  }
});

test('saveGame/loadGame: 저장소에 썼다가 다시 읽는다', () => {
  const storage = fakeStorage();
  const s = playedGame();
  assert.equal(saveGame(storage, s), true);
  assert.ok(storage.data[SAVE_KEY]);
  assert.deepEqual(loadGame(storage, T0).inventory, s.inventory);
});

test('loadGame: 저장이 없거나 깨졌으면 새 게임을 돌려준다', () => {
  assert.deepEqual(loadGame(fakeStorage(), T0), newGame(T0));
  assert.deepEqual(loadGame(fakeStorage({ [SAVE_KEY]: '망가짐' }), T0), newGame(T0));
});

test('저장소를 쓸 수 없어도(사생활 보호 모드 등) 오류 없이 넘어간다', () => {
  const blocked = {
    getItem() { throw new Error('막힘'); },
    setItem() { throw new Error('막힘'); },
  };
  assert.equal(saveGame(blocked, newGame(T0)), false);
  assert.deepEqual(loadGame(blocked, T0), newGame(T0));
});
