// Boozy 데이터 모델 (PRD §4)

export interface Room {
  id: string; // UUID
  room_code: string; // 6자리 코드 (예: BOOZ01)
  title: string;
  created_at: string;
  is_active: boolean;
}

export interface Participant {
  id: string; // UUID
  room_id: string;
  nickname: string;
  drinks_count: number; // 총 마신 잔 수 (주종 무관 합산)
  soju_equiv: number; // 소주 환산 잔 수 (가중치 합산) — 시속 계산 기준
  start_time: string | null; // 첫 잔 시각 (ISO) — null이면 아직 시작 전
  last_updated: string; // 마지막 잔/동기화 시각 (ISO)
  is_retired: boolean; // 피니시(기록 고정) 여부
  current_speed: number; // 스냅샷 시속 (참고용)
}
