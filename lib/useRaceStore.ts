"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { COOLDOWN_MS } from "./booster";
import { DEFAULT_DRINK } from "./drinks";

export type RaceMode = "none" | "solo" | "multi";

interface RaceState {
  nickname: string;
  selectedTypes: string[]; // 선택한 주종들 (기본: 소주)
  currentType: string; // 지금 마시는 주종 (다음 클릭 대상)

  // 방 세션 (multi 모드)
  mode: RaceMode;
  roomId: string | null;
  roomCode: string | null;
  participantId: string | null;

  // 내 레이스 상태
  counts: Record<string, number>; // 주종별 마신 잔 수
  startTime: number | null; // 첫 잔 시각 (ms epoch)
  lastDrinkAt: number | null; // 마지막 잔 (쿨타임용)
  isFinished: boolean; // 피니시(기록 고정) 여부

  muted: boolean; // 효과음 음소거

  setProfile: (nickname: string) => void;
  toggleMute: () => void;
  setCurrentType: (type: string) => void;
  addDrinkType: (type: string) => void;
  removeDrinkType: (type: string) => void;
  startSolo: () => void;
  enterRoom: (p: {
    roomId: string;
    roomCode: string;
    participantId: string;
  }) => void;

  /** 현재 주종 +1잔. 쿨타임/피니시면 false */
  drink: () => boolean;
  finish: () => void;
  leaveRoom: () => void;
  resetAll: () => void;
}

const freshRace = {
  counts: {} as Record<string, number>,
  startTime: null,
  lastDrinkAt: null,
  isFinished: false,
};

export const useRaceStore = create<RaceState>()(
  persist(
    (set, get) => ({
      nickname: "",
      selectedTypes: [DEFAULT_DRINK],
      currentType: DEFAULT_DRINK,
      mode: "none",
      roomId: null,
      roomCode: null,
      participantId: null,
      muted: false,
      ...freshRace,

      setProfile: (nickname) => set({ nickname }),
      toggleMute: () => set({ muted: !get().muted }),

      setCurrentType: (type) => set({ currentType: type }),

      addDrinkType: (type) => {
        const { selectedTypes } = get();
        if (selectedTypes.includes(type)) {
          set({ currentType: type });
          return;
        }
        set({ selectedTypes: [...selectedTypes, type], currentType: type });
      },

      removeDrinkType: (type) => {
        if (type === DEFAULT_DRINK) return; // 소주는 항상 유지
        const { selectedTypes, currentType, counts } = get();
        if ((counts[type] ?? 0) > 0) return; // 마신 기록 있으면 삭제 불가
        const next = selectedTypes.filter((t) => t !== type);
        set({
          selectedTypes: next,
          currentType: currentType === type ? DEFAULT_DRINK : currentType,
        });
      },

      // 새 레이스는 항상 소주 기본으로 시작
      startSolo: () =>
        set({
          mode: "solo",
          selectedTypes: [DEFAULT_DRINK],
          currentType: DEFAULT_DRINK,
          ...freshRace,
        }),

      enterRoom: ({ roomId, roomCode, participantId }) =>
        set({
          mode: "multi",
          roomId,
          roomCode,
          participantId,
          selectedTypes: [DEFAULT_DRINK],
          currentType: DEFAULT_DRINK,
          ...freshRace,
        }),

      drink: () => {
        const { isFinished, lastDrinkAt, startTime, counts, currentType } =
          get();
        if (isFinished) return false;

        const now = Date.now();
        if (lastDrinkAt && now - lastDrinkAt < COOLDOWN_MS) return false;

        set({
          counts: { ...counts, [currentType]: (counts[currentType] ?? 0) + 1 },
          startTime: startTime ?? now, // 첫 잔에 타이머 시작
          lastDrinkAt: now,
        });
        return true;
      },

      finish: () => set({ isFinished: true }),

      leaveRoom: () =>
        set({
          mode: "none",
          roomId: null,
          roomCode: null,
          participantId: null,
          ...freshRace,
        }),

      resetAll: () =>
        set({
          mode: "none",
          roomId: null,
          roomCode: null,
          participantId: null,
          ...freshRace,
        }),
    }),
    { name: "boozy-race-v2" }
  )
);
