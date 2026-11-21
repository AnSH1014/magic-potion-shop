// 섬 디오라마 만들기
// 모든 물체는 three.js 기본 도형(구, 원기둥, 상자, 원뿔, 도넛, 둥근 상자)과 색만으로 만든다.
// 꾸미기 단계에서 목업(references/05_ui_mockup.webp)처럼 모서리를 둥글게, 지붕을 뭉게뭉게 다듬었다.
//
// [three.js 기본 개념]
// - Mesh(메시) = Geometry(모양) + Material(재질·색). 화면에 보이는 물체 하나.
// - Group(그룹) = 여러 메시를 묶은 상자. 그룹을 옮기거나 돌리면 안의 메시가 함께 움직인다.
// - position / rotation / scale 로 위치·회전·크기를 정한다. 단위는 자유지만 여기서는 1 = 대략 사람 키의 절반.

import * as THREE from 'three';
// RoundedBoxGeometry: 모서리가 둥근 상자. 점토 장난감처럼 말랑해 보이게 해 준다.
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// 참고 이미지 03_palette.png 의 색
export const PALETTE = {
  sky: '#A8D8FF',
  grass: '#BDE89C',
  roof: '#FFB3C6',
  cauldron: '#8876B8',
  fairy: '#FFF1C8',
  accent: '#FFD37A',
  // 팔레트를 바탕으로 더한 보조색
  grassDark: '#9FD67E',
  dirt: '#D9A07A',
  dirtDark: '#B9825E',
  wood: '#C98E6A',
  woodDark: '#A8704F',
  wall: '#FBE3C0',
  stone: '#F3E3CF',
  stoneGray: '#B9AEB8',
  leaf: '#A6DC82',
  leafDark: '#8CCB6E',
  cream: '#FFF8EC',
  potion: '#E7A6F5',
  roofDeep: '#FF9EBB',
};

// 같은 색 재질은 하나만 만들어 함께 쓴다 (휴대폰에서 가볍게)
const materialCache = new Map();
export function mat(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!materialCache.has(key)) {
    // MeshStandardMaterial: 빛을 받으면 밝고 어두운 면이 생기는 재질.
    // roughness를 높이면 반짝임이 줄어 점토처럼 부드러워 보인다.
    materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }));
  }
  return materialCache.get(key);
}

// 메시 하나를 만들어 위치·크기를 정하는 작은 도우미
export function mesh(geometry, material, { pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1], shadow = true } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.scale.set(...scale);
  m.castShadow = shadow;     // 이 물체가 그림자를 드리운다
  m.receiveShadow = true;    // 다른 물체의 그림자가 이 물체 위에 진다
  return m;
}

// 자주 쓰는 모양 (한 번만 만들어 재사용)
export const G = {
  sphere: new THREE.SphereGeometry(1, 24, 16),
  sphereLow: new THREE.SphereGeometry(1, 14, 10),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 20),
  box: new THREE.BoxGeometry(1, 1, 1),
  half: new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), // 위쪽 반구
};

// 둥근 상자: 크기별로 한 번만 만든다
const rboxCache = new Map();
function rbox(w, h, d, r = 0.08) {
  const key = `${w},${h},${d},${r}`;
  if (!rboxCache.has(key)) rboxCache.set(key, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)));
  return rboxCache.get(key);
}

// 정원 밭 윗면 높이 (재료가 이 높이에 심긴다)
export const PLOT_TOP = 0.3;

