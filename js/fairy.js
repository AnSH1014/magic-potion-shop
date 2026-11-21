// 요정 손님 4명 (참고 이미지 02_characters.png, 04_characters2.png 를 구·원뿔로 단순화)
// 공통: 큰 머리 + 작은 몸 + 크림색 날개. 요정마다 머리 모양·옷·장신구가 다르다.
//  - flower  꽃 요정: 분홍 올림머리, 데이지 머리핀, 보라 꽃잎 원피스, 잎사귀 깃
//  - crystal 크리스탈 요정: 민트색 웨이브 머리, 크리스탈 왕관, 파란 망토, 보석 단추
//  - mushroom 버섯 요정: 분홍 땡땡이 버섯 모자, 주황 땋은 머리, 크림색 원피스와 단추
//  - star    별 요정: 노란 머리와 큰 올림머리, 보라 리본과 별, 노란 원피스, 물약 크로스백

import * as THREE from 'three';
import { mat, mesh, G, PALETTE } from './scene.js';

const halfSphere = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
const crystalGeo = new THREE.ConeGeometry(1, 1, 5);   // 오각뿔 = 크리스탈 조각
const starGeo = new THREE.OctahedronGeometry(1);      // 납작하게 누르면 반짝 별 모양

// ───── 요정마다 다른 부분 ─────
const STYLES = {
  flower: {
    hair: '#FF9EBB', dress: '#C9A8F0',
    decorate(head, body, m) {
      head.add(mesh(G.sphere, m.hair, { pos: [0, 0.38, -0.05], scale: [0.16, 0.15, 0.16] }));                 // 올림머리
      // 데이지 머리핀: 흰 꽃잎 5장 + 노란 가운데 + 잎사귀
      const daisy = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        daisy.add(mesh(G.sphereLow, mat('#FFFFFF'), { pos: [Math.cos(a) * 0.06, Math.sin(a) * 0.06, 0], scale: [0.045, 0.045, 0.025], shadow: false }));
      }
      daisy.add(mesh(G.sphereLow, mat(PALETTE.accent), { pos: [0, 0, 0.015], scale: [0.035, 0.035, 0.02], shadow: false }));
      daisy.add(mesh(G.sphereLow, mat(PALETTE.leafDark), { pos: [-0.08, -0.05, -0.01], rot: [0, 0, 0.6], scale: [0.05, 0.025, 0.02], shadow: false }));
      daisy.position.set(-0.24, 0.2, 0.17);
      daisy.rotation.y = -0.6;
      head.add(daisy);
      // 잎사귀 깃
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        body.add(mesh(G.sphereLow, mat(PALETTE.leafDark), { pos: [Math.cos(a) * 0.1, 0.68, Math.sin(a) * 0.1], rot: [0, -a, 0], scale: [0.08, 0.025, 0.05] }));
      }
    },
  },

  crystal: {
    hair: '#9FD8C8', dress: '#A9A6E8',
    decorate(head, body, m) {
      // 웨이브 머리: 옆과 뒤에 둥근 덩어리를 더 붙인다
      [[-0.3, -0.12, -0.02], [0.3, -0.12, -0.02], [-0.2, -0.2, -0.18], [0.2, -0.2, -0.18], [0, -0.15, -0.25]].forEach((p) => {
        head.add(mesh(G.sphereLow, m.hair, { pos: p, scale: [0.12, 0.13, 0.12] }));
      });
      // 크리스탈 왕관: 갈색 고리 + 보라·하늘 크리스탈 3개
      head.add(mesh(new THREE.TorusGeometry(0.15, 0.025, 8, 20), mat(PALETTE.woodDark), { pos: [0, 0.3, -0.02], rot: [Math.PI / 2 - 0.15, 0, 0] }));
      [[0, 0.47, -0.02, 0.08, 0.28, '#C3A6EE'], [-0.12, 0.42, 0, 0.06, 0.2, '#A8D8FF'], [0.12, 0.42, 0, 0.06, 0.2, '#A8D8FF']].forEach(([x, y, z, r, h, c]) => {
        head.add(mesh(crystalGeo, mat(c, { roughness: 0.3, emissive: c, emissiveIntensity: 0.2 }), { pos: [x, y, z], rot: [0, 0, -x * 2], scale: [r, h, r] }));
      });
      // 파란 망토: 몸보다 조금 큰 원뿔을 뒤쪽에 + 크림색 깃
      body.add(mesh(new THREE.ConeGeometry(0.34, 0.5, 20, 1, true, Math.PI / 2, Math.PI), mat('#9DB8F0', { side: THREE.DoubleSide }), { pos: [0, 0.46, -0.02] }));
      body.add(mesh(new THREE.TorusGeometry(0.1, 0.035, 8, 16), mat('#FFF1DC'), { pos: [0, 0.68, 0], rot: [Math.PI / 2, 0, 0] }));
      // 보석 단추
      body.add(mesh(starGeo, mat('#A8D8FF', { roughness: 0.2, emissive: '#A8D8FF', emissiveIntensity: 0.3 }), { pos: [0, 0.5, 0.2], scale: [0.04, 0.06, 0.02] }));
    },
  },

  mushroom: {
    hair: '#F4B57A', dress: '#FFF1DC',
    decorate(head, body, m) {
      // 땋은 머리: 양옆에 작은 구를 줄지어
      [-1, 1].forEach((s) => {
        for (let i = 0; i < 3; i++) head.add(mesh(G.sphereLow, m.hair, { pos: [s * 0.3, -0.12 - i * 0.09, 0.02], scale: [0.065, 0.06, 0.065] }));
        head.add(mesh(G.sphereLow, mat('#FFFFFF'), { pos: [s * 0.3, -0.36, 0.02], scale: [0.04, 0.03, 0.04], shadow: false }));
      });
      // 버섯 모자: 큰 분홍 반구 + 흰 땡땡이
      const hat = new THREE.Group();
      hat.add(mesh(halfSphere, mat(PALETTE.roof), { scale: [0.46, 0.34, 0.46] }));
      [[0.2, 0.22, 0.25], [-0.25, 0.2, 0.2], [0.02, 0.32, 0], [0.3, 0.12, -0.2], [-0.15, 0.24, -0.28]].forEach((p) => {
        hat.add(mesh(G.sphereLow, mat('#FFFFFF'), { pos: p, scale: [0.07, 0.04, 0.07], shadow: false }));
      });
      hat.position.set(0, 0.12, 0);
      hat.rotation.z = 0.12;
      head.add(hat);
      // 원피스 단추 두 개
      [0.55, 0.42].forEach((y) => body.add(mesh(G.sphereLow, mat(PALETTE.wood), { pos: [0, y, 0.15 + (0.6 - y) * 0.3], scale: [0.03, 0.03, 0.02], shadow: false })));
    },
  },

  star: {
    hair: '#FFD86B', dress: '#FFE07A',
    decorate(head, body, m) {
      head.add(mesh(G.sphere, m.hair, { pos: [-0.05, 0.4, -0.08], scale: [0.2, 0.18, 0.2] }));              // 큰 올림머리
      // 보라 리본 + 노란 별
      [-1, 1].forEach((s) => head.add(mesh(G.sphereLow, mat('#B59BE8'), { pos: [0.18 + s * 0.08, 0.26, 0.14], rot: [0, 0, s * 0.5], scale: [0.08, 0.05, 0.03] })));
      head.add(mesh(starGeo, mat(PALETTE.accent, { emissive: PALETTE.accent, emissiveIntensity: 0.3 }), { pos: [0.18, 0.26, 0.17], scale: [0.04, 0.04, 0.015] }));
      // 보라 깃
      body.add(mesh(G.sphereLow, mat('#B59BE8'), { pos: [0, 0.68, 0.02], scale: [0.14, 0.05, 0.12] }));
      // 크로스백: 대각선 끈 + 옆구리의 분홍 물약 병
      body.add(mesh(new THREE.TorusGeometry(0.22, 0.015, 6, 24), mat(PALETTE.woodDark), { pos: [0, 0.5, 0.02], rot: [0, 0, 0.7], scale: [1, 1.1, 0.9] }));
      body.add(mesh(G.sphereLow, mat('#FFB3D9', { roughness: 0.2, emissive: '#FFB3D9', emissiveIntensity: 0.2 }), { pos: [0.24, 0.33, 0.1], scale: [0.08, 0.08, 0.08] }));
      body.add(mesh(G.cylinder, mat(PALETTE.wood), { pos: [0.24, 0.43, 0.1], scale: [0.03, 0.05, 0.03] }));
    },
  },
};
export const FAIRY_STYLES = Object.keys(STYLES);

