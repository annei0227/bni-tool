import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar, Card, Empty, Pill, SectionTitle } from "@/components/ui";
import { BOOKING_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { fmtDate, fmtMin, todayTaipei } from "@/lib/taipei-time";
import { acceptReschedule, rejectReschedule, transitionBooking } from "./actions";

type BookingWithMembers = Awaited<ReturnType<typeof loadAll>>[number];

async function loadAll(meId: number) {
  return db.booking.findMany({
    where: { OR: [{ requesterId: meId }, { recipientId: meId }] },
    include: { requester: true, recipient: true },
    orderBy: [{ date: "asc" }, { startMin: "asc" }],
  });
}

function ActionBtn({ id, to, label, primary = false }: { id: number; to: string; label: string; primary?: boolean }) {
  return (
    <form action={transitionBooking} className="flex-1">
      <input type="hidden" name="bookingId" value={id} />
      <input type="hidden" name="to" value={to} />
      <button
        className={`w-full rounded-lg py-2 text-sm font-bold ${
          primary ? "bg-bni text-white" : "border border-neutral-300 bg-white"
        }`}
      >
        {label}
      </button>
    </form>
  );
}

function BookingCard({ b, meId, actions }: { b: BookingWithMembers; meId: number; actions?: React.ReactNode }) {
  const today = todayTaipei();
  const other = b.requesterId === meId ? b.recipient : b.requester;
  const dir = b.requesterId === meId ? "我約的" : "約我的";
  const proposal =
    b.proposedDate && b.proposedStartMin != null ? (
      <div className="mt-2 rounded-lg bg-amber-50 p-2.5 text-sm text-amber-800">
        🔁 {b.proposedById === meId ? "你" : other.name}提議改期：
        <b> {fmtDate(b.proposedDate, today)} {fmtMin(b.proposedStartMin)}</b>
        {b.proposedById !== meId && (
          <span className="mt-2 flex gap-2">
            <form action={acceptReschedule} className="flex-1">
              <input type="hidden" name="bookingId" value={b.id} />
              <button className="w-full rounded-lg bg-bni py-1.5 text-xs font-bold text-white">接受新時間</button>
            </form>
            <form action={rejectReschedule} className="flex-1">
              <input type="hidden" name="bookingId" value={b.id} />
              <button className="w-full rounded-lg border border-neutral-300 bg-white py-1.5 text-xs font-bold">維持原時間</button>
            </form>
          </span>
        )}
      </div>
    ) : null;

  return (
    <Card className="mb-2.5">
      <div className="flex items-center gap-3">
        <Avatar name={other.name} color={other.avatarColor} size={38} />
        <div className="min-w-0 flex-1">
          <div>
            <span className="font-bold">{other.name}</span>
            <span className="ml-2 text-xs text-neutral-500">{other.profession}・{dir}</span>
          </div>
          <div className="text-sm font-semibold">
            {fmtDate(b.date, today)} {fmtMin(b.startMin)}–{fmtMin(b.startMin + b.durationMin)}
          </div>
        </div>
      </div>
      {b.message && (
        <div className="mt-2 rounded-lg bg-neutral-50 p-2.5 text-sm text-neutral-600">💬 {b.message}</div>
      )}
      {proposal}
      {actions && <div className="mt-2.5 flex gap-2">{actions}</div>}
    </Card>
  );
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const me = await requireMember();
  const { sent } = await searchParams;
  const all = await loadAll(me.id);
  const today = todayTaipei();

  const inbox = all.filter((b) => b.recipientId === me.id && b.status === BOOKING_STATUS.REQUESTED);
  const waiting = all.filter((b) => b.requesterId === me.id && b.status === BOOKING_STATUS.REQUESTED);
  const coming = all.filter((b) => b.status === BOOKING_STATUS.CONFIRMED);
  const history = all
    .filter((b) => [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.DECLINED, BOOKING_STATUS.CANCELLED].includes(b.status as never))
    .sort((a, c) => (a.date < c.date ? 1 : -1))
    .slice(0, 20);

  const histPill = {
    [BOOKING_STATUS.COMPLETED]: <Pill tone="green">已完成</Pill>,
    [BOOKING_STATUS.DECLINED]: <Pill tone="gray">已婉拒</Pill>,
    [BOOKING_STATUS.CANCELLED]: <Pill tone="gray">已取消</Pill>,
  } as Record<string, React.ReactNode>;

  return (
    <AppShell title="我的預約">
      {sent && (
        <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          ✅ 預約請求已送出，等待對方確認（對方會收到通知）。
        </div>
      )}

      <SectionTitle>待我回應（{inbox.length}）</SectionTitle>
      {inbox.length === 0 && <Empty>沒有等待你回應的請求。</Empty>}
      {inbox.map((b) => (
        <BookingCard
          key={b.id}
          b={b}
          meId={me.id}
          actions={
            <>
              <ActionBtn id={b.id} to="confirmed" label="確認" primary />
              <Link
                href={`/bookings/${b.id}/reschedule`}
                className="flex-1 rounded-lg border border-neutral-300 bg-white py-2 text-center text-sm font-bold"
              >
                提議改期
              </Link>
              <ActionBtn id={b.id} to="declined" label="婉拒" />
            </>
          }
        />
      ))}

      <SectionTitle>等待對方確認（{waiting.length}）</SectionTitle>
      {waiting.length === 0 && <Empty>沒有送出中的請求，到「成員」頁挑一位約看看。</Empty>}
      {waiting.map((b) => (
        <BookingCard key={b.id} b={b} meId={me.id} actions={<ActionBtn id={b.id} to="cancelled" label="收回請求" />} />
      ))}

      <SectionTitle>即將到來（{coming.length}）</SectionTitle>
      {coming.length === 0 && <Empty>沒有已確認的約訪。</Empty>}
      {coming.map((b) => (
        <BookingCard
          key={b.id}
          b={b}
          meId={me.id}
          actions={
            <>
              {b.date <= today && <ActionBtn id={b.id} to="completed" label="✓ 完成打卡" primary />}
              <Link
                href={`/bookings/${b.id}/reschedule`}
                className="flex-1 rounded-lg border border-neutral-300 bg-white py-2 text-center text-sm font-bold"
              >
                改期
              </Link>
              <ActionBtn id={b.id} to="cancelled" label="取消" />
            </>
          }
        />
      ))}

      {history.length > 0 && (
        <>
          <SectionTitle>歷史紀錄</SectionTitle>
          {history.map((b) => (
            <BookingCard key={b.id} b={b} meId={me.id} actions={histPill[b.status]} />
          ))}
        </>
      )}
    </AppShell>
  );
}
