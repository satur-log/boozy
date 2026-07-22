"use client";

import { getSupabase } from "./supabase";
import { CHEAT_SPEED_LIMIT } from "./booster";

export interface RankParticipant {
  nickname: string;
  drinks_count: number;
  soju_equiv: number;
  current_speed: number;
  room_id: string;
  room_title: string;
}

/**
 * 최근 24시간 내 활동한 참가자 + 방 이름을 가져온다.
 * (부스터왕 / 하마왕 / 전설의 크루 계산에 공통 사용)
 */
export async function fetchRankingData(): Promise<RankParticipant[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await sb
    .from("participants")
    .select(
      "nickname, drinks_count, soju_equiv, current_speed, room_id, rooms(title)"
    )
    .gte("last_updated", since);

  if (error || !data) return [];

  return (data as any[]).map((r) => {
    const rooms = r.rooms;
    const title = Array.isArray(rooms) ? rooms[0]?.title : rooms?.title;
    return {
      nickname: r.nickname,
      drinks_count: r.drinks_count ?? 0,
      soju_equiv: r.soju_equiv ?? 0,
      current_speed: r.current_speed ?? 0,
      room_id: r.room_id,
      room_title: title ?? "이름 없는 술자리",
    };
  });
}

export interface CountRank {
  nickname: string;
  count: number; // 음주 횟수 (세션 수)
  totalDrinks: number; // 누적 총 잔
}

/**
 * 🍺 알콜 침식상 — 닉네임별 "최다 음주 횟수" 전국 집계 (전체 기간).
 * 참가자 row 1건 = 1회 음주 세션으로 계산.
 */
export async function fetchErosionRanking(limit = 10): Promise<CountRank[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("participants")
    .select("nickname, drinks_count")
    .limit(2000);
  if (error || !data) return [];

  const map = new Map<string, { count: number; totalDrinks: number }>();
  for (const r of data as any[]) {
    const e = map.get(r.nickname) ?? { count: 0, totalDrinks: 0 };
    e.count += 1;
    e.totalDrinks += r.drinks_count ?? 0;
    map.set(r.nickname, e);
  }
  return Array.from(map, ([nickname, v]) => ({ nickname, ...v }))
    .sort((a, b) => b.count - a.count || b.totalDrinks - a.totalDrinks)
    .slice(0, limit);
}

/** 🏎️ 전국 부스터왕 — 24h 최고 시속 (주작 4.0km/h↑ 제외) */
export function boosterKings(rows: RankParticipant[], limit = 10) {
  return [...rows]
    .filter((r) => r.current_speed <= CHEAT_SPEED_LIMIT && r.current_speed > 0)
    .sort((a, b) => b.current_speed - a.current_speed)
    .slice(0, limit);
}

/** 🐘 전국 하마왕 — 한 세션 최다 음주량(총 잔) */
export function hippoKings(rows: RankParticipant[], limit = 10) {
  return [...rows]
    .filter((r) => r.drinks_count > 0)
    .sort((a, b) => b.drinks_count - a.drinks_count)
    .slice(0, limit);
}

export interface CrewRank {
  room_id: string;
  room_title: string;
  avgSpeed: number;
  members: number;
}

/** 🏆 전설의 크루 — 방 단위 평균 시속 (주작 제외) */
export function legendCrews(rows: RankParticipant[], limit = 10): CrewRank[] {
  const byRoom = new Map<string, RankParticipant[]>();
  for (const r of rows) {
    if (r.current_speed > CHEAT_SPEED_LIMIT || r.current_speed <= 0) continue;
    const arr = byRoom.get(r.room_id) ?? [];
    arr.push(r);
    byRoom.set(r.room_id, arr);
  }
  const crews: CrewRank[] = [];
  byRoom.forEach((members, room_id) => {
    const avg =
      members.reduce((s, m) => s + m.current_speed, 0) / members.length;
    crews.push({
      room_id,
      room_title: members[0].room_title,
      avgSpeed: avg,
      members: members.length,
    });
  });
  return crews.sort((a, b) => b.avgSpeed - a.avgSpeed).slice(0, limit);
}
