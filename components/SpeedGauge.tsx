"use client";

import { motion } from "framer-motion";
import { BoosterTier, CHEAT_SPEED_LIMIT } from "@/lib/booster";

interface SpeedGaugeProps {
  speed: number;
  tier: BoosterTier;
  cheating: boolean;
}

export default function SpeedGauge({ speed, tier, cheating }: SpeedGaugeProps) {
  // 게이지는 0 ~ CHEAT_SPEED_LIMIT 범위를 0~100%로 매핑
  const pct = Math.min(100, (speed / CHEAT_SPEED_LIMIT) * 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-baseline gap-1.5">
        <motion.span
          key={Math.round(speed * 10)}
          initial={{ scale: 1.15, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="tabular text-6xl font-black leading-none"
          style={{ color: tier.color, textShadow: `0 0 24px ${tier.glow}` }}
        >
          {speed.toFixed(1)}
        </motion.span>
        <span className="text-lg font-bold text-white/50">병/h</span>
      </div>

      {/* 속도 바 */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, #7dd3fc, ${tier.color})`,
            boxShadow: `0 0 16px ${tier.glow}`,
          }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
        {/* 주작 한계선 마커 */}
        <div className="absolute inset-y-0 right-0 w-0.5 bg-booze-accent/70" />
      </div>

      {cheating && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold text-booze-accent"
        >
          ⚠️ {CHEAT_SPEED_LIMIT.toFixed(0)}병/h 초과 — 랭킹 등록 제외 (주작 감지)
        </motion.p>
      )}
    </div>
  );
}