// ───────────────────────── 섬 바닥 ─────────────────────────
function buildGround() {
  const group = new THREE.Group();
  group.name = 'ground';

  // 풀밭 윗면: 납작한 원기둥 하나 + 가장자리를 따라 두툼한 둥근 덩어리 (목업처럼 말랑한 풀 테두리)
  group.add(mesh(new THREE.CylinderGeometry(6, 6, 0.6, 48), mat(PALETTE.grass), { pos: [0, -0.3, 0], shadow: false }));
  const edgeCount = 18;
  for (let i = 0; i < edgeCount; i++) {
    const a = (i / edgeCount) * Math.PI * 2;
    group.add(mesh(G.sphere, mat(i % 3 ? PALETTE.grass : PALETTE.grassDark), {
      pos: [Math.cos(a) * 5.6, -0.42, Math.sin(a) * 5.6],
      scale: [1.25, 0.55, 1.25],
      shadow: false,
    }));
  }

  // 흙 아랫면: 아래로 뾰족한 원뿔 + 둥근 흙덩이들 (떠 있는 섬 느낌)
  group.add(mesh(new THREE.ConeGeometry(5.8, 4.5, 32), mat(PALETTE.dirt), { pos: [0, -2.9, 0], rot: [Math.PI, 0, 0], shadow: false }));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.2;
    const r = 4.6 - (i % 3) * 0.6;
    const s = 1.4 + (i % 2) * 0.3;
    group.add(mesh(G.sphereLow, mat(i % 2 ? PALETTE.dirt : PALETTE.dirtDark), {
      pos: [Math.cos(a) * r, -2.0 - (i % 3) * 0.5, Math.sin(a) * r],
      scale: [s, s * 0.9, s],
      shadow: false,
    }));
  }

  // 섬 가장자리에서 늘어진 덩굴 (작은 잎 구를 줄지어)
  [-0.5, 0.35, 1.2, 2.0, 2.6].forEach((a, k) => {
    const len = 4 + (k % 3);
    for (let j = 0; j < len; j++) {
      const r = 5.95 - j * 0.12;
      group.add(mesh(G.sphereLow, mat(j % 2 ? PALETTE.leaf : PALETTE.leafDark), {
        pos: [Math.cos(a) * r + Math.sin(j * 1.7) * 0.08, -0.45 - j * 0.32, Math.sin(a) * r],
        scale: [0.16, 0.12, 0.1], shadow: false,
      }));
    }
  });
  return group;
}

// ───────────────────────── 나무 ─────────────────────────
function buildTree(x, z, size = 1) {
  const tree = new THREE.Group();
  tree.add(mesh(new THREE.CylinderGeometry(0.22, 0.34, 1.6, 12), mat(PALETTE.wood), { pos: [0, 0.8, 0] }));
  // 잎: 크기가 다른 구 4개를 겹쳐 뭉게뭉게
  tree.add(mesh(G.sphere, mat(PALETTE.leaf), { pos: [0, 2.05, 0], scale: [1.15, 1.05, 1.15] }));
  tree.add(mesh(G.sphere, mat(PALETTE.leafDark), { pos: [0.75, 1.75, 0.2], scale: [0.78, 0.72, 0.78] }));
  tree.add(mesh(G.sphere, mat(PALETTE.leaf), { pos: [-0.65, 1.8, -0.3], scale: [0.82, 0.78, 0.82] }));
  tree.add(mesh(G.sphere, mat('#B7E596'), { pos: [0.15, 2.75, 0.1], scale: [0.6, 0.55, 0.6] }));
  tree.position.set(x, 0, z);
  tree.scale.setScalar(size);
  return tree;
}

