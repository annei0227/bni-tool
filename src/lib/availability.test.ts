import { describe, expect, it } from "vitest";
import { computeSlots, isSlotAvailable } from "./availability";

// 2026-07-06 是週一
const MON = "2026-07-06";
const FROM = "2026-07-05"; // 週日

const pat = (weekday: number, startMin: number, endMin: number) => ({ weekday, startMin, endMin });

describe("computeSlots：固定模式", () => {
  it("週一 10:00–12:00 → 兩個時段", () => {
    const r = computeSlots([pat(1, 600, 720)], [], [], FROM, 7);
    expect(r).toEqual([{ date: MON, slots: [600, 660] }]);
  });

  it("非整點區間從起點切齊，不足 60 分不成段", () => {
    // 14:30–16:00 → 14:30 一段（15:30–16:30 超出）
    const r = computeSlots([pat(1, 870, 960)], [], [], FROM, 7);
    expect(r).toEqual([{ date: MON, slots: [870] }]);
  });

  it("重疊的固定模式不產生重複時段", () => {
    const r = computeSlots([pat(1, 600, 720), pat(1, 600, 780)], [], [], FROM, 7);
    expect(r[0].slots).toEqual([600, 660, 720]);
  });

  it("endMin <= startMin 的髒資料被忽略", () => {
    const r = computeSlots([pat(1, 720, 720), pat(1, 800, 700)], [], [], FROM, 7);
    expect(r).toEqual([]);
  });
});

describe("computeSlots：一次性加開與挖除", () => {
  it("加開只影響該日", () => {
    const r = computeSlots(
      [],
      [{ date: MON, type: "extra", startMin: 540, endMin: 660 }],
      [],
      FROM,
      7,
    );
    expect(r).toEqual([{ date: MON, slots: [540, 600] }]);
  });

  it("整天挖除：固定模式與加開都不生效", () => {
    const r = computeSlots(
      [pat(1, 600, 720)],
      [
        { date: MON, type: "block", startMin: null, endMin: null },
        { date: MON, type: "extra", startMin: 900, endMin: 960 },
      ],
      [],
      FROM,
      7,
    );
    expect(r).toEqual([]);
  });

  it("區段挖除：只挖掉重疊部分", () => {
    // 固定 10:00–13:00，挖 11:00–12:00 → 剩 10:00、12:00
    const r = computeSlots(
      [pat(1, 600, 780)],
      [{ date: MON, type: "block", startMin: 660, endMin: 720 }],
      [],
      FROM,
      7,
    );
    expect(r[0].slots).toEqual([600, 720]);
  });

  it("區段挖除造成的殘段不足 60 分不成段", () => {
    // 固定 10:00–12:00，挖 10:30–11:00 → 殘段 10:00–10:30 與 11:00–12:00 → 只有 11:00
    const r = computeSlots(
      [pat(1, 600, 720)],
      [{ date: MON, type: "block", startMin: 630, endMin: 660 }],
      [],
      FROM,
      7,
    );
    expect(r[0].slots).toEqual([660]);
  });
});

describe("computeSlots：占用排除", () => {
  it("已占用時段被排除（含部分重疊）", () => {
    const r = computeSlots(
      [pat(1, 600, 780)], // 10:00,11:00,12:00
      [],
      [{ date: MON, startMin: 630, durationMin: 60 }], // 10:30–11:30 壓到前兩段
      FROM,
      7,
    );
    expect(r[0].slots).toEqual([720]);
  });

  it("不同日期的占用互不影響", () => {
    const r = computeSlots(
      [pat(1, 600, 660)],
      [],
      [{ date: "2026-07-13", startMin: 600, durationMin: 60 }],
      FROM,
      7,
    );
    expect(r).toEqual([{ date: MON, slots: [600] }]);
  });
});

describe("computeSlots：今日過去時間過濾", () => {
  it("date === fromDate 時，早於 minStartMin 的時段被過濾", () => {
    const r = computeSlots([pat(0, 540, 780)], [], [], FROM, 1, 600); // 週日 9:00–13:00，現在 10:00
    expect(r).toEqual([{ date: FROM, slots: [600, 660, 720] }]);
  });

  it("其他日期不受 minStartMin 影響", () => {
    const r = computeSlots([pat(1, 540, 660)], [], [], FROM, 7, 9999);
    expect(r).toEqual([{ date: MON, slots: [540, 600] }]);
  });
});

describe("isSlotAvailable", () => {
  const patterns = [pat(1, 600, 720)];
  it("可約時段回傳 true", () => {
    expect(isSlotAvailable(patterns, [], [], MON, 600, FROM)).toBe(true);
  });
  it("被占用回傳 false", () => {
    expect(
      isSlotAvailable(patterns, [], [{ date: MON, startMin: 600, durationMin: 60 }], MON, 600, FROM),
    ).toBe(false);
  });
  it("不存在的時段回傳 false", () => {
    expect(isSlotAvailable(patterns, [], [], MON, 630, FROM)).toBe(false);
  });
});
