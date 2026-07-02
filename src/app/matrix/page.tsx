import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar, Card, SectionTitle } from "@/components/ui";
import { BOOKING_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { currentQuarter, todayTaipei } from "@/lib/taipei-time";

export default async function MatrixPage() {
  const me = await requireMember();
  const q = currentQuarter(todayTaipei());

  const [others, bookings] = await Promise.all([
    db.member.findMany({ where: { active: true, id: { not: me.id } }, orderBy: { speechOrder: "asc" } }),
    db.booking.findMany({
      where: {
        OR: [{ requesterId: me.id }, { recipientId: me.id }],
        date: { gte: q.startDate, lte: q.endDate },
        status: { in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] },
      },
    }),
  ]);

  const statusOf = (otherId: number): "done" | "going" | "todo" => {
    const mine = bookings.filter(
      (b) => b.requesterId === otherId || b.recipientId === otherId,
    );
    if (mine.some((b) => b.status === BOOKING_STATUS.COMPLETED)) return "done";
    if (mine.length) return "going";
    return "todo";
  };

  const stats = { done: 0, going: 0, todo: 0 };
  const cells = others.map((m) => {
    const s = statusOf(m.id);
    stats[s]++;
    return { m, s };
  });

  const cellCls = {
    done: "bg-emerald-50 border-emerald-200",
    going: "bg-amber-50 border-amber-200",
    todo: "bg-white border-neutral-200",
  };
  const cellLabel = { done: "✓ 已完成", going: "進行中", todo: "尚未約" };
  const labelCls = { done: "text-emerald-700", going: "text-amber-700", todo: "text-neutral-400" };

  return (
    <AppShell title="一對一矩陣">
      <SectionTitle>
        {q.year} 第 {q.quarter} 季
      </SectionTitle>
      <div className="mb-3 grid grid-cols-3 gap-2.5">
        {[
          { v: stats.done, l: "已完成" },
          { v: stats.going, l: "進行中" },
          { v: stats.todo, l: "還沒約" },
        ].map((s) => (
          <Card key={s.l} className="text-center">
            <div className="text-2xl font-extrabold text-bni">{s.v}</div>
            <div className="text-xs text-neutral-500">{s.l}</div>
          </Card>
        ))}
      </div>
      <p className="mb-3 text-xs text-neutral-500">點任何一格可直接查看對方時段並發起預約。</p>
      <div className="grid grid-cols-3 gap-2">
        {cells.map(({ m, s }) => (
          <Link key={m.id} href={`/members/${m.id}`}>
            <div className={`rounded-xl border p-2.5 text-center ${cellCls[s]}`}>
              <div className="mx-auto mb-1.5 w-fit">
                <Avatar name={m.name} color={m.avatarColor} size={36} />
              </div>
              <div className="truncate text-xs font-bold">{m.name}</div>
              <div className={`mt-0.5 text-[11px] ${labelCls[s]}`}>{cellLabel[s]}</div>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-xs text-neutral-400">
        每季自動重新累計；完成打卡後即列入 PALMS 回報依據。
      </p>
    </AppShell>
  );
}
