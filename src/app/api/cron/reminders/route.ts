// 每日提醒：明天有約訪的成員各收一則合併通知（Vercel Cron 每天 20:00 台北時間呼叫）
import { type NextRequest, NextResponse } from "next/server";
import { BOOKING_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { notifyMember } from "@/lib/notify";
import { addDays, fmtMin, todayTaipei } from "@/lib/taipei-time";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const tomorrow = addDays(todayTaipei(), 1);
  const bookings = await db.booking.findMany({
    where: { date: tomorrow, status: BOOKING_STATUS.CONFIRMED },
    include: { requester: true, recipient: true },
    orderBy: { startMin: "asc" },
  });

  // 按成員合併為一則（控制 LINE 用量）
  const byMember = new Map<number, string[]>();
  for (const b of bookings) {
    for (const [meId, other] of [
      [b.requesterId, b.recipient],
      [b.recipientId, b.requester],
    ] as const) {
      const lines = byMember.get(meId) ?? [];
      lines.push(`${fmtMin(b.startMin)} 與 ${other.name}`);
      byMember.set(meId, lines);
    }
  }

  for (const [memberId, lines] of byMember) {
    await notifyMember({
      memberId,
      type: "booking_reminder",
      title: `明天有 ${lines.length} 場一對一`,
      body: lines.join("；"),
      linkPath: "/bookings",
    });
  }
  return NextResponse.json({ date: tomorrow, bookings: bookings.length, notified: byMember.size });
}