// ───────────────────────── 가게 ─────────────────────────
function buildShop() {
  const shop = new THREE.Group();
  shop.name = 'shop';
  const glow = mat('#FFE6A0', { emissive: '#FFC861', emissiveIntensity: 0.7 }); // emissive: 스스로 빛나는 색

  // 돌 바닥과 둥근 벽
  shop.add(mesh(rbox(3.4, 0.3, 2.8, 0.12), mat(PALETTE.stone), { pos: [0, 0.15, 0] }));
  shop.add(mesh(rbox(3.0, 2.2, 2.4, 0.3), mat(PALETTE.wall), { pos: [0, 1.35, 0] }));

  // 뭉게뭉게 지붕: 처마(납작한 구) + 큰 반구 + 위쪽 둥근 혹들
  shop.add(mesh(G.sphere, mat(PALETTE.roofDeep), { pos: [0, 2.45, 0.05], scale: [2.05, 0.42, 1.72] }));
  shop.add(mesh(G.half, mat(PALETTE.roof), { pos: [0, 2.45, 0], scale: [1.85, 1.35, 1.55] }));
  [[-0.9, 3.25, 0.4, 0.55], [0.75, 3.35, 0.25, 0.6], [-0.1, 3.7, -0.1, 0.55], [1.2, 2.95, 0.7, 0.42]].forEach(([x, y, z, s]) => {
    shop.add(mesh(G.sphere, mat(PALETTE.roof), { pos: [x, y, z], scale: [s, s * 0.8, s] }));
  });

  // 지붕의 둥근 창: 빛나는 원판 + 나무 테 + 십자 창살
  const win = new THREE.Group();
  win.add(mesh(new THREE.CircleGeometry(0.36, 24), glow, { shadow: false }));
  win.add(mesh(new THREE.TorusGeometry(0.38, 0.07, 10, 28), mat(PALETTE.wood)));
  win.add(mesh(rbox(0.06, 0.72, 0.05, 0.02), mat(PALETTE.wood), { shadow: false }));
  win.add(mesh(rbox(0.72, 0.06, 0.05, 0.02), mat(PALETTE.wood), { shadow: false }));
  win.position.set(0, 3.05, 1.42);
  win.rotation.x = -0.45;
  shop.add(win);

  // 굴뚝
  shop.add(mesh(rbox(0.5, 1.0, 0.5, 0.1), mat('#E6B49A'), { pos: [-1.0, 3.6, -0.45] }));
  shop.add(mesh(rbox(0.62, 0.18, 0.62, 0.08), mat(PALETTE.wood), { pos: [-1.0, 4.12, -0.45] }));

  // 지붕 위 별 장식 (팔면체를 납작하게)
  shop.add(mesh(new THREE.OctahedronGeometry(0.35), mat(PALETTE.accent, { emissive: PALETTE.accent, emissiveIntensity: 0.4 }), {
    pos: [0.75, 4.15, 0.1], scale: [1, 1.3, 0.35],
  }));

  // 지붕을 덮은 덩굴 잎: 처마를 따라 동글동글
  for (let i = 0; i < 9; i++) {
    const a = -0.9 + i * 0.22;
    shop.add(mesh(G.sphereLow, mat(i % 2 ? PALETTE.leaf : PALETTE.leafDark), {
      pos: [Math.sin(a) * 1.95 - 0.3, 2.55 + Math.cos(i) * 0.08 - (i % 3) * 0.1, Math.cos(a) * 1.55 + 0.05],
      scale: [0.17, 0.12, 0.1], shadow: false,
    }));
  }

  // 판매 창구: 안쪽(밝은 나무색) + 선반 두 칸 + 진열된 물약 병
  shop.add(mesh(rbox(2.0, 1.35, 0.1, 0.05), mat('#E8C89A'), { pos: [0, 1.45, 1.17], shadow: false }));
  shop.add(mesh(rbox(2.2, 0.12, 0.2, 0.05), mat(PALETTE.wood), { pos: [0, 2.15, 1.25] }));
  [1.55, 1.95].forEach((y) => shop.add(mesh(rbox(1.8, 0.07, 0.25, 0.03), mat(PALETTE.wood), { pos: [0, y - 0.12, 1.25], shadow: false })));
  const bottleColors = ['#A8C8FF', '#FFB3D9', '#C9B3F0', '#FFE27A', '#9FE8D0'];
  bottleColors.forEach((c, i) => {
    const x = -0.7 + i * 0.35;
    const y = i % 2 ? 1.92 : 1.52;
    shop.add(mesh(G.sphereLow, mat(c, { roughness: 0.3, emissive: c, emissiveIntensity: 0.15 }), { pos: [x, y, 1.27], scale: [0.11, 0.11, 0.11], shadow: false }));
    shop.add(mesh(G.cylinder, mat('#F4F0FA'), { pos: [x, y + 0.13, 1.27], scale: [0.04, 0.08, 0.04], shadow: false }));
  });
  // 카운터
  shop.add(mesh(rbox(2.3, 0.85, 0.6, 0.12), mat(PALETTE.wood), { pos: [0, 0.6, 1.45] }));
  shop.add(mesh(rbox(2.45, 0.1, 0.72, 0.05), mat('#E3B48C'), { pos: [0, 1.06, 1.47] }));

  // 줄무늬 차양: 분홍·크림 판을 번갈아 기울이고, 끝에 동글동글 장식
  for (let i = 0; i < 7; i++) {
    const x = -1.08 + i * 0.36;
    const color = i % 2 ? PALETTE.cream : PALETTE.roofDeep;
    shop.add(mesh(rbox(0.36, 0.07, 0.8, 0.03), mat(color), { pos: [x, 2.28, 1.6], rot: [0.5, 0, 0] }));
    shop.add(mesh(G.sphereLow, mat(color), { pos: [x, 2.08, 1.95], scale: [0.18, 0.12, 0.08], shadow: false }));
  }

  // 랜턴 두 개: 받침 팔 + 빛나는 몸통 + 지붕
  [-1.65, 1.65].forEach((x) => {
    shop.add(mesh(rbox(0.08, 0.08, 0.35, 0.03), mat(PALETTE.woodDark), { pos: [x, 2.05, 1.32], shadow: false }));
    shop.add(mesh(G.cylinder, glow, { pos: [x, 1.8, 1.48], scale: [0.13, 0.3, 0.13], shadow: false }));
    shop.add(mesh(new THREE.ConeGeometry(0.19, 0.16, 12), mat(PALETTE.woodDark), { pos: [x, 2.02, 1.48], shadow: false }));
    shop.add(mesh(G.cylinder, mat(PALETTE.woodDark), { pos: [x, 1.63, 1.48], scale: [0.15, 0.05, 0.15], shadow: false }));
  });

  // 왼쪽에 매달린 물약 간판
  shop.add(mesh(rbox(0.9, 0.1, 0.1, 0.04), mat(PALETTE.woodDark), { pos: [-1.85, 2.55, 0.9] }));
  shop.add(mesh(rbox(0.62, 0.62, 0.1, 0.1), mat(PALETTE.wood), { pos: [-2.05, 2.05, 0.9] }));
  shop.add(mesh(rbox(0.5, 0.5, 0.06, 0.08), mat('#F3D9B8'), { pos: [-2.05, 2.05, 0.95], shadow: false }));
  shop.add(mesh(G.sphereLow, mat('#B59BE8', { emissive: '#B59BE8', emissiveIntensity: 0.2 }), { pos: [-2.05, 1.98, 1.0], scale: [0.14, 0.14, 0.05], shadow: false }));
  shop.add(mesh(G.cylinder, mat('#F4F0FA'), { pos: [-2.05, 2.16, 1.0], scale: [0.04, 0.1, 0.03], shadow: false }));
  [-2.25, -1.85].forEach((x) => shop.add(mesh(G.cylinder, mat(PALETTE.woodDark), { pos: [x, 2.45, 0.9], scale: [0.015, 0.2, 0.015], shadow: false })));

  // 옆창
  shop.add(mesh(rbox(0.06, 0.6, 0.6, 0.03), glow, { pos: [1.52, 1.5, 0.2], shadow: false }));
  shop.add(mesh(new THREE.TorusGeometry(0.34, 0.05, 8, 20), mat(PALETTE.wood), { pos: [1.53, 1.5, 0.2], rot: [0, Math.PI / 2, 0], shadow: false }));

  return shop;
}

