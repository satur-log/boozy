"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";
import { Participant } from "./types";

/**
 * 방 참가자들을 실시간으로 구독.
 * - 최초 1회 전체 fetch
 * - participants 테이블 변경(postgres_changes) 발생 시 재조회
 */
export function useRoomLeaderboard(roomId: string | null): {
  participants: Participant[];
  loading: boolean;
} {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !roomId) {
      setLoading(false);
      return;
    }

    let alive = true;

    const fetchAll = async () => {
      const { data } = await sb
        .from("participants")
        .select()
        .eq("room_id", roomId);
      if (alive && data) setParticipants(data as Participant[]);
      if (alive) setLoading(false);
    };

    fetchAll();

    const channel = sb
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `room_id=eq.${roomId}`,
        },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      alive = false;
      sb.removeChannel(channel);
    };
  }, [roomId]);

  return { participants, loading };
}
