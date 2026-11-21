// 낮과 밤: 게임 속 하루 = 약 5분.
// 조명과 하늘색만 바뀌고 게임 규칙(자라는 시간, 손님 등)에는 영향을 주지 않는다.
// 시계(Date.now)를 기준으로 계산하므로 새로고침해도 하루가 이어서 흘러간다.

import * as THREE from 'three';

export const DAY_LENGTH = 5 * 60 * 1000;

// 하루 중 시점(0~1)별 색과 밝기. 사이는 부드럽게 섞는다.
//  sky: 하늘·안개색, top/bottom: 위아래에서 비추는 은은한 빛(HemisphereLight) 색,
//  ambient: 은은한 빛 세기, sun: 해(밤에는 달) 빛 색, sunI: 해 빛 세기
const KEYS = [
  { t: 0.00, name: '새벽', sky: '#F7C8D8', top: '#FFE4EC', bottom: '#BDE89C', ambient: 1.2, sun: '#FFC9A8', sunI: 1.1 },
  { t: 0.08, name: '낮',   sky: '#A8D8FF', top: '#FFFFFF', bottom: '#BDE89C', ambient: 1.6, sun: '#FFF4E0', sunI: 1.8 },
  { t: 0.55, name: '낮',   sky: '#A8D8FF', top: '#FFFFFF', bottom: '#BDE89C', ambient: 1.6, sun: '#FFF4E0', sunI: 1.8 },
  { t: 0.63, name: '노을', sky: '#FFB59E', top: '#FFE0CC', bottom: '#E8C89C', ambient: 1.25, sun: '#FFA477', sunI: 1.4 },
  { t: 0.72, name: '밤',   sky: '#3F4C82', top: '#8FA3E8', bottom: '#4E5E7A', ambient: 0.9, sun: '#B4C6FF', sunI: 0.5 },
  { t: 0.92, name: '밤',   sky: '#3F4C82', top: '#8FA3E8', bottom: '#4E5E7A', ambient: 0.9, sun: '#B4C6FF', sunI: 0.5 },
  { t: 1.00, name: '새벽', sky: '#F7C8D8', top: '#FFE4EC', bottom: '#BDE89C', ambient: 1.2, sun: '#FFC9A8', sunI: 1.1 },
];

// 미리 Color 객체로 바꿔 둔다
const COLOR_KEYS = KEYS.map((k) => ({
  ...k, sky: new THREE.Color(k.sky), top: new THREE.Color(k.top), bottom: new THREE.Color(k.bottom), sun: new THREE.Color(k.sun),
}));

export function dayPhase(nowMs) {
  return (nowMs % DAY_LENGTH) / DAY_LENGTH;
}

export function createDayNight({ scene, hemi, sun }) {
  const tmpColor = new THREE.Color();

  function update(nowMs) {
    const t = dayPhase(nowMs);
    let i = 0;
    while (COLOR_KEYS[i + 1].t < t) i++;
    const a = COLOR_KEYS[i];
    const b = COLOR_KEYS[i + 1];
    const raw = (t - a.t) / (b.t - a.t);
    const k = raw * raw * (3 - 2 * raw); // smoothstep: 시작과 끝을 부드럽게

    tmpColor.copy(a.sky).lerp(b.sky, k);   // lerp: 두 색 사이를 k 비율로 섞기
    scene.background.copy(tmpColor);
    scene.fog.color.copy(tmpColor);
    hemi.color.copy(a.top).lerp(b.top, k);
    hemi.groundColor.copy(a.bottom).lerp(b.bottom, k);
    hemi.intensity = a.ambient + (b.ambient - a.ambient) * k;
    sun.color.copy(a.sun).lerp(b.sun, k);
    sun.intensity = a.sunI + (b.sunI - a.sunI) * k;

    // 해(달)가 하루 동안 하늘을 천천히 가로지른다 → 그림자 방향이 조금씩 바뀐다
    const angle = t * Math.PI * 2;
    sun.position.set(Math.cos(angle) * 8, 12, 6 + Math.sin(angle) * 4);

    return k < 0.5 ? a.name : b.name;
  }

  return { update };
}
