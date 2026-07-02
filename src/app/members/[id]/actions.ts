"use server";

import { redirect } from "next/navigation";
import { BOOKING_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { notifyMember } from "@/lib/notify";
import { requireMemberAction } from "@/lib/session";
import { slotStillAvailable } from "@/lib/availability-service";
import { fmtDate, fmtMin, todayTaipei } from "@/lib/taipei-time";

export async function requestBooking(formData: FormData) {
  const me = await requireMemberAction();
  const recipientId = Number(formData.get("recipientId"));
  const date = String(formData.get("date"));
  const startMin = Number(formData.get("startMin"));
  const message = String(formData.get("message") ?? "").slice(0, 500);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(startMin)) throw new Error("參數錯誤");
  if (recipientId === me.id) throw new Error("不能預約自己");
  const recipient = await db.member.findUnique({ where: { id: recipientId } });
  if (!recipient || !recipient.active) throw new Error("成員不存在");

  // 最終防線：雙方此刻都仍可約
  const ok = await slotStillAvailable(recipientId, me.id, date, startMin);
  if (!ok) {
    redirect(
      `/members/${recipientId}?date=${date}&start=${startMin}&error=${encodeURIComponent("這個時段剛被占用了，請改選其他時段")}`,
    );
  }

  await db.booking.create({
    data: { requesterId: me.id, recipientId, date, startMin, message, status: BOOKING_STATUS.REQUESTED },
  });
  await notifyMember({
    memberId: recipientId,
    type: "booking_requested",
    title: `${me.name} 想跟你約一對一`,
    body: `${fmtDate(date, todayTaipei())} ${fmtMin(startMin)}，請到平台回應`,
    linkPath: "/bookings",
  });
  redirect("/bookings?sent=1");
}
