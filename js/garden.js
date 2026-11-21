// 정원 화면: 밭마다 재료 3D 모양을 올리고, 규칙 모듈(rules/garden.js)의 상태에 맞춰
// 자라는 크기를 바꿔 준다. 수확 판정은 규칙 모듈이 하고, 여기서는 그리기만 한다.

import * as THREE from 'three';
import { mat, mesh, G, PALETTE } from './scene.js';
import { INGREDIENTS } from './data.js';
import { growthProgress, isReady } from './rules/garden.js';

const COLOR = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i.color]));
const CROP_SIZE = 1.4; // 밭 위 재료 크기 배율
const halfSphere = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);

// ───── 재료 5종 모양 (1단계 표 그대로) ─────
const CROP_BUILDERS = {
  // 이슬꽃: 하늘색 구 꽃잎 5개 + 가는 원기둥 줄기
  dewflower() {
    const g = new THREE.Group();
    g.add(mesh(G.cylinder, mat(PALETTE.leafDark), { pos: [0, 0.25, 0], scale: [0.035, 0.5, 0.035] }));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.add(mesh(G.sphereLow, mat(COLOR.dewflower), { pos: [Math.cos(a) * 0.14, 0.55, Math.sin(a) * 0.14], scale: [0.11, 0.07, 0.11] }));
    }
    g.add(mesh(G.sphereLow, mat(PALETTE.cream), { pos: [0, 0.57, 0], scale: [0.07, 0.06, 0.07] }));
    g.add(mesh(G.sphereLow, mat(PALETTE.leaf), { pos: [0.1, 0.12, 0], scale: [0.14, 0.05, 0.08], rot: [0, 0, 0.4] }));
    g.add(mesh(G.sphereLow, mat(PALETTE.leaf), { pos: [-0.1, 0.16, 0], scale: [0.14, 0.05, 0.08], rot: [0, 0, -0.4] }));
    return g;
  },
  // 콩콩버섯: 분홍 반구 갓 + 흰 점 + 짧은 원기둥 기둥
  mushroom() {
    const g = new THREE.Group();
    g.add(mesh(G.cylinder, mat(PALETTE.cream), { pos: [0, 0.17, 0], scale: [0.12, 0.34, 0.12] }));
    g.add(mesh(halfSphere, mat(COLOR.mushroom), { pos: [0, 0.32, 0], scale: [0.34, 0.28, 0.34] }));
    [[0.15, 0.5, 0.17], [-0.18, 0.48, 0.1], [0.02, 0.58, -0.12], [0.2, 0.44, -0.15]].forEach((p) => {
      g.add(mesh(G.sphereLow, mat('#FFFFFF'), { pos: p, scale: [0.05, 0.03, 0.05], shadow: false }));
    });
    return g;
  },
  // 말랑민트: 납작하게 누른 구 잎 3장
  mint() {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Group();
      leaf.add(mesh(G.sphereLow, mat(COLOR.mint), { pos: [0, 0.36, 0.15], rot: [0.6, 0, 0], scale: [0.15, 0.05, 0.26] }));
      leaf.rotation.y = (i / 3) * Math.PI * 2;
      g.add(leaf);
    }
    g.add(mesh(G.sphereLow, mat(PALETTE.leafDark), { pos: [0, 0.2, 0], scale: [0.07, 0.22, 0.07] }));
    return g;
  },
  // 별사탕열매: 덤불(구) 위에 정팔면체 열매
  starberry() {
    const g = new THREE.Group();
    g.add(mesh(G.sphereLow, mat(PALETTE.leafDark), { pos: [0, 0.22, 0], scale: [0.32, 0.25, 0.32] }));
    const fruitMat = mat(COLOR.starberry, { emissive: COLOR.starberry, emissiveIntensity: 0.25 });
    [[0, 0.52, 0], [0.18, 0.42, 0.12], [-0.17, 0.4, 0.1]].forEach((p) => {
      g.add(mesh(new THREE.OctahedronGeometry(0.09), fruitMat, { pos: p }));
    });
    return g;
  },
  // 달빛호박: 위아래로 눌린 구 + 원기둥 꼭지
  moonpumpkin() {
    const g = new THREE.Group();
    g.add(mesh(G.sphere, mat(COLOR.moonpumpkin), { pos: [0, 0.2, 0], scale: [0.32, 0.22, 0.32] }));
    g.add(mesh(G.cylinder, mat(PALETTE.leafDark), { pos: [0, 0.45, 0], scale: [0.04, 0.12, 0.04] }));
    g.add(mesh(G.sphereLow, mat(PALETTE.leaf), { pos: [0.1, 0.43, 0.05], scale: [0.12, 0.03, 0.08] }));
    return g;
  },
};

