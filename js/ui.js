// 화면 위에 겹쳐 보이는 HTML UI: 보유 재료, 안내 메시지, 솥 패널, 도감

import { INGREDIENTS, POTIONS } from './data.js';

const ING = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));
const $ = (sel) => document.querySelector(sel);

// ───── 보유 재료 ─────
// 씨앗으로 여는 재료는 아직 없으면 흐리게 보인다.
export function renderInventory(inventory, unlocked) {
  $('#hud').innerHTML = INGREDIENTS.map((ing) => {
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
function openPanel(id) {
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('open', p.id === id));
}
export function closePanels() {
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('open'));
}
document.querySelectorAll('.panel .close').forEach((b) => b.addEventListener('click', closePanels));

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
export function openCodex(inventory, codex) {
  const found = new Set(codex.discovered);
  $('#codexCount').textContent = `${found.size} / ${POTIONS.length}`;
  $('#codexDone').hidden = found.size < POTIONS.length;
  $('#codexGrid').innerHTML = POTIONS.map((p) => {
    if (!found.has(p.id)) {
      return `<div class="card unknown"><div class="bottle" style="--c:#D9D2DE"></div><b>???</b><small>아직 발견하지 못했어요</small></div>`;
    }
    const recipe = p.recipe.map((id) => ING[id].name).join(' + ');
    return `<div class="card"><div class="bottle" style="--c:${p.color}"></div><b>${p.name}</b>
      <small>${recipe}</small><small class="own">보유 ${inventory.potions[p.id]}개</small></div>`;
  }).join('');
  openPanel('codexPanel');
}
