import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar, BackLink, Card, Empty, Pill, SectionTitle } from "@/components/ui";
import { BOOKING_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { slotsForMember } from "@/lib/availability-service";
import { currentQuarter, fmtDate, fmtMin, todayTaipei } from "@/lib/taipei-time";
import { requestBooking } from "./actions";

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; start?: string; error?: string }>;
}) {
  const me = await requireMember();
  const { id } = await params;
  const { date, start, error } = await searchParams;
  const member = await db.member.findUnique({ where: { id: Number(id) } });
  if (!member || !member.active || member.id === me.id) notFound();

  const today = todayTaipei();
  const q = currentQuarter(today);
  const [slots, quarterBookings] = await Promise.all([
    slotsForMember(member.id, me.id),
    db.booking.findMany({
      where: {
        OR: [
          { requesterId: me.id, recipientId: member.id },
          { requesterId: member.id, recipientId: me.id },
        ],
        status: { in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] },
        date: { gte: q.startDate, lte: q.endDate },
      },
    }),
  ]);
  const done = quarterBookings.some((b) => b.status === BOOKING_STATUS.COMPLETED);
  const going = quarterBookings.some((b) => b.status !== BOOKING_STATUS.COMPLETED);

  const picking = date && start; // 已選時段 → 顯示留言表單

  return (
    <AppShell title="預約">
      <BackLink href="/members" label="返回成員列表" />
      <Card className="flex items-center gap-3">
        <Avatar name={member.name} color={member.avatarColor} />
        <div className="min-w-0 flex-1">
          <div className="font-bold">{member.name}</div>
          <div className="text-xs text-neutral-500">
            {member.company}｜{member.profession}
          </div>
        </div>
        {done ? (
          <Pill tone="green">本季已一對一</Pill>
        ) : going ? (
          <Pill tone="amber">進行中</Pill>
        ) : (
          <Pill tone="gray">本季尚未約</Pill>
        )}
      </Card>

      {picking ? (
        <Card className="mt-4">
          <h3 className="font-bold">
            預約 {member.name} 的一對一
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {fmtDate(date!, today)} {fmtMin(Number(start))}–{fmtMin(Number(start) + 60)}
          </p>
          <form action={requestBooking} className="mt-3">
            <input type="hidden" name="recipientId" value={member.id} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="startMin" value={start} />
            <textarea
              name="message"
              rows={3}
              placeholder="留言給對方（選填）：想聊的主題、建議的地點…"
              className="w-full rounded-xl border border-neutral-300 p-3 text-sm"
            />
            {error && <p className="mt-1 text-sm text-bni">{decodeURIComponent(error)}</p>}
            <div className="mt-2 flex gap-2">
              <Link
                href={`/members/${member.id}`}
                className="flex-1 rounded-xl bg-neutral-100 py-2.5 text-center text-sm font-bold"
              >
                取消
              </Link>
              <button className="flex-1 rounded-xl bg-bni py-2.5 text-sm font-bold text-white">
                送出預約請求
              </button>
            </div>
          </form>
        </Card>
      ) : (
        <>
          <SectionTitle>
            可約時段 <span className="text-xs font-normal text-neutral-500">（未來 14 天）</span>
          </SectionTitle>
          <p className="-mt-1 mb-3 text-xs text-neutral-500">
            點選時段送出預約請求，{member.name} 確認後才算成立。
          </p>
          {slots.length === 0 && (
            <Empty>近兩週沒有可約時段（已排除你自己占用的時間）。</Empty>
          )}
          {slots.map((d) => (
            <div key={d.date} className="mb-3.5">
              <div className="mb-1.5 text-sm font-bold">{fmtDate(d.date, today)}</div>
              <div className="flex flex-wrap gap-2">
                {d.slots.map((s) => (
                  <Link
                    key={s}
                    href={`/members/${member.id}?date=${d.date}&start=${s}`}
                    className="rounded-lg border-[1.5px] border-bni px-3 py-1.5 text-sm font-bold text-bni"
                  >
                    {fmtMin(s)}–{fmtMin(s + 60)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </AppShell>
  );
}