function buildFairy(styleName) {
  const style = STYLES[styleName];
  const root = new THREE.Group();   // 위치·회전용
  const body = new THREE.Group();   // 통통 뛰기용
  root.add(body);

  const skin = mat(PALETTE.fairy);
  const m = { hair: mat(style.hair), dress: mat(style.dress) };

  // 다리와 원피스
  [-0.09, 0.09].forEach((x) => body.add(mesh(G.cylinder, skin, { pos: [x, 0.12, 0], scale: [0.06, 0.24, 0.06] })));
  body.add(mesh(new THREE.ConeGeometry(0.3, 0.5, 20), m.dress, { pos: [0, 0.45, 0] }));
  // 팔
  [-1, 1].forEach((s) => body.add(mesh(G.sphereLow, skin, { pos: [s * 0.2, 0.5, 0.06], rot: [0, 0, s * 0.5], scale: [0.06, 0.14, 0.06] })));

  // 머리: 몸보다 훨씬 크게 (동글동글한 비율)
  const head = new THREE.Group();
  head.position.y = 0.98;
  head.add(mesh(G.sphere, skin, { scale: [0.33, 0.31, 0.31] }));
  head.add(mesh(G.sphere, m.hair, { pos: [0, 0.07, -0.05], scale: [0.36, 0.32, 0.33] }));      // 뒷머리
  head.add(mesh(G.sphere, m.hair, { pos: [0, 0.16, 0.12], scale: [0.3, 0.13, 0.2] }));         // 앞머리
  [-1, 1].forEach((s) => head.add(mesh(G.sphereLow, m.hair, { pos: [s * 0.3, -0.08, 0.02], scale: [0.09, 0.16, 0.1] }))); // 옆머리
  // 얼굴: 눈, 볼, 입
  [-1, 1].forEach((s) => {
    head.add(mesh(G.sphereLow, mat('#5A4040'), { pos: [s * 0.11, -0.02, 0.28], scale: [0.035, 0.05, 0.02], shadow: false }));
    head.add(mesh(G.sphereLow, mat('#FFB3C6'), { pos: [s * 0.18, -0.09, 0.25], scale: [0.05, 0.03, 0.02], shadow: false }));
  });
  head.add(mesh(G.sphereLow, mat('#E07A8A'), { pos: [0, -0.1, 0.29], scale: [0.03, 0.02, 0.01], shadow: false }));
  body.add(head);

  // 날개: 납작한 반투명 구 4장
  const wingMat = mat('#FFF6DA', { transparent: true, opacity: 0.85 });
  const wings = [];
  [-1, 1].forEach((s) => {
    const w = new THREE.Group();
    w.position.set(s * 0.08, 0.6, -0.15);
    w.add(mesh(G.sphereLow, wingMat, { pos: [s * 0.25, 0.12, 0], rot: [0, 0, s * -0.5], scale: [0.24, 0.16, 0.02], shadow: false }));
    w.add(mesh(G.sphereLow, wingMat, { pos: [s * 0.2, -0.1, 0], rot: [0, 0, s * 0.4], scale: [0.16, 0.11, 0.02], shadow: false }));
    body.add(w);
    wings.push({ w, s });
  });

  style.decorate(head, body, m);
  return { root, body, head, wings };
}