// ───────────────────────── 솥 ─────────────────────────
function buildCauldron() {
  const cauldron = new THREE.Group();
  cauldron.name = 'cauldron';
  const fire = mat(PALETTE.accent, { emissive: '#FFB347', emissiveIntensity: 1.2 });

  // 돌 받침대: 둥근 돌을 고리 모양으로 + 가운데 돌 기단
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    cauldron.add(mesh(G.sphereLow, mat(i % 2 ? PALETTE.stoneGray : '#C8BEC6'), {
      pos: [Math.cos(a) * 0.95, 0.1, Math.sin(a) * 0.95], scale: [0.3, 0.16, 0.24], shadow: false,
    }));
  }
  cauldron.add(mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.42, 24), mat('#9F93AE'), { pos: [0, 0.21, 0] }));
  // 받침대 앞의 아치 모양 불구멍 두 개 (목업처럼 노랗게 빛남)
  [-0.26, 0.26].forEach((x) => {
    const a = Math.atan2(x, 0.79);
    cauldron.add(mesh(new THREE.CircleGeometry(0.17, 16, 0, Math.PI), fire, {
      pos: [x, 0.02, Math.cos(a) * 0.79 + 0.01], rot: [0, a, 0], shadow: false,
    }));
  });
  cauldron.add(mesh(new THREE.CircleGeometry(0.7, 24), fire, { pos: [0, 0.43, 0], rot: [-Math.PI / 2, 0, 0], shadow: false }));

  // 솥 몸통: 통통한 구 (조금 크게)
  cauldron.add(mesh(G.sphere, mat(PALETTE.cauldron, { roughness: 0.55 }), { pos: [0, 1.05, 0], scale: [0.9, 0.74, 0.9] }));
  // 두툼한 테두리 (도넛)
  cauldron.add(mesh(new THREE.TorusGeometry(0.7, 0.13, 12, 32), mat('#9C8AC9', { roughness: 0.55 }), {
    pos: [0, 1.63, 0], rot: [Math.PI / 2, 0, 0],
  }));
  // 끓는 물약 표면
  const liquidMat = mat(PALETTE.potion, { emissive: '#D58BF0', emissiveIntensity: 0.45, roughness: 0.35 });
  cauldron.add(mesh(new THREE.CircleGeometry(0.66, 28), liquidMat, { pos: [0, 1.6, 0], rot: [-Math.PI / 2, 0, 0], shadow: false }));
  // 거품
  [[0.2, 1.74, 0.1, 0.15], [-0.25, 1.82, -0.05, 0.11], [0.05, 2.0, -0.2, 0.09], [-0.1, 2.2, 0.15, 0.06]].forEach(([x, y, z, s]) => {
    cauldron.add(mesh(G.sphereLow, mat('#F0B8FA', { roughness: 0.15, transparent: true, opacity: 0.85, emissive: '#E7A6F5', emissiveIntensity: 0.3 }), { pos: [x, y, z], scale: [s, s, s], shadow: false }));
  });
  // 손잡이 고리 두 개
  [-1, 1].forEach((side) => {
    cauldron.add(mesh(new THREE.TorusGeometry(0.15, 0.05, 8, 16), mat('#7A68AA'), { pos: [side * 0.92, 1.3, 0], rot: [0, Math.PI / 2, 0] }));
  });
  // 젓는 국자
  cauldron.add(mesh(G.cylinder, mat(PALETTE.wood), { pos: [0.35, 2.0, 0.0], rot: [0, 0, -0.5], scale: [0.06, 1.05, 0.06] }));

  return cauldron;
}

