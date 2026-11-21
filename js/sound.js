// 소리: 음원 파일 없이 Web Audio API로 코드에서 직접 만든다.
//
// [Web Audio 기본 개념]
// - AudioContext: 소리를 만들고 섞는 작업실. 브라우저 정책상 사용자가 한 번 눌러 준 뒤에만 소리가 난다.
// - Oscillator(오실레이터): 일정한 높이의 "삐-" 소리를 만드는 발진기. type으로 음색을 고른다(sine, triangle 등).
// - Gain(게인): 소리 크기 조절기. 크기를 시간에 따라 바꾸면 "띵~" 하고 사라지는 소리가 된다.
// 연결 순서: 소리 재료 → 크기 조절 → (음악 / 효과음 볼륨) → 전체 볼륨 → 스피커

const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12);

export function createSound() {
  let ctx = null;
  let master, musicBus, sfxBus;
  let musicOn = true;
  let sfxOn = true;
  let noiseBuffer = null;

  // ───── 시작: "가게 열기" 버튼을 누를 때 한 번 ─────
  function start() {
    if (ctx) { ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return; // 소리를 지원하지 않는 브라우저면 조용히 진행
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 0.16 : 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 0.5 : 0; sfxBus.connect(master);
    // 연기 소리용 "쉬-" 잡음 (무작위 값으로 채운 짧은 소리 조각)
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    startMusic();
  }

  // ───── 기본 소리 재료 ─────
  // 한 음: 높이(freq)에서 시작해 toFreq로 미끄러지며, attack 동안 커졌다가 decay 동안 사라진다
  function tone(bus, { freq, toFreq, type = 'sine', at = 0, attack = 0.005, decay = 0.3, vol = 1 }) {
    if (!ctx) return;
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (toFreq) osc.frequency.exponentialRampToValueAtTime(toFreq, t0 + decay * 0.8);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    osc.connect(g).connect(bus);
    osc.start(t0);
    osc.stop(t0 + attack + decay + 0.05);
  }

  // 오르골 음: 맑은 기본음 + 살짝 높은 배음, 빠르게 울리고 천천히 사라진다
  function musicBoxNote(midi, when, vol = 0.5, decay = 1.4) {
    const t = when - ctx.currentTime;
    const f = midiToHz(midi);
    tone(musicBus, { freq: f, at: t, decay, vol });
    tone(musicBus, { freq: f * 2.01, at: t, decay: decay * 0.4, vol: vol * 0.25 });
    tone(musicBus, { freq: f * 3.98, at: t, decay: decay * 0.15, vol: vol * 0.1 });
  }

  function noise({ at = 0, decay = 0.5, vol = 0.5, freq = 800 }) {
    if (!ctx) return;
    const t0 = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter(); // 잡음에서 원하는 높이만 남기는 필터
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, t0);
    filter.frequency.exponentialRampToValueAtTime(freq * 0.3, t0 + decay);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    src.connect(filter).connect(g).connect(sfxBus);
    src.start(t0);
    src.stop(t0 + decay + 0.05);
  }

  // ───── 효과음 ─────
  const sfx = {
    // 뽁: 높은 음이 순식간에 내려간다 (수확)
    pop() { tone(sfxBus, { freq: 900, toFreq: 280, decay: 0.12, vol: 0.8 }); },
    // 톡: 작고 짧은 소리 (버튼, 재료 고르기)
    tick() { tone(sfxBus, { freq: 1300, type: 'triangle', decay: 0.05, vol: 0.35 }); },
    // 퐁: 낮고 둥근 소리 (씨앗 심기)
    plant() { tone(sfxBus, { freq: 420, toFreq: 220, type: 'triangle', decay: 0.18, vol: 0.7 }); },
    // 링~: 맑은 종소리가 차례로 올라간다 (조합 성공, 새 발견이면 한 음 더)
    chime(isNew = false) {
      const notes = isNew ? [84, 88, 91, 96] : [84, 88, 91];
      notes.forEach((m, i) => {
        tone(sfxBus, { freq: midiToHz(m), at: i * 0.08, decay: 0.7, vol: 0.45 });
        tone(sfxBus, { freq: midiToHz(m) * 2, at: i * 0.08, decay: 0.3, vol: 0.12 });
      });
    },
    // 펑~ 뿌우: 잡음 연기 + 낮게 내려가는 소리 (실패작)
    poof() {
      noise({ decay: 0.6, vol: 0.6, freq: 900 });
      tone(sfxBus, { freq: 300, toFreq: 120, type: 'triangle', at: 0.05, decay: 0.45, vol: 0.5 });
    },
    // 짤랑: 높은 두 음 (코인 받기, 씨앗 사기)
    coin() {
      tone(sfxBus, { freq: midiToHz(88), type: 'square', decay: 0.08, vol: 0.18 });
      tone(sfxBus, { freq: midiToHz(95), type: 'square', at: 0.07, decay: 0.35, vol: 0.18 });
    },
    // 음-음: 두 음이 내려간다 (틀린 물약, 재료 부족)
    nope() {
      tone(sfxBus, { freq: midiToHz(67), type: 'triangle', decay: 0.15, vol: 0.45 });
      tone(sfxBus, { freq: midiToHz(62), type: 'triangle', at: 0.16, decay: 0.25, vol: 0.45 });
    },
    // 반짝반짝: 요정이 날아올 때
    twinkle() {
      [96, 100, 103, 108].forEach((m, i) => tone(sfxBus, { freq: midiToHz(m), at: i * 0.05, decay: 0.25, vol: 0.18 }));
    },
  };

  // ───── 배경음: 잔잔한 오르골 (F장조, 8마디를 반복) ─────
  // 마디마다 화음을 위아래로 펼쳐 연주하고(아르페지오), 위에 짧은 멜로디를 얹는다.
  const BPM = 80;
  const EIGHTH = 60 / BPM / 2; // 8분음표 길이(초)
  const CHORDS = [
    [65, 69, 72], [62, 65, 69], [58, 62, 65], [60, 64, 67], // F  Dm  Bb  C
    [65, 69, 72], [57, 60, 64], [58, 62, 65], [60, 64, 67], // F  Am  Bb  C
  ];
  const MELODY = [ // [마디, 8분음표 위치, 음]
    [0, 0, 81], [0, 4, 84], [1, 0, 81], [1, 4, 77], [2, 0, 79], [2, 2, 77], [2, 4, 74],
    [3, 0, 76], [3, 4, 79], [4, 0, 81], [4, 2, 84], [4, 4, 86], [5, 0, 84], [5, 4, 81],
    [6, 0, 79], [6, 2, 81], [6, 4, 77], [7, 0, 76], [7, 4, 77],
  ];
  const ARP = [0, 1, 2, 1, 0, 1, 2, 1]; // 화음 안에서 오르내리는 순서
  let step = 0;        // 지금까지 예약한 8분음표 수
  let nextTime = 0;    // 다음 음을 낼 시각
  let timer = 0;

  // 앞으로 0.3초 안에 낼 음들을 미리 예약한다 (setInterval만 쓰면 박자가 흔들려서 이렇게 한다)
  function schedule() {
    // 다른 탭에 다녀와서 예약이 밀렸으면, 밀린 음을 한꺼번에 내지 않고 지금부터 다시 이어 간다
    if (nextTime < ctx.currentTime - 0.1) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.3) {
      const bar = Math.floor(step / 8) % CHORDS.length;
      const pos = step % 8;
      const chord = CHORDS[bar];
      musicBoxNote(chord[ARP[pos]] + 12, nextTime, pos === 0 ? 0.32 : 0.22, 1.2);
      for (const [b, p, m] of MELODY) if (b === bar && p === pos) musicBoxNote(m, nextTime, 0.38, 1.8);
      step++;
      nextTime += EIGHTH;
    }
  }
  function startMusic() {
    nextTime = ctx.currentTime + 0.2;
    clearInterval(timer);
    timer = setInterval(schedule, 100);
  }

  // ───── 켜고 끄기 ─────
  function setMusic(on) {
    musicOn = on;
    if (ctx) musicBus.gain.setTargetAtTime(on ? 0.16 : 0, ctx.currentTime, 0.1); // 부드럽게 줄이고 키운다
  }
  function setSfx(on) {
    sfxOn = on;
    if (ctx) sfxBus.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.05);
  }

  return {
    start, sfx, setMusic, setSfx,
    get musicOn() { return musicOn; },
    get sfxOn() { return sfxOn; },
  };
}
