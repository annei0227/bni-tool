import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { exchangeLineCode } from "@/lib/line-auth";
import { createSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const base = process.env.APP_BASE_URL!;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const jar = await cookies();
  const expectedState = jar.get("line_oauth_state")?.value;
  jar.delete("line_oauth_state");

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(`${base}/login`);
  }
  const profile = await exchangeLineCode(code);
  if (!profile) return NextResponse.redirect(`${base}/login`);

  const existing = await db.member.findUnique({ where: { lineUserId: profile.lineUserId } });
  if (existing && existing.active) {
    await createSession(existing.id);
    return NextResponse.redirect(base);
  }
  // 尚未綁定 → 引導輸入邀請碼（10 分鐘內有效）
  jar.set("line_pending_uid", profile.lineUserId, { httpOnly: true, maxAge: 600, path: "/" });
  return NextResponse.redirect(`${base}/link`);
}