// ───────────────────────── 뒤뜰 정원 ─────────────────────────
function buildGarden() {
  const garden = new THREE.Group();
  garden.name = 'garden';

  // 밭 6칸 (3 x 2). 0~2번이 카메라 쪽 앞줄, 3~5번이 뒷줄.
  // 한 칸 = 둥근 나무 틀 + 그 위의 흙. 흙 메시를 "밭"으로 써서 누르기·재료 위치에 쓴다.
  const plots = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const x = col * 1.25 - 1.25;
      const z = (1 - row) * 1.25 - 0.62;
      garden.add(mesh(rbox(1.08, 0.24, 1.08, 0.09), mat(PALETTE.wood), { pos: [x, 0.12, z] }));
      const plot = mesh(rbox(0.86, 0.1, 0.86, 0.05), mat(PALETTE.dirtDark), { pos: [x, PLOT_TOP - 0.05, z], shadow: false });
      plot.name = `plot-${row * 3 + col}`;
      garden.add(plot);
      plots.push(plot);
    }
  }
  garden.userData.plots = plots;

  // 울타리: 둥근 머리가 달린 통통한 기둥 + 둥근 가로대 (앞쪽은 드나들 수 있게 가운데를 비운다)
  const w = 4.4, d = 3.2; // 울타리 너비·깊이
  const postGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.75, 12);
  const post = (x, z) => {
    garden.add(mesh(postGeo, mat(PALETTE.wood), { pos: [x, 0.375, z] }));
    garden.add(mesh(G.sphereLow, mat('#D9A27E'), { pos: [x, 0.77, z], scale: [0.14, 0.1, 0.14] }));
  };
  for (let i = 0; i <= 4; i++) post(-w / 2 + (w / 4) * i, -d / 2);          // 뒤
  for (let i = 1; i <= 3; i++) post(-w / 2, -d / 2 + (d / 3) * i);          // 왼쪽
  for (let i = 1; i <= 3; i++) post(w / 2, -d / 2 + (d / 3) * i);           // 오른쪽
  post(-w / 2 + 0.55, d / 2); post(w / 2 - 0.55, d / 2);                    // 앞 (가운데 입구)

  const rail = (x1, z1, x2, z2) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    [0.32, 0.58].forEach((y) => {
      const r = mesh(rbox(len, 0.1, 0.09, 0.04), mat(PALETTE.woodDark), { pos: [(x1 + x2) / 2, y, (z1 + z2) / 2] });
      r.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
      garden.add(r);
    });
  };
  rail(-w / 2, -d / 2, w / 2, -d / 2);
  rail(-w / 2, -d / 2, -w / 2, d / 2);
  rail(w / 2, -d / 2, w / 2, d / 2);
  rail(-w / 2, d / 2, -w / 2 + 0.55, d / 2);
  rail(w / 2 - 0.55, d / 2, w / 2, d / 2);

  return garden;
}

