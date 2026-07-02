// LINE Login OAuth 2.1（未設定環境變數時整組停用）
import { createHmac } from "node:crypto";

export function lineLoginConfigured(): boolean {
  return !!(process.env.LINE_LOGIN_CHANNEL_ID && process.env.LINE_LOGIN_CHANNEL_SECRET);
}

export function lineAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
    redirect_uri: `${process.env.APP_BASE_URL}/api/auth/line/callback`,
    state,
    scope: "profile openid",
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${params}`;
}

export async function exchangeLineCode(code: string): Promise<{ lineUserId: string; displayName: string } | null> {
  const res = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.APP_BASE_URL}/api/auth/line/callback`,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
    }),
  });
  if (!res.ok) return null;
  const { access_token } = (await res.json()) as { access_token: string };
  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!profileRes.ok) return null;
  const p = (await profileRes.json()) as { userId: string; displayName: string };
  return { lineUserId: p.userId, displayName: p.displayName };
}

/** LINE webhook 簽章驗證（Messaging API channel secret） */
export function verifyLineSignature(body: string, signature: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("base64");
  return expected === signature;
}
