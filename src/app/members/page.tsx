import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar, Card, SectionTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { slotsForMember } from "@/lib/availability-service";
import { fmtDate, fmtMin, todayTaipei } from "@/lib/taipei-time";

export default async function MembersPage() {
  const me = await requireMember();
  const today = todayTaipei();
  const members = await db.member.findMany({
    where: { active: true, id: { not: me.id } },
    orderBy: { speechOrder: "asc" },
  });
  const nextSlots = await Promise.all(members.map((m) => slotsForMember(m.id, me.id)));

  return (
    <AppShell title="成員">
      <SectionTitle>
        分會成員 <span className="text-xs font-normal text-neutral-500">（點選即可預約）</span>
      </SectionTitle>
      {members.map((m, i) => {
        const first = nextSlots[i][0];
        return (
          <Link key={m.id} href={`/members/${m.id}`}>
            <Card className="mb-2.5 flex items-center gap-3">
              <Avatar name={m.name} color={m.avatarColor} />
              <div className="min-w-0 flex-1">
                <div className="font-bold">{m.name}</div>
                <div className="text-xs text-neutral-500">{m.profession}</div>
              </div>
              <div className="text-right text-xs">
                {first ? (
                  <span className="text-emerald-700">
                    {fmtDate(first.date, today)}
                    <br />
                    {fmtMin(first.slots[0])} 起
                  </span>
                ) : (
                  <span className="text-neutral-400">近兩週無空檔</span>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
    </AppShell>
  );
}
