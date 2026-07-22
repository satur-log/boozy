"use client";

import { useEffect, useState } from "react";

/**
 * startTime(ms epoch)부터 지금까지 경과 시간(ms)을 주기적으로 리턴.
 * startTime이 null이거나 frozen이면 갱신을 멈춘다.
 *
 * @param startTime 시작 시각 (ms epoch) — null이면 0 반환
 * @param frozen    true면 타이머 정지 (기권/종료 시 최종값 고정)
 * @param freezeAt  frozen일 때 고정할 시각 (ms epoch). 없으면 마지막 값 유지
 */
export function useElapsed(
  startTime: number | null,
  frozen = false,
  freezeAt?: number | null
): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (startTime == null) {
      setElapsed(0);
      return;
    }

    if (frozen) {
      const end = freezeAt ?? Date.now();
      setElapsed(Math.max(0, end - startTime));
      return;
    }

    const tick = () => setElapsed(Math.max(0, Date.now() - startTime));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [startTime, frozen, freezeAt]);

  return elapsed;
}
