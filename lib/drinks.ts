// 주종 정의 — 각 주종마다 1회 클릭 기준 잔, 1병/세트당 잔 수, 소주 환산 가중치가 다르다.
// 속도(km/h)는 모든 주종을 "소주 환산 잔"으로 합산해 계산한다. (소주 1잔 = 가중치 1.0 기준)

export interface DrinkDef {
  key: string;
  emoji: string;
  /** 1회 클릭 기준 잔 (예: 소주잔 50ml) */
  unit: string;
  /** 1병/세트당 잔 수 (예: 소주 7잔 = 1병) */
  perBottle: number;
  /** 병/세트 단위 라벨 */
  bottleLabel: string;
  /** 소주 환산 가중치 (1잔당) */
  weight: number;
  /** 잔 채움 색상 */
  color: string;
}

export const DEFAULT_DRINK = "소주";

export const DRINKS: DrinkDef[] = [
  {
    key: "소주",
    emoji: "🍶",
    unit: "소주잔 (50ml)",
    perBottle: 7,
    bottleLabel: "병",
    weight: 1.0,
    color: "#00e0ff",
  },
  {
    key: "소맥",
    emoji: "💣",
    unit: "소맥잔 (150ml)",
    perBottle: 5,
    bottleLabel: "세트",
    weight: 1.3,
    color: "#ffb347",
  },
  {
    key: "맥주",
    emoji: "🍺",
    unit: "500cc 잔/캔",
    perBottle: 2, // 2잔 = 1,000cc
    bottleLabel: "세트(1L)",
    weight: 3.5,
    color: "#ffd166",
  },
  {
    key: "막걸리",
    emoji: "🥛",
    unit: "막걸리 사발 (150ml)",
    perBottle: 5,
    bottleLabel: "병",
    weight: 1.0,
    color: "#e8e8ef",
  },
];

const DRINK_MAP: Record<string, DrinkDef> = Object.fromEntries(
  DRINKS.map((d) => [d.key, d])
);

export function getDrink(key: string): DrinkDef {
  return DRINK_MAP[key] ?? DRINKS[0];
}

/** counts(주종별 잔 수) → 총 잔 수 */
export function totalGlasses(counts: Record<string, number>): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

/** counts → 소주 환산 잔 수 (가중치 합산) */
export function sojuEquivGlasses(counts: Record<string, number>): number {
  return Object.entries(counts).reduce(
    (sum, [key, n]) => sum + n * getDrink(key).weight,
    0
  );
}
