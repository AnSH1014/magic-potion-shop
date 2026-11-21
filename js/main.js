// 게임 시작점: 렌더러·카메라·조명을 준비하고 섬을 화면에 그린다.
//
// [three.js 기본 개념]
// - Scene(장면): 물체·조명을 모두 담는 무대.
// - Camera(카메라): 무대를 어디서 어떤 각도로 볼지 정한다.
// - Renderer(렌더러): 카메라에 비친 장면을 캔버스에 그림으로 그린다.
// - Light(조명): 빛이 있어야 MeshStandardMaterial 물체가 보인다.
// 매 프레임 renderer.render(scene, camera)를 불러서 화면을 새로 그린다.

import * as THREE from 'three';
// OrbitControls: 마우스 드래그·손가락으로 카메라를 물체 주위로 돌리고 확대·축소하게 해 주는 도구
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildIsland, buildSky, PALETTE } from './scene.js';
import { createGardenView, plotIndexOf } from './garden.js';
import { createGarden, createInventory, harvest } from './rules/garden.js';
import { createCodex, brew, isCodexComplete } from './rules/brew.js';
import { nextCustomer, serveCustomer, canBuySeed, buySeed, plantSeed } from './rules/shop.js';
import { INGREDIENTS } from './data.js';
import {
  renderInventory, bumpChip, toast, openBrewPanel, openCodex,
  setBubble, placeBubble, openGivePanel, openShop, openPlantPanel,
} from './ui.js';
import { createFx } from './brewfx.js';
import { createFairy } from './fairy.js';

const canvas = document.getElementById('game');

// 렌더러
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
// 휴대폰의 고해상도 화면에서 너무 무거워지지 않게 픽셀 비율을 2로 제한
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;                 // 그림자 켜기
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // 가장자리가 부드러운 그림자

// 장면
const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.sky);
// 안개: 멀리 있는 물체를 하늘색으로 흐리게 → 아래 숲이 아련하게 보인다
scene.fog = new THREE.Fog(PALETTE.sky, 30, 80);

// 카메라: PerspectiveCamera(시야각, 화면 비율, 가까운 한계, 먼 한계)
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
camera.position.set(11, 10, 14);

// 조명
// HemisphereLight: 위(하늘색)와 아래(풀색)에서 은은하게 비추는 빛 → 파스텔 분위기의 바탕
const hemi = new THREE.HemisphereLight('#FFFFFF', PALETTE.grass, 1.6);
scene.add(hemi);
// DirectionalLight: 해처럼 한 방향에서 오는 빛. 그림자는 이 조명 하나만 만든다.
const sun = new THREE.DirectionalLight('#FFF4E0', 1.8);
sun.position.set(6, 12, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); // 그림자 해상도 (휴대폰을 위해 작게)
const s = sun.shadow.camera;        // 그림자가 계산되는 범위를 섬 크기에 맞춘다
s.left = -8; s.right = 8; s.top = 8; s.bottom = -8; s.near = 1; s.far = 30;
sun.shadow.bias = -0.001;
sun.shadow.radius = 4;
scene.add(sun);

// 섬과 하늘 넣기
const { island, garden: gardenGroup, cauldron } = buildIsland();
scene.add(island);
scene.add(buildSky());

// 게임 상태 (6단계에서 localStorage 저장을 붙일 예정)
const state = {
  garden: createGarden(Date.now()),
  inventory: createInventory(),
  codex: createCodex(),
  customer: null,   // 지금 와 있는 손님 { wish } (없으면 null)
  lastWish: null,   // 바로 앞 손님의 소원 (같은 소원이 연달아 나오지 않게)
};
const gardenView = createGardenView(gardenGroup);
const fx = createFx(scene);

// 지금 기를 수 있는 재료 = 정원에 심겨 있는 재료
function unlockedSet() {
  return new Set(state.garden.plots.map((p) => p.crop).filter(Boolean));
}
renderInventory(state.inventory, unlockedSet());

// ───── 솥에서 끓이기 ─────
const cauldronTop = cauldron.position.clone().add(new THREE.Vector3(0, 1.25, 0));
const jellySpot = cauldron.position.clone().add(new THREE.Vector3(1.1, 0, 0.5));

