// 섬 디오라마 만들기
// 모든 물체는 three.js 기본 도형(구, 원기둥, 상자, 원뿔, 도넛)과 색만으로 만든다.
//
// [three.js 기본 개념]
// - Mesh(메시) = Geometry(모양) + Material(재질·색). 화면에 보이는 물체 하나.
// - Group(그룹) = 여러 메시를 묶은 상자. 그룹을 옮기거나 돌리면 안의 메시가 함께 움직인다.
// - position / rotation / scale 로 위치·회전·크기를 정한다. 단위는 자유지만 여기서는 1 = 대략 사람 키의 절반.

import * as THREE from 'three';

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
};

// ───────────────────────── 섬 바닥 ─────────────────────────
function buildGround() {
  const group = new THREE.Group();
  group.name = 'ground';

  // 풀밭 윗면: 납작한 원기둥 하나 + 가장자리를 따라 둥근 덩어리를 붙여 울퉁불퉁하게
  group.add(mesh(new THREE.CylinderGeometry(6, 6, 0.6, 48), mat(PALETTE.grass), { pos: [0, -0.3, 0], shadow: false }));
  const edgeCount = 16;
  for (let i = 0; i < edgeCount; i++) {
    const a = (i / edgeCount) * Math.PI * 2;
    const r = 5.6;
    group.add(mesh(G.sphere, mat(PALETTE.grass), {
      pos: [Math.cos(a) * r, -0.35, Math.sin(a) * r],
      scale: [1.3, 0.45, 1.3],
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
  return group;
}

// ───────────────────────── 나무 ─────────────────────────
function buildTree(x, z, size = 1) {
  const tree = new THREE.Group();
  tree.add(mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.6, 12), mat(PALETTE.wood), { pos: [0, 0.8, 0] }));
  // 잎: 크기가 다른 구 3개를 겹쳐 뭉게뭉게
  tree.add(mesh(G.sphere, mat(PALETTE.leaf), { pos: [0, 2.0, 0], scale: [1.1, 1.0, 1.1] }));
  tree.add(mesh(G.sphere, mat(PALETTE.leafDark), { pos: [0.7, 1.7, 0.2], scale: [0.75, 0.7, 0.75] }));
  tree.add(mesh(G.sphere, mat(PALETTE.leaf), { pos: [-0.6, 1.8, -0.3], scale: [0.8, 0.75, 0.8] }));
  tree.position.set(x, 0, z);
  tree.scale.setScalar(size);
  return tree;
}

// ───────────────────────── 가게 ─────────────────────────
function buildShop() {
  const shop = new THREE.Group();
  shop.name = 'shop';

  // 벽
  shop.add(mesh(G.box, mat(PALETTE.wall), { pos: [0, 1.1, 0], scale: [3.2, 2.2, 2.6] }));

  // 둥근 지붕: 원기둥을 반만 잘라(thetaLength = π) 앞뒤 방향으로 눕힌다 → 앞에서 보면 아치 모양
  const roofGeo = new THREE.CylinderGeometry(1.85, 1.85, 3.0, 24, 1, true, -Math.PI / 2, Math.PI);
  roofGeo.computeVertexNormals();
  shop.add(mesh(roofGeo, mat(PALETTE.roof, { side: THREE.DoubleSide }), { pos: [0, 2.2, 0], rot: [-Math.PI / 2, 0, 0], scale: [1, 1, 0.8] }));
  // 지붕 안쪽 앞뒤를 막는 반원 벽 (지붕보다 조금 작게 해서 분홍 테두리가 보이게)
  const capGeo = new THREE.CircleGeometry(1.6, 24, 0, Math.PI);
  shop.add(mesh(capGeo, mat(PALETTE.wall), { pos: [0, 2.2, 1.3], scale: [1, 0.8, 1], shadow: false }));
  shop.add(mesh(capGeo, mat(PALETTE.wall), { pos: [0, 2.2, -1.3], rot: [0, Math.PI, 0], scale: [1, 0.8, 1], shadow: false }));

  // 굴뚝
  shop.add(mesh(G.box, mat(PALETTE.wood), { pos: [-0.9, 3.4, -0.4], scale: [0.45, 1.0, 0.45] }));
  shop.add(mesh(G.box, mat(PALETTE.woodDark), { pos: [-0.9, 3.95, -0.4], scale: [0.55, 0.15, 0.55] }));

  // 지붕 꼭대기 별 장식 (팔면체를 납작하게)
  shop.add(mesh(new THREE.OctahedronGeometry(0.35), mat(PALETTE.accent, { emissive: PALETTE.accent, emissiveIntensity: 0.4 }), {
    pos: [0.6, 3.95, 0], scale: [1, 1.3, 0.35],
  }));

  // 창문: 노란 빛이 나는 판 (emissive = 스스로 빛나는 색, 조명이 없어도 밝게 보인다)
  const windowMat = mat('#FFE6A0', { emissive: '#FFC861', emissiveIntensity: 0.6 });
  shop.add(mesh(G.box, windowMat, { pos: [0, 2.75, 1.32], scale: [0.7, 0.55, 0.05], shadow: false }));
  shop.add(mesh(G.box, windowMat, { pos: [1.62, 1.35, 0.3], scale: [0.05, 0.6, 0.6], shadow: false }));
  // 창살
  shop.add(mesh(G.box, mat(PALETTE.woodDark), { pos: [0, 2.75, 1.35], scale: [0.06, 0.55, 0.03], shadow: false }));
  shop.add(mesh(G.box, mat(PALETTE.woodDark), { pos: [0, 2.75, 1.35], scale: [0.7, 0.06, 0.03], shadow: false }));

  // 판매 창구(카운터)와 진열 선반
  shop.add(mesh(G.box, mat(PALETTE.woodDark), { pos: [0.2, 1.25, 1.31], scale: [1.8, 1.1, 0.05], shadow: false }));
  shop.add(mesh(G.box, mat(PALETTE.wood), { pos: [0.2, 0.55, 1.5], scale: [2.0, 0.9, 0.45] }));
  shop.add(mesh(G.box, mat(PALETTE.woodDark), { pos: [0.2, 1.02, 1.52], scale: [2.1, 0.08, 0.55] }));
  // 선반 위 장식 물약 병
  const bottleColors = ['#A8C8FF', '#FFB3C6', '#C9B3F0', '#BDE89C'];
  bottleColors.forEach((c, i) => {
    const x = -0.45 + i * 0.4;
    shop.add(mesh(G.sphere, mat(c, { roughness: 0.3 }), { pos: [x, 1.2, 1.55], scale: [0.14, 0.14, 0.14] }));
    shop.add(mesh(G.cylinder, mat(PALETTE.cream), { pos: [x, 1.36, 1.55], scale: [0.05, 0.1, 0.05] }));
  });

  // 줄무늬 차양: 분홍·크림 판자를 번갈아 기울여 붙인다
  for (let i = 0; i < 7; i++) {
    const x = -1.0 + i * 0.36 + 0.2;
    shop.add(mesh(G.box, mat(i % 2 ? PALETTE.cream : PALETTE.roof), {
      pos: [x, 2.0, 1.6], rot: [0.55, 0, 0], scale: [0.36, 0.06, 0.8],
    }));
  }

  // 랜턴 두 개
  const lanternMat = mat('#FFE6A0', { emissive: '#FFC861', emissiveIntensity: 0.8 });
  [-1.35, 1.75].forEach((x) => {
    shop.add(mesh(G.box, lanternMat, { pos: [x, 1.75, 1.45], scale: [0.22, 0.3, 0.22], shadow: false }));
    shop.add(mesh(G.box, mat(PALETTE.woodDark), { pos: [x, 1.95, 1.45], scale: [0.28, 0.06, 0.28], shadow: false }));
  });

  // 문(옆면)
  shop.add(mesh(G.box, mat(PALETTE.wood), { pos: [-1.62, 0.7, 0.4], scale: [0.05, 1.4, 0.8], shadow: false }));

  // 덩굴 잎 몇 개
  [[-1.4, 2.7, 1.1], [1.3, 2.9, 1.0], [-0.4, 3.3, 0.9]].forEach((p) => {
    shop.add(mesh(G.sphereLow, mat(PALETTE.leafDark), { pos: p, scale: [0.25, 0.18, 0.25] }));
  });

  return shop;
}

// ───────────────────────── 솥 ─────────────────────────
function buildCauldron() {
  const cauldron = new THREE.Group();
  cauldron.name = 'cauldron';

  // 받침 돌 고리
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    cauldron.add(mesh(G.sphereLow, mat(PALETTE.stoneGray), {
      pos: [Math.cos(a) * 0.85, 0.08, Math.sin(a) * 0.85], scale: [0.28, 0.14, 0.22], shadow: false,
    }));
  }
  // 불빛: 바닥에서 노랗게 빛나는 원판
  cauldron.add(mesh(new THREE.CircleGeometry(0.6, 20), mat(PALETTE.accent, { emissive: '#FFB347', emissiveIntensity: 1.0 }), {
    pos: [0, 0.03, 0], rot: [-Math.PI / 2, 0, 0], shadow: false,
  }));

  // 솥 몸통: 위아래로 살짝 눌린 구
  cauldron.add(mesh(G.sphere, mat(PALETTE.cauldron, { roughness: 0.6 }), { pos: [0, 0.75, 0], scale: [0.75, 0.62, 0.75] }));
  // 테두리: 도넛 모양(TorusGeometry)
  cauldron.add(mesh(new THREE.TorusGeometry(0.58, 0.1, 10, 28), mat('#7A68AA', { roughness: 0.6 }), {
    pos: [0, 1.25, 0], rot: [Math.PI / 2, 0, 0],
  }));
  // 끓는 물약 표면
  const liquidMat = mat(PALETTE.potion, { emissive: '#D58BF0', emissiveIntensity: 0.35, roughness: 0.4 });
  cauldron.add(mesh(new THREE.CircleGeometry(0.55, 24), liquidMat, { pos: [0, 1.22, 0], rot: [-Math.PI / 2, 0, 0], shadow: false }));
  // 거품
  [[0.15, 1.35, 0.1, 0.12], [-0.2, 1.42, -0.05, 0.09], [0.05, 1.55, -0.2, 0.07]].forEach(([x, y, z, s]) => {
    cauldron.add(mesh(G.sphereLow, mat(PALETTE.potion, { roughness: 0.2, transparent: true, opacity: 0.85 }), { pos: [x, y, z], scale: [s, s, s], shadow: false }));
  });
  // 손잡이 고리 두 개
  [-1, 1].forEach((side) => {
    cauldron.add(mesh(new THREE.TorusGeometry(0.13, 0.04, 8, 16), mat('#7A68AA'), { pos: [side * 0.78, 1.0, 0], rot: [0, Math.PI / 2, 0] }));
  });
  // 다리 세 개
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    cauldron.add(mesh(G.sphereLow, mat('#6E5E9E'), { pos: [Math.cos(a) * 0.45, 0.2, Math.sin(a) * 0.45], scale: [0.13, 0.18, 0.13] }));
  }
  // 젓는 국자
  cauldron.add(mesh(G.cylinder, mat(PALETTE.wood), { pos: [0.25, 1.55, 0.05], rot: [0, 0, -0.45], scale: [0.05, 0.9, 0.05] }));

  return cauldron;
}

