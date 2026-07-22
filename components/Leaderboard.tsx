"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crown } from "lucide-react";
import { useRoomLeaderboard } from "@/lib/useRoomLeaderboard";
import { getTier, liveSpeed } from "@/lib/booster";

interface LeaderboardProps {
  roomId: string;
  myParticipantId: string | null;
  /** 내 로컬 상태로 낙관적 덮어쓰기 (DB 반영 전에도 즉시 반영) */
  myLocal: {
    glasses: number; // 총 잔
    sojuEquiv: number; // 소주 환산 잔
    startTime: number | null;
    isFinished: boolean;
  };
}

export default function Leaderboard({
  roomId,
  myParticipantId,
  myLocal,
}: LeaderboardProps) {
  const { participants, loading } = useRoomLeaderboard(roomId);
  const [now, setNow] = useState(() => Date.now());

  // 1초마다 재계산 (시간이 흐르며 시속이 살아있게)
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const ranked = useMemo(() => {
    const rows = participants.map((p) => {
      const isMe = p.id === myParticipantId;
      const drinks = isMe ? myLocal.glasses : p.drinks_count;
      const equiv = isMe ? myLocal.sojuEquiv : p.soju_equiv;
      const startISO =
        isMe && myLocal.startTime
          ? new Date(myLocal.startTime).toISOString()
          : p.start_time;
      const retired = isMe ? myLocal.isFinished : p.is_retired;
      const speed = liveSpeed(equiv, startISO, p.last_updated, retired, now);
      return { p, isMe, drinks, retired, speed };
    });
    return rows.sort((a, b) => b.speed - a.speed);
  }, [participants, myParticipantId, myLocal, now]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-booze-card/60 p-4 text-center text-sm text-white/40">
        방원 불러오는 중…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-booze-card/60 p-3">
      <div className="flex items-center gap-1.5 px-1 text-xs font-bold text-white/50">
        <Crown size={13} className="text-booze-gold" /> 실시간 리더보드 ·{" "}
        {ranked.length}명
      </div>
      <AnimatePresence initial={false}>
        {ranked.map((row, i) => {
          const tier = getTier(row.speed);
          return (
            <motion.div
              key={row.p.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                row.isMe
                  ? "bg-booze-neon/10 ring-1 ring-booze-neon/40"
                  : "bg-white/[0.03]"
              }`}
            >
              <span className="w-5 text-center text-sm font-black text-white/50">
                {i + 1}
              </span>
              <span className="text-lg">{tier.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {row.p.nickname}
                  {row.isMe && <span className="text-booze-neon"> (나)</span>}
                  {row.retired && (
                    <span className="ml-1 text-xs text-white/40">🏁</span>
                  )}
                </p>
                <p className="text-[11px] text-white/40">총 {row.drinks}잔</p>
              </div>
              <span
                className="tabular text-right text-sm font-black"
                style={{ color: tier.color }}
              >
                {row.speed.toFixed(1)}
                <span className="text-[10px] text-white/40"> 병/h</span>
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
