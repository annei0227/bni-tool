import { requireMember } from "@/lib/session";
import { BottomNav } from "./bottom-nav";
import type { ReactNode } from "react";

/** 登入後頁面的共用外框：置中窄版＋頂欄＋底部導覽 */
export async function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const me = await requireMember();
  return (
    <div className="mx-auto min-h-screen max-w-md pb-20">
      <header className="sticky top-0 z-20 flex items-center gap-2.5 bg-bni px-4 py-2.5 text-white">
        <span className="text-lg font-extrabold tracking-wide">富禮一對一</span>
        {title && <span className="text-sm opacity-90">· {title}</span>}
        <span className="ml-auto text-sm opacity-90">{me.name}</span>
      </header>
      <main className="px-4 py-3">{children}</main>
      <BottomNav me={me} />
    </div>
  );
}