// ───────────────────────── 뒤뜰 정원 ─────────────────────────
// 3단계에서 재료가 자라날 밭 자리. 지금은 빈 흙 밭과 울타리만 만든다.
function buildGarden() {
  const garden = new THREE.Group();
  garden.name = 'garden';

  // 밭 6칸 (3 x 2). 0~2번이 카메라 쪽 앞줄, 3~5번이 뒷줄. 각 칸에 이름을 붙여 두면 나중에 찾기 쉽다.
  const plots = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const plot = mesh(G.box, mat(PALETTE.dirtDark), {
        pos: [col * 1.25 - 1.25, 0.06, (1 - row) * 1.25 - 0.62], scale: [0.95, 0.14, 0.95], shadow: false,
      });
      plot.name = `plot-${row * 3 + col}`;
      garden.add(plot);
      plots.push(plot);
      // 흙 위 작은 둔덕
      garden.add(mesh(G.sphereLow, mat(PALETTE.dirt), { pos: [plot.position.x, 0.13, plot.position.z], scale: [0.35, 0.08, 0.35], shadow: false }));
    }
  }
  garden.userData.plots = plots;

  // 울타리: 기둥 + 가로대 (앞쪽은 드나들 수 있게 가운데를 비운다)
  const w = 4.4, d = 3.2; // 울타리 너비·깊이
  const postGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.7, 10);
  const posts = [];
  for (let i = 0; i <= 4; i++) posts.push([-w / 2 + (w / 4) * i, -d / 2]);          // 뒤
  for (let i = 1; i <= 3; i++) posts.push([-w / 2, -d / 2 + (d / 3) * i]);          // 왼쪽
  for (let i = 1; i <= 3; i++) posts.push([w / 2, -d / 2 + (d / 3) * i]);           // 오른쪽
  posts.push([-w / 2 + 0.55, d / 2], [w / 2 - 0.55, d / 2]);                         // 앞 (가운데 입구)
  posts.forEach(([x, z]) => garden.add(mesh(postGeo, mat(PALETTE.wood), { pos: [x, 0.35, z] })));

  const rail = (x1, z1, x2, z2) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const r = mesh(G.box, mat(PALETTE.woodDark), {
      pos: [(x1 + x2) / 2, 0.45, (z1 + z2) / 2], scale: [len, 0.09, 0.08],
    });
    r.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    garden.add(r);
  };
  rail(-w / 2, -d / 2, w / 2, -d / 2);
  rail(-w / 2, -d / 2, -w / 2, d / 2);
  rail(w / 2, -d / 2, w / 2, d / 2);
  rail(-w / 2, d / 2, -w / 2 + 0.55, d / 2);
  rail(w / 2 - 0.55, d / 2, w / 2, d / 2);
  // 앞쪽 모서리 기둥
  garden.add(mesh(postGeo, mat(PALETTE.wood), { pos: [-w / 2, 0.35, d / 2] }));
  garden.add(mesh(postGeo, mat(PALETTE.wood), { pos: [w / 2, 0.35, d / 2] }));

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
  b.add(mesh(G.sphereLow, mat(PALETTE.leafDark), { pos: [0, 0.25, 0], scale: [0.5, 0.4, 0.45] }));
  b.add(mesh(G.sphereLow, mat(PALETTE.leaf), { pos: [0.3, 0.2, 0.1], scale: [0.35, 0.3, 0.32] }));
  b.position.set(x, 0, z);
  b.scale.setScalar(s);
  return b;
}

