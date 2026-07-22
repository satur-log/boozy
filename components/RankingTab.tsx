"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Crosshair, RefreshCw } from "lucide-react";
import { useRaceStore } from "@/lib/useRaceStore";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  CountRank,
  RankParticipant,
  boosterKings,
  fetchErosionRanking,
  fetchRankingData,
  hippoKings,
  legendCrews,
} from "@/lib/rankings";
import MuteButton from "./MuteButton";

type Cat = "booster" | "hippo" | "erosion" | "crew";

const CATS: { key: Cat; emoji: string; label: string; desc: string }[] = [
  { key: "booster", emoji: "🏎️", label: "부스터왕", desc: "24시간 내 최고 페이스" },
  { key: "hippo", emoji: "🐘", label: "하마왕", desc: "한 세션 최다 음주량" },
  { key: "erosion", emoji: "🍺", label: "침식상", desc: "닉네임별 최다 음주 횟수" },
  { key: "crew", emoji: "🏆", label: "크루", desc: "방 평균 페이스 1위" },
];

interface Item {
  rank: number;
  name: string;
  sub?: string;
  value: string;
  isMine: boolean;
}

function buildRanking(
  cat: Cat,
  rows: RankParticipant[],
  erosionFull: CountRank[],
  me: string
): { items: Item[]; myRank: number | null; myValue: string | null } {
  let all: Item[] = [];

  if (cat === "crew") {
    all = legendCrews(rows, 9999).map((c, i) => ({
      rank: i + 1,
      name: c.room_title,
      sub: `${c.members}명`,
      value: `${c.avgSpeed.toFixed(1)} 병/h`,
      isMine: false, // 크루는 방 단위 → 개인 순위 없음
    }));
  } else if (cat === "erosion") {
    all = erosionFull.map((e, i) => ({
      rank: i + 1,
      name: e.nickname,
      sub: `누적 ${e.totalDrinks}잔`,
      value: `${e.count} 회`,
      isMine: e.nickname === me,
    }));
  } else {
    const list =
      cat === "booster" ? boosterKings(rows, 9999) : hippoKings(rows, 9999);
    all = list.map((p, i) => ({
      rank: i + 1,
      name: p.nickname,
      sub: p.room_title,
      value:
        cat === "booster"
          ? `${p.current_speed.toFixed(1)} 병/h`
          : `${p.drinks_count} 잔`,
      isMine: p.nickname === me,
    }));
  }

  const mine = all.find((it) => it.isMine) ?? null;
  return {
    items: all.slice(0, 10),
    myRank: mine ? mine.rank : null,
    myValue: mine ? mine.value : null,
  };
}