function onBrew(ids) {
  const r = brew(state.inventory, state.codex, ids);
  if (!r.ok) {
    if (r.reason === 'notEnough') toast('재료가 부족해요');
    return;
  }
  renderInventory(state.inventory, unlockedSet());
  if (r.failed) {
    fx.failSmoke(cauldronTop, jellySpot);
    toast('펑! 말랑한 수상한 젤리가 나왔어요…', 2200);
    return;
  }
  fx.potionRise(r.potion, cauldronTop);
  // 손님이 찾던 물약을 막 발견했다면 말풍선의 "처음 보는 물약" 안내를 물약 이름으로 바꾼다
  if (r.isNew && state.customer?.wish === r.potion.id) setBubble(state.customer, state.codex.discovered);
  if (!r.isNew) toast(`${r.potion.name} 완성!`, 2000);
  else if (isCodexComplete(state.codex)) toast(`🎉 ${r.potion.name} 발견! 도감 완성!`, 3500);
  else toast(`✨ 새 물약 발견! ${r.potion.name}`, 2600);
}

document.getElementById('codexBtn').addEventListener('click', () => openCodex(state.inventory, state.codex, state.customer?.wish));

// ───── 요정 손님 ─────
// 가게 창구 앞에 서서 카메라 쪽을 비스듬히 바라본다
const fairy = createFairy(scene, new THREE.Vector3(0.5, 0, 1.7), 0.3);

function callCustomer() {
  state.customer = nextCustomer(state.garden, state.lastWish);
  fairy.arrive(() => setBubble(state.customer, state.codex.discovered));
}

function onGive(potionId) {
  const r = serveCustomer(state.inventory, state.customer, potionId);
  if (r.ok) {
    renderInventory(state.inventory, unlockedSet());
    bumpChip('coins');
    toast(`고마워요! 🪙 ${r.coins} 코인을 받았어요`, 2200);
    state.lastWish = state.customer.wish;
    state.customer = null;
    setBubble(null);
    fairy.leave();
    setTimeout(callCustomer, 3000); // 잠시 뒤 다음 손님
  } else if (r.reason === 'wrong') {
    // 받지 않고 고개를 저으며 소원을 다시 말한다
    fairy.shake();
    setBubble(state.customer, state.codex.discovered);
    toast('이 물약이 아니에요…');
  }
}

function talkToCustomer() {
  if (state.customer && fairy.mode === 'waiting') openGivePanel(state.inventory, state.customer, onGive);
}
document.getElementById('bubble').addEventListener('click', talkToCustomer);
setTimeout(callCustomer, 1200);

// ───── 씨앗 상점과 심기 ─────
document.getElementById('shopBtn').addEventListener('click', () => {
  openShop(
    state.inventory,
    (id) => canBuySeed(state.inventory, state.garden, id),
    (id) => {
      if (buySeed(state.inventory, state.garden, id).ok) {
        renderInventory(state.inventory, unlockedSet());
        toast('씨앗을 샀어요! 정원의 빈 밭을 눌러 심어요', 2200);
      }
    },
  );
});

function onEmptyPlot(index) {
  const hasSeed = Object.values(state.inventory.seeds).some((n) => n > 0);
  if (!hasSeed) return toast('빈 밭이에요. 상점에서 씨앗을 사 보세요');
  openPlantPanel(state.inventory, (seedId) => {
    if (plantSeed(state.inventory, state.garden, index, seedId, Date.now()).ok) {
      renderInventory(state.inventory, unlockedSet());
      const name = INGREDIENTS.find((x) => x.id === seedId).name;
      toast(`${name} 씨앗을 심었어요 🌱`);
    }
  });
}

// 카메라 조작
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.8, 0);     // 섬 가운데를 바라보며 돈다
controls.enableDamping = true;      // 손을 놓아도 부드럽게 멈춘다
controls.dampingFactor = 0.08;
controls.enablePan = false;         // 섬이 화면 밖으로 밀려나지 않게 이동은 막는다
controls.minDistance = 9;           // 너무 가까이 / 멀리 가지 않게
controls.maxDistance = 30;
controls.minPolarAngle = 0.35;      // 너무 위에서 내려다보거나
controls.maxPolarAngle = 1.45;      // 섬 아래로 들어가지 않게
controls.update();