// ───────────────────────── 장식 ─────────────────────────
function buildFlower(x, z, petalColor, size = 1) {
  const f = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    f.add(mesh(G.sphereLow, mat(petalColor), { pos: [Math.cos(a) * 0.14, 0.3, Math.sin(a) * 0.14], scale: [0.11, 0.07, 0.11], shadow: false }));
  }
  f.add(mesh(G.sphereLow, mat(PALETTE.accent), { pos: [0, 0.32, 0], scale: [0.08, 0.06, 0.08], shadow: false }));
  f.add(mesh(G.sphereLow, mat(PALETTE.leafDark), { pos: [0.1, 0.1, 0], scale: [0.14, 0.1, 0.1], shadow: false }));
  f.add(mesh(G.sphereLow, mat(PALETTE.leafDark), { pos: [-0.1, 0.1, 0], scale: [0.14, 0.1, 0.1], shadow: false }));
  f.position.set(x, 0, z);
  f.scale.setScalar(size);
  return f;
}

function buildBush(x, z, s = 1) {
  const b = new THREE.Group();
  b.add(mesh(G.sphereLow, mat(PALETTE.leafDark), { pos: [0, 0.25, 0], scale: [0.5, 0.42, 0.45] }));
  b.add(mesh(G.sphereLow, mat(PALETTE.leaf), { pos: [0.32, 0.2, 0.1], scale: [0.36, 0.31, 0.33] }));
  b.add(mesh(G.sphereLow, mat('#B7E596'), { pos: [-0.25, 0.18, 0.15], scale: [0.3, 0.26, 0.28] }));
  b.position.set(x, 0, z);
  b.scale.setScalar(s);
  return b;
}

function buildMushroomDecor(x, z, capColor, s = 1) {
  const m = new THREE.Group();
  m.add(mesh(G.cylinder, mat(PALETTE.cream), { pos: [0, 0.3, 0], scale: [0.15, 0.6, 0.15] }));
  m.add(mesh(G.half, mat(capColor), { pos: [0, 0.55, 0], scale: [0.45, 0.35, 0.45] }));
  [[0.2, 0.75, 0.25], [-0.25, 0.72, 0.15], [0.0, 0.85, -0.2]].forEach((p) => {
    m.add(mesh(G.sphereLow, mat(PALETTE.cream), { pos: p, scale: [0.07, 0.04, 0.07], shadow: false }));
  });
  m.position.set(x, 0, z);
  m.scale.setScalar(s);
  return m;
}

// 나무통: 가운데가 볼록한 몸통(LatheGeometry: 옆모습 선을 빙 돌려 만드는 모양) + 테 두 줄
function buildBarrel(x, z) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    pts.push(new THREE.Vector2(0.34 + Math.sin(t * Math.PI) * 0.06, t * 0.85));
  }
  g.add(mesh(new THREE.LatheGeometry(pts, 20), mat(PALETTE.wood)));
  g.add(mesh(new THREE.CircleGeometry(0.35, 20), mat('#E3B48C'), { pos: [0, 0.85, 0], rot: [-Math.PI / 2, 0, 0], shadow: false }));
  [0.18, 0.67].forEach((y) => g.add(mesh(new THREE.TorusGeometry(0.385, 0.03, 6, 24), mat(PALETTE.woodDark), { pos: [0, y, 0], rot: [Math.PI / 2, 0, 0] })));
  g.position.set(x, 0, z);
  return g;
}

// 물뿌리개
function buildWateringCan(x, z) {
  const g = new THREE.Group();
  const body = mat('#FFE9A8');
  g.add(mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.36, 18), body, { pos: [0, 0.18, 0] }));
  g.add(mesh(G.half, body, { pos: [0, 0.36, 0], scale: [0.22, 0.08, 0.22] }));
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.5, 8), body, { pos: [0.33, 0.33, 0], rot: [0, 0, -0.9] }));
  g.add(mesh(new THREE.ConeGeometry(0.08, 0.1, 10), body, { pos: [0.54, 0.47, 0], rot: [0, 0, -0.9 + Math.PI] }));
  g.add(mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 14, Math.PI), body, { pos: [-0.12, 0.38, 0], rot: [0, 0, 0.3] }));
  g.position.set(x, 0, z);
  g.rotation.y = -0.5;
  return g;
}