export default function RankingTab() {
  const nickname = useRaceStore((s) => s.nickname);
  const [cat, setCat] = useState<Cat>("booster");
  const [rows, setRows] = useState<RankParticipant[]>([]);
  const [erosion, setErosion] = useState<CountRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMine, setShowMine] = useState(false);
  const mineRef = useRef<HTMLLIElement>(null);

  const load = async () => {
    setLoading(true);
    const [data, ero] = await Promise.all([
      fetchRankingData(),
      fetchErosionRanking(9999),
    ]);
    setRows(data);
    setErosion(ero);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { items, myRank, myValue } = useMemo(
    () => buildRanking(cat, rows, erosion, nickname),
    [cat, rows, erosion, nickname]
  );

  // 내 순위 보기 → 목록 안의 내 행으로 스크롤
  useEffect(() => {
    if (showMine && mineRef.current) {
      mineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showMine, cat]);

  const meta = CATS.find((c) => c.key === cat)!;
  const showCheatNote = cat === "booster" || cat === "crew";
  const supportsMine = cat !== "crew";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black">전국 랭킹</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:bg-white/5"
            aria-label="새로고침"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <MuteButton />
        </div>
      </header>

      {/* 카테고리 4종 */}
      <div className="grid grid-cols-4 gap-2">
        {CATS.map((c) => {
          const on = cat === c.key;
          return (
            <button
              key={c.key}
              onClick={() => {
                setCat(c.key);
                setShowMine(false);
              }}
              className="flex flex-col items-center gap-1 rounded-2xl border p-2.5 transition"
              style={{
                borderColor: on ? "#ffd166" : "rgba(255,255,255,0.1)",
                background: on
                  ? "rgba(255,209,102,0.1)"
                  : "rgba(255,255,255,0.03)",
              }}
            >
              <span className="text-xl">{c.emoji}</span>
              <span
                className="text-[11px] font-bold"
                style={{ color: on ? "#ffd166" : "rgba(255,255,255,0.6)" }}
              >
                {c.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="px-1 text-xs text-white/40">
          {meta.desc}
          {showCheatNote && " · 5병/h 초과 제외"}
        </p>
        {supportsMine && isSupabaseConfigured && (
          <button
            onClick={() => setShowMine((v) => !v)}
            className="flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition"
            style={{
              borderColor: showMine ? "#00e0ff" : "rgba(255,255,255,0.15)",
              background: showMine ? "rgba(0,224,255,0.12)" : "transparent",
              color: showMine ? "#00e0ff" : "rgba(255,255,255,0.6)",
            }}
          >
            <Crosshair size={13} /> 내 순위
          </button>
        )}
      </div>

      {/* 내 순위 요약 */}
      {showMine && supportsMine && (
        <MyRankCard nickname={nickname} rank={myRank} value={myValue} />
      )}

      {!isSupabaseConfigured ? (
        <NoticeCard />
      ) : loading ? (
        <SkeletonList />
      ) : items.length === 0 ? (
        <EmptyRank />
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((it) => (
            <RankRow
              key={`${it.name}-${it.rank}`}
              item={it}
              highlight={showMine && it.isMine}
              rowRef={showMine && it.isMine ? mineRef : undefined}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function MyRankCard({
  nickname,
  rank,
  value,
}: {
  nickname: string;
  rank: number | null;
  value: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-2xl border border-booze-neon/40 bg-booze-neon/10 px-4 py-3"
    >
      <Crosshair size={18} className="text-booze-neon" />
      {rank ? (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-booze-neon">
              {nickname} (나)
            </p>
            <p className="text-[11px] text-white/50">{value}</p>
          </div>
          <p className="tabular text-2xl font-black text-booze-neon">
            {rank}
            <span className="text-sm text-white/40">위</span>
          </p>
        </>
      ) : (
        <p className="text-sm text-white/60">
          아직 <b className="text-booze-neon">{nickname}</b> 의 기록이 없어요 —
          레이스를 완주해 순위에 이름을 올려보세요 🏁
        </p>
      )}
    </motion.div>
  );
}

function RankRow({
  item,
  highlight,
  rowRef,
}: {
  item: Item;
  highlight?: boolean;
  rowRef?: React.Ref<HTMLLIElement>;
}) {
  const medal = ["🥇", "🥈", "🥉"][item.rank - 1];
  return (
    <motion.li
      ref={rowRef}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(item.rank, 10) * 0.03 }}
      className="flex items-center gap-3 rounded-2xl border px-4 py-3"
      style={{
        borderColor: highlight ? "#00e0ff" : "rgba(255,255,255,0.1)",
        background: highlight ? "rgba(0,224,255,0.08)" : "rgba(21,21,31,0.6)",
      }}
    >
      <span className="w-6 text-center text-lg font-black text-white/50">
        {medal ?? item.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">
          {item.name}
          {item.isMine && <span className="text-booze-neon"> (나)</span>}
        </p>
        {item.sub && (
          <p className="truncate text-[11px] text-white/40">{item.sub}</p>
        )}
      </div>
      <span className="tabular text-right font-black text-booze-gold">
        {item.value}
      </span>
    </motion.li>
  );
}

function NoticeCard() {
  return (
    <div className="rounded-3xl border border-booze-gold/30 bg-booze-gold/10 p-6 text-center text-sm text-booze-gold">
      ⚙️ Supabase를 연결하면 전국 랭킹이 켜져요.
      <br />
      <span className="text-booze-gold/70">
        내 개인 기록은 <b>내 기록</b> 탭에서 볼 수 있어요.
      </span>
    </div>
  );
}

function EmptyRank() {
  return (
    <div className="rounded-3xl border border-white/10 bg-booze-card/60 p-8 text-center text-sm text-white/40">
      아직 기록이 없어요. 첫 부스터의 주인공이 되어보세요 🏁
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-2xl border border-white/10 bg-white/5"
        />
      ))}
    </div>
  );
}
