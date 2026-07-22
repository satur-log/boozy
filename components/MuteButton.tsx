"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useRaceStore } from "@/lib/useRaceStore";

export default function MuteButton() {
  const muted = useRaceStore((s) => s.muted);
  const toggleMute = useRaceStore((s) => s.toggleMute);
  return (
    <button
      onClick={toggleMute}
      aria-label={muted ? "소리 켜기" : "음소거"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:bg-white/5"
    >
      {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
    </button>
  );
}