// 요정 손님 한 자리: 4명의 모습을 미리 만들어 두고, 손님이 올 때 그중 하나를 보여 준다.
// 날아오기·떠나기·고개 젓기·기뻐서 통통 뛰기를 관리한다.
export function createFairy(scene, spot, faceAngle) {
  const root = new THREE.Group();   // 누르기 판정과 위치는 이 그룹 하나로
  root.position.copy(spot);
  root.rotation.y = faceAngle;
  root.scale.setScalar(1.4); // 참고 이미지처럼 가게 창구에 어울리는 크기로
  root.visible = false;
  scene.add(root);

  const looks = Object.fromEntries(FAIRY_STYLES.map((name) => {
    const f = buildFairy(name);
    f.root.visible = false;
    root.add(f.root);
    return [name, f];
  }));
  let f = looks.flower; // 지금 보이는 요정

  let mode = 'away';   // away → arriving → waiting → leaving → away
  let t = 0;
  let shakeT = 0;
  let hopT = 0;
  let onArrived = null;

  function arrive(styleName, cb) {
    Object.values(looks).forEach((l) => { l.root.visible = false; });
    f = looks[styleName] ?? looks.flower;
    f.root.visible = true;
    mode = 'arriving'; t = 0; root.visible = true; onArrived = cb;
  }
  function leave() { mode = 'leaving'; t = 0; }
  function shake() { shakeT = 0.8; }
  function hop() { hopT = 0.6; }

  function update(dt, time) {
    t += dt;
    let y = 0;
    if (mode === 'arriving') {
      const k = Math.min(1, t / 1.2);
      y = 4 * (1 - k) ** 3; // 위에서 부드럽게 내려온다 (4 → 0)
      if (k >= 1) { mode = 'waiting'; onArrived?.(); }
    } else if (mode === 'leaving') {
      const k = Math.min(1, t / 1.0);
      y = k * k * 5;                    // 점점 빠르게 위로 날아간다
      if (k >= 1) { mode = 'away'; root.visible = false; }
    }
    root.position.y = spot.y + y + 0.15 + Math.sin(time * 2.2) * 0.06; // 살짝 떠서 둥실둥실

    // 기뻐서 통통 (물약을 받았을 때)
    if (hopT > 0) {
      hopT = Math.max(0, hopT - dt);
      const k = 1 - hopT / 0.6;
      f.body.position.y = Math.abs(Math.sin(k * Math.PI * 2)) * 0.25 * (1 - k);
    } else {
      f.body.position.y = 0;
    }

    // 날갯짓
    const flap = Math.sin(time * (mode === 'waiting' ? 8 : 22)) * 0.35;
    f.wings.forEach(({ w, s }) => { w.rotation.y = s * flap; });

    // 고개 젓기 (도리도리)
    if (shakeT > 0) {
      shakeT = Math.max(0, shakeT - dt);
      f.head.rotation.y = Math.sin(shakeT * 25) * 0.45 * (shakeT / 0.8);
    } else {
      f.head.rotation.y = 0;
    }
  }

  // 말풍선을 띄울 머리 위 위치 (월드 좌표)
  const tmp = new THREE.Vector3();
  function bubbleAnchor() {
    return f.head.getWorldPosition(tmp).add(new THREE.Vector3(0, 0.6, 0));
  }

  return {
    group: root, arrive, leave, shake, hop, update, bubbleAnchor,
    get mode() { return mode; },
  };
}
