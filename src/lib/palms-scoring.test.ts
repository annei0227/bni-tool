import { describe, expect, it } from "vitest";
import { scorePalms } from "./palms-scoring";

const base = { absences: 0, referralsOut: 0, visitors: 0, oneToOnes: 0, ceu: 0, tyfcb: 0 };

describe("scorePalms", () => {
  it("全滿 → 120 分綠燈", () => {
    const r = scorePalms(
      { absences: 0, referralsOut: 40, visitors: 5, oneToOnes: 25, ceu: 25, tyfcb: 150 },
      20,
    );
    expect(r.total).toBe(120);
    expect(r.light).toBe("green");
    expect(r.remedies).toEqual([]);
  });

  it("全零 → 出席 20 分紅燈", () => {
    const r = scorePalms(base, 20);
    expect(r.total).toBe(20);
    expect(r.light).toBe("red");
  });

  it("週數不足 → 灰燈（觀察期）", () => {
    const r = scorePalms(base, 2);
    expect(r.light).toBe("gray");
  });

  it("黃燈區間", () => {
    // 出席20 + 引薦(0.5/wk→10) + 一對一(0.5/wk→10) = 40 → yellow
    const r = scorePalms({ ...base, referralsOut: 10, oneToOnes: 10 }, 20);
    expect(r.total).toBe(40);
    expect(r.light).toBe("yellow");
  });

  it("差一級就轉綠時給出補救建議", () => {
    // 出席20 引薦20(2/wk) 培訓15(0.8/wk) 一對一10(0.5/wk) 來賓0 業績0 = 65，差 5
    const r = scorePalms({ ...base, referralsOut: 40, ceu: 16, oneToOnes: 10 }, 20);
    expect(r.total).toBe(65);
    expect(r.light).toBe("yellow");
    const keys = r.remedies.map((x) => x.key);
    expect(keys).toContain("oneToOnes"); // 0.5→0.75 得 +5 即轉綠
    expect(keys).toContain("ceu"); // 0.8→1.0 得 +5 即轉綠
  });

  it("缺席影響出席率分級", () => {
    // 20 週缺 2 → 90% → 10 分
    const r = scorePalms({ ...base, absences: 2 }, 20);
    expect(r.components.find((c) => c.key === "attendance")!.score).toBe(10);
  });
});
