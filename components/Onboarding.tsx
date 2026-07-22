"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRaceStore } from "@/lib/useRaceStore";
import Logo from "./Logo";

export default function Onboarding() {
  const setProfile = useRaceStore((s) => s.setProfile);
  const [name, setName] = useState("");
  const go = () => setProfile(name.trim() || "익명의 레이서");

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center gap-8 px-6">
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Logo height={72} />
        </motion.div>
        <p className="mt-4 text-white/60">
          오늘 밤, 당신의 간에 부스터를 답니다 🏎️🔥
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-white/60">닉네임</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          maxLength={12}
          placeholder="예: 강남역폭주족"
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-lg outline-none focus:border-booze-neon"
        />
        <p className="mt-2 px-1 text-xs text-white/40">
          술은 소주로 시작해요. 레이스 중에 언제든 추가할 수 있어요 🍶
        </p>
      </div>

      <button
        onClick={go}
        className="rounded-2xl bg-booze-accent py-4 text-lg font-black text-white shadow-lg shadow-booze-accent/30 transition active:scale-[0.98]"
      >
        다음 →
      </button>
    </div>
  );
}
