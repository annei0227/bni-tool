import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BackLink, Card, Empty, SectionTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { markAllRead } from "./actions";

export default async function NotificationsPage() {
  const me = await requireMember();
  const notifications = await db.notification.findMany({
    where: { memberId: me.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <AppShell title="通知">
      <BackLink href="/me" />
      <div className="flex items-center">
        <SectionTitle>通知中心</SectionTitle>
        {hasUnread && (
          <form action={markAllRead} className="ml-auto">
            <button className="text-xs font-bold text-bni">全部標為已讀</button>
          </form>
        )}
      </div>
      {notifications.length === 0 && <Empty>目前沒有通知。</Empty>}
      <div className="space-y-2">
        {notifications.map((n) => (
          <Link key={n.id} href={n.linkPath || "/"}>
            <Card className={`mb-0 py-3 ${n.readAt ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-2">
                {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-bni" />}
                <span className="text-sm font-bold">{n.title}</span>
                <span className="ml-auto shrink-0 text-[11px] text-neutral-400">
                  {n.createdAt.toLocaleString("zh-TW", { timeZone: "Asia/Taipei", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
              {n.body && <p className="mt-1 text-xs text-neutral-500">{n.body}</p>}
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
