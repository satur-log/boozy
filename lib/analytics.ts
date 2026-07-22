"use client";

import { sendGAEvent } from "@next/third-parties/google";

/**
 * GA4 이벤트 트래킹.
 * NEXT_PUBLIC_GA_ID 가 없으면 전부 no-op (개발/미설정 환경 안전).
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
export const isAnalyticsEnabled = Boolean(GA_ID);

type Params = Record<string, string | number | boolean | undefined>;

export function track(event: string, params: Params = {}) {
  if (!isAnalyticsEnabled) return;
  try {
    sendGAEvent("event", event, params);
  } catch {
    /* 수집 실패는 앱 동작에 영향 주지 않음 */
  }
}
