// 솥에서 끓인 결과를 3D로 보여 주는 연출: 물약 병이 떠오르기, 뽀연 연기, 말랑한 수상한 젤리

import * as THREE from 'three';
import { mat, mesh, G, PALETTE } from './scene.js';

// ───── 물약 병 6가지 모양 (data.js 의 bottle 값) ─────
const BODY = {
  round:    () => ({ geo: G.sphere, scale: [0.3, 0.3, 0.3], y: 0.3, top: 0.58 }),
  bigRound: () => ({ geo: G.sphere, scale: [0.38, 0.38, 0.38], y: 0.38, top: 0.74 }),
  cylinder: () => ({ geo: G.cylinder, scale: [0.22, 0.5, 0.22], y: 0.25, top: 0.5 }),
  cone:     () => ({ geo: new THREE.CylinderGeometry(0.09, 0.3, 0.5, 20), scale: [1, 1, 1], y: 0.25, top: 0.5 }),
  cube:     () => ({ geo: G.box, scale: [0.42, 0.42, 0.42], y: 0.21, top: 0.42 }),
  tall:     () => ({ geo: G.cylinder, scale: [0.15, 0.7, 0.15], y: 0.35, top: 0.7 }),
};

export function buildBottle(potion) {
  const g = new THREE.Group();
  const b = BODY[potion.bottle]();
  // 반들반들한 유리 느낌을 위해 roughness를 낮추고, 물약 색으로 살짝 스스로 빛나게
  const glass = mat(potion.color, { roughness: 0.2, emissive: potion.color, emissiveIntensity: 0.25 });
  g.add(mesh(b.geo, glass, { pos: [0, b.y, 0], scale: b.scale }));
  g.add(mesh(G.cylinder, mat('#F4F0FA', { roughness: 0.3 }), { pos: [0, b.top + 0.08, 0], scale: [0.08, 0.18, 0.08] }));  // 병목
  g.add(mesh(G.cylinder, mat(PALETTE.wood), { pos: [0, b.top + 0.2, 0], scale: [0.1, 0.1, 0.1] }));                       // 코르크
  g.add(mesh(G.sphereLow, mat('#FFFFFF', { transparent: true, opacity: 0.7 }), { pos: [-0.1, b.y + 0.08, 0.16], scale: [0.05, 0.08, 0.03], shadow: false })); // 반짝 하이라이트
  return g;
}

// ───── 말랑한 수상한 젤리 (참고 이미지의 보라 젤리를 구로 단순화) ─────
export function buildJelly() {
  const g = new THREE.Group();
  const jelly = mat('#C9A8F0', { roughness: 0.25 });
  g.add(mesh(G.sphere, jelly, { pos: [0, 0.18, 0], scale: [0.42, 0.2, 0.42] }));   // 퍼진 아랫부분
  g.add(mesh(G.sphere, jelly, { pos: [0, 0.36, 0], scale: [0.3, 0.3, 0.3] }));     // 몸통
  [[0.5, 0.03, 0.15, 0.08], [-0.45, 0.03, 0.25, 0.06]].forEach(([x, y, z, s]) => {  // 흘린 방울
    g.add(mesh(G.sphereLow, jelly, { pos: [x, y, z], scale: [s, s * 0.5, s] }));
  });
  [-0.1, 0.1].forEach((x) => {                                                     // 눈
    g.add(mesh(G.sphereLow, mat('#FFFFFF'), { pos: [x, 0.45, 0.24], scale: [0.07, 0.07, 0.04], shadow: false }));
    g.add(mesh(G.sphereLow, mat('#5A4040'), { pos: [x, 0.45, 0.28], scale: [0.03, 0.03, 0.02], shadow: false }));
  });
  g.add(mesh(G.sphereLow, mat('#FF8FB0'), { pos: [0.03, 0.31, 0.27], scale: [0.05, 0.03, 0.04], shadow: false })); // 메롱
  return g;
}

// ───── 간단한 애니메이션 관리자 ─────
// 연출마다 { 시간, 길이, 매 프레임 할 일 } 을 등록해 두고, tick()이 매 프레임 진행시킨다.
export function createFx(scene) {
  const running = [];

  function play(duration, onFrame, onEnd) {
    running.push({ t: 0, duration, onFrame, onEnd });
  }

  function tick(dt) {
    for (let i = running.length - 1; i >= 0; i--) {
      const a = running[i];
      a.t += dt;
      const k = Math.min(1, a.t / a.duration); // 0 → 1 진행률
      a.onFrame(k, a.t);
      if (k >= 1) { running.splice(i, 1); a.onEnd?.(); }
    }
  }

  // 성공: 물약 병이 솥에서 톡 튀어 올라 빙글 돌다가 사라진다
  function potionRise(potion, at) {
    const bottle = buildBottle(potion);
    bottle.position.copy(at);
    scene.add(bottle);
    play(2.4, (k, t) => {
      const up = Math.min(1, t / 0.5);                         // 처음 0.5초 동안 떠오름
      const easeOut = 1 - (1 - up) ** 3;
      bottle.position.y = at.y + easeOut * 1.4 + Math.sin(t * 3) * 0.05;
      bottle.rotation.y = t * 2;
      const pop = (up < 1 ? easeOut * 1.25 : 1.25 - Math.min(0.25, (t - 0.5) * 2)) * 1.6; // 살짝 커졌다가 제자리
      const out = k > 0.85 ? 1 - (k - 0.85) / 0.15 : 1;        // 끝에서 작아지며 사라짐
      bottle.scale.setScalar(Math.max(0.001, pop * out));
    }, () => scene.remove(bottle));
  }

  // 실패: 뽀연 연기가 피어오르고 젤리가 솥 옆에 털썩 나타나 말랑말랑 흔들리다 사라진다
  function failSmoke(at, jellyAt) {
    for (let i = 0; i < 9; i++) {
      // 연기 하나하나가 따로 투명해져야 해서 재질을 따로 만든다
      const m = new THREE.MeshStandardMaterial({ color: '#F4EEF8', roughness: 1, transparent: true, opacity: 0.9 });
      const puff = new THREE.Mesh(G.sphereLow, m);
      const a = (i / 9) * Math.PI * 2;
      const dir = new THREE.Vector3(Math.cos(a) * 0.5, 1.2 + (i % 3) * 0.3, Math.sin(a) * 0.5);
      puff.position.copy(at);
      scene.add(puff);
      play(1.4, (k) => {
        puff.position.copy(at).addScaledVector(dir, k);
        puff.scale.setScalar(0.2 + k * 0.45);
        m.opacity = 0.9 * (1 - k);
      }, () => { scene.remove(puff); m.dispose(); });
    }

    const jelly = buildJelly();
    jelly.position.copy(jellyAt);
    jelly.scale.setScalar(0.001);
    scene.add(jelly);
    play(3.2, (k, t) => {
      const appear = Math.min(1, t / 0.35);
      const leave = k > 0.85 ? 1 - (k - 0.85) / 0.15 : 1;
      const s = appear * leave * 1.6;
      const wob = Math.sin(t * 9) * 0.08 * (1 - k);              // 말랑말랑 흔들림
      jelly.scale.set(s * (1 + wob), s * (1 - wob), s * (1 + wob));
    }, () => scene.remove(jelly));
  }

  return { tick, potionRise, failSmoke };
}
