// 화면 위에 겹쳐 보이는 HTML UI (목업 references/05_ui_mockup.webp 배치)
//  - 왼쪽 위: 코인 배지 / 오른쪽 위: 음악·효과음 버튼, 도감 배지, 하루 게이지
//  - 아래 가운데: 솥 칸 3개 + 끓이기 버튼 / 아래 오른쪽: 가방·도감·씨앗 상점 버튼
//  - 패널(가방, 도감, 상점, 물약 건네기, 씨앗 심기)은 아래에서 올라온다

import { INGREDIENTS, POTIONS } from './data.js';
import { INGREDIENT_ICONS, potionIcon, COIN_ICON, BAG_ICON, BOOK_ICON, SHOP_ICON, MUSIC_ICON, SPEAKER_ICON, SEED_ICON } from './icons.js';

const ING = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));
const $ = (sel) => document.querySelector(sel);

// 고정 아이콘 채워 넣기
$('#coinIcon').innerHTML = COIN_ICON;
$('#musicBtn').innerHTML = MUSIC_ICON;
$('#sfxBtn').innerHTML = SPEAKER_ICON;
$('#codexBadgeIcon').innerHTML = BOOK_ICON;
$('#bagBtn .ico').innerHTML = BAG_ICON;
$('#codexBtn .ico').innerHTML = BOOK_ICON;
$('#shopBtn .ico').innerHTML = SHOP_ICON;

// 마지막으로 받은 가방 상태 (솥 칸·가방 패널을 다시 그릴 때 쓴다)
let inv = null;
let unlockedIds = new Set();

// ───── 코인·가방 숫자 갱신 ─────
export function renderInventory(inventory, unlocked) {
  inv = inventory;
  unlockedIds = unlocked;
  $('#coinCount').textContent = inventory.coins;
  renderTray();
  if ($('#bagPanel').classList.contains('open')) renderBag();
}

export function renderCodexBadge(codex) {
  $('#codexBadgeCount').textContent = `${codex.discovered.length}/${POTIONS.length}`;
}

// 방금 늘어난 것을 통 튀게: 코인이면 코인 배지, 재료면 가방 버튼 위로 "+1"
function bumpEl(el) {
  el.classList.remove('bump');
  void el.offsetWidth; // 애니메이션을 다시 시작하기 위한 작은 요령
  el.classList.add('bump');
}
export function bumpChip(id) {
  if (id === 'coins') return bumpEl($('#coinBadge'));
  const bag = $('#bagBtn');
  bumpEl(bag);
  if (ING[id]) {
    const f = document.createElement('div');
    f.className = 'floater';
    f.innerHTML = `${INGREDIENT_ICONS[id]}<b>+1</b>`;
    bag.appendChild(f);
    setTimeout(() => f.remove(), 900);
  }
}

// ───── 짧은 안내 ─────
let toastTimer = 0;
export function toast(message, ms = 1400) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

// ───── 패널 열고 닫기 ─────
// 패널이 열리면 뒤에 반투명 막(#scrim)을 깔아, 패널 바깥을 누르면 닫히게 한다
function openPanel(id) {
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('open', p.id === id));
  $('#scrim').classList.add('show');
  document.body.classList.toggle('bag-open', id === 'bagPanel');
}
export function closePanels() {
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('open'));
  $('#scrim').classList.remove('show');
  document.body.classList.remove('bag-open');
}
document.querySelectorAll('.panel .close').forEach((b) => b.addEventListener('click', closePanels));
$('#scrim').addEventListener('click', closePanels);

// ───── 솥 칸 (아래 가운데) ─────
// 가방에서 재료를 누르면 칸에 들어가고, 칸의 ✕를 누르면 빠진다. 2~3개가 차면 "끓이기"가 켜진다.
let selected = [];
let onBrewHandler = null;
export function setupTray(onBrew) { onBrewHandler = onBrew; }

function renderTray() {
  $('#slots').innerHTML = [0, 1, 2].map((i) => {
    const id = selected[i];
    return id
      ? `<button class="slot full" data-slot="${i}" aria-label="${ING[id].name} 빼기">${INGREDIENT_ICONS[id]}<span class="x">✕</span></button>`
      : `<button class="slot" data-slot="${i}" aria-label="재료 넣기"><span class="plus">+</span></button>`;
  }).join('');
  $('#brewBtn').disabled = selected.length < 2;
}

