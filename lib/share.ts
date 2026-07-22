"use client";

/** DOM 요소를 PNG로 캡처해 반환 (html2canvas 동적 임포트) */
export async function capturePng(
  el: HTMLElement,
  scale = 2
): Promise<Blob | null> {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(el, {
    scale,
    backgroundColor: "#0a0a0f",
    useCORS: true,
    logging: false,
  });
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png", 1)
  );
}

/** PNG 다운로드 */
export async function savePng(el: HTMLElement, filename: string) {
  const blob = await capturePng(el);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 결과 공유. 이미지가 있으면 이미지 우선(Web Share Level 2),
 * 아니면 텍스트+링크, 그것도 안 되면 클립보드 복사.
 * @returns "shared" | "copied" | "failed"
 */
export async function shareResult(params: {
  el?: HTMLElement | null;
  title: string;
  text: string;
  url: string;
}): Promise<"shared" | "copied" | "failed"> {
  const { el, title, text, url } = params;

  // 1) 이미지 파일 공유 시도
  if (el && navigator.canShare) {
    try {
      const blob = await capturePng(el);
      if (blob) {
        const file = new File([blob], "boozy-result.png", {
          type: "image/png",
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title, text });
          return "shared";
        }
      }
    } catch {
      /* 취소/미지원 → 다음 단계 */
    }
  }

  // 2) 텍스트+링크 공유
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch {
      /* 다음 단계 */
    }
  }

  // 3) 클립보드 복사
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}

/**
 * 카카오톡 공유. NEXT_PUBLIC_KAKAO_JS_KEY 가 있고 SDK가 로드된 경우에만 동작,
 * 아니면 shareResult 로 폴백.
 */
export async function shareKakao(params: {
  title: string;
  description: string;
  url: string;
}): Promise<boolean> {
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  const Kakao = (window as unknown as { Kakao?: any }).Kakao;
  if (!key || !Kakao) return false;
  try {
    if (!Kakao.isInitialized()) Kakao.init(key);
    Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: params.title,
        description: params.description,
        imageUrl: "",
        link: { mobileWebUrl: params.url, webUrl: params.url },
      },
    });
    return true;
  } catch {
    return false;
  }
}