// 칠판 간판: A자 다리 + 어두운 칠판 + 하얀 물약 병 그림
function buildChalkboard(x, z) {
  const g = new THREE.Group();
  g.add(mesh(rbox(0.62, 0.78, 0.07, 0.05), mat(PALETTE.wood), { pos: [0, 0.5, 0.05], rot: [-0.18, 0, 0] }));
  g.add(mesh(rbox(0.5, 0.64, 0.04, 0.03), mat('#4E5A57'), { pos: [0, 0.52, 0.1], rot: [-0.18, 0, 0], shadow: false }));
  const chalk = mat('#FFFFFF', { emissive: '#FFFFFF', emissiveIntensity: 0.2 });
  g.add(mesh(new THREE.TorusGeometry(0.11, 0.015, 6, 20), chalk, { pos: [0, 0.46, 0.13], rot: [-0.18, 0, 0], shadow: false }));
  g.add(mesh(rbox(0.07, 0.12, 0.01, 0.01), chalk, { pos: [0, 0.62, 0.105], rot: [-0.18, 0, 0], shadow: false }));
  [-0.25, 0.25].forEach((dx) => g.add(mesh(rbox(0.06, 0.8, 0.06, 0.02), mat(PALETTE.woodDark), { pos: [dx, 0.4, -0.12], rot: [0.25, 0, 0] })));
  g.position.set(x, 0, z);
  g.rotation.y = 0.35;
  return g;
}

// 징검다리 길
function buildPath() {
  const path = new THREE.Group();
  const stones = [[0.6, 2.4, 0.45], [1.3, 3.2, 0.42], [0.3, 3.6, 0.4], [1.0, 4.3, 0.44], [1.7, 1.6, 0.38], [2.4, 0.9, 0.36], [-0.5, 4.5, 0.4]];
  stones.forEach(([x, z, r]) => {
    path.add(mesh(G.sphereLow, mat(PALETTE.stone), { pos: [x, 0.0, z], scale: [r, 0.08, r * 0.8], shadow: false }));
  });
  return path;
}

// ───────────────────────── 하늘 ─────────────────────────
function buildCloud(x, y, z, s = 1, color = '#FFE3EE') {
  const c = new THREE.Group();
  const m = mat(color, { roughness: 1 });
  c.add(mesh(G.sphereLow, m, { pos: [0, 0, 0], scale: [1.2, 0.8, 0.8], shadow: false }));
  c.add(mesh(G.sphereLow, m, { pos: [1.1, -0.15, 0], scale: [0.9, 0.6, 0.7], shadow: false }));
  c.add(mesh(G.sphereLow, m, { pos: [-1.1, -0.2, 0], scale: [0.8, 0.55, 0.65], shadow: false }));
  c.position.set(x, y, z);
  c.scale.setScalar(s);
  return c;
}

// 섬 아래 멀리 보이는 숲 (구 몇 개를 흐릿하게)
function buildDistantForest() {
  const g = new THREE.Group();
  const m = mat('#B5E3A8', { roughness: 1 });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = 18 + (i % 3) * 4;
    const s = 3 + (i % 4);
    g.add(mesh(G.sphereLow, m, { pos: [Math.cos(a) * r, -10 - (i % 2) * 2, Math.sin(a) * r], scale: [s, s * 0.8, s], shadow: false }));
  }
  return g;
}

// 멀리 떠 있는 작은 섬들 (목업 배경처럼). 하나에는 폭포가 흐른다.
function buildFarIsland(x, y, z, s, { waterfall = false, house = false } = {}) {
  const g = new THREE.Group();
  g.add(mesh(G.half, mat('#B9E49B', { roughness: 1 }), { scale: [3, 0.6, 3], shadow: false }));
  g.add(mesh(new THREE.ConeGeometry(3, 3.2, 16), mat('#D9A98A', { roughness: 1 }), { pos: [0, -1.6, 0], rot: [Math.PI, 0, 0], shadow: false }));
  [[-1.2, 0.6], [1.1, -0.4], [0.2, -1.4]].forEach(([tx, tz], i) => {
    g.add(mesh(G.cylinder, mat(PALETTE.wood, { roughness: 1 }), { pos: [tx, 0.6, tz], scale: [0.15, 1.0, 0.15], shadow: false }));
    g.add(mesh(new THREE.ConeGeometry(0.7, 1.6, 10), mat(i % 2 ? '#8CCB6E' : '#9FD67E', { roughness: 1 }), { pos: [tx, 1.6, tz], shadow: false }));
  });
  if (house) {
    g.add(mesh(rbox(0.9, 0.7, 0.8, 0.12), mat(PALETTE.wall, { roughness: 1 }), { pos: [0.6, 0.6, 1.0], shadow: false }));
    g.add(mesh(G.half, mat(PALETTE.roof, { roughness: 1 }), { pos: [0.6, 0.95, 1.0], scale: [0.6, 0.45, 0.55], shadow: false }));
  }
  if (waterfall) {
    // 폭포: 반투명한 하늘색 판 + 아래쪽 물보라 구
    g.add(mesh(new THREE.PlaneGeometry(0.9, 6), new THREE.MeshBasicMaterial({ color: '#D6F0FF', transparent: true, opacity: 0.75 }), { pos: [0.4, -2.9, 2.95], shadow: false }));
    g.add(mesh(G.sphereLow, new THREE.MeshBasicMaterial({ color: '#F4FBFF', transparent: true, opacity: 0.6 }), { pos: [0.4, -5.9, 2.95], scale: [0.9, 0.5, 0.5], shadow: false }));
  }
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  return g;
}

