"use client";

import { Car, Swords, Trophy, User } from "lucide-react";

export type Tab = "race" | "battle" | "ranking" | "mine";

const TABS: { key: Tab; label: string; icon: typeof Car }[] = [
  { key: "race", label: "레이스", icon: Car },
  { key: "battle", label: "원격 대결", icon: Swords },
  { key: "ranking", label: "전국 랭킹", icon: Trophy },
  { key: "mine", label: "내 기록", icon: User },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20">
      <div className="mx-auto flex max-w-md items-stretch gap-1 border-t border-white/10 bg-booze-bg/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        {TABS.map(({ key, label, icon: Icon }) => {
          const on = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition"
              style={{ color: on ? "#ff4d4d" : "rgba(255,255,255,0.45)" }}
            >
              <Icon size={20} strokeWidth={on ? 2.6 : 2} />
              <span className="text-[11px] font-bold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
