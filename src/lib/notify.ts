// 通知：一律先落站內 Notification 表，LINE 設定齊全且成員已綁定時同步推播。
// LINE 推播失敗不影響主流程（站內通知為準）。

import { db } from "./db";

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

export function lineConfigured(): boolean {
  return !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
}

async function pushLine(lineUserId: string, text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;
  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text }] }),
    });
    if (!res.ok) {
      console.error(`LINE push failed: ${res.status} ${await res.text()}`);
    }
  } catch (e) {
    console.error("LINE push error", e);
  }
}

export async function notifyMember(params: {
  memberId: number;
  type: string;
  title: string;
  body?: string;
  linkPath?: string;
}): Promise<void> {
  const { memberId, type, title, body = "", linkPath = "" } = params;
  await db.notification.create({ data: { memberId, type, title, body, linkPath } });

  if (lineConfigured()) {
    const m = await db.member.findUnique({
      where: { id: memberId },
      select: { lineUserId: true },
    });
    if (m?.lineUserId) {
      const base = process.env.APP_BASE_URL ?? "";
      const link = linkPath && base ? `\n${base}${linkPath}` : "";
      // 合併為單則訊息控制用量（免費額度 200 則/月）
      await pushLine(m.lineUserId, `${title}${body ? `\n${body}` : ""}${link}`);
    }
  }
}
