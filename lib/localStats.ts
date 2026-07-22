"use client";

// 알콜 침식상 — 이 기기(LocalStorage) 기준 누적 기록.

const KEY = "boozy-local-stats";

export interface LocalStats {
  sessions: number; // 완주(피니시) 횟수
  totalDrinks: number; // 누적 총 잔 수
  bestSpeed: number; // 최고 시속 (주작 제외)
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

/** 레이스 완주 시 기록 갱신 */
export function recordSession(drinks: number, speed: number): LocalStats {
  const prev = getLocalStats();
  const next: LocalStats = {
    sessions: prev.sessions + 1,
    totalDrinks: prev.totalDrinks + drinks,
    bestSpeed: speed <= 4.0 ? Math.max(prev.bestSpeed, speed) : prev.bestSpeed,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장 실패 무시 */
  }
  return next;
}
