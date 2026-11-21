// 낮과 밤: 게임 속 하루 = 약 5분.
// 하늘색·조명이 바뀌고, 햇님과 달님이 섬 뒤 하늘을 가로질러 떠오르고 지며, 밤에는 별이 뜬다.
// 게임 규칙(자라는 시간, 손님 등)에는 영향을 주지 않는다.
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
const COLOR_KEYS = KEYS.map((k) => ({
  ...k, sky: new THREE.Color(k.sky), top: new THREE.Color(k.top), bottom: new THREE.Color(k.bottom), sun: new THREE.Color(k.sun),
}));

// 햇님은 하루의 0 ~ 0.68 동안, 달님은 0.66 ~ 1.02 동안 하늘을 가로지른다 (조금 겹쳐서 노을 때 바통 터치)
const SUN_SPAN = [0, 0.68];
const MOON_SPAN = [0.66, 1.02];

export function dayPhase(nowMs) {
  return (nowMs % DAY_LENGTH) / DAY_LENGTH;
}

const smooth = (x) => x * x * (3 - 2 * x);

// 하늘을 가로지르는 길: 섬 뒤쪽 먼 곳에 납작한 반원. a=0 왼쪽 지평선 → π/2 가장 높이 → π 오른쪽 지평선
// 기본 카메라 구도에서 섬 위로 보이는 하늘 띠 안을 지나가도록 낮고 납작하게 잡았다
function arcPosition(a, out) {
  return out.set(-Math.cos(a) * 40, -4 + Math.sin(a) * 8.5, -48);
}

// ───── 햇님: 노란 구 + 은은한 빛무리 ─────
function buildSun() {
  const g = new THREE.Group();
  // fog: false → 멀리 있어도 안개에 묻히지 않고 또렷하게
  g.add(new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 16), new THREE.MeshBasicMaterial({ color: '#FFE27A', fog: false })));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(4, 24, 16), new THREE.MeshBasicMaterial({ color: '#FFF1C8', transparent: true, opacity: 0.35, fog: false, depthWrite: false })));
  return g;
}

// ───── 달님: 크림색 구 + 살짝 어두운 무늬 + 푸른 빛무리 ─────
function buildMoon() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(2.1, 24, 16), new THREE.MeshBasicMaterial({ color: '#FFF6D6', fog: false })));
  const craterMat = new THREE.MeshBasicMaterial({ color: '#EADFB8', fog: false });
  [[-0.6, 0.5, 0.35], [0.7, -0.2, 0.45], [-0.1, -0.8, 0.3]].forEach(([x, y, r]) => {
    const c = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), craterMat);
    c.position.set(x, y, 1.95);
    c.scale.z = 0.3;
    g.add(c);
  });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(3.3, 24, 16), new THREE.MeshBasicMaterial({ color: '#DDE6FF', transparent: true, opacity: 0.25, fog: false, depthWrite: false })));
  return g;
}

// ───── 별: 하늘 위쪽에 점 200개 ─────
// Points: 점 여러 개를 한 번에 그리는 물체. 별처럼 아주 많은 작은 것을 가볍게 그릴 때 쓴다.
function buildStars() {
  const count = 320;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const h = 0.01 + Math.random() ** 3 * 0.9;      // 지평선보다 위쪽에만, 화면에 잘 보이도록 낮은 하늘에 많이
    const r = 70;
    pos[i * 3] = Math.cos(a) * r * Math.sqrt(1 - h * h);
    pos[i * 3 + 1] = h * r - 6;
    pos[i * 3 + 2] = Math.sin(a) * r * Math.sqrt(1 - h * h);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: '#FFF6D6', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  return new THREE.Points(geo, mat);
}

export function createDayNight({ scene, hemi, sun: light }) {
  const sunBody = buildSun();
  const moonBody = buildMoon();
  const stars = buildStars();
  scene.add(sunBody, moonBody, stars);

  const gauge = document.getElementById('dayGauge');
  const gaugeIcon = document.getElementById('dayIcon');
  const gaugeName = document.getElementById('dayName');
  const gaugeMarker = document.getElementById('dayMarker');
  let lastName = '';

  function update(nowMs, camera) {
    const t = dayPhase(nowMs);

    // 1) 하늘색·조명
    let i = 0;
    while (COLOR_KEYS[i + 1].t < t) i++;
    const a = COLOR_KEYS[i];
    const b = COLOR_KEYS[i + 1];
    const k = smooth((t - a.t) / (b.t - a.t));
    scene.background.copy(a.sky).lerp(b.sky, k); // lerp: 두 색 사이를 k 비율로 섞기
    scene.fog.color.copy(scene.background);
    hemi.color.copy(a.top).lerp(b.top, k);
    hemi.groundColor.copy(a.bottom).lerp(b.bottom, k);
    hemi.intensity = a.ambient + (b.ambient - a.ambient) * k;
    light.color.copy(a.sun).lerp(b.sun, k);
    light.intensity = a.sunI + (b.sunI - a.sunI) * k;

    // 2) 햇님·달님 위치: 각자 맡은 시간 동안 왼쪽에서 떠올라 오른쪽으로 진다
    const sunK = (t - SUN_SPAN[0]) / (SUN_SPAN[1] - SUN_SPAN[0]);
    const moonT = t < 0.5 ? t + 1 : t; // 자정을 넘어가도 이어지게
    const moonK = (moonT - MOON_SPAN[0]) / (MOON_SPAN[1] - MOON_SPAN[0]);
    sunBody.visible = sunK >= 0 && sunK <= 1;
    moonBody.visible = moonK >= 0 && moonK <= 1;
    if (sunBody.visible) arcPosition(sunK * Math.PI, sunBody.position);
    if (moonBody.visible) arcPosition(moonK * Math.PI, moonBody.position);
    if (camera) moonBody.lookAt(camera.position); // 달 무늬가 늘 이쪽을 보게

    // 그림자를 만드는 빛도 떠 있는 햇님(달님) 쪽에서 비춘다 (너무 낮으면 그림자가 길어져서 높이는 최소한 유지)
    const body = sunBody.visible ? sunBody : moonBody;
    light.position.set(body.position.x * 0.2, Math.max(7, body.position.y * 0.6 + 8), 8);

    // 3) 별: 밤에 서서히 나타났다가 새벽에 사라진다
    let night = 0;
    if (t > 0.62 && t < 0.74) night = smooth((t - 0.62) / 0.12);
    else if (t >= 0.74 && t < 0.92) night = 1;
    else if (t >= 0.92) night = 1 - smooth((t - 0.92) / 0.08);
    stars.material.opacity = night * (0.75 + Math.sin(nowMs / 400) * 0.1); // 살짝 반짝반짝

    // 4) 화면 위 시간 게이지: 하루 중 어디쯤인지 막대 위 아이콘으로
    const name = k < 0.5 ? a.name : b.name;
    if (gauge) {
      gaugeMarker.style.left = `${t * 100}%`;
      if (name !== lastName) {
        gaugeName.textContent = name;
        gaugeIcon.textContent = name === '밤' ? '🌙' : name === '노을' ? '🌇' : name === '새벽' ? '🌅' : '☀️';
        gaugeMarker.textContent = sunBody.visible && name !== '밤' ? '☀️' : '🌙';
        lastName = name;
      }
    }
    return name;
  }

  return { update };
}
