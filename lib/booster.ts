/**
 * Boozy 부스터/속도 계산 로직 (Phase 1 핵심)
 *
 * 지표: "음주 페이스 = 시간당 몇 병(소주 환산)을 마시는가" = 병/h
 *   - 1병 = 소주 7잔 (환산)
 *   - 페이스(병/h) = (소주 환산 잔 / 7) ÷ 경과 시간(시간)
 *
 * ⚠️ 첫 잔 직후엔 경과시간이 0에 가까워 값이 폭발한다.
 *    → 최소 측정 창(MEASURE_WINDOW_MS)으로 분모를 눌러 스파이크를 막는다.
 *    이렇게 하면 처음 30분은 "30분에 이만큼 마신 페이스"로 환산돼 자연스럽게 오른다.
 *    (창이 짧을수록 초반 몇 잔이 과하게 뻥튀기된다 — 맥주는 ×3.5라 특히)
 */

export const GLASSES_PER_BOTTLE = 7;

/** 연타 방지 쿨타임 (ms) — PRD: 3초 */
export const COOLDOWN_MS = 3000;

/** 최소 측정 창 (ms) — 초반 나눗셈 폭발 방지 (30분) */
export const MEASURE_WINDOW_MS = 30 * 60 * 1000;

/** 랭킹 등록 제외 기준 (주작 방지) — 5병/h 초과 */
export const CHEAT_SPEED_LIMIT = 5.0;

export interface BoosterTier {
  key: "eco" | "cruise" | "boost" | "overheat";
  label: string;
  emoji: string;
  /** 이 등급의 하한 페이스 (병/h) */
  min: number;
  /** UI 강조 색상 (tailwind text/glow에 사용) */
  color: string;
  glow: string;
}

/** 페이스(병/h) 구간별 부스터 등급 (낮은 순 → 높은 순) */
export const BOOSTER_TIERS: BoosterTier[] = [
  {
    key: "eco",
    label: "에코 드라이빙",
    emoji: "🐢",
    min: 0,
    color: "#7dd3fc",
    glow: "rgba(125,211,252,0.5)",
  },
  {
    key: "cruise",
    label: "부스터 온",
    emoji: "🏎️",
    min: 1.0,
    color: "#00e0ff",
    glow: "rgba(0,224,255,0.6)",
  },
  {
    key: "boost",
    label: "고속도로 질주",
    emoji: "🚀",
    min: 2.0,
    color: "#ffd166",
    glow: "rgba(255,209,102,0.6)",
  },
  {
    key: "overheat",
    label: "엔진 과열! 폭주 레이서",
    emoji: "🔥",
    min: 3.0,
    color: "#ff4d4d",
    glow: "rgba(255,77,77,0.7)",
  },
];

/**
 * 소주 환산 잔 수 + 경과 시간(ms) → 음주 페이스(병/h)
 * 경과시간은 최소 측정 창으로 눌러 초반 폭발을 방지한다.
 */
export function calcSpeed(sojuEquivGlasses: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || sojuEquivGlasses <= 0) return 0;
  const bottles = sojuEquivGlasses / GLASSES_PER_BOTTLE;
  const effectiveMs = Math.max(elapsedMs, MEASURE_WINDOW_MS);
  const hours = effectiveMs / (1000 * 60 * 60);
  return bottles / hours;
}

/**
 * 참가자 row(잔 수 + 시작/종료 시각)로부터 "지금 이 순간" 시속을 계산.
 * - 시작 안 함(startISO null) → 0
 * - 피니시(retired) → start~lastUpdated 로 고정
 * - 진행 중 → start~now (시간이 흐를수록 자연히 감소)
 */
export function liveSpeed(
  drinks: number,
  startISO: string | null,
  lastUpdatedISO: string,
  retired: boolean,
  now: number
): number {
  if (!startISO) return 0;
  const start = Date.parse(startISO);
  const end = retired ? Date.parse(lastUpdatedISO) : now;
  return calcSpeed(drinks, end - start);
}

/** 시속 → 현재 부스터 등급 */
export function getTier(speed: number): BoosterTier {
  let current = BOOSTER_TIERS[0];
  for (const tier of BOOSTER_TIERS) {
    if (speed >= tier.min) current = tier;
  }
  return current;
}

/** 잔 수 → { 병, 남은 잔 } */
export function toBottles(totalGlasses: number) {
  return {
    bottles: Math.floor(totalGlasses / GLASSES_PER_BOTTLE),
    remainder: totalGlasses % GLASSES_PER_BOTTLE,
  };
}

/** 주작(비현실적 속도) 여부 */
export function isCheating(speed: number): boolean {
  return speed > CHEAT_SPEED_LIMIT;
}

/** ms → "MM:SS" 포맷 */
export function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * 종료 시각/잔 수 기반으로 최종 칭호 생성.
 * 새벽 시간대 + 폭주면 "새벽 N시의 부스터 레이서" 같은 밈 칭호.
 */
export function getTitle(speed: number, hourOfDay: number): string {
  const tier = getTier(speed);
  if (hourOfDay >= 0 && hourOfDay < 5 && tier.key === "overheat") {
    return `새벽 ${hourOfDay === 0 ? 12 : hourOfDay}시의 부스터 레이서`;
  }
  switch (tier.key) {
    case "overheat":
      return "간을 갈아 넣는 폭주 기관차";
    case "boost":
      return "고속도로 하이패스 크루";
    case "cruise":
      return "안정적인 순항 드라이버";
    default:
      return "몸을 사리는 에코 세이버";
  }
}
