// PALMS 紅綠燈計分（參考 BNI Power of One 六項制，門檻可調）
// ⚠️ 以下門檻為業界慣例的預設值，需與富禮分會實際採用的中心區規則核對後調整 THRESHOLDS

export interface PalmsStatLike {
  absences: number;
  referralsOut: number;
  visitors: number;
  oneToOnes: number;
  ceu: number;
  tyfcb: number; // 萬
}

export interface ComponentScore {
  key: string;
  label: string;
  score: number;
  max: number;
  perWeek?: number; // 換算後的每週值（顯示用）
}

export interface LightResult {
  total: number;
  max: number;
  light: "green" | "yellow" | "red" | "gray";
  components: ComponentScore[];
  /** 補救建議：把哪一項提升一級即可轉綠 */
  remedies: { key: string; label: string; gain: number; hint: string }[];
}

/** 各項分級門檻：[門檻, 得分] 由高到低。per-week 值（出席率、TYFCB 除外） */
export const THRESHOLDS = {
  attendance: {
    label: "出席",
    max: 20,
    // 出席率（1 - 缺席/週數）
    tiers: [
      [0.99, 20],
      [0.95, 15],
      [0.9, 10],
      [0.85, 5],
    ] as [number, number][],
  },
  referrals: {
    label: "引薦",
    max: 20,
    tiers: [
      [1.5, 20],
      [1.0, 15],
      [0.5, 10],
      [0.25, 5],
    ] as [number, number][],
    hint: "多遞引薦單",
  },
  oneToOnes: {
    label: "一對一",
    max: 20,
    tiers: [
      [1.0, 20],
      [0.75, 15],
      [0.5, 10],
      [0.25, 5],
    ] as [number, number][],
    hint: "約一場一對一",
  },
  ceu: {
    label: "培訓",
    max: 20,
    tiers: [
      [1.0, 20],
      [0.75, 15],
      [0.5, 10],
      [0.25, 5],
    ] as [number, number][],
    hint: "參加培訓/聽 CEU",
  },
  visitors: {
    label: "來賓",
    max: 20,
    // 期間累計人數
    tiers: [
      [4, 20],
      [2, 15],
      [1, 10],
    ] as [number, number][],
    hint: "邀請來賓",
  },
  tyfcb: {
    label: "業績",
    max: 20,
    // 期間累計金額（萬）
    tiers: [
      [100, 20],
      [50, 15],
      [20, 10],
      [5, 5],
    ] as [number, number][],
    hint: "回報感謝金額",
  },
} as const;

export const LIGHT_CUTOFF = { green: 70, yellow: 40 } as const;
/** 新成員資料週數低於此值 → 灰燈（觀察期） */
export const GRAY_MIN_WEEKS = 4;

function tierScore(tiers: readonly [number, number][], value: number): number {
  for (const [t, s] of tiers) if (value >= t) return s;
  return 0;
}

/** 下一級還差多少分（已滿級回傳 0） */
function nextTierGain(tiers: readonly [number, number][], value: number): number {
  const cur = tierScore(tiers, value);
  const higher = tiers.filter(([, s]) => s > cur).map(([, s]) => s);
  return higher.length ? Math.min(...higher) - cur : 0;
}

export function scorePalms(stat: PalmsStatLike, weekCount: number): LightResult {
  if (weekCount < GRAY_MIN_WEEKS) {
    return { total: 0, max: 120, light: "gray", components: [], remedies: [] };
  }
  const attendanceRate = Math.max(0, (weekCount - stat.absences) / weekCount);
  const per = (n: number) => n / weekCount;

  const comps: ComponentScore[] = [
    { key: "attendance", label: "出席", max: 20, score: tierScore(THRESHOLDS.attendance.tiers, attendanceRate) },
    { key: "referrals", label: "引薦", max: 20, score: tierScore(THRESHOLDS.referrals.tiers, per(stat.referralsOut)), perWeek: per(stat.referralsOut) },
    { key: "oneToOnes", label: "一對一", max: 20, score: tierScore(THRESHOLDS.oneToOnes.tiers, per(stat.oneToOnes)), perWeek: per(stat.oneToOnes) },
    { key: "ceu", label: "培訓", max: 20, score: tierScore(THRESHOLDS.ceu.tiers, per(stat.ceu)), perWeek: per(stat.ceu) },
    { key: "visitors", label: "來賓", max: 20, score: tierScore(THRESHOLDS.visitors.tiers, stat.visitors) },
    { key: "tyfcb", label: "業績", max: 20, score: tierScore(THRESHOLDS.tyfcb.tiers, stat.tyfcb) },
  ];
  const total = comps.reduce((a, c) => a + c.score, 0);
  const light = total >= LIGHT_CUTOFF.green ? "green" : total >= LIGHT_CUTOFF.yellow ? "yellow" : "red";

  // 補救建議：非綠燈時，找出「提升一級就能跨過綠燈線」的項目
  const remedies: LightResult["remedies"] = [];
  if (light !== "green") {
    const gap = LIGHT_CUTOFF.green - total;
    const candidates: { key: keyof typeof THRESHOLDS; value: number }[] = [
      { key: "oneToOnes", value: per(stat.oneToOnes) },
      { key: "referrals", value: per(stat.referralsOut) },
      { key: "ceu", value: per(stat.ceu) },
      { key: "visitors", value: stat.visitors },
      { key: "tyfcb", value: stat.tyfcb },
    ];
    for (const c of candidates) {
      const def = THRESHOLDS[c.key];
      const gain = nextTierGain(def.tiers, c.value);
      if (gain >= gap && gain > 0) {
        remedies.push({ key: c.key, label: def.label, gain, hint: "hint" in def ? def.hint : "" });
      }
    }
  }
  return { total, max: 120, light, components: comps, remedies };
}
