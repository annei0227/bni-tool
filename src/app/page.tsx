import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar, Card, Empty, SectionTitle } from "@/components/ui";
import { BOOKING_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { currentQuarter, fmtDate, fmtMin, todayTaipei } from "@/lib/taipei-time";

export default async function HomePage() {
  const me = await requireMember();
  const today = todayTaipei();
  const q = currentQuarter(today);

  const [pendingIn, upcoming, doneCount, otherCount] = await Promise.all([
    db.booking.findMany({
      where: { recipientId: me.id, status: BOOKING_STATUS.REQUESTED },
      include: { requester: true },
      orderBy: { createdAt: "asc" },
    }),
    db.booking.findMany({
      where: {
        status: BOOKING_STATUS.CONFIRMED,
        date: { gte: today },
        OR: [{ requesterId: me.id }, { recipientId: me.id }],
      },
      include: { requester: true, recipient: true },
      orderBy: [{ date: "asc" }, { startMin: "asc" }],
      take: 3,
    }),
    db.booking.findMany({
      where: {
        status: BOOKING_STATUS.COMPLETED,
        date: { gte: q.startDate, lte: q.endDate },
        OR: [{ requesterId: me.id }, { recipientId: me.id }],
      },
      select: { requesterId: true, recipientId: true },
    }),
    db.member.count({ where: { active: true, id: { not: me.id } } }),
  ]);

  const metQuarter = new Set(
    doneCount.map((b) => (b.requesterId === me.id ? b.recipientId : b.requesterId)),
  ).size;

  return (
    <AppShell>
      <div className="mb-3 grid grid-cols-3 gap-2.5">
        {[
          { v: metQuarter, l: `本季已一對一`, href: "/matrix" },
          { v: otherCount - metQuarter, l: "本季還沒約", href: "/matrix" },
          { v: pendingIn.length, l: "待我回應", href: "/bookings" },
        ].map((s) => (
          <Link key={s.l} href={s.href}>
            <Card className="text-center">
              <div className="text-2xl font-extrabold text-bni">{s.v}</div>
              <div className="text-xs text-neutral-500">{s.l}</div>
            </Card>
          </Link>
        ))}
      </div>

      {pendingIn.length > 0 && (
        <>
          <SectionTitle>等待你回應</SectionTitle>
          {pendingIn.map((b) => (
            <Link key={b.id} href="/bookings">
              <Card className="mb-2 flex items-center gap-3">
                <Avatar name={b.requester.name} color={b.requester.avatarColor} size={36} />
                <div className="min-w-0 flex-1">
                  <span className="font-bold">{b.requester.name}</span>
                  <span className="ml-2 text-xs text-neutral-500">想跟你約一對一</span>
                  <div className="text-sm">{fmtDate(b.date, today)} {fmtMin(b.startMin)}</div>
                </div>
                <span className="text-bni">›</span>
              </Card>
            </Link>
          ))}
        </>
      )}

      <SectionTitle>即將到來</SectionTitle>
      {upcoming.length === 0 && <Empty>目前沒有已確認的約訪，到「成員」頁挑一位約看看。</Empty>}
      {upcoming.map((b) => {
        const other = b.requesterId === me.id ? b.recipient : b.requester;
        return (
          <Card key={b.id} className="mb-2 flex items-center gap-3">
            <Avatar name={other.name} color={other.avatarColor} size={36} />
            <div className="flex-1">
              <div className="font-bold">{other.name}</div>
              <div className="text-sm text-neutral-600">
                {fmtDate(b.date, today)} {fmtMin(b.startMin)}–{fmtMin(b.startMin + b.durationMin)}
              </div>
            </div>
          </Card>
        );
      })}

      <SectionTitle>快速入口</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { href: "/members", icon: "🤝", label: "找人約一對一" },
          { href: "/availability", icon: "🕒", label: "設定我的空檔" },
          { href: "/palms/predict", icon: "🎯", label: "預測綠燈" },
          { href: "/directory", icon: "🔗", label: "產業服務鏈" },
        ].map((x) => (
          <Link key={x.href} href={x.href}>
            <Card className="flex items-center gap-2.5">
              <span className="text-2xl">{x.icon}</span>
              <span className="text-sm font-bold">{x.label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
