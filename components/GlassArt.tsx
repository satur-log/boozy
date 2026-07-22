"use client";

import { motion } from "framer-motion";
import { DrinkDef } from "@/lib/drinks";

/**
 * 핸드드로잉 느낌의 잔 SVG. 주종별로 실루엣이 다르고,
 * 채워진 비율(fillPct 0~1)만큼 술이 차오른다.
 * 손그림 특유의 흔들리는 선은 feTurbulence 변위 필터로 표현.
 */

interface GlassSpec {
  slug: string;
  outline: string; // 옆선(윗변 열림)
  rim: { cx: number; cy: number; rx: number; ry: number };
  clip: string; // 술이 채워지는 내부 영역
  liquid: { x: number; w: number; top: number; bottom: number };
  facets?: string[]; // 세로 결(맥주잔)
  handle?: string;
  foam?: boolean;
}

const SLUG: Record<string, string> = {
  소주: "soju",
  소맥: "somaek",
  맥주: "beer",
  막걸리: "makgeolli",
};

function spec(key: string): GlassSpec {
  switch (key) {
    case "맥주":
      return {
        slug: "beer",
        outline: "M38,40 L40,128 Q60,134 80,128 L82,40",
        rim: { cx: 60, cy: 40, rx: 22, ry: 5 },
        clip: "M38,41 L40,128 Q60,134 80,128 L82,41 Q60,47 38,41 Z",
        liquid: { x: 37, w: 46, top: 44, bottom: 127 },
        facets: ["M51,58 L53,118", "M60,57 L60,120", "M69,58 L67,118"],
        handle: "M82,55 C102,55 104,92 83,95",
        foam: true,
      };
    case "소맥":
      return {
        slug: "somaek",
        outline: "M43,32 L47,125 Q60,131 73,125 L77,32",
        rim: { cx: 60, cy: 32, rx: 17, ry: 4.5 },
        clip: "M43,33 L47,125 Q60,131 73,125 L77,33 Q60,38 43,33 Z",
        liquid: { x: 42, w: 36, top: 36, bottom: 124 },
        foam: true,
      };
    case "막걸리":
      return {
        slug: "makgeolli",
        outline: "M30,58 C30,97 42,115 60,115 C78,115 90,97 90,58",
        rim: { cx: 60, cy: 58, rx: 30, ry: 6.5 },
        clip: "M30,59 C30,97 42,115 60,115 C78,115 90,97 90,59 Q60,67 30,59 Z",
        liquid: { x: 30, w: 60, top: 63, bottom: 113 },
      };
    default: // 소주
      return {
        slug: "soju",
        outline: "M45,50 L50,116 Q60,122 70,116 L75,50",
        rim: { cx: 60, cy: 50, rx: 15, ry: 4.2 },
        clip: "M45,51 L50,116 Q60,122 70,116 L75,51 Q60,56 45,51 Z",
        liquid: { x: 44, w: 32, top: 54, bottom: 115 },
      };
  }
}

export default function GlassArt({
  drink,
  fillPct,
}: {
  drink: DrinkDef;
  fillPct: number;
}) {
  const s = spec(drink.key);
  const slug = SLUG[drink.key] ?? "soju";
  const pct = Math.max(0, Math.min(1, fillPct));
  const { x, w, top, bottom } = s.liquid;
  const topY = bottom - pct * (bottom - top);
  const height = Math.max(0, bottom - topY);

  const roughId = `rough-${slug}`;
  const clipId = `clip-${slug}`;
  const gradId = `grad-${slug}`;

  const stroke = "rgba(245,245,247,0.9)";
  const spring = { type: "spring" as const, stiffness: 120, damping: 17 };

  return (
    <svg
      viewBox="0 0 120 150"
      className="h-full w-full overflow-visible"
      aria-hidden
    >
      <defs>
        <filter id={roughId} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.017"
            numOctaves={2}
            seed={7}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={3.4}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <clipPath id={clipId}>
          <path d={s.clip} />
        </clipPath>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={drink.color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={drink.color} stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* 술 (내부 클립) */}
      <g clipPath={`url(#${clipId})`}>
        <motion.rect
          x={x}
          width={w}
          initial={false}
          animate={{ y: topY, height }}
          transition={spring}
          fill={`url(#${gradId})`}
        />
        {/* 표면 반짝임 */}
        <motion.rect
          x={x}
          width={w}
          height={2.5}
          initial={false}
          animate={{ y: topY }}
          transition={spring}
          fill="rgba(255,255,255,0.55)"
        />
        {/* 거품 (맥주/소맥) */}
        {s.foam && pct > 0.02 && (
          <motion.g initial={false} animate={{ y: topY }} transition={spring}>
            {[0.2, 0.4, 0.6, 0.8].map((f, i) => (
              <circle
                key={i}
                cx={x + w * f}
                cy={i % 2 ? -3 : -6}
                r={i % 2 ? 7 : 9}
                fill="rgba(255,255,255,0.92)"
              />
            ))}
            <rect x={x} y={-2} width={w} height={6} fill="rgba(255,255,255,0.9)" />
          </motion.g>
        )}
      </g>

      {/* 손그림 외곽선 */}
      <g
        filter={`url(#${roughId})`}
        fill="none"
        stroke={stroke}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {s.handle && <path d={s.handle} />}
        <path d={s.outline} />
        <ellipse
          cx={s.rim.cx}
          cy={s.rim.cy}
          rx={s.rim.rx}
          ry={s.rim.ry}
        />
        {s.facets?.map((d, i) => (
          <path key={i} d={d} strokeWidth={2.4} opacity={0.5} />
        ))}
      </g>
    </svg>
  );
}
