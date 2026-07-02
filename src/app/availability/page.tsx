import { AppShell } from "@/components/app-shell";
import { Card, Empty, SectionTitle } from "@/components/ui";
import { DAY_NAMES, OVERRIDE_TYPE } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { addDays, fmtDate, fmtMin, todayTaipei } from "@/lib/taipei-time";
import { addBlock, addExtra, addPattern, deleteOverride, deletePattern } from "./actions";

const HOURS = Array.from({ length: 15 }, (_, i) => (i + 7) * 60); // 07:00–21:00

function TimeSelect({ name, def }: { name: string; def: number }) {
  return (
    <select name={name} defaultValue={def} className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm">
      {HOURS.map((m) => (
        <option key={m} value={m}>{fmtMin(m)}</option>
      ))}
    </select>
  );
}

function DelBtn({ action, id }: { action: (fd: FormData) => Promise<void>; id: number }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="px-2 text-lg text-neutral-400" title="刪除">✕</button>
    </form>
  );
}

export default async function AvailabilityPage() {
  const me = await requireMember();
  const today = todayTaipei();
  const [patterns, overrides] = await Promise.all([
    db.availabilityPattern.findMany({ where: { memberId: me.id }, orderBy: [{ weekday: "asc" }, { startMin: "asc" }] }),
    db.availabilityOverride.findMany({ where: { memberId: me.id, date: { gte: today } }, orderBy: { date: "asc" } }),
  ]);
  const extras = overrides.filter((o) => o.type === OVERRIDE_TYPE.EXTRA);
  const blocks = overrides.filter((o) => o.type === OVERRIDE_TYPE.BLOCK);

  return (
    <AppShell title="我的空檔">
      <SectionTitle>每週固定模式</SectionTitle>
      <p className="-mt-1 mb-2 text-xs text-neutral-500">設定一次長期有效，是你的「通常可以」時段，隨時可增刪。</p>
      <Card>
        {patterns.length === 0 && <Empty>還沒有固定時段，先加一個吧。</Empty>}
        {patterns.map((p) => (
          <div key={p.id} className="flex items-center border-b border-neutral-100 py-2 last:border-none">
            <span className="flex-1 text-sm">
              每<b>週{DAY_NAMES[p.weekday]}</b>　{fmtMin(p.startMin)}–{fmtMin(p.endMin)}
            </span>
            <DelBtn action={deletePattern} id={p.id} />
          </div>
        ))}
        <form action={addPattern} className="mt-3 flex flex-wrap items-center gap-2">
          <select name="weekday" defaultValue={2} className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm">
            {DAY_NAMES.map((d, i) => (
              <option key={i} value={i}>週{d}</option>
            ))}
          </select>
          <TimeSelect name="startMin" def={840} />–<TimeSelect name="endMin" def={960} />
          <button className="rounded-lg bg-bni px-3 py-1.5 text-sm font-bold text-white">＋新增</button>
        </form>
      </Card>

      <SectionTitle>一次性加開</SectionTitle>
      <p className="-mt-1 mb-2 text-xs text-neutral-500">某天臨時有空？加開只屬於那一天的時段。</p>
      <Card>
        {extras.length === 0 && <Empty>目前沒有加開時段。</Empty>}
        {extras.map((o) => (
          <div key={o.id} className="flex items-center border-b border-neutral-100 py-2 last:border-none">
            <span className="flex-1 text-sm">
              <b>{fmtDate(o.date, today)}</b>　{fmtMin(o.startMin!)}–{fmtMin(o.endMin!)}
            </span>
            <DelBtn action={deleteOverride} id={o.id} />
          </div>
        ))}
        <form action={addExtra} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="date" name="date" min={addDays(today, 1)} defaultValue={addDays(today, 2)} required className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm" />
          <TimeSelect name="startMin" def={600} />–<TimeSelect name="endMin" def={720} />
          <button className="rounded-lg bg-bni px-3 py-1.5 text-sm font-bold text-white">＋加開</button>
        </form>
      </Card>

      <SectionTitle>例外（整天不開放）</SectionTitle>
      <p className="-mt-1 mb-2 text-xs text-neutral-500">出差、休假？挖掉那天，固定時段當週不生效。</p>
      <Card>
        {blocks.length === 0 && <Empty>目前沒有例外日。</Empty>}
        {blocks.map((o) => (
          <div key={o.id} className="flex items-center border-b border-neutral-100 py-2 last:border-none">
            <span className="flex-1 text-sm"><b>{fmtDate(o.date, today)}</b>　整天不開放</span>
            <DelBtn action={deleteOverride} id={o.id} />
          </div>
        ))}
        <form action={addBlock} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="date" name="date" min={addDays(today, 1)} defaultValue={addDays(today, 3)} required className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm" />
          <button className="rounded-lg bg-bni px-3 py-1.5 text-sm font-bold text-white">＋挖除</button>
        </form>
      </Card>
    </AppShell>
  );
}
