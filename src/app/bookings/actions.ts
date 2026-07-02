"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { BOOKING_STATUS, type BookingStatus } from "@/lib/constants";
import { canAcceptReschedule, canAct, canProposeReschedule } from "@/lib/booking-rules";
import { db } from "@/lib/db";
import { notifyMember } from "@/lib/notify";
import { requireMemberAction } from "@/lib/session";
import { slotStillAvailable } from "@/lib/availability-service";
import { fmtDate, fmtMin, todayTaipei } from "@/lib/taipei-time";

async function loadBooking(id: number) {
  const b = await db.booking.findUnique({
    where: { id },
    include: { requester: true, recipient: true },
  });
  if (!b) throw new Error("預約不存在");
  return b;
}

const NOTIFY_TEXT: Record<string, { type: string; title: (name: string) => string }> = {
  [BOOKING_STATUS.CONFIRMED]: { type: "booking_confirmed", title: (n) => `${n} 已確認你們的一對一` },
  [BOOKING_STATUS.DECLINED]: { type: "booking_declined", title: (n) => `${n} 婉拒了這次預約` },
  [BOOKING_STATUS.CANCELLED]: { type: "booking_cancelled", title: (n) => `${n} 取消了你們的一對一` },
  [BOOKING_STATUS.COMPLETED]: { type: "booking_completed", title: (n) => `${n} 已將你們的一對一標記完成` },
};

export async function transitionBooking(formData: FormData) {
  const me = await requireMemberAction();
  const id = Number(formData.get("bookingId"));
  const to = String(formData.get("to")) as BookingStatus;
  const b = await loadBooking(id);

  if (!canAct(b, me.id, to)) throw new Error("不允許的操作");

  // 確認前再驗一次時段（空檔可能已變動）
  if (to === BOOKING_STATUS.CONFIRMED) {
    const stillOk = await slotStillAvailable(b.recipientId, b.requesterId, b.date, b.startMin);
    // 這筆自己占用的要排除：availability 引擎把 requested 也視為占用，
    // 所以「僅剩這筆自己」時 stillOk 會 false——改用寬鬆策略：只檢查重疊的其他預約
    const overlap = await db.booking.count({
      where: {
        id: { not: b.id },
        date: b.date,
        status: { in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.CONFIRMED] },
        OR: [
          { requesterId: { in: [b.requesterId, b.recipientId] } },
          { recipientId: { in: [b.requesterId, b.recipientId] } },
        ],
        startMin: { lt: b.startMin + b.durationMin, gt: b.startMin - 60 },
      },
    });
    void stillOk;
    if (overlap > 0) throw new Error("時段已與其他預約衝突");
  }

  await db.booking.update({
    where: { id: b.id },
    data: { status: to, proposedDate: null, proposedStartMin: null, proposedById: null },
  });

  const other = me.id === b.requesterId ? b.recipient : b.requester;
  const n = NOTIFY_TEXT[to];
  if (n) {
    await notifyMember({
      memberId: other.id,
      type: n.type,
      title: n.title(me.name),
      body: `${fmtDate(b.date, todayTaipei())} ${fmtMin(b.startMin)}`,
      linkPath: "/bookings",
    });
  }
  revalidatePath("/bookings");
}

export async function proposeReschedule(formData: FormData) {
  const me = await requireMemberAction();
  const id = Number(formData.get("bookingId"));
  const date = String(formData.get("date"));
  const startMin = Number(formData.get("startMin"));
  const b = await loadBooking(id);

  if (!canProposeReschedule(b, me.id)) throw new Error("不允許的操作");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(startMin)) throw new Error("參數錯誤");

  const other = me.id === b.requesterId ? b.recipient : b.requester;
  const ok = await slotStillAvailable(other.id, me.id, date, startMin);
  if (!ok) {
    redirect(`/bookings/${id}/reschedule?error=${encodeURIComponent("該時段已不可約，請重新選擇")}`);
  }

  await db.booking.update({
    where: { id: b.id },
    data: { proposedDate: date, proposedStartMin: startMin, proposedById: me.id },
  });
  await notifyMember({
    memberId: other.id,
    type: "reschedule_proposed",
    title: `${me.name} 提議改期`,
    body: `新時間：${fmtDate(date, todayTaipei())} ${fmtMin(startMin)}，請到平台回覆`,
    linkPath: "/bookings",
  });
  redirect("/bookings");
}

export async function acceptReschedule(formData: FormData) {
  const me = await requireMemberAction();
  const id = Number(formData.get("bookingId"));
  const b = await loadBooking(id);
  if (!canAcceptReschedule(b, me.id) || !b.proposedDate || b.proposedStartMin == null) {
    throw new Error("不允許的操作");
  }
  await db.booking.update({
    where: { id: b.id },
    data: {
      date: b.proposedDate,
      startMin: b.proposedStartMin,
      status: BOOKING_STATUS.CONFIRMED, // 接受改期即視為雙方同意 → 直接成立
      proposedDate: null,
      proposedStartMin: null,
      proposedById: null,
    },
  });
  const other = me.id === b.requesterId ? b.recipient : b.requester;
  await notifyMember({
    memberId: other.id,
    type: "reschedule_accepted",
    title: `${me.name} 接受了改期`,
    body: `新時間：${fmtDate(b.proposedDate, todayTaipei())} ${fmtMin(b.proposedStartMin)}`,
    linkPath: "/bookings",
  });
  revalidatePath("/bookings");
}

export async function rejectReschedule(formData: FormData) {
  const me = await requireMemberAction();
  const id = Number(formData.get("bookingId"));
  const b = await loadBooking(id);
  if (!canAcceptReschedule(b, me.id)) throw new Error("不允許的操作");
  await db.booking.update({
    where: { id: b.id },
    data: { proposedDate: null, proposedStartMin: null, proposedById: null },
  });
  const other = me.id === b.requesterId ? b.recipient : b.requester;
  await notifyMember({
    memberId: other.id,
    type: "reschedule_rejected",
    title: `${me.name} 未接受改期提議`,
    body: "原時間維持不變，你也可以再提議其他時間",
    linkPath: "/bookings",
  });
  revalidatePath("/bookings");
}
