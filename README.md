# Boozy 🏎️ — 실시간 음주 레이싱 (Phase 1 + 2)

소주잔을 누르며 음주 속도(km/h)를 측정하는 밈 기반 멀티플레이 웹 앱.

## Phase 1 — 1인 카운터 & 속도 측정 ✅

- 닉네임 + 주종 선택 온보딩 (비회원, LocalStorage 보존)
- 소주 잔 클릭 애니메이션 (붓기 모션 + 채워지는 잔)
- 잔/병 카운팅 (7잔 = 1병) + 병 완성 축포 연출
- 첫 잔 클릭 시 타이머 자동 시작
- 실시간 시속(km/h) = (총 잔 / 7) ÷ 경과 시간(h)
- 부스터 뱃지 (🐢 에코 / 🏎️ 부스터 / 🚀 질주 / 🔥 과열)
- 연타 방지 3초 쿨타임
- 주작 방지 (4.0km/h 초과 시 랭킹 제외 경고)
- **🏁 피니시 (기록 저장)** — 긍정적 종료. 안 눌러도 시속은 계속 기록됨

## Phase 2 — Supabase Realtime 멀티플레이 ✅

- 로비: **방 만들기 / 코드로 입장 / 혼자 달리기**
- 6자리 초대 코드 + **QR 코드** 자동 생성 (링크 복사 포함)
- `?room=CODE` 링크/QR로 접속 시 입장 화면 자동 오픈
- **실시간 라이브 리더보드** (Supabase Realtime) — 방원 순위·음주량·시속이 1초 단위로 갱신
- 각 참가자 시속은 서버 스냅샷이 아니라 클라이언트에서 실시간 재계산

> **Supabase 미설정 시** 앱은 자동으로 "혼자 달리기(솔로)" 모드로만 동작합니다.

## Phase 3 — 원격 대결 & 전국 랭킹 ✅

- **3-Tab 네비게이션**: 🏎️ 레이스 / ⚔️ 원격 대결 / 🏆 전국 랭킹
- **원격 대결(Battle)**: 상대 방 코드를 입력해 두 방을 연결 → 팀 평균 시속 VS 스코어보드 + 양 팀 실시간 명단
- **명예의 전당 4종** (주작 4.0km/h↑ 자동 제외):
  - 🏎️ 전국 부스터왕 (24h 최고 시속)
  - 🐘 전국 하마왕 (한 세션 최다 음주량)
  - 🍺 알콜 침식상 (완주 횟수 — LocalStorage 기반)
  - 🏆 전설의 크루 (방 평균 시속 1위)

## Phase 4 — 결과 공유 & 폴리싱 ✅

- **부스터 결과 카드** — 칭호(예: "새벽 2시의 부스터 레이서") + 최종 시속·시간·환산량·주종별 내역
- **이미지 저장** (html2canvas → PNG) · **공유** (Web Share API, 이미지 우선 → 링크 복사 폴백)
- **카카오톡 공유** (`NEXT_PUBLIC_KAKAO_JS_KEY` 있으면 SDK, 없으면 폴백)
- **효과음** (WebAudio 합성 — 꿀꺽/뻥/팡파레) + 🔊 뮤트 토글
- 연타 방지 3초 쿨타임 · 주작 속도 경고

> 남은 것: 실 Supabase/카카오 키 연결 후 멀티·공유 실전 검증.

## 실행

```bash
cd Projects/Boozy
npm install
npm run dev
# http://localhost:3000
```

## 멀티플레이 켜기 (Supabase)

1. [supabase.com](https://supabase.com) 에서 프로젝트 생성
2. **SQL Editor** 에 [`supabase/schema.sql`](supabase/schema.sql) 붙여넣고 실행 (테이블 + Realtime + RLS)
3. `.env.local.example` → `.env.local` 로 복사 후 프로젝트 URL·anon key 입력
4. `npm run dev` 재시작 → 로비에 "방 만들기 / 입장" 활성화

## 구조

| 파일 | 역할 |
| --- | --- |
| `lib/booster.ts` | 시속·부스터 등급·주작 판정·칭호·`liveSpeed` 등 **핵심 계산 로직** |
| `lib/useRaceStore.ts` | Zustand 상태 (LocalStorage persist) — 프로필·방 세션·레이스·쿨타임 |
| `lib/useElapsed.ts` | 경과 시간 틱 훅 (피니시 시 freeze) |
| `lib/drinks.ts` | 주종 정의 (잔 기준·병 단위·소주 환산 가중치) |
| `lib/supabase.ts` | Supabase 클라이언트 (env 없으면 null → 솔로 폴백) |
| `lib/rooms.ts` | 방 생성/입장/동기화/피니시/나가기/코드조회 헬퍼 |
| `lib/rankings.ts` | 전국 랭킹 4종 집계 |
| `lib/localStats.ts` | 알콜 침식상 (LocalStorage 누적) |
| `lib/sound.ts` | WebAudio 효과음 합성 |
| `lib/share.ts` | html2canvas 캡처 · Web Share · 카카오 공유 |
| `components/BoozyApp.tsx` | 앱 셸 (온보딩 게이트 + 3탭 + 하단 네비) |
| `components/RaceDashboard.tsx` | 레이스 탭 (로비 → 레이스 → 결과카드) |
| `components/BattleTab.tsx` | 원격 대결 (방대방 VS 스코어보드) |
| `components/RankingTab.tsx` | 전국 랭킹 (명예의 전당 4종) |
| `components/Leaderboard.tsx` / `InviteCard.tsx` | 실시간 리더보드 / 초대 QR |
| `components/SojuGlass.tsx` · `SpeedGauge.tsx` · `BoosterBadge.tsx` | 잔·게이지·뱃지 |

## Tech

Next.js 14 (App Router) · Tailwind CSS · Framer Motion · Zustand · Lucide React
· Supabase (Realtime) · qrcode.react · html2canvas · Web Audio API