$('#slots').addEventListener('click', (e) => {
  const b = e.target.closest('[data-slot]');
  if (!b) return;
  const i = Number(b.dataset.slot);
  if (selected[i]) { selected.splice(i, 1); renderTray(); if ($('#bagPanel').classList.contains('open')) renderBag(); }
  else openBag(); // 빈 칸을 누르면 가방이 열려 재료를 고를 수 있다
});

function pickIngredient(id) {
  if (selected.includes(id)) selected = selected.filter((x) => x !== id);
  else if (inv.ingredients[id] < 1) return toast('재료가 부족해요');
  else if (selected.length >= 3) return toast('재료는 3개까지 넣을 수 있어요');
  else selected.push(id);
  renderTray();
  renderBag();
}

$('#brewBtn').addEventListener('click', () => {
  if (selected.length < 2) return;
  const ids = selected;
  selected = [];
  closePanels(); // 패널을 닫아 솥에서 나오는 결과를 보여 준다
  renderTray();
  onBrewHandler?.(ids);
});

// ───── 가방 ─────
// 재료(누르면 솥 칸으로), 물약, 씨앗을 한눈에
export function openBag() {
  renderBag();
  openPanel('bagPanel');
}

function tile({ icon, name, count, data = '', cls = '' }) {
  return `<button class="tile ${cls}" ${data}>
    <span class="ico">${icon}</span><span class="cnt">${count}</span><span class="nm">${name}</span>
  </button>`;
}

function renderBag() {
  if (!inv) return;
  $('#bagIngredients').innerHTML = INGREDIENTS.map((ing) => {
    const left = inv.ingredients[ing.id] - (selected.includes(ing.id) ? 1 : 0);
    const dim = !unlockedIds.has(ing.id) && inv.ingredients[ing.id] === 0;
    const on = selected.includes(ing.id);
    return tile({ icon: INGREDIENT_ICONS[ing.id], name: ing.name, count: left, data: `data-id="${ing.id}"`, cls: `${on ? 'on' : ''} ${dim ? 'dim' : ''}` });
  }).join('');
  const potions = POTIONS.filter((p) => inv.potions[p.id] > 0);
  $('#bagPotions').innerHTML = potions.length
    ? potions.map((p) => tile({ icon: potionIcon(p.color), name: p.name, count: inv.potions[p.id], cls: 'static' })).join('')
    : '<p class="empty">아직 만든 물약이 없어요</p>';
  const seeds = INGREDIENTS.filter((i) => !i.starter && inv.seeds[i.id] > 0);
  $('#bagSeeds').innerHTML = seeds.length
    ? seeds.map((s) => tile({ icon: SEED_ICON, name: `${s.name} 씨앗`, count: inv.seeds[s.id], cls: 'static' })).join('')
    : '<p class="empty">씨앗은 상점에서 살 수 있어요</p>';
}

$('#bagIngredients').addEventListener('click', (e) => {
  const b = e.target.closest('[data-id]');
  if (b) pickIngredient(b.dataset.id);
});

// ───── 도감 ─────
// hintFor: 손님이 원하는 물약 id. 아직 발견하지 못했다면 그 칸에 힌트 한 줄을 보여 준다.
export function openCodex(inventory, codex, hintFor) {
  const found = new Set(codex.discovered);
  $('#codexCount').textContent = `${found.size} / ${POTIONS.length}`;
  $('#codexDone').hidden = found.size < POTIONS.length;
  $('#codexGrid').innerHTML = POTIONS.map((p) => {
    if (!found.has(p.id)) {
      if (p.id === hintFor) {
        return `<div class="card unknown wanted"><span class="ico">${potionIcon(p.color)}</span><b>???</b>
          <small>🧚 손님이 찾는 물약</small><small class="hint">💡 ${p.hint}</small></div>`;
      }
      return `<div class="card unknown"><span class="ico">${potionIcon('', true)}</span><b>???</b><small>아직 발견하지 못했어요</small></div>`;
    }
    const recipe = p.recipe.map((id) => `<span class="mini">${INGREDIENT_ICONS[id]}</span>`).join('<i>+</i>');
    return `<div class="card"><span class="ico">${potionIcon(p.color)}</span><b>${p.name}</b>
      <span class="recipe">${recipe}</span><small class="own">보유 ${inventory.potions[p.id]}개</small></div>`;
  }).join('');
  openPanel('codexPanel');
}

