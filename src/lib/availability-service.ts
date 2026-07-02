// 空檔引擎的 DB 接線層
import { db } from "./db";
import { computeSlots, isSlotAvailable, type BusyInput, type DaySlots } from "./availability";
import { BOOKING_STATUS, BOOKING_WINDOW_DAYS } from "./constants";
import { nowMinutesTaipei, todayTaipei } from "./taipei-time";

const ACTIVE_STATUSES = [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.CONFIRMED];

async function loadInputs(memberId: number, extraBusyOf?: number) {
  const ids = extraBusyOf ? [memberId, extraBusyOf] : [memberId];
  const [patterns, overrides, bookings] = await Promise.all([
    db.availabilityPattern.findMany({ where: { memberId } }),
    db.availabilityOverride.findMany({ where: { memberId } }),
    db.booking.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        OR: [{ requesterId: { in: ids } }, { recipientId: { in: ids } }],
      },
      select: { date: true, startMin: true, durationMin: true },
    }),
  ]);
  const busy: BusyInput[] = bookings;
  return { patterns, overrides, busy };
}

/**
 * 成員的可約時段（未來 BOOKING_WINDOW_DAYS 天）。
 * @param viewerId 給定時，同時排除瀏覽者自己已占用的時間（雙方都有空才可約）
 */
export async function slotsForMember(memberId: number, viewerId?: number): Promise<DaySlots[]> {
  const { patterns, overrides, busy } = await loadInputs(
    memberId,
    viewerId !== memberId ? viewerId : undefined,
  );
  return computeSlots(patterns, overrides, busy, todayTaipei(), BOOKING_WINDOW_DAYS, nowMinutesTaipei());
}

/** 預約成立前的最終檢查（雙方時間都要可用） */
export async function slotStillAvailable(
  memberId: number,
  counterpartId: number,
  date: string,
  startMin: number,
): Promise<boolean> {
  const { patterns, overrides, busy } = await loadInputs(memberId, counterpartId);
  return isSlotAvailable(patterns, overrides, busy, date, startMin, todayTaipei(), nowMinutesTaipei());
}
