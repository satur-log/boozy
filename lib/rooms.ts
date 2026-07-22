"use client";

import { getSupabase } from "./supabase";
import { Participant, Room } from "./types";

/** 6자리 코드 생성 (헷갈리는 0/O/1/I 제외) */
function genRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export interface Session {
  room: Room;
  participant: Participant;
}

/** 방 생성 + 방장 참가자 등록 */
export async function createRoom(
  title: string,
  nickname: string
): Promise<Session> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase 미설정");

  // 코드 중복 방지: 최대 5회 재시도
  let room: Room | null = null;
  for (let attempt = 0; attempt < 5 && !room; attempt++) {
    const code = genRoomCode();
    const { data, error } = await sb
      .from("rooms")
      .insert({ room_code: code, title: title || "이름 없는 술자리" })
      .select()
      .single();
    if (!error && data) room = data as Room;
    else if (error && error.code !== "23505") throw error; // 23505 = unique 충돌 → 재시도
  }
  if (!room) throw new Error("방 코드 생성 실패, 다시 시도해주세요");

  const participant = await insertParticipant(room.id, nickname);
  return { room, participant };
}

/** 코드로 방 입장 */
export async function joinRoom(
  code: string,
  nickname: string
): Promise<Session> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase 미설정");

  const { data: room, error } = await sb
    .from("rooms")
    .select()
    .eq("room_code", code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!room) throw new Error("존재하지 않거나 종료된 방이에요");

  const participant = await insertParticipant((room as Room).id, nickname);
  return { room: room as Room, participant };
}

/** 코드로 방 정보만 조회 (배틀 상대 방 연결용, 참가자 추가 없음) */
export async function findRoomByCode(code: string): Promise<Room | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from("rooms")
    .select()
    .eq("room_code", code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();
  return (data as Room) ?? null;
}

async function insertParticipant(
  roomId: string,
  nickname: string
): Promise<Participant> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase 미설정");

  const { data, error } = await sb
    .from("participants")
    .insert({ room_id: roomId, nickname: nickname || "익명의 레이서" })
    .select()
    .single();
  if (error) throw error;
  return data as Participant;
}

/** 내 진행상황을 방에 동기화 (잔 마실 때마다 호출) */
export async function syncParticipant(params: {
  participantId: string;
  drinks: number; // 총 잔 수
  sojuEquiv: number; // 소주 환산 잔 수
  startTime: number | null;
  speed: number;
}): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  await sb
    .from("participants")
    .update({
      drinks_count: params.drinks,
      soju_equiv: Number(params.sojuEquiv.toFixed(2)),
      start_time: params.startTime
        ? new Date(params.startTime).toISOString()
        : null,
      last_updated: new Date().toISOString(),
      current_speed: Number(params.speed.toFixed(2)),
    })
    .eq("id", params.participantId);
}

/** 피니시(기록 고정) */
export async function finishParticipant(params: {
  participantId: string;
  speed: number;
}): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  await sb
    .from("participants")
    .update({
      is_retired: true,
      current_speed: Number(params.speed.toFixed(2)),
      last_updated: new Date().toISOString(),
    })
    .eq("id", params.participantId);
}

/** 방 나갈 때 내 참가자 row 삭제 */
export async function leaveParticipant(participantId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("participants").delete().eq("id", participantId);
}
