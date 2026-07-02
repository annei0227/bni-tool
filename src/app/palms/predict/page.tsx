import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar, BackLink, Card, Empty, SectionTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { LIGHT_CUTOFF, scorePalms } from "@/lib/palms-scoring";

export default async function PredictPage() {
  const me = await requireMember();
  const snapshot = await db.palmsSnapshot.findFirst({
    orderBy: { importedAt: "desc" },
    include: { stats: { include: { member: true } } },
  });

  if (!snapshot) {
    return (
      <AppShell title="預測綠燈">
        <BackLink href="/me" />
        <Empty>尚未匯入 PALMS 資料。請幹部到管理後台上傳中心區報表。</Empty>
      </AppShell>
    );
  }

  const scored = snapshot.stats
    .filter((s) => s.member && s.member.active)
    .map((s) => ({ member: s.member!, result: scorePalms(s, snapshot.weekCount) }));

  const total = scored.length;
  const greenNow = scored.filter((x) => x.result.light === "green").length;
  const target = Math.ceil(total * 0.8);
  const gap = Math.max(0, target - greenNow);

  // 補救名單：一級提升即可轉綠的人
  const nearGreen = scored
    .filter((x) => x.result.light !== "green" && x.result.remedies.length > 0)
    .sort((a, b) => b.result.total - a.result.total);

  const myRow = scored.find((x) => x.member.id === me.id);

  return (
    <AppShell title="預測綠燈">
      <BackLink href="/me" />
      <SectionTitle>🎯 衝刺綠燈</SectionTitle>
      <Card>
        <p className="text-sm">
          資料截至 <b>{snapshot.periodLabel}</b>：目前 <b className="text-emerald-600">{greenNow}</b> 位綠燈
          {gap > 0 ? (
            <>
              ，再衝 <b className="text-bni">{gap}</b> 位 → 達成 80% 目標（{total} 位中 {target} 位）
            </>
          ) : (
            <>，已達成 80% 目標 🎉</>
          )}
        </p>
        <p className="mt-1.5 text-xs text-neutral-400">
          綠燈 ≥ {LIGHT_CUTOFF.green} 分（門檻為預設值，最終以中心區系統為準）
        </p>
      </Card>

      {myRow && myRow.result.light !== "green" && myRow.result.remedies.length > 0 && (
        <>
          <SectionTitle>你自己就差一步</SectionTitle>
          <Card className="border-bni bg-bni-soft">
            <p className="text-sm">
              你目前 <b>{myRow.result.total} 分</b>（{myRow.result.light === "yellow" ? "🟡" : "🔴"}），
              {myRow.result.remedies.map((r) => r.label).join("或")}再進一級就能轉綠！
            </p>
            {myRow.result.remedies.some((r) => r.key === "oneToOnes") && (
              <Link href="/members" className="mt-2 block rounded-lg bg-bni py-2 text-center text-sm font-bold text-white">
                立刻找人約一對一 →
              </Link>
            )}
          </Card>
        </>
      )}

      <SectionTitle>
        差一步就綠燈的夥伴 <span className="text-xs font-normal text-neutral-500">（{nearGreen.length} 位）</span>
      </SectionTitle>
      <p className="-mt-1 mb-2 text-xs text-neutral-500">
        找他們做一對一，既幫他們轉綠、也累積你自己的一對一次數——雙贏。
      </p>
      {nearGreen.length === 0 && <Empty>目前沒有「差一級就轉綠」的成員。</Empty>}
      <div className="space-y-2">
        {nearGreen.map(({ member, result }) => (
          <Card key={member.id} className="mb-0">
            <div className="flex items-center gap-2.5">
              <Avatar name={member.name} color={member.avatarColor} size={34} />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-bold">{member.name}</span>
                <span className="ml-2 text-xs text-neutral-500">{result.total} 分</span>
                <div className="text-xs text-amber-700">
                  補：{result.remedies.map((r) => `${r.label}（${r.hint}）`).join("、")}
                </div>
              </div>
              {member.id !== me.id && (
                <Link
                  href={`/members/${member.id}`}
                  className="shrink-0 rounded-lg border-[1.5px] border-bni px-2.5 py-1.5 text-xs font-bold text-bni"
                >
                  約一對一
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
