import Link from "next/link";
import { db } from "@/lib/db";
import { BOOKING_STATUS } from "@/lib/constants";
import type { SessionMember } from "@/lib/session";

const TABS = [
  { href: "/", icon: "🏠", label: "首頁" },
  { href: "/members", icon: "👥", label: "成員" },
  { href: "/bookings", icon: "📅", label: "預約", badge: "bookings" },
  { href: "/matrix", icon: "▦", label: "矩陣" },
  { href: "/me", icon: "👤", label: "我的", badge: "notifications" },
] as const;

export async function BottomNav({ me }: { me: SessionMember }) {
  const [pendingCount, unreadCount] = await Promise.all([
    db.booking.count({ where: { recipientId: me.id, status: BOOKING_STATUS.REQUESTED } }),
    db.notification.count({ where: { memberId: me.id, readAt: null } }),
  ]);
  const dots: Record<string, boolean> = {
    bookings: pendingCount > 0,
    notifications: unreadCount > 0,
  };
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-md -translate-x-1/2 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className="flex-1 py-2 text-center text-[11px] text-neutral-500">
          <span className="relative block text-xl leading-6">
            {t.icon}
            {"badge" in t && dots[t.badge] && (
              <span className="absolute top-0 right-[calc(50%-16px)] h-2 w-2 rounded-full bg-bni" />
            )}
          </span>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
