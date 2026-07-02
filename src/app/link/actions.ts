"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function bindInviteCode(formData: FormData) {
  const jar = await cookies();
  const lineUserId = jar.get("line_pending_uid")?.value;
  if (!lineUserId) redirect("/login");

  const code = String(formData.get("inviteCode") ?? "").trim().toUpperCase();
  const member = await db.member.findUnique({ where: { inviteCode: code } });
  if (!member || !member.active || member.lineUserId) {
    redirect(`/link?error=${encodeURIComponent("邀請碼無效或已被使用")}`);
  }
  await db.member.update({ where: { id: member.id }, data: { lineUserId } });
  jar.delete("line_pending_uid");
  await createSession(member.id);
  redirect("/");
}
