import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar, Card, SectionTitle } from "@/components/ui";
import { ROLE } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { logout } from "../login/actions";

export default async function MePage() {
  const me = await requireMember();
  const [member, unread] = await Promise.all([
    db.member.findUnique({ where: { id: me.id } }),
    db.notification.count({ where: { memberId: me.id, readAt: null } }),
  ]);

  const items = [
    { href: "/notifications", icon: "🔔", label: "通知中心", badge: unread },
    { href: "/availability", icon: "🕒", label: "我的空檔" },
    { href: "/directory", icon: "🔗", label: "產業服務鏈・25 秒順序" },
    { href: "/palms", icon: "🚦", label: "紅綠燈表" },
    { href: "/palms/predict", icon: "🎯", label: "預測綠燈" },
    { href: "/tools/goal-calc", icon: "🧮", label: "我的事業在 BNI 的目標" },
  ];
  if (me.role === ROLE.OFFICER) {
    items.push({ href: "/admin", icon: "🛠", label: "管理後台（幹部）" });
  }

  return (
    <AppShell title="我的">
      <Card className="flex items-center gap-3">
        <Avatar name={me.name} color={me.avatarColor} size={52} />
        <div>
          <div className="text-lg font-bold">{me.name}</div>
          <div className="text-xs text-neutral-500">
            {member?.company}｜{member?.profession}
            {me.role === ROLE.OFFICER && "｜幹部"}
          </div>
        </div>
      </Card>

      <SectionTitle>功能</SectionTitle>
      <div className="space-y-2">
        {items.map((x) => (
          <Link key={x.href} href={x.href}>
            <Card className="mb-0 flex items-center gap-3 py-3">
              <span className="text-xl">{x.icon}</span>
              <span className="flex-1 text-sm font-bold">{x.label}</span>
              {!!x.badge && (
                <span className="rounded-full bg-bni px-2 py-0.5 text-xs font-bold text-white">{x.badge}</span>
              )}
              <span className="text-neutral-300">›</span>
            </Card>
          </Link>
        ))}
      </div>

      <form action={logout} className="mt-6">
        <button className="w-full rounded-xl border border-neutral-300 bg-white py-2.5 text-sm font-bold text-neutral-500">
          登出
        </button>
      </form>
    </AppShell>
  );
}
