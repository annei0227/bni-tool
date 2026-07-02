import { bindInviteCode } from "./actions";

export default async function LinkPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-center text-2xl font-extrabold text-bni">綁定會員身分</h1>
      <p className="mt-2 text-center text-sm text-neutral-500">
        首次使用請輸入分會提供的邀請碼，將你的 LINE 帳號與會員資料綁定。
      </p>
      <form action={bindInviteCode} className="mt-8 space-y-3">
        <input
          name="inviteCode"
          placeholder="邀請碼（例：FL001）"
          required
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center text-lg tracking-widest"
        />
        {error && <p className="text-center text-sm text-bni">{error}</p>}
        <button className="w-full rounded-xl bg-bni py-3.5 font-bold text-white">綁定並登入</button>
      </form>
    </div>
  );
}
