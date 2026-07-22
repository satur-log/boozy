"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Flag,
  Gauge,
  GlassWater,
  LogOut,
  Plus,
  Share2,
  Timer,
  X,
} from "lucide-react";
import { useRaceStore } from "@/lib/useRaceStore";
import { useElapsed } from "@/lib/useElapsed";
import {
  COOLDOWN_MS,
  GLASSES_PER_BOTTLE,
  calcSpeed,
  formatElapsed,
  getTier,
  getTitle,
  isCheating,
} from "@/lib/booster";
import { DRINKS, getDrink, sojuEquivGlasses, totalGlasses } from "@/lib/drinks";
import {
  finishParticipant,
  leaveParticipant,
  syncParticipant,
} from "@/lib/rooms";
import { playFanfare, playPop, playSip } from "@/lib/sound";
import { track } from "@/lib/analytics";
import { recordSession } from "@/lib/localStats";
import { savePng, shareKakao, shareResult } from "@/lib/share";
import SojuGlass from "./SojuGlass";
import SpeedGauge from "./SpeedGauge";
import BoosterBadge from "./BoosterBadge";
import Lobby from "./Lobby";
import Leaderboard from "./Leaderboard";
import InviteCard from "./InviteCard";
import MuteButton from "./MuteButton";
import Logo from "./Logo";

