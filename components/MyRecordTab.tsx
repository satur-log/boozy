"use client";

import { useEffect, useState } from "react";
import { useRaceStore } from "@/lib/useRaceStore";
import { getLocalStats, LocalStats } from "@/lib/localStats";
import { getTier } from "@/lib/booster";
import MuteButton from "./MuteButton";

export default function MyRecordTab() {
  const nickname = useRaceStore((s) => s.nickname);
  const [stats, setStats] = useState<LocalStats | null>(null);

  useEffect(() => setStats(getLocalStats()), []);

  const s = stats ?? { sessions: 0, totalDrinks: 0, bestSpeed: 0 };
  const tier = getTier(s.bestSpeed);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black">내 기록</h1>
        <MuteButton />
      </header>

      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-booze-card/60 p-6">
        <div className="text-center">
          <p className="text-sm text-white/50">👤 {nickname}</p>
          <p className="mt-2 text-6xl font-black text-booze-neon">
            {s.sessions}
            <span className="text-xl text-white/40"> 회</span>
          </p>
          <p className="text-xs text-white/40">완주한 레이스 횟수</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-white/5 py-4">
            <p className="text-[11px] text-white/40">누적 총 잔</p>
            <p className="text-2xl font-black tabular">{s.totalDrinks}</p>
          </div>
          <div className="rounded-xl bg-white/5 py-4">
            <p className="text-[11px] text-white/40">최고 페이스</p>
            <p
              className="text-2xl font-black tabular"
              style={{ color: tier.color }}
            >
              {s.bestSpeed.toFixed(1)}
              <span className="text-xs text-white/40"> 병/h</span>
            </p>
          </div>
        </div>

        {s.bestSpeed > 0 && (
          <div
            className="flex items-center justify-center gap-2 rounded-2xl border py-2.5"
            style={{ borderColor: tier.color, background: `${tier.glow}` }}
          >
            <span>{tier.emoji}</span>
            <span
              className="text-sm font-bold"
              style={{ color: tier.color }}
            >
              최고 등급 · {tier.label}
            </span>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-white/30">
        이 기록은 이 기기에만 저장돼요 (LocalStorage)
        <br />
        전국 순위는 <b className="text-white/50">전국 랭킹 탭</b>에서 확인하세요 🏆
      </p>
    </div>
  );
}
