"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DrinkDef } from "@/lib/drinks";
import GlassArt from "./GlassArt";

interface SojuGlassProps {
  drink: DrinkDef;
  /** 현재 병/세트 안에서 채워진 잔 수 (0 ~ perBottle) */
  remainder: number;
  /** 눌렀을 때 튀는 값 (매 클릭마다 증가) — 리액션 트리거용 */
  pulse: number;
  cooling: boolean;
  disabled: boolean;
  onDrink: () => void;
}

export default function SojuGlass({
  drink,
  remainder,
  pulse,
  cooling,
  disabled,
  onDrink,
}: SojuGlassProps) {
  const fillPct = remainder / drink.perBottle;

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        type="button"
        onClick={onDrink}
        disabled={disabled || cooling}
        whileTap={{ scale: 0.93 }}
        className="relative h-56 w-44 select-none focus:outline-none disabled:cursor-not-allowed"
        aria-label={`${drink.key} 한 잔 마시기`}
      >
        <GlassArt drink={drink} fillPct={fillPct} />

        {/* 클릭 시 튀는 방울 + 물결 링 */}
        <AnimatePresence>
          <motion.span
            key={`splash-${pulse}`}
            initial={{ scale: 0.2, opacity: 0.7 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 0.55 }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{ borderColor: `${drink.color}99` }}
          />
        </AnimatePresence>
        <AnimatePresence>
          <motion.span
            key={`drop-${pulse}`}
            initial={{ y: -40, opacity: 0.9 }}
            animate={{ y: 6, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeIn" }}
            className="pointer-events-none absolute left-1/2 top-6 h-3 w-1.5 -translate-x-1/2 rounded-full"
            style={{ background: drink.color }}
          />
        </AnimatePresence>
      </motion.button>

      <p className="text-sm text-white/60">
        {cooling ? (
          <span className="text-booze-accent">잠시만… 목 넘김 중 🫗</span>
        ) : disabled ? (
          <span className="text-white/40">레이스 종료 🏁</span>
        ) : (
          <>
            <b style={{ color: drink.color }}>
              {drink.emoji} {drink.unit}
            </b>{" "}
            원샷!
          </>
        )}
      </p>
    </div>
  );
}
