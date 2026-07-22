"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRaceStore } from "@/lib/useRaceStore";
import {
  getHistory,
  getLocalStats,
  LocalStats,
  SessionRecord,
} from "@/lib/localStats";
import { formatElapsed, getTier } from "@/lib/booster";
import MuteButton from "./MuteButton";

function formatDate(at: number): string {
  const d = new Date(at);
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${M}월 ${D}일 ${hh}:${mm}`;
}

export default function MyRecordTab() {
  const nickname = useRaceStore((s) => s.nickname);
  const [stats, setStats] = useState<LocalStats | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);

  useEffect(() => {
    setStats(getLocalStats());
    setHistory(getHistory());
  }, []);

  const s = stats ?? { sessions: 0, totalDrinks: 0, bestSpeed: 0 };
  const tier = getTier(s.bestSpeed);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black">내 기록</h1>
        <MuteButton />
      </header>

      {/* 요약 */}
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
      </div>

      {/* 히스토리 리스트 */}
      <div className="flex flex-col gap-2">
        <p className="px-1 text-xs font-bold text-white/40">
          완주 기록 {history.length > 0 && `· ${history.length}회`}
        </p>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-booze-card/60 p-6 text-center text-sm text-white/40">
            아직 완주 기록이 없어요.
            <br />
            레이스에서 <b className="text-booze-gold">🏁 피니시</b>를 누르면
            여기에 쌓여요.
          </div>
        ) : (
          history.map((h, i) => {
            const t = getTier(h.speed);
            return (
              <motion.div
                key={h.at}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.03 }}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-booze-card/60 px-4 py-3"
              >
                <span className="text-xl">{t.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{formatDate(h.at)}</p>
                  <p className="text-[11px] text-white/40">
                    {h.equivBottles.toFixed(1)}병 · {h.glasses}잔 ·{" "}
                    {formatElapsed(h.elapsedMs)}
                  </p>
                </div>
                <span
                  className="tabular text-right text-sm font-black"
                  style={{ color: t.color }}
                >
                  {h.speed.toFixed(1)}
                  <span className="text-[10px] text-white/40"> 병/h</span>
                </span>
              </motion.div>
            );
          })
        )}
      </div>

      <p className="text-center text-[11px] text-white/30">
        이 기록은 이 기기에만 저장돼요 (LocalStorage)
      </p>
    </div>
  );
}
