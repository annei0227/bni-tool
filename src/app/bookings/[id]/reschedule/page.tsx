import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BackLink, Card, Empty, SectionTitle } from "@/components/ui";
import { canProposeReschedule } from "@/lib/booking-rules";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { slotsForMember } from "@/lib/availability-service";
import { fmtDate, fmtMin, todayTaipei } from "@/lib/taipei-time";
import { proposeReschedule } from "../../actions";

export default async function ReschedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const me = await requireMember();
  const { id } = await params;
  const { error } = await searchParams;
  const b = await db.booking.findUnique({
    where: { id: Number(id) },
    include: { requester: true, recipient: true },
  });
  if (!b || !canProposeReschedule(b, me.id)) notFound();

  const other = b.requesterId === me.id ? b.recipient : b.requester;
  const slots = await slotsForMember(other.id, me.id);
  const today = todayTaipei();

  return (
    <AppShell title="提議改期">
      <BackLink href="/bookings" label="返回我的預約" />
      <Card>
        <div className="text-sm text-neutral-500">與 {other.name} 的一對一</div>
        <div className="font-bold">
          原時間：{fmtDate(b.date, today)} {fmtMin(b.startMin)}–{fmtMin(b.startMin + b.durationMin)}
        </div>
      </Card>
      {error && <p className="mt-2 text-sm text-bni">{decodeURIComponent(error)}</p>}

      <SectionTitle>選擇新時間 <span className="text-xs font-normal text-neutral-500">（{other.name} 的可約時段）</span></SectionTitle>
      {slots.length === 0 && <Empty>對方近兩週沒有其他可約時段。</Empty>}
      {slots.map((d) => (
        <div key={d.date} className="mb-3.5">
          <div className="mb-1.5 text-sm font-bold">{fmtDate(d.date, today)}</div>
          <div className="flex flex-wrap gap-2">
            {d.slots.map((s) => (
              <form key={s} action={proposeReschedule}>
                <input type="hidden" name="bookingId" value={b.id} />
                <input type="hidden" name="date" value={d.date} />
                <input type="hidden" name="startMin" value={s} />
                <button className="rounded-lg border-[1.5px] border-bni px-3 py-1.5 text-sm font-bold text-bni">
                  {fmtMin(s)}–{fmtMin(s + 60)}
                </button>
              </form>
            ))}
          </div>
        </div>
      ))}
    </AppShell>
  );
}
