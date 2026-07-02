import { describe, expect, it } from "vitest";
import { canAcceptReschedule, canAct, canProposeReschedule, canTransition } from "./booking-rules";

const b = (status: string) => ({ requesterId: 1, recipientId: 2, status });

describe("狀態轉換表", () => {
  it("requested 可到 confirmed/declined/cancelled", () => {
    expect(canTransition("requested", "confirmed")).toBe(true);
    expect(canTransition("requested", "declined")).toBe(true);
    expect(canTransition("requested", "cancelled")).toBe(true);
    expect(canTransition("requested", "completed")).toBe(false);
  });
  it("confirmed 可到 completed/cancelled", () => {
    expect(canTransition("confirmed", "completed")).toBe(true);
    expect(canTransition("confirmed", "cancelled")).toBe(true);
    expect(canTransition("confirmed", "declined")).toBe(false);
  });
  it("終態不可再轉換", () => {
    for (const s of ["declined", "cancelled", "completed"]) {
      for (const t of ["requested", "confirmed", "declined", "cancelled", "completed"]) {
        expect(canTransition(s, t)).toBe(false);
      }
    }
  });
});

describe("動作權限", () => {
  it("只有被約方能確認/婉拒", () => {
    expect(canAct(b("requested"), 2, "confirmed")).toBe(true);
    expect(canAct(b("requested"), 1, "confirmed")).toBe(false);
    expect(canAct(b("requested"), 2, "declined")).toBe(true);
    expect(canAct(b("requested"), 1, "declined")).toBe(false);
  });
  it("requested 只有發起方能收回（cancelled）", () => {
    expect(canAct(b("requested"), 1, "cancelled")).toBe(true);
    expect(canAct(b("requested"), 2, "cancelled")).toBe(false);
  });
  it("confirmed 雙方皆可取消、皆可完成打卡", () => {
    expect(canAct(b("confirmed"), 1, "cancelled")).toBe(true);
    expect(canAct(b("confirmed"), 2, "cancelled")).toBe(true);
    expect(canAct(b("confirmed"), 1, "completed")).toBe(true);
    expect(canAct(b("confirmed"), 2, "completed")).toBe(true);
  });
  it("無關的人什麼都不能做", () => {
    expect(canAct(b("requested"), 99, "confirmed")).toBe(false);
    expect(canAct(b("confirmed"), 99, "cancelled")).toBe(false);
  });
});

describe("改期", () => {
  it("requested/confirmed 雙方皆可提案", () => {
    expect(canProposeReschedule(b("requested"), 1)).toBe(true);
    expect(canProposeReschedule(b("confirmed"), 2)).toBe(true);
    expect(canProposeReschedule(b("completed"), 1)).toBe(false);
    expect(canProposeReschedule(b("confirmed"), 99)).toBe(false);
  });
  it("只有非提案方能接受", () => {
    const bk = { ...b("confirmed"), proposedById: 1 };
    expect(canAcceptReschedule(bk, 2)).toBe(true);
    expect(canAcceptReschedule(bk, 1)).toBe(false);
    expect(canAcceptReschedule({ ...b("confirmed"), proposedById: null }, 2)).toBe(false);
  });
});
