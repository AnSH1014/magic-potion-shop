// 요정 손님 (참고 이미지 02_characters.png 를 구·원뿔로 단순화)
// 큰 머리 + 분홍 머리카락과 올림머리 + 보라 원피스 + 크림색 날개

import * as THREE from 'three';
import { mat, mesh, G, PALETTE } from './scene.js';

function buildFairy() {
  const root = new THREE.Group();   // 위치·회전용
  const body = new THREE.Group();   // 둥실 떠다니기·고개 젓기용
  root.add(body);

  const skin = mat(PALETTE.fairy);
  const hair = mat('#FF9EBB');
  const dress = mat('#C3A6EE');

  // 다리와 원피스
  [-0.09, 0.09].forEach((x) => body.add(mesh(G.cylinder, skin, { pos: [x, 0.12, 0], scale: [0.06, 0.24, 0.06] })));
  body.add(mesh(new THREE.ConeGeometry(0.3, 0.5, 20), dress, { pos: [0, 0.45, 0] }));
  body.add(mesh(G.sphereLow, mat('#FFFFFF'), { pos: [0, 0.68, 0.02], scale: [0.14, 0.05, 0.12] })); // 꽃잎 깃
  // 팔
  [-1, 1].forEach((s) => body.add(mesh(G.sphereLow, skin, { pos: [s * 0.2, 0.5, 0.06], rot: [0, 0, s * 0.5], scale: [0.06, 0.14, 0.06] })));

  // 머리: 몸보다 훨씬 크게 (동글동글한 비율)
  const head = new THREE.Group();
  head.position.y = 0.98;
  head.add(mesh(G.sphere, skin, { scale: [0.33, 0.31, 0.31] }));
  head.add(mesh(G.sphere, hair, { pos: [0, 0.07, -0.05], scale: [0.36, 0.32, 0.33] }));      // 뒷머리
  head.add(mesh(G.sphere, hair, { pos: [0, 0.16, 0.12], scale: [0.3, 0.13, 0.2] }));         // 앞머리
  head.add(mesh(G.sphere, hair, { pos: [0, 0.38, -0.05], scale: [0.16, 0.15, 0.16] }));      // 올림머리
  [-1, 1].forEach((s) => head.add(mesh(G.sphereLow, hair, { pos: [s * 0.3, -0.08, 0.02], scale: [0.09, 0.16, 0.1] }))); // 옆머리
  // 얼굴: 눈, 볼
  [-1, 1].forEach((s) => {
    head.add(mesh(G.sphereLow, mat('#5A4040'), { pos: [s * 0.11, -0.02, 0.28], scale: [0.035, 0.05, 0.02], shadow: false }));
    head.add(mesh(G.sphereLow, mat('#FFB3C6'), { pos: [s * 0.18, -0.09, 0.25], scale: [0.05, 0.03, 0.02], shadow: false }));
  });
  head.add(mesh(G.sphereLow, mat('#E07A8A'), { pos: [0, -0.1, 0.29], scale: [0.03, 0.02, 0.01], shadow: false })); // 입
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

  return { root, body, head, wings };
}

// 요정 하나를 무대에 두고 날아오기·떠나기·고개 젓기를 관리한다
export function createFairy(scene, spot, faceAngle) {
  const f = buildFairy();
  f.root.position.copy(spot);
  f.root.rotation.y = faceAngle;
  f.root.scale.setScalar(1.4); // 참고 이미지처럼 가게 창구에 어울리는 크기로
  f.root.visible = false;
  scene.add(f.root);

  let mode = 'away';   // away → arriving → waiting → leaving → away
  let t = 0;
  let shakeT = 0;
  let onArrived = null;

  function arrive(cb) { mode = 'arriving'; t = 0; f.root.visible = true; onArrived = cb; }
  function leave() { mode = 'leaving'; t = 0; }
  function shake() { shakeT = 0.8; }

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
      if (k >= 1) { mode = 'away'; f.root.visible = false; }
    }
    f.root.position.y = spot.y + y + 0.15 + Math.sin(time * 2.2) * 0.06; // 살짝 떠서 둥실둥실

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
    return f.head.getWorldPosition(tmp).add(new THREE.Vector3(0, 0.55, 0));
  }

  return {
    group: f.root, arrive, leave, shake, update, bubbleAnchor,
    get mode() { return mode; },
  };
}
