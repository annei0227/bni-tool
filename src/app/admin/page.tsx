import { AppShell } from "@/components/app-shell";
import { Avatar, BackLink, Card, Empty, Pill, SectionTitle } from "@/components/ui";
import { ROLE } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireOfficer } from "@/lib/session";
import { addMember, deleteSnapshot, importPalms, toggleMemberActive, toggleOfficer } from "./actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const me = await requireOfficer();
  const { ok, error } = await searchParams;
  const [members, snapshots] = await Promise.all([
    db.member.findMany({ orderBy: { speechOrder: "asc" } }),
    db.palmsSnapshot.findMany({ orderBy: { importedAt: "desc" }, include: { _count: { select: { stats: true } } } }),
  ]);

  const input = "w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-sm";

  return (
    <AppShell title="管理後台">
      <BackLink href="/me" />
      {ok && <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">✅ {decodeURIComponent(ok)}</div>}
      {error && <div className="mb-3 rounded-xl bg-bni-soft p-3 text-sm text-bni-dark">⚠ {decodeURIComponent(error)}</div>}

      <SectionTitle>PALMS 匯入</SectionTitle>
      <Card>
        <form action={importPalms} className="space-y-2.5">
          <input type="file" name="file" accept=".xlsx" required className="w-full text-sm" />
          <div className="flex gap-2">
            <input name="periodLabel" placeholder="統計期間（例 2026/01—2026/06）" required className={input} />
            <input name="weekCount" type="number" min={1} placeholder="週數" required className={`${input} w-24 shrink-0`} />
          </div>
          <button className="w-full rounded-xl bg-bni py-2.5 text-sm font-bold text-white">上傳並匯入</button>
        </form>
        <p className="mt-2 text-[11px] text-neutral-400">
          支援 .xlsx；需含「姓名」欄，其餘欄位（缺席/引薦/一對一/培訓/來賓/感謝金額）以名稱自動比對。
        </p>
      </Card>

      {snapshots.length > 0 && (
        <>
          <SectionTitle>已匯入快照</SectionTitle>
          <Card>
            {snapshots.map((s) => (
              <div key={s.id} className="flex items-center border-b border-neutral-100 py-2 text-sm last:border-none">
                <div className="flex-1">
                  <b>{s.periodLabel}</b>（{s.weekCount} 週，{s._count.stats} 筆）
                  <div className="text-[11px] text-neutral-400">
                    {s.importedAt.toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false })}・{s.importedBy}
                  </div>
                </div>
                <form action={deleteSnapshot}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="px-2 text-neutral-400">✕</button>
                </form>
              </div>
            ))}
          </Card>
        </>
      )}

      <SectionTitle>成員管理（{members.filter((m) => m.active).length} 位）</SectionTitle>
      <Card>
        {members.length === 0 && <Empty>尚無成員。</Empty>}
        {members.map((m) => (
          <div key={m.id} className={`flex items-center gap-2.5 border-b border-neutral-100 py-2 last:border-none ${m.active ? "" : "opacity-45"}`}>
            <Avatar name={m.name} color={m.avatarColor} size={30} />
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold">{m.name}</span>
              <span className="ml-1.5 text-xs text-neutral-500">{m.profession}</span>
              <div className="text-[11px] text-neutral-400">
                邀請碼 {m.inviteCode ?? "—"}｜{m.lineUserId ? "已綁定 LINE" : "未綁定"}
              </div>
            </div>
            {m.role === ROLE.OFFICER && <Pill tone="red">幹部</Pill>}
            {m.id !== me.id && (
              <>
                <form action={toggleOfficer}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="rounded-lg border border-neutral-300 px-2 py-1 text-[11px]">
                    {m.role === ROLE.OFFICER ? "降為成員" : "設為幹部"}
                  </button>
                </form>
                <form action={toggleMemberActive}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="rounded-lg border border-neutral-300 px-2 py-1 text-[11px]">
                    {m.active ? "停用" : "啟用"}
                  </button>
                </form>
              </>
            )}
          </div>
        ))}
        <form action={addMember} className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input name="name" placeholder="姓名*" required className={input} />
            <input name="profession" placeholder="專業別" className={input} />
          </div>
          <div className="flex gap-2">
            <input name="company" placeholder="公司" className={input} />
            <input name="industryCategory" placeholder="產業鏈分類" className={input} />
            <input name="speechOrder" type="number" placeholder="順序" className={`${input} w-20 shrink-0`} />
          </div>
          <button className="w-full rounded-xl border-[1.5px] border-bni py-2 text-sm font-bold text-bni">＋新增成員（自動產生邀請碼）</button>
        </form>
      </Card>
    </AppShell>
  );
}
