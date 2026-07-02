import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar, BackLink, Card, SectionTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireMember();
  const { view } = await searchParams;
  const members = await db.member.findMany({ where: { active: true }, orderBy: { speechOrder: "asc" } });

  const byCategory = new Map<string, typeof members>();
  for (const m of members) {
    const key = m.industryCategory || "未分類";
    byCategory.set(key, [...(byCategory.get(key) ?? []), m]);
  }

  const showOrder = view === "order";

  return (
    <AppShell title="名錄">
      <BackLink href="/me" />
      <div className="mb-3 flex gap-2">
        <Link href="/directory" className={`flex-1 rounded-xl py-2 text-center text-sm font-bold ${!showOrder ? "bg-bni text-white" : "border border-neutral-300 bg-white"}`}>
          產業服務鏈
        </Link>
        <Link href="/directory?view=order" className={`flex-1 rounded-xl py-2 text-center text-sm font-bold ${showOrder ? "bg-bni text-white" : "border border-neutral-300 bg-white"}`}>
          25 秒順序
        </Link>
      </div>

      {showOrder ? (
        <Card>
          {members.map((m) => (
            <Link key={m.id} href={`/members/${m.id}`} className="flex items-center gap-3 border-b border-neutral-100 py-2 last:border-none">
              <span className="w-6 text-center text-sm font-bold text-neutral-400">{m.speechOrder ?? "—"}</span>
              <Avatar name={m.name} color={m.avatarColor} size={30} />
              <span className="text-sm font-bold">{m.name}</span>
              <span className="ml-auto text-xs text-neutral-500">{m.profession}</span>
            </Link>
          ))}
        </Card>
      ) : (
        [...byCategory.entries()].map(([cat, list]) => (
          <div key={cat}>
            <SectionTitle>
              {cat} <span className="text-xs font-normal text-neutral-500">（{list.length}）</span>
            </SectionTitle>
            <Card>
              {list.map((m) => (
                <Link key={m.id} href={`/members/${m.id}`} className="flex items-center gap-3 border-b border-neutral-100 py-2 last:border-none">
                  <Avatar name={m.name} color={m.avatarColor} size={30} />
                  <span className="text-sm font-bold">{m.name}</span>
                  <span className="ml-auto text-xs text-neutral-500">{m.profession}</span>
                </Link>
              ))}
            </Card>
          </div>
        ))
      )}
    </AppShell>
  );
}
