"use client";

// 에셋 없이 WebAudio로 합성하는 효과음.
// 잔 클릭음은 "꼴꼴 따르는/꼴깍 넘기는" 글러그 사운드.
// 호출부에서 muted 여부를 확인한 뒤 호출한다.
//
// 실제 녹음 파일을 쓰고 싶으면 public/sounds/pour.mp3 에 넣으면
// 자동으로 그 파일을 재생하고, 없으면 합성음으로 폴백한다.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// ── 선택: 실제 음원 자동 로드 ─────────────────────────────────────
let sampleEl: HTMLAudioElement | null = null;
let sampleReady = false;
if (typeof window !== "undefined") {
  const a = new Audio("/sounds/pour.mp3");
  a.preload = "auto";
  a.addEventListener(
    "canplaythrough",
    () => {
      sampleReady = true;
      sampleEl = a;
    },
    { once: true }
  );
  a.addEventListener("error", () => (sampleReady = false), { once: true });
}

// ── 기본 톤 헬퍼 ──────────────────────────────────────────────────
function tone(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.18
) {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  g.gain.setValueAtTime(0, ac.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.02);
}

// 목 넘김 "꼴깍" 한 번 —
// 공명 로우패스를 건 노이즈를 아래로 스윕(꿀럭 울림) + 저역 바디.
function gulp(ac: AudioContext, start: number, vol: number, pitch: number) {
  const dur = 0.16;

  // 1) 공명 로우패스 노이즈 스윕 (목 안에서 물이 넘어가는 울림)
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const d = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 15; // 높은 Q = 목울대 공명
  lp.frequency.setValueAtTime(620 * pitch, start);
  lp.frequency.exponentialRampToValueAtTime(130 * pitch, start + 0.11);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.5 * vol, start + 0.018);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(lp).connect(g).connect(ac.destination);
  src.start(start);

  // 2) 저역 바디 (묵직하게 "꿀꺽")
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(175 * pitch, start);
  osc.frequency.exponentialRampToValueAtTime(85 * pitch, start + 0.1);
  const og = ac.createGain();
  og.gain.setValueAtTime(0, start);
  og.gain.linearRampToValueAtTime(0.16 * vol, start + 0.022);
  og.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
  osc.connect(og).connect(ac.destination);
  osc.start(start);
  osc.stop(start + 0.16);
}

/** 잔 클릭 — 꼴깍 삼키는 사운드 */
export function playSip() {
  // 실제 음원이 준비돼 있으면 그걸 재생
  if (sampleReady && sampleEl) {
    try {
      const a = sampleEl.cloneNode(true) as HTMLAudioElement;
      a.volume = 0.8;
      void a.play();
      return;
    } catch {
      /* 폴백 */
    }
  }

  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime;
  const pitch = 0.92 + Math.random() * 0.16; // 매번 살짝 다르게
  gulp(ac, t0, 1.0, pitch);
  // 가끔 "꼴-깍" 두 번째 삼킴
  if (Math.random() < 0.55) {
    gulp(ac, t0 + 0.13 + Math.random() * 0.03, 0.6, pitch * 1.05);
  }
}

/** 병 따는 "뻥!" — 팝 + 노이즈 버스트 */
export function playPop() {
  const ac = getCtx();
  if (!ac) return;
  tone(880, 0, 0.12, "sine", 0.22);
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.08), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.25, ac.currentTime);
  ng.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.08);
  noise.connect(ng).connect(ac.destination);
  noise.start();
}

/** 피니시 팡파레 — 상승 아르페지오 */
export function playFanfare() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.22, "square", 0.14));
}