// 화면 크기에 맞추기 (PC·휴대폰 반응형)
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  const aspect = w / h;
  camera.aspect = aspect;
  // 세로로 긴 휴대폰 화면에서는 섬 양옆이 잘리지 않게 시야를 넓히고 멀리서 본다
  camera.fov = aspect < 1 ? 50 : 40;
  camera.updateProjectionMatrix();
  const dist = 20 * Math.max(1, 0.55 / aspect);
  controls.maxDistance = dist * 1.5;
  // 지금 보는 방향은 그대로 두고 거리만 바꾼다
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).addScaledVector(dir, dist);
}
window.addEventListener('resize', resize);
resize();

// ───── 클릭·터치로 물체 고르기 ─────
// Raycaster(레이캐스터): 카메라에서 화면의 한 점을 향해 보이지 않는 광선을 쏴서
// 그 광선에 처음 맞는 3D 물체를 찾아 준다. "무엇을 눌렀나"를 알아내는 도구.
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// 누른 곳에 있는 것을 알려 준다: { type: 'plot', index } / { type: 'cauldron' } / { type: 'fairy' } / null
function pick(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  // 화면 좌표를 -1 ~ 1 범위(왼쪽 아래가 -1)로 바꿔야 레이캐스터가 이해한다
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  // 광선에 맞은 물체들(가까운 순) 중 솥·요정이거나 밭·재료인 첫 번째를 고른다.
  // 울타리를 살짝 같이 눌러도 그 뒤의 재료가 선택되어 손가락으로 누르기 쉽다.
  const targets = [gardenGroup, cauldron];
  if (fairy.group.visible) targets.push(fairy.group);
  for (const hit of raycaster.intersectObjects(targets, true)) {
    for (let o = hit.object; o; o = o.parent) {
      if (o === cauldron) return { type: 'cauldron' };
      if (o === fairy.group) return { type: 'fairy' };
    }
    const i = plotIndexOf(hit.object);
    if (i >= 0) return { type: 'plot', index: i };
  }
  return null;
}

function onTap(clientX, clientY) {
  const target = pick(clientX, clientY);
  if (!target) return;
  if (target.type === 'cauldron') return openBrewPanel(state.inventory, unlockedSet(), onBrew);
  if (target.type === 'fairy') return talkToCustomer();
  if (!state.garden.plots[target.index].crop) return onEmptyPlot(target.index);
  const result = harvest(state.garden, state.inventory, target.index, Date.now());
  if (result.ok) {
    const name = INGREDIENTS.find((x) => x.id === result.crop).name;
    renderInventory(state.inventory, unlockedSet());
    bumpChip(result.crop);
    toast(`${name} 1개 수확!`);
  } else if (result.reason === 'growing') {
    toast('아직 자라는 중이에요');
  }
}

// 섬을 돌리려고 드래그한 것과 "누른 것"을 구분한다: 거의 안 움직이고 뗐을 때만 누른 것으로 본다
let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) onTap(e.clientX, e.clientY);
  down = null;
});
// PC에서 재료 위에 마우스를 올리면 손가락 모양 커서
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || e.buttons) return;
  const t = pick(e.clientX, e.clientY);
  canvas.style.cursor = t ? 'pointer' : '';
});

// 요정 머리 위 3D 위치를 화면 좌표로 바꿔 말풍선을 붙인다
// (project(): 3D 좌표를 카메라 화면의 -1 ~ 1 좌표로 바꿔 준다)
const anchor = new THREE.Vector3();
function updateBubble() {
  anchor.copy(fairy.bubbleAnchor()).project(camera);
  const rect = canvas.getBoundingClientRect();
  placeBubble(rect.left + (anchor.x + 1) / 2 * rect.width, rect.top + (1 - anchor.y) / 2 * rect.height);
}

// 매 프레임 실행되는 반복문
const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.1); // 지난 프레임부터 흐른 시간(초). 탭이 멈췄다 돌아와도 튀지 않게 제한
  const time = clock.elapsedTime;
  gardenView.update(state.garden, Date.now(), time);
  fx.tick(dt);
  fairy.update(dt, time);
  controls.update();
  updateBubble();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