export function buildCrop(id) {
  return CROP_BUILDERS[id]();
}

// 정원 그룹(scene.js의 buildGarden 결과)에 재료 모양을 올리고 관리하는 객체를 만든다
export function createGardenView(gardenGroup) {
  const plotMeshes = gardenGroup.userData.plots;
  const crops = []; // 밭 번호별 { id, group }

  // 클릭 판정을 위해 밭 메시에 번호를 적어 둔다
  plotMeshes.forEach((m, i) => { m.userData.plotIndex = i; });

  function setCrop(i, id) {
    const old = crops[i];
    if (old && old.id === id) return;
    if (old) gardenGroup.remove(old.group);
    crops[i] = null;
    if (!id) return;
    const group = buildCrop(id);
    group.position.set(plotMeshes[i].position.x, 0.13, plotMeshes[i].position.z);
    group.userData.plotIndex = i;
    group.traverse((o) => { o.userData.plotIndex = i; }); // 재료의 어느 부분을 눌러도 이 밭으로
    gardenGroup.add(group);
    crops[i] = { id, group };
  }

  // 매 프레임: 상태에 맞춰 재료 크기를 바꾼다.
  // 자라는 중에는 작게 시작해 점점 커지고, 다 자라면 통통 살짝 흔들려 "수확할 수 있어요"를 알린다.
  function update(garden, now, time) {
    garden.plots.forEach((plot, i) => {
      setCrop(i, plot.crop);
      const c = crops[i];
      if (!c) return;
      const p = growthProgress(plot, now);
      let s = (0.3 + 0.7 * p) * CROP_SIZE;
      let y = 0;
      if (isReady(plot, now)) {
        s *= 1 + Math.sin(time * 4 + i) * 0.04;
        y = Math.abs(Math.sin(time * 2 + i)) * 0.04;
      }
      // 수확 직후 통통: 위아래로 늘었다 줄었다 (말랑한 젤리처럼 찌그러짐)
      let sx = 1, sy = 1;
      if (pops[i] === 'start') pops[i] = time;
      if (typeof pops[i] === 'number') {
        const k = (time - pops[i]) / 0.5;
        if (k >= 1) pops[i] = null;
        else {
          const w = Math.sin(k * Math.PI * 3) * 0.45 * (1 - k);
          sy = 1 + w; sx = 1 - w * 0.5;
          y += Math.max(0, w) * 0.15;
        }
      }
      c.group.scale.set(s * sx, s * sy, s * sx);
      c.group.position.y = 0.13 + y;
    });
  }

  const pops = []; // 밭 번호별 통통 효과 시작 시각
  function pop(i) { pops[i] = 'start'; }

  // 밭 가운데의 월드 좌표 (반짝이를 터뜨릴 자리)
  function worldPos(i) {
    return plotMeshes[i].getWorldPosition(new THREE.Vector3());
  }

  return { update, pop, worldPos, objects: gardenGroup };
}

// 레이캐스터가 맞힌 물체에서 밭 번호를 찾는다 (없으면 -1)
export function plotIndexOf(object) {
  for (let o = object; o; o = o.parent) {
    if (o.userData && Number.isInteger(o.userData.plotIndex)) return o.userData.plotIndex;
  }
  return -1;
}