// ───── 요정 손님 말풍선 ─────
// 3D 장면 속 요정 머리 위 화면 좌표(x, y)에 HTML 말풍선을 붙인다.
export function setBubble(customer, discovered) {
  const el = $('#bubble');
  if (!customer) { el.classList.remove('show'); return; }
  const p = POTIONS.find((x) => x.id === customer.wish);
  const sub = discovered.includes(p.id)
    ? `<small>👉 ${p.name}</small>`
    : `<small>❓ 처음 보는 물약이에요. 도감에 힌트가 있어요</small>`;
  el.innerHTML = `${p.wish}${sub}`;
  el.classList.remove('show', 'pop');
  void el.offsetWidth;
  el.classList.add('show', 'pop');
}
export function placeBubble(x, y) {
  const el = $('#bubble');
  // 요정이 화면 가장자리에 있어도 말풍선이 화면 밖으로 잘리지 않게 안쪽으로 밀어 준다
  const half = el.offsetWidth / 2 + 8;
  const cx = Math.min(Math.max(x, half), window.innerWidth - half);
  el.style.left = `${cx}px`;
  el.style.top = `${Math.max(y, el.offsetHeight + 8)}px`;
  // 꼬리는 원래 요정 위치를 가리키도록
  el.style.setProperty('--tail', `${x - cx}px`);
}

// ───── 물약 건네기 패널 ─────
export function openGivePanel(inventory, customer, onGive) {
  const wish = POTIONS.find((x) => x.id === customer.wish);
  $('#giveWish').textContent = `“${wish.wish}”`;
  const owned = POTIONS.filter((p) => inventory.potions[p.id] > 0);
  $('#giveList').innerHTML = owned.length
    ? owned.map((p) => tile({ icon: potionIcon(p.color), name: p.name, count: inventory.potions[p.id], data: `data-id="${p.id}"` })).join('')
    : `<p class="empty">아직 건넬 물약이 없어요. 솥에서 물약을 만들어 보세요!</p>`;
  $('#giveList').onclick = (e) => {
    const b = e.target.closest('[data-id]');
    if (!b) return;
    closePanels();
    onGive(b.dataset.id);
  };
  openPanel('givePanel');
}

// ───── 씨앗 상점 ─────
// canBuy(id) → { ok, reason }, onBuy(id) 는 main.js 에서 규칙 모듈과 연결해 넘겨준다.
const BUY_REASON = { coins: '코인이 부족해요', noRoom: '빈 밭이 없어요' };
export function openShop(inventory, canBuy, onBuy) {
  const render = () => {
    $('#shopCoins').innerHTML = `<span class="ico">${COIN_ICON}</span>${inventory.coins}`;
    $('#shopList').innerHTML = INGREDIENTS.filter((i) => !i.starter).map((s) => {
      const c = canBuy(s.id);
      return `<div class="seed">
        <span class="ico big">${INGREDIENT_ICONS[s.id]}</span>
        <div class="info"><b>${s.name} 씨앗</b><small>가진 씨앗 ${inventory.seeds[s.id]}개${c.ok ? '' : ` · ${BUY_REASON[c.reason]}`}</small></div>
        <button class="buy" data-id="${s.id}" ${c.ok ? '' : 'disabled'}><span class="ico">${COIN_ICON}</span>${s.seedPrice}</button>
      </div>`;
    }).join('');
  };
  $('#shopList').onclick = (e) => {
    const b = e.target.closest('button[data-id]');
    if (!b || b.disabled) return;
    onBuy(b.dataset.id);
    render();
  };
  render();
  openPanel('shopPanel');
}

// ───── 빈 밭에 씨앗 심기 ─────
export function openPlantPanel(inventory, onPlant) {
  const owned = INGREDIENTS.filter((i) => !i.starter && inventory.seeds[i.id] > 0);
  $('#plantList').innerHTML = owned.map((s) =>
    tile({ icon: INGREDIENT_ICONS[s.id], name: `${s.name} 씨앗`, count: inventory.seeds[s.id], data: `data-id="${s.id}"` })).join('');
  $('#plantList').onclick = (e) => {
    const b = e.target.closest('[data-id]');
    if (!b) return;
    closePanels();
    onPlant(b.dataset.id);
  };
  openPanel('plantPanel');
}