export default function RaceDashboard() {
  const [pulse, setPulse] = useState(0);
  const [cooling, setCooling] = useState(false);
  const [bottleMsg, setBottleMsg] = useState<string | null>(null);
  const recordedRef = useRef(false);

  const {
    nickname,
    selectedTypes,
    currentType,
    mode,
    roomId,
    roomCode,
    participantId,
    counts,
    startTime,
    lastDrinkAt,
    isFinished,
    muted,
    setCurrentType,
    addDrinkType,
    removeDrinkType,
    drink,
    finish,
    leaveRoom,
  } = useRaceStore();

  const elapsed = useElapsed(startTime, isFinished, lastDrinkAt);

  const total = totalGlasses(counts);
  const equiv = useMemo(() => sojuEquivGlasses(counts), [counts]);
  const speed = useMemo(() => calcSpeed(equiv, elapsed), [equiv, elapsed]);
  const tier = useMemo(() => getTier(speed), [speed]);
  const cheating = isCheating(speed);
  const isMulti = mode === "multi";

  const curDrink = getDrink(currentType);
  const curCount = counts[currentType] ?? 0;
  const curRemainder = curCount % curDrink.perBottle;
  const equivBottles = equiv / GLASSES_PER_BOTTLE;

  // 쿨타임 표시
  useEffect(() => {
    if (!lastDrinkAt) return;
    const remain = COOLDOWN_MS - (Date.now() - lastDrinkAt);
    if (remain <= 0) return;
    setCooling(true);
    const id = window.setTimeout(() => setCooling(false), remain);
    return () => window.clearTimeout(id);
  }, [lastDrinkAt]);

  const handleDrink = () => {
    const prevCount = counts[currentType] ?? 0;
    const ok = drink();
    if (!ok) return;
    setPulse((p) => p + 1);
    if (!muted) playSip();

    const nextCount = prevCount + 1;

    // 📊 핵심 지표: 잔 클릭
    track("drink_click", {
      drink_type: currentType,
      mode,
      total_glasses: total + 1,
    });

    if (
      Math.floor(nextCount / curDrink.perBottle) >
      Math.floor(prevCount / curDrink.perBottle)
    ) {
      const n = Math.floor(nextCount / curDrink.perBottle);
      setBottleMsg(
        `${curDrink.emoji} ${curDrink.key} ${n}${curDrink.bottleLabel} 완성!`
      );
      if (!muted) playPop();
      track("bottle_complete", { drink_type: currentType, bottles: n });
      window.setTimeout(() => setBottleMsg(null), 1200);
    }

    if (isMulti && participantId) {
      const nextCounts = { ...counts, [currentType]: nextCount };
      const nextTotal = totalGlasses(nextCounts);
      const nextEquiv = sojuEquivGlasses(nextCounts);
      const nextStart = startTime ?? Date.now();
      void syncParticipant({
        participantId,
        drinks: nextTotal,
        sojuEquiv: nextEquiv,
        startTime: nextStart,
        speed: calcSpeed(nextEquiv, Date.now() - nextStart),
      });
    }
  };

  const handleFinish = () => {
    finish();
    if (!muted) playFanfare();
    if (!recordedRef.current) {
      recordSession({
        drinks: total,
        speed,
        elapsedMs: elapsed,
        equivBottles,
      });
      recordedRef.current = true;
    }
    track("race_finish", {
      mode,
      total_glasses: total,
      pace: Number(speed.toFixed(2)),
      tier: tier.key,
      elapsed_min: Math.round(elapsed / 60000),
    });
    if (isMulti && participantId) void finishParticipant({ participantId, speed });
  };

  const handleLeave = () => {
    // 완주율: finished=false 면 중도 이탈
    track("race_leave", {
      mode,
      finished: isFinished,
      total_glasses: total,
    });
    if (isMulti && participantId) void leaveParticipant(participantId);
    recordedRef.current = false;
    leaveRoom();
  };

  if (mode === "none") return <Lobby />;

  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Logo height={24} className="self-start" />
          <p className="text-sm text-white/50">
            {nickname}
            {isMulti && roomCode && (
              <span className="text-white/30"> · 방 {roomCode}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MuteButton />
          <button
            onClick={handleLeave}
            className="flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/5"
          >
            <LogOut size={13} /> 나가기
          </button>
        </div>
      </header>

      {isMulti && roomId && roomCode && (
        <>
          <InviteCard roomCode={roomCode} />
          <Leaderboard
            roomId={roomId}
            myParticipantId={participantId}
            myLocal={{ glasses: total, sojuEquiv: equiv, startTime, isFinished }}
          />
        </>
      )}

      <section className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-booze-card/70 p-6 backdrop-blur">
        <SpeedGauge speed={speed} tier={tier} cheating={cheating} />
        <BoosterBadge tier={tier} />
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Gauge size={16} />}
          label="소주 환산"
          value={equivBottles.toFixed(1)}
          unit="병"
          sub={`${equiv.toFixed(1)} 환산잔`}
        />
        <StatCard
          icon={<GlassWater size={16} />}
          label="총 잔"
          value={total.toString()}
          unit="잔"
        />
        <StatCard
          icon={<Timer size={16} />}
          label="경과"
          value={formatElapsed(elapsed)}
          unit=""
          mono
        />
      </section>

      <TypeSelector
        selectedTypes={selectedTypes}
        currentType={currentType}
        counts={counts}
        onPick={(t) => {
          track("drink_type_switch", { drink_type: t });
          setCurrentType(t);
        }}
        onAdd={(t) => {
          track("drink_type_add", { drink_type: t });
          addDrinkType(t);
        }}
        onRemove={removeDrinkType}
        disabled={isFinished}
      />

      <AnimatePresence>
        {bottleMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="rounded-2xl border border-booze-gold/40 bg-booze-gold/10 py-2 text-center text-sm font-bold text-booze-gold"
          >
            🍾 {bottleMsg} 뚜껑 오픈… 펑!
          </motion.div>
        )}
      </AnimatePresence>

      <section className="flex items-center justify-center py-2">
        <SojuGlass
          drink={curDrink}
          remainder={curRemainder}
          pulse={pulse}
          cooling={cooling}
          disabled={isFinished}
          onDrink={handleDrink}
        />
      </section>

      <footer className="flex flex-col gap-2">
        {isFinished ? (
          <FinalReport
            nickname={nickname}
            counts={counts}
            total={total}
            equivBottles={equivBottles}
            elapsed={elapsed}
            speed={speed}
            cheating={cheating}
            onReset={handleLeave}
          />
        ) : (
          <>
            <button
              onClick={handleFinish}
              disabled={total === 0}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-booze-gold py-3.5 font-black text-black transition active:scale-[0.98] disabled:opacity-30"
            >
              <Flag size={18} /> 피니시 라인 통과 · 기록 저장 🏁
            </button>
            <p className="text-center text-[11px] text-white/30">
              끝낼 필요 없어요 — 계속 달려도 페이스는 실시간으로 기록돼요
            </p>
          </>
        )}
      </footer>
    </div>
  );
}