function buildMushroomDecor(x, z, capColor, s = 1) {
  const m = new THREE.Group();
  m.add(mesh(G.cylinder, mat(PALETTE.cream), { pos: [0, 0.3, 0], scale: [0.15, 0.6, 0.15] }));
  const cap = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); // 반구
  m.add(mesh(cap, mat(capColor), { pos: [0, 0.55, 0], scale: [0.45, 0.35, 0.45] }));
  [[0.2, 0.75, 0.25], [-0.25, 0.72, 0.15], [0.0, 0.85, -0.2]].forEach((p) => {
    m.add(mesh(G.sphereLow, mat(PALETTE.cream), { pos: p, scale: [0.07, 0.04, 0.07], shadow: false }));
  });
  m.position.set(x, 0, z);
  m.scale.setScalar(s);
  return m;
}

// 징검다리 길
function buildPath() {
  const path = new THREE.Group();
  const stones = [[0.6, 2.4, 0.45], [1.3, 3.2, 0.4], [0.3, 3.6, 0.38], [1.0, 4.3, 0.42], [1.7, 1.6, 0.36], [2.4, 0.9, 0.34]];
  stones.forEach(([x, z, r]) => {
    path.add(mesh(G.cylinder, mat(PALETTE.stone), { pos: [x, 0.03, z], scale: [r, 0.08, r * 0.8], shadow: false }));
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

// ───────────────────────── 전체 조립 ─────────────────────────
export function buildIsland() {
  const island = new THREE.Group();
  island.name = 'island';

  island.add(buildGround());

  const shop = buildShop();
  shop.position.set(-1.6, 0, -0.6);
  shop.rotation.y = 0;
  island.add(shop);

  const cauldron = buildCauldron();
  cauldron.position.set(-1.6, 0, 2.5);
  island.add(cauldron);

  const garden = buildGarden();
  garden.position.set(2.7, 0, -1.6);
  garden.rotation.y = 0;
  island.add(garden);

  // 상자와 장식 병 (솥 옆)
  island.add(mesh(G.box, mat(PALETTE.wood), { pos: [0.55, 0.3, 0.75], scale: [0.7, 0.6, 0.6] }));
  island.add(mesh(G.box, mat(PALETTE.woodDark), { pos: [0.55, 0.62, 0.75], scale: [0.75, 0.05, 0.65] }));

  island.add(buildPath());

  // 나무
  island.add(buildTree(-4.0, -2.2, 1.2));
  island.add(buildTree(-4.4, 0.8, 0.8));
  island.add(buildTree(4.6, -3.6, 1.0));
  island.add(buildTree(-1.2, -4.6, 0.9));

  // 꽃·덤불·버섯 장식
  island.add(buildFlower(-3.6, 2.6, PALETTE.cream, 1.2));
  island.add(buildFlower(3.0, 2.2, PALETTE.roof, 1.3));
  island.add(buildFlower(2.2, 3.6, PALETTE.roof, 1.0));
  island.add(buildFlower(3.9, 3.0, PALETTE.cream, 1.1));
  island.add(buildFlower(-0.4, 4.6, PALETTE.cream, 0.9));
  island.add(buildBush(4.4, 2.0, 1.2));
  island.add(buildBush(-2.4, 4.3, 1.0));
  island.add(buildBush(-4.8, -1.0, 0.9));
  island.add(buildMushroomDecor(1.0, -4.4, PALETTE.roof, 1.2));
  island.add(buildMushroomDecor(2.0, -4.8, '#C9B3F0', 0.8));

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
  sky.add(buildDistantForest());
  return sky;
}
