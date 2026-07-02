import { AppShell } from "@/components/app-shell";
import { Avatar, BackLink, Card, Empty, SectionTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { scorePalms } from "@/lib/palms-scoring";

const LIGHT_UI = {
  green: { emoji: "🟢", cls: "bg-emerald-50 border-emerald-200" },
  yellow: { emoji: "🟡", cls: "bg-amber-50 border-amber-200" },
  red: { emoji: "🔴", cls: "bg-red-50 border-red-200" },
  gray: { emoji: "⚪", cls: "bg-neutral-50 border-neutral-200" },
} as const;

export default async function PalmsPage() {
  await requireMember();
  const snapshot = await db.palmsSnapshot.findFirst({
    orderBy: { importedAt: "desc" },
    include: { stats: { include: { member: true } } },
  });

  if (!snapshot) {
    return (
      <AppShell title="紅綠燈">
        <BackLink href="/me" />
        <Empty>尚未匯入 PALMS 資料。請幹部到管理後台上傳中心區報表。</Empty>
      </AppShell>
    );
  }

  const activeMembers = await db.member.findMany({ where: { active: true } });
  const statByMemberId = new Map(snapshot.stats.filter((s) => s.memberId).map((s) => [s.memberId!, s]));

  const rows = activeMembers.map((m) => {
    const stat = statByMemberId.get(m.id);
    const result = stat
      ? scorePalms(stat, snapshot.weekCount)
      : scorePalms({ absences: 0, referralsOut: 0, visitors: 0, oneToOnes: 0, ceu: 0, tyfcb: 0 }, 0); // 無資料 → 灰
    return { m, result };
  });
  const counts = { green: 0, yellow: 0, red: 0, gray: 0 };
  rows.forEach((r) => counts[r.result.light]++);
  rows.sort((a, b) => b.result.total - a.result.total);

  return (
    <AppShell title="紅綠燈">
      <BackLink href="/me" />
      <SectionTitle>紅綠燈表</SectionTitle>
      <p className="-mt-1 mb-3 text-xs text-neutral-500">
        統計期間 {snapshot.periodLabel}（{snapshot.weekCount} 週）｜門檻為預設值，以中心區實際燈號為準
      </p>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {(["green", "yellow", "red", "gray"] as const).map((l) => (
          <Card key={l} className="p-2.5 text-center">
            <div className="text-lg">{LIGHT_UI[l].emoji}</div>
            <div className="text-xl font-extrabold">{counts[l]}</div>
          </Card>
        ))}
      </div>
      <div className="space-y-2">
        {rows.map(({ m, result }) => (
          <div key={m.id} className={`rounded-xl border p-3 ${LIGHT_UI[result.light].cls}`}>
            <div className="flex items-center gap-2.5">
              <Avatar name={m.name} color={m.avatarColor} size={32} />
              <span className="text-sm font-bold">{m.name}</span>
              <span className="ml-auto text-lg">{LIGHT_UI[result.light].emoji}</span>
              <span className="w-12 text-right text-sm font-extrabold">
                {result.light === "gray" ? "—" : `${result.total}分`}
              </span>
            </div>
            {result.light !== "gray" && (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-600">
                {result.components.map((c) => (
                  <span key={c.key}>
                    {c.label} <b>{c.score}</b>/{c.max}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
