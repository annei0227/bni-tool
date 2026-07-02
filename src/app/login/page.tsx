import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionMember, isDevAuth } from "@/lib/session";
import { lineLoginConfigured } from "@/lib/line-auth";
import { Avatar } from "@/components/ui";
import { devLogin } from "./actions";

export default async function LoginPage() {
  if (await getSessionMember()) redirect("/");
  const devAuth = isDevAuth();
  const lineReady = lineLoginConfigured();
  const members = devAuth
    ? await db.member.findMany({ where: { active: true }, orderBy: { id: "asc" } })
    : [];

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-center text-3xl font-extrabold text-bni">富禮一對一</h1>
      <p className="mt-2 text-center text-sm text-neutral-500">BNI 富禮分會常駐營運平台</p>

      {lineReady && (
        <a
          href="/api/auth/line"
          className="mt-8 block rounded-xl bg-[#06C755] py-3.5 text-center font-bold text-white"
        >
          使用 LINE 登入
        </a>
      )}
      {!lineReady && !devAuth && (
        <p className="mt-8 text-center text-sm text-neutral-500">
          LINE 登入尚未設定，請聯絡分會管理員。
        </p>
      )}

      {devAuth && (
        <div className="mt-8">
          <p className="mb-3 text-center text-xs font-semibold tracking-wide text-amber-600">
            ⚠ 開發模式：選擇身分登入
          </p>
          <div className="space-y-2">
            {members.map((m) => (
              <form key={m.id} action={devLogin}>
                <input type="hidden" name="memberId" value={m.id} />
                <button className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left">
                  <Avatar name={m.name} color={m.avatarColor} size={36} />
                  <span className="font-bold">{m.name}</span>
                  <span className="text-xs text-neutral-500">{m.profession}</span>
                  {m.role === "officer" && (
                    <span className="ml-auto rounded-full bg-bni-soft px-2 py-0.5 text-xs font-semibold text-bni-dark">
                      幹部
                    </span>
                  )}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
