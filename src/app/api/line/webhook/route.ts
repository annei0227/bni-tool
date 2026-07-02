// LINE Messaging API webhook（必須驗證簽章）
// 目前僅確認接收（follow/unfollow 等事件暫不處理），供 channel 設定時通過驗證
import { type NextRequest, NextResponse } from "next/server";
import { verifyLineSignature } from "@/lib/line-auth";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature");
  if (!verifyLineSignature(body, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
