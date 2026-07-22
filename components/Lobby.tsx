"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DoorOpen, Loader2, PlusCircle, User } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createRoom, joinRoom } from "@/lib/rooms";
import { useRaceStore } from "@/lib/useRaceStore";
import Logo from "./Logo";

type Tab = "menu" | "create" | "join";

export default function Lobby() {
  const { nickname, enterRoom, startSolo } = useRaceStore();
  const [tab, setTab] = useState<Tab>("menu");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL ?room=CODE 로 들어오면 입장 탭 자동 오픈
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("room");
    if (r && isSupabaseConfigured) {
      setCode(r.toUpperCase());
      setTab("join");
    }
  }, []);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const { room, participant } = await createRoom(title, nickname);
      enterRoom({
        roomId: room.id,
        roomCode: room.room_code,
        participantId: participant.id,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "방 생성에 실패했어요");
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (code.trim().length < 4) {
      setError("코드를 확인해주세요");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { room, participant } = await joinRoom(code.trim(), nickname);
      enterRoom({
        roomId: room.id,
        roomCode: room.room_code,
        participantId: participant.id,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "입장에 실패했어요");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[75dvh] flex-1 flex-col justify-center gap-6">
      <div className="flex flex-col items-center text-center">
        <Logo height={48} />
        <p className="mt-3 flex items-center justify-center gap-1 text-sm text-white/50">
          <User size={13} /> {nickname}
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-2xl border border-booze-gold/30 bg-booze-gold/10 p-4 text-center text-xs text-booze-gold">
          ⚙️ Supabase 미설정 — 지금은 <b>혼자 달리기</b>만 가능해요.
          <br />
          <span className="text-booze-gold/70">
            멀티는 <code>.env.local</code> 에 키를 넣으면 켜집니다.
          </span>
        </div>
      )}

      {tab === "menu" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <button
            disabled={!isSupabaseConfigured}
            onClick={() => setTab("create")}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-booze-card p-4 text-left transition hover:border-booze-neon/50 disabled:opacity-40"
          >
            <PlusCircle className="text-booze-neon" />
            <div>
              <p className="font-bold">방 만들기</p>
              <p className="text-xs text-white/50">방장이 되어 코드·QR 발급</p>
            </div>
          </button>

          <button
            disabled={!isSupabaseConfigured}
            onClick={() => setTab("join")}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-booze-card p-4 text-left transition hover:border-booze-neon/50 disabled:opacity-40"
          >
            <DoorOpen className="text-booze-neon" />
            <div>
              <p className="font-bold">코드로 입장</p>
              <p className="text-xs text-white/50">친구 방 6자리 코드 입력</p>
            </div>
          </button>

          <button
            onClick={startSolo}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
          >
            <span className="text-xl">🐢</span>
            <div>
              <p className="font-bold">혼자 달리기</p>
              <p className="text-xs text-white/50">연습 삼아 나 홀로 부스터</p>
            </div>
          </button>
        </motion.div>
      )}

      {tab === "create" && (
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="mb-1.5 block text-sm text-white/60">방 이름</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={20}
              placeholder="예: 강남역 3번출구"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-lg outline-none focus:border-booze-neon"
            />
          </div>
          {error && <p className="text-sm text-booze-accent">{error}</p>}
          <div className="flex gap-2">
            <BackButton onClick={() => setTab("menu")} disabled={busy} />
            <button
              onClick={handleCreate}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-booze-accent py-3.5 font-black text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? <Loader2 className="animate-spin" size={18} /> : "🏁 방 만들기"}
            </button>
          </div>
        </motion.div>
      )}

      {tab === "join" && (
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="mb-1.5 block text-sm text-white/60">
              초대 코드 (6자리)
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="BOOZY1"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-2xl font-black tracking-[0.3em] outline-none focus:border-booze-neon"
            />
          </div>
          {error && <p className="text-sm text-booze-accent">{error}</p>}
          <div className="flex gap-2">
            <BackButton onClick={() => setTab("menu")} disabled={busy} />
            <button
              onClick={handleJoin}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-booze-neon py-3.5 font-black text-black transition active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? <Loader2 className="animate-spin" size={18} /> : "입장하기"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function BackButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-2xl border border-white/15 px-5 py-3.5 font-bold text-white/60 transition hover:bg-white/5 disabled:opacity-40"
    >
      뒤로
    </button>
  );
}
