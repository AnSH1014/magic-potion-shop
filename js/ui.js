// 화면 위에 겹쳐 보이는 HTML UI: 보유 재료, 안내 메시지, 솥 패널, 도감

import { INGREDIENTS, POTIONS } from './data.js';

const ING = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));
const $ = (sel) => document.querySelector(sel);

// ───── 보유 재료 ─────
// 씨앗으로 여는 재료는 아직 없으면 흐리게 보인다.
export function renderInventory(inventory, unlocked) {
  const coinChip = `<div class="chip coin" data-id="coins"><span class="name">🪙</span><b class="count">${inventory.coins}</b></div>`;
  $('#hud').innerHTML = coinChip + INGREDIENTS.map((ing) => {
    const count = inventory.ingredients[ing.id];
    const dim = !unlocked.has(ing.id) && count === 0;
    return `<div class="chip${dim ? ' dim' : ''}" data-id="${ing.id}">
      <span class="dot" style="background:${ing.color}"></span>
      <span class="name">${ing.name}</span>
      <b class="count">${count}</b>
    </div>`;
  }).join('');
}

// 방금 늘어난 재료 칩을 통 튀게
export function bumpChip(id) {
  const chip = $(`#hud [data-id="${id}"]`);
  if (!chip) return;
  chip.classList.remove('bump');
  void chip.offsetWidth; // 애니메이션을 다시 시작하기 위한 작은 요령
  chip.classList.add('bump');
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
}
export function closePanels() {
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('open'));
  $('#scrim').classList.remove('show');
}
document.querySelectorAll('.panel .close').forEach((b) => b.addEventListener('click', closePanels));
$('#scrim').addEventListener('click', closePanels);

// ───── 솥 패널 ─────
// 재료를 눌러 칸에 넣고(최대 3개), 다시 누르면 뺀다. 2~3개가 차면 "끓이기"가 켜진다.
let selected = [];
let brewCtx = null; // { inventory, unlocked, onBrew }

export function openBrewPanel(inventory, unlocked, onBrew) {
  selected = [];
  brewCtx = { inventory, unlocked, onBrew };
  renderBrew();
  openPanel('brewPanel');
}

function renderBrew() {
  const { inventory, unlocked } = brewCtx;
  // 넣은 재료 칸 3개
  $('#slots').innerHTML = [0, 1, 2].map((i) => {
    const id = selected[i];
    return id
      ? `<button class="slot full" data-slot="${i}"><span class="dot" style="background:${ING[id].color}"></span>${ING[id].name}</button>`
      : `<div class="slot">${i < 2 ? '재료' : '(선택)'}</div>`;
  }).join('');
  // 고를 수 있는 재료 (칸에 넣은 만큼 남은 수가 줄어 보인다)
  $('#ingredientPicker').innerHTML = INGREDIENTS.map((ing) => {
    const left = inventory.ingredients[ing.id] - (selected.includes(ing.id) ? 1 : 0);
    const dim = !unlocked.has(ing.id) && inventory.ingredients[ing.id] === 0;
    const on = selected.includes(ing.id);
    return `<button class="pick${on ? ' on' : ''}${dim ? ' dim' : ''}" data-id="${ing.id}">
      <span class="dot" style="background:${ing.color}"></span>${ing.name} <b>${left}</b>
    </button>`;
  }).join('');
  $('#brewBtn').disabled = selected.length < 2;
}

$('#slots').addEventListener('click', (e) => {
  const b = e.target.closest('[data-slot]');
  if (!b) return;
  selected.splice(Number(b.dataset.slot), 1);
  renderBrew();
});

$('#ingredientPicker').addEventListener('click', (e) => {
  const b = e.target.closest('[data-id]');
  if (!b) return;
  const id = b.dataset.id;
  if (selected.includes(id)) selected = selected.filter((x) => x !== id);
  else if (brewCtx.inventory.ingredients[id] < 1) return toast('재료가 부족해요');
  else if (selected.length >= 3) return toast('재료는 3개까지 넣을 수 있어요');
  else selected.push(id);
  renderBrew();
});

$('#brewBtn').addEventListener('click', () => {
  if (selected.length < 2) return;
  const ids = selected;
  closePanels(); // 패널을 닫아 솥에서 나오는 결과를 보여 준다
  brewCtx.onBrew(ids);
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
        return `<div class="card unknown wanted"><div class="bottle" style="--c:${p.color}"></div><b>???</b>
          <small>🧚 손님이 찾는 물약</small><small class="hint">💡 ${p.hint}</small></div>`;
      }
      return `<div class="card unknown"><div class="bottle" style="--c:#D9D2DE"></div><b>???</b><small>아직 발견하지 못했어요</small></div>`;
    }
    const recipe = p.recipe.map((id) => ING[id].name).join(' + ');
    return `<div class="card"><div class="bottle" style="--c:${p.color}"></div><b>${p.name}</b>
      <small>${recipe}</small><small class="own">보유 ${inventory.potions[p.id]}개</small></div>`;
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
    ? owned.map((p) => `<button class="pick" data-id="${p.id}"><span class="dot" style="background:${p.color}"></span>${p.name} <b>${inventory.potions[p.id]}</b></button>`).join('')
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
    $('#shopCoins').textContent = `🪙 ${inventory.coins}`;
    $('#shopList').innerHTML = INGREDIENTS.filter((i) => !i.starter).map((s) => {
      const c = canBuy(s.id);
      return `<div class="seed">
        <span class="dot big" style="background:${s.color}"></span>
        <div class="info"><b>${s.name} 씨앗</b><small>가진 씨앗 ${inventory.seeds[s.id]}개${c.ok ? '' : ` · ${BUY_REASON[c.reason]}`}</small></div>
        <button class="buy" data-id="${s.id}" ${c.ok ? '' : 'disabled'}>🪙 ${s.seedPrice}</button>
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
    `<button class="pick" data-id="${s.id}"><span class="dot" style="background:${s.color}"></span>${s.name} 씨앗 <b>${inventory.seeds[s.id]}</b></button>`).join('');
  $('#plantList').onclick = (e) => {
    const b = e.target.closest('[data-id]');
    if (!b) return;
    closePanels();
    onPlant(b.dataset.id);
  };
  openPanel('plantPanel');
}
