"use client";

import { useEffect, useState } from "react";
import { useRaceStore } from "@/lib/useRaceStore";
import { track } from "@/lib/analytics";
import Onboarding from "./Onboarding";
import BottomNav, { Tab } from "./BottomNav";
import RaceDashboard from "./RaceDashboard";
import BattleTab from "./BattleTab";
import RankingTab from "./RankingTab";
import MyRecordTab from "./MyRecordTab";

export default function BoozyApp() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("race");
  const nickname = useRaceStore((s) => s.nickname);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-white/40">
        로딩 중…
      </div>
    );
  }

  if (!nickname) return <Onboarding />;

  return (
    <>
      <div className="mx-auto w-full max-w-md px-5 pb-28 pt-6">
        {tab === "race" && <RaceDashboard />}
        {tab === "battle" && <BattleTab onGoRace={() => setTab("race")} />}
        {tab === "ranking" && <RankingTab />}
        {tab === "mine" && <MyRecordTab />}
      </div>
      <BottomNav
        active={tab}
        onChange={(t) => {
          track("tab_view", { tab: t });
          setTab(t);
        }}
      />
    </>
  );
}