// ───────────────────────── 전체 조립 ─────────────────────────
export function buildIsland() {
  const island = new THREE.Group();
  island.name = 'island';

  island.add(buildGround());

  const shop = buildShop();
  shop.position.set(-1.6, 0, -0.6);
  island.add(shop);

  const cauldron = buildCauldron();
  cauldron.position.set(-0.7, 0, 2.7);
  cauldron.scale.setScalar(0.9);
  island.add(cauldron);

  const garden = buildGarden();
  garden.position.set(2.7, 0, -1.6);
  island.add(garden);

  // 소품: 나무통, 물뿌리개, 칠판 간판
  island.add(buildBarrel(0.85, 0.35));
  island.add(buildWateringCan(1.6, 1.25));
  island.add(buildChalkboard(-3.7, 2.7));

  island.add(buildPath());

  // 나무
  island.add(buildTree(-4.0, -2.2, 1.2));
  island.add(buildTree(-4.7, -0.5, 0.8));
  island.add(buildTree(4.6, -3.6, 1.05));
  island.add(buildTree(-1.2, -4.6, 0.9));
  island.add(buildTree(5.3, -1.0, 0.7));

  // 꽃·덤불·버섯 장식
  island.add(buildFlower(-4.4, 1.9, PALETTE.cream, 1.2));
  island.add(buildFlower(3.0, 2.2, PALETTE.roof, 1.3));
  island.add(buildFlower(2.4, 3.5, PALETTE.cream, 1.1));
  island.add(buildFlower(3.9, 3.0, PALETTE.roof, 1.2));
  island.add(buildFlower(4.6, 1.4, PALETTE.cream, 1.0));
  island.add(buildFlower(-0.4, 4.7, PALETTE.cream, 0.9));
  island.add(buildFlower(-2.8, 4.1, PALETTE.roof, 1.0));
  island.add(buildBush(4.4, 2.2, 1.2));
  island.add(buildBush(-2.0, 4.6, 1.0));
  island.add(buildBush(-4.9, 0.9, 0.9));
  island.add(buildBush(0.1, -2.6, 0.9));
  island.add(buildMushroomDecor(1.0, -4.4, PALETTE.roof, 1.3));
  island.add(buildMushroomDecor(2.0, -4.8, '#C9B3F0', 0.9));
  island.add(buildMushroomDecor(5.0, 0.4, PALETTE.roof, 0.7));

  return { island, shop, cauldron, garden };
}

export function buildSky() {
  const sky = new THREE.Group();
  sky.name = 'sky';
  // 카메라가 섬 주위를 돌 때 부딪히지 않게 멀리(반지름 35 이상) 둔다
  sky.add(buildCloud(-24, 9, -26, 3.0));
  sky.add(buildCloud(20, 11, -30, 2.6, '#FFFFFF'));
  sky.add(buildCloud(36, 5, 4, 2.4));
  sky.add(buildCloud(-36, 4, 10, 2.4, '#FFFFFF'));
  sky.add(buildCloud(6, 7, 38, 2.2));
  // 멀리 떠 있는 섬들
  sky.add(buildFarIsland(-30, -1, -34, 1.2, { house: true }));
  sky.add(buildFarIsland(32, 0, -30, 1.3, { waterfall: true }));
  sky.add(buildFarIsland(-40, -4, 6, 1.0));
  sky.add(buildFarIsland(42, -3, 10, 0.9, { house: true }));
  sky.add(buildFarIsland(4, -2, -44, 1.0));
  sky.add(buildDistantForest());
  return sky;
}
