// 空檔計算引擎（純函數，無 DB 依賴）
// 可約時段 = 每週固定模式 ＋ 一次性加開 − 例外挖除 − 已占用預約
// 時段以 SLOT_DURATION_MIN（60 分）為一格，從區間起點切齊

import { OVERRIDE_TYPE, SLOT_DURATION_MIN } from "./constants";
import { addDays, weekdayOf } from "./taipei-time";

export interface PatternInput {
  weekday: number;
  startMin: number;
  endMin: number;
}
export interface OverrideInput {
  date: string;
  type: string; // extra | block
  startMin: number | null;
  endMin: number | null;
}
export interface BusyInput {
  date: string;
  startMin: number;
  durationMin: number;
}

export interface DaySlots {
  date: string;
  slots: number[]; // 各時段的 startMin，升冪
}

interface Range {
  s: number;
  e: number;
}

function subtractRanges(ranges: Range[], cuts: Range[]): Range[] {
  let out = ranges;
  for (const c of cuts) {
    const next: Range[] = [];
    for (const r of out) {
      if (c.e <= r.s || c.s >= r.e) {
        next.push(r);
        continue;
      }
      if (c.s > r.s) next.push({ s: r.s, e: c.s });
      if (c.e < r.e) next.push({ s: c.e, e: r.e });
    }
    out = next;
  }
  return out;
}

/**
 * 計算某成員在 [fromDate, fromDate+days) 的可約時段。
 * @param busy 該成員「占用中」的預約（requested/confirmed 皆算，避免同時段被重複請求）
 * @param minStartMin 當 date === fromDate 時，時段起點需 >= 此值（過濾今天已過去的時間）
 */
export function computeSlots(
  patterns: PatternInput[],
  overrides: OverrideInput[],
  busy: BusyInput[],
  fromDate: string,
  days: number,
  minStartMin = 0,
): DaySlots[] {
  const byDate = new Map<string, OverrideInput[]>();
  for (const o of overrides) {
    const arr = byDate.get(o.date) ?? [];
    arr.push(o);
    byDate.set(o.date, arr);
  }
  const busyByDate = new Map<string, Range[]>();
  for (const b of busy) {
    const arr = busyByDate.get(b.date) ?? [];
    arr.push({ s: b.startMin, e: b.startMin + b.durationMin });
    busyByDate.set(b.date, arr);
  }

  const out: DaySlots[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(fromDate, i);
    const dayOverrides = byDate.get(date) ?? [];

    // 整天挖除 → 該日固定模式不生效，加開也不生效（整天不開放語意）
    const wholeDayBlocked = dayOverrides.some(
      (o) => o.type === OVERRIDE_TYPE.BLOCK && o.startMin == null,
    );
    if (wholeDayBlocked) continue;

    const wd = weekdayOf(date);
    let ranges: Range[] = patterns
      .filter((p) => p.weekday === wd && p.endMin > p.startMin)
      .map((p) => ({ s: p.startMin, e: p.endMin }));

    for (const o of dayOverrides) {
      if (o.type === OVERRIDE_TYPE.EXTRA && o.startMin != null && o.endMin != null) {
        ranges.push({ s: o.startMin, e: o.endMin });
      }
    }

    // 區段挖除
    const cuts: Range[] = dayOverrides
      .filter((o) => o.type === OVERRIDE_TYPE.BLOCK && o.startMin != null && o.endMin != null)
      .map((o) => ({ s: o.startMin!, e: o.endMin! }));
    ranges = subtractRanges(ranges, cuts);

    // 切成 60 分鐘時段（從各區間起點切齊），再排除占用與重複
    const slotSet = new Set<number>();
    for (const r of ranges) {
      for (let s = r.s; s + SLOT_DURATION_MIN <= r.e; s += SLOT_DURATION_MIN) {
        slotSet.add(s);
      }
    }
    const busyRanges = busyByDate.get(date) ?? [];
    const slots = [...slotSet]
      .filter((s) => {
        if (date === fromDate && s < minStartMin) return false;
        return !busyRanges.some((b) => s < b.e && s + SLOT_DURATION_MIN > b.s);
      })
      .sort((a, b) => a - b);

    if (slots.length) out.push({ date, slots });
  }
  return out;
}

/** 檢查單一時段目前是否可約（送出/確認預約前的最終防線） */
export function isSlotAvailable(
  patterns: PatternInput[],
  overrides: OverrideInput[],
  busy: BusyInput[],
  date: string,
  startMin: number,
  fromDate: string,
  minStartMin = 0,
): boolean {
  const days = computeSlots(patterns, overrides, busy, fromDate, 366, minStartMin);
  const day = days.find((d) => d.date === date);
  return !!day && day.slots.includes(startMin);
}