// ── 주종 선택 + 추가 + 주종별 현황 ────────────────────────────────
function TypeSelector({
  selectedTypes,
  currentType,
  counts,
  onPick,
  onAdd,
  onRemove,
  disabled,
}: {
  selectedTypes: string[];
  currentType: string;
  counts: Record<string, number>;
  onPick: (t: string) => void;
  onAdd: (t: string) => void;
  onRemove: (t: string) => void;
  disabled: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const remaining = DRINKS.filter((d) => !selectedTypes.includes(d.key));

  return (
    <section className="flex flex-col gap-2">
      <p className="px-1 text-xs font-bold text-white/40">지금 마실 술</p>

      <div className="grid grid-cols-2 gap-2">
        {selectedTypes.map((key) => {
          const d = getDrink(key);
          const c = counts[key] ?? 0;
          const bottles = Math.floor(c / d.perBottle);
          const remainder = c % d.perBottle;
          const active = key === currentType;
          const removable = key !== "소주" && c === 0 && !disabled;
          return (
            <button
              key={key}
              disabled={disabled}
              onClick={() => onPick(key)}
              className="relative flex items-center gap-2 rounded-2xl border p-3 text-left transition disabled:opacity-50"
              style={{
                borderColor: active ? d.color : "rgba(255,255,255,0.1)",
                background: active ? `${d.color}1a` : "rgba(255,255,255,0.03)",
              }}
            >
              <span className="text-xl">{d.emoji}</span>
              <div className="min-w-0">
                <p
                  className="text-sm font-bold"
                  style={{ color: active ? d.color : "#f5f5f7" }}
                >
                  {d.key}
                </p>
                <p className="text-[11px] text-white/40">
                  {bottles}
                  {d.bottleLabel} {remainder}잔
                </p>
              </div>
              {removable && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(key);
                  }}
                  className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs text-white/50 hover:bg-white/20"
                >
                  <X size={11} />
                </span>
              )}
            </button>
          );
        })}

        {remaining.length > 0 && !disabled && (
          <button
            onClick={() => setAdding((v) => !v)}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/20 p-3 text-sm font-semibold text-white/50 transition hover:bg-white/5"
          >
            <Plus size={15} /> 주종 추가
          </button>
        )}
      </div>

      <AnimatePresence>
        {adding && remaining.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-2 pt-1">
              {remaining.map((d) => (
                <button
                  key={d.key}
                  onClick={() => {
                    onAdd(d.key);
                    setAdding(false);
                  }}
                  className="flex flex-col items-center gap-0.5 rounded-xl border border-white/10 bg-white/[0.03] p-2 transition hover:border-white/30"
                >
                  <span className="text-lg">{d.emoji}</span>
                  <span className="text-xs font-semibold">{d.key}</span>
                  <span className="text-[10px] text-white/40">×{d.weight}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── 스탯 카드 ─────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  unit,
  sub,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-booze-card/60 p-3">
      <div className="flex items-center gap-1 text-white/40">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-black ${mono ? "tabular" : ""}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-white/40">{unit}</span>}
      </div>
      {sub && <span className="text-[11px] text-white/30">{sub}</span>}
    </div>
  );
}

// ── 최종 리포트 + 공유 ────────────────────────────────────────────
function FinalReport({
  nickname,
  counts,
  total,
  equivBottles,
  elapsed,
  speed,
  cheating,
  onReset,
}: {
  nickname: string;
  counts: Record<string, number>;
  total: number;
  equivBottles: number;
  elapsed: number;
  speed: number;
  cheating: boolean;
  onReset: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tier = getTier(speed);
  const title = getTitle(speed, new Date().getHours());
  const drank = Object.entries(counts).filter(([, n]) => n > 0);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  };

  const onSave = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      await savePng(cardRef.current, `boozy-${nickname}.png`);
      track("share", { method: "save_image" });
      flash("이미지를 저장했어요 📸");
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    setBusy(true);
    try {
      const res = await shareResult({
        el: cardRef.current,
        title: "Boozy 부스터 리포트",
        text: `${nickname} · ${title} · ${speed.toFixed(1)}병/h 🏎️🔥`,
        url: typeof window !== "undefined" ? window.location.origin : "",
      });
      track("share", { method: "web_share", result: res });
      if (res === "copied") flash("링크를 복사했어요 🔗");
      else if (res === "failed") flash("공유를 지원하지 않는 환경이에요");
    } finally {
      setBusy(false);
    }
  };

  const onKakao = async () => {
    const ok = await shareKakao({
      title: `Boozy — ${nickname}의 부스터 리포트`,
      description: `${title} · ${speed.toFixed(1)}병/h`,
      url: typeof window !== "undefined" ? window.location.origin : "",
    });
    track("share", { method: "kakao", result: ok ? "sent" : "fallback" });
    if (!ok) onShare();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 캡처 대상 카드 */}
      <div
        ref={cardRef}
        className="flex flex-col gap-4 rounded-3xl border-2 p-5"
        style={{
          borderColor: tier.color,
          background: "#15151f",
          boxShadow: `0 0 30px ${tier.glow}`,
        }}
      >
        <div className="flex flex-col items-center text-center">
          <Logo height={22} />
          <p className="mt-1 text-[11px] font-bold tracking-widest text-white/40">
            부스터 리포트
          </p>
          <p
            className="mt-2 text-2xl font-black"
            style={{ color: tier.color }}
          >
            {tier.emoji} {tier.label}
          </p>
          <p className="mt-1 text-sm font-bold text-white/80">“{title}”</p>
          <p className="text-xs text-white/50">{nickname}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <ReportItem label="최종 페이스" value={`${speed.toFixed(1)} 병/h`} />
          <ReportItem label="소요 시간" value={formatElapsed(elapsed)} />
          <ReportItem label="소주 환산" value={`${equivBottles.toFixed(1)} 병`} />
          <ReportItem label="총 잔 수" value={`${total} 잔`} />
        </div>

        {drank.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {drank.map(([key, n]) => {
              const d = getDrink(key);
              const b = Math.floor(n / d.perBottle);
              const r = n % d.perBottle;
              return (
                <span
                  key={key}
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: `${d.color}1a`, color: d.color }}
                >
                  {d.emoji} {b}
                  {d.bottleLabel} {r}잔
                </span>
              );
            })}
          </div>
        )}

        {cheating && (
          <p className="rounded-xl bg-booze-accent/10 py-2 text-center text-xs text-booze-accent">
            ⚠️ 비현실적 속도 — 전국 랭킹 등록 제외
          </p>
        )}
      </div>

      {toast && (
        <p className="text-center text-xs font-semibold text-booze-neon">
          {toast}
        </p>
      )}

      {/* 공유 액션 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onSave}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/15 py-3 text-sm font-bold text-white/80 transition hover:bg-white/5 disabled:opacity-50"
        >
          <Download size={16} /> 이미지 저장
        </button>
        <button
          onClick={onShare}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/15 py-3 text-sm font-bold text-white/80 transition hover:bg-white/5 disabled:opacity-50"
        >
          <Share2 size={16} /> 공유
        </button>
      </div>
      <button
        onClick={onKakao}
        disabled={busy}
        className="rounded-2xl py-3 text-sm font-black text-black transition active:scale-[0.98] disabled:opacity-50"
        style={{ background: "#FEE500" }}
      >
        💬 카카오톡 공유
      </button>

      <button
        onClick={onReset}
        className="rounded-2xl border border-white/15 py-3 font-bold text-white/70 transition hover:bg-white/5"
      >
        로비로 돌아가기
      </button>
    </div>
  );
}

function ReportItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 py-2.5">
      <p className="text-[11px] text-white/40">{label}</p>
      <p className="text-lg font-black tabular">{value}</p>
    </div>
  );
}
