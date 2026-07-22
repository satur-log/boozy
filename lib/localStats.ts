"use client";

// 내 기록 — 이 기기(LocalStorage) 기준 누적 통계 + 세션 히스토리.

const KEY = "boozy-local-stats";
const KEY_HISTORY = "boozy-history";
const HISTORY_CAP = 50;

export interface LocalStats {
  sessions: number; // 완주(피니시) 횟수
  totalDrinks: number; // 누적 총 잔 수
  bestSpeed: number; // 최고 페이스 (주작 제외)
}

export interface SessionRecord {
  at: number; // 완주 시각 (ms epoch)
  speed: number; // 최종 페이스 (병/h)
  glasses: number; // 총 잔
  equivBottles: number; // 소주 환산 병
  elapsedMs: number; // 소요 시간
}

const empty: LocalStats = { sessions: 0, totalDrinks: 0, bestSpeed: 0 };

export function getLocalStats(): LocalStats {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

/** 세션 히스토리 (최신순) */
export function getHistory(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    return raw ? (JSON.parse(raw) as SessionRecord[]) : [];
  } catch {
    return [];
  }
}

/** 레이스 완주 시 누적 통계 + 히스토리 갱신 */
export function recordSession(rec: {
  drinks: number;
  speed: number;
  elapsedMs: number;
  equivBottles: number;
}): LocalStats {
  const prev = getLocalStats();
  const next: LocalStats = {
    sessions: prev.sessions + 1,
    totalDrinks: prev.totalDrinks + rec.drinks,
    bestSpeed:
      rec.speed <= 5.0 ? Math.max(prev.bestSpeed, rec.speed) : prev.bestSpeed,
  };

  const entry: SessionRecord = {
    at: Date.now(),
    speed: rec.speed,
    glasses: rec.drinks,
    equivBottles: rec.equivBottles,
    elapsedMs: rec.elapsedMs,
  };
  const history = [entry, ...getHistory()].slice(0, HISTORY_CAP);

  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
  } catch {
    /* 저장 실패 무시 */
  }
  return next;
}
