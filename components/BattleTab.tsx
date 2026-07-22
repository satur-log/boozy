"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Swords, Unlink } from "lucide-react";
import { useRaceStore } from "@/lib/useRaceStore";
import { useRoomLeaderboard } from "@/lib/useRoomLeaderboard";
import { findRoomByCode } from "@/lib/rooms";
import { Participant, Room } from "@/lib/types";
import { getTier, liveSpeed } from "@/lib/booster";
import { sojuEquivGlasses, totalGlasses } from "@/lib/drinks";
import MuteButton from "./MuteButton";

interface MyLocal {
  id: string | null;
  glasses: number;
  sojuEquiv: number;
  startTime: number | null;
  isFinished: boolean;
}

function teamStats(
  members: Participant[],
  now: number,
  my?: MyLocal
): { avgSpeed: number; totalDrinks: number; count: number } {
  if (members.length === 0) return { avgSpeed: 0, totalDrinks: 0, count: 0 };
  let sumSpeed = 0;
  let totalDrinks = 0;
  for (const p of members) {
    const isMe = my && p.id === my.id;
    const drinks = isMe ? my!.glasses : p.drinks_count;
    const equiv = isMe ? my!.sojuEquiv : p.soju_equiv;
    const startISO =
      isMe && my!.startTime
        ? new Date(my!.startTime).toISOString()
        : p.start_time;
    const retired = isMe ? my!.isFinished : p.is_retired;
    sumSpeed += liveSpeed(equiv, startISO, p.last_updated, retired, now);
    totalDrinks += drinks;
  }
  return {
    avgSpeed: sumSpeed / members.length,
    totalDrinks,
    count: members.length,
  };
}

export default function BattleTab({ onGoRace }: { onGoRace: () => void }) {
  const {
    mode,
    roomId,
    roomCode,
    participantId,
    counts,
    startTime,
    isFinished,
  } = useRaceStore();

  const [oppCode, setOppCode] = useState("");
  const [oppRoom, setOppRoom] = useState<Room | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const mine = useRoomLeaderboard(roomId);
  const opp = useRoomLeaderboard(oppRoom?.id ?? null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const myLocal: MyLocal = {
    id: participantId,
    glasses: totalGlasses(counts),
    sojuEquiv: sojuEquivGlasses(counts),
    startTime,
    isFinished,
  };

  const myTeam = useMemo(
    () => teamStats(mine.participants, now, myLocal),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mine.participants, now, counts, startTime, isFinished, participantId]
  );
  const oppTeam = useMemo(
    () => teamStats(opp.participants, now),
    [opp.participants, now]
  );

  const connect = async () => {
    if (oppCode.trim().toUpperCase() === roomCode) {
      setError("우리 방과 같은 코드예요");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const room = await findRoomByCode(oppCode.trim());
      if (!room) setError("존재하지 않거나 종료된 방이에요");
      else setOppRoom(room);
    } catch {
      setError("연결에 실패했어요");
    } finally {
      setBusy(false);
    }
  };

  // 방에 없으면 안내
  if (mode !== "multi" || !roomId) {
    return (
      <TabShell title="원격 대결">
        <EmptyState
          emoji="⚔️"
          title="먼저 방에 입장하세요"
          desc="레이스 탭에서 방을 만들거나 코드로 입장하면, 여기서 다른 방과 팀 대항전을 할 수 있어요."
          action={
            <button
              onClick={onGoRace}
              className="rounded-2xl bg-booze-accent px-5 py-2.5 text-sm font-black text-white"
            >
              레이스 탭으로
            </button>
          }
        />
      </TabShell>
    );
  }

  const myWin = myTeam.avgSpeed >= oppTeam.avgSpeed;

  return (
    <TabShell title="원격 대결">
      {!oppRoom ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-white/60">
            우리 방 <b className="text-booze-neon">{roomCode}</b> · 상대 방 코드를
            입력해 팀 대항전을 시작하세요.
          </p>
          <input
            value={oppCode}
            onChange={(e) => setOppCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="상대 방 코드"
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-2xl font-black tracking-[0.3em] outline-none focus:border-booze-accent"
          />
          {error && <p className="text-sm text-booze-accent">{error}</p>}
          <button
            onClick={connect}
            disabled={busy || oppCode.trim().length < 4}
            className="flex items-center justify-center gap-2 rounded-2xl bg-booze-accent py-3.5 font-black text-white disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Swords size={18} /> 배틀 연결
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* VS 스코어보드 */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <TeamCard
              name={roomCode ?? "우리"}
              stats={myTeam}
              win={myWin}
              mine
            />
            <span className="text-lg font-black text-white/40">VS</span>
            <TeamCard
              name={oppRoom.room_code}
              stats={oppTeam}
              win={!myWin && oppTeam.avgSpeed > 0}
            />
          </div>

          {/* 평균 페이스 대결 바 */}
          <VersusBar
            left={myTeam.avgSpeed}
            right={oppTeam.avgSpeed}
            leftLabel={roomCode ?? "우리"}
            rightLabel={oppRoom.room_code}
          />

          <div className="grid grid-cols-2 gap-3">
            <TeamRoster
              title={`🟦 ${roomCode}`}
              members={mine.participants}
              now={now}
              my={myLocal}
            />
            <TeamRoster
              title={`🟥 ${oppRoom.room_code}`}
              members={opp.participants}
              now={now}
            />
          </div>

          <button
            onClick={() => {
              setOppRoom(null);
              setOppCode("");
            }}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/15 py-3 text-sm font-bold text-white/60 transition hover:bg-white/5"
          >
            <Unlink size={15} /> 배틀 연결 끊기
          </button>
        </div>
      )}
    </TabShell>
  );
}

function TabShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black">{title}</h1>
        <MuteButton />
      </header>
      {children}
    </div>
  );
}

function EmptyState({
  emoji,
  title,
  desc,
  action,
}: {
  emoji: string;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-booze-card/60 p-8 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="text-lg font-bold">{title}</p>
      <p className="text-sm text-white/50">{desc}</p>
      {action}
    </div>
  );
}

function TeamCard({
  name,
  stats,
  win,
  mine,
}: {
  name: string;
  stats: { avgSpeed: number; totalDrinks: number; count: number };
  win: boolean;
  mine?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-2xl border p-3"
      style={{
        borderColor: win ? "#ffd166" : "rgba(255,255,255,0.1)",
        background: win ? "rgba(255,209,102,0.08)" : "rgba(255,255,255,0.03)",
      }}
    >
      {win && <span className="text-xs">👑</span>}
      <p className="truncate text-sm font-black" style={{ maxWidth: "100%" }}>
        {mine ? "🟦" : "🟥"} {name}
      </p>
      <p className="tabular text-2xl font-black text-booze-neon">
        {stats.avgSpeed.toFixed(1)}
      </p>
      <p className="text-[10px] text-white/40">
        평균 병/h · {stats.count}명 · {stats.totalDrinks}잔
      </p>
    </div>
  );
}

function VersusBar({
  left,
  right,
  leftLabel,
  rightLabel,
}: {
  left: number;
  right: number;
  leftLabel: string;
  rightLabel: string;
}) {
  const total = left + right;
  const leftPct = total > 0 ? (left / total) * 100 : 50;
  return (
    <div>
      <div className="flex h-5 overflow-hidden rounded-full border border-white/10">
        <motion.div
          className="bg-booze-neon"
          animate={{ width: `${leftPct}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
        <div className="flex-1 bg-booze-accent" />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-white/40">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

function TeamRoster({
  title,
  members,
  now,
  my,
}: {
  title: string;
  members: Participant[];
  now: number;
  my?: MyLocal;
}) {
  const rows = [...members]
    .map((p) => {
      const isMe = my && p.id === my.id;
      const equiv = isMe ? my!.sojuEquiv : p.soju_equiv;
      const startISO =
        isMe && my!.startTime
          ? new Date(my!.startTime).toISOString()
          : p.start_time;
      const retired = isMe ? my!.isFinished : p.is_retired;
      return {
        p,
        speed: liveSpeed(equiv, startISO, p.last_updated, retired, now),
      };
    })
    .sort((a, b) => b.speed - a.speed);

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-booze-card/40 p-2.5">
      <p className="px-1 text-[11px] font-bold text-white/40">{title}</p>
      {rows.length === 0 && (
        <p className="px-1 py-2 text-[11px] text-white/30">아직 없음</p>
      )}
      {rows.map(({ p, speed }) => (
        <div key={p.id} className="flex items-center gap-1.5">
          <span className="text-sm">{getTier(speed).emoji}</span>
          <span className="min-w-0 flex-1 truncate text-xs">{p.nickname}</span>
          <span className="tabular text-xs font-bold text-white/70">
            {speed.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}
