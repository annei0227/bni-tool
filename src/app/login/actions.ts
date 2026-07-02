"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, isDevAuth } from "@/lib/session";

export async function devLogin(formData: FormData) {
  if (!isDevAuth()) throw new Error("開發模式未啟用");
  const memberId = Number(formData.get("memberId"));
  const m = await db.member.findUnique({ where: { id: memberId } });
  if (!m || !m.active) throw new Error("成員不存在");
  await createSession(m.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
