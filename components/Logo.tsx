/* eslint-disable @next/next/no-img-element */
"use client";

/** Boozy 워드마크 로고 (투명 흰색 PNG). height(px) 기준으로 스케일. */
export default function Logo({
  height = 28,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  return (
    <img
      src="/boozy-logo.png"
      alt="Boozy"
      height={height}
      style={{ height, width: "auto" }}
      className={className}
      draggable={false}
    />
  );
}
