// Session：HMAC 簽署的 cookie（memberId.expiry.signature），無外部依賴
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { ROLE } from "./constants";

const COOKIE_NAME = "bni_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 天

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET 未設定或過短");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function createSession(memberId: number) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = `${memberId}.${exp}`;
  const token = `${payload}.${sign(payload)}`;
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SEC,
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

function verifyToken(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [idStr, expStr, sig] = parts;
  const payload = `${idStr}.${expStr}`;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expStr) < Math.floor(Date.now() / 1000)) return null;
  const id = Number(idStr);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export type SessionMember = {
  id: number;
  name: string;
  role: string;
  avatarColor: string;
};

/** 取得目前登入成員；未登入回傳 null */
export async function getSessionMember(): Promise<SessionMember | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const id = verifyToken(token);
  if (!id) return null;
  const m = await db.member.findUnique({
    where: { id },
    select: { id: true, name: true, role: true, avatarColor: true, active: true },
  });
  if (!m || !m.active) return null;
  return { id: m.id, name: m.name, role: m.role, avatarColor: m.avatarColor };
}

/** 頁面用：未登入導向登入頁 */
export async function requireMember(): Promise<SessionMember> {
  const m = await getSessionMember();
  if (!m) redirect("/login");
  return m;
}

/** 幹部限定 */
export async function requireOfficer(): Promise<SessionMember> {
  const m = await requireMember();
  if (m.role !== ROLE.OFFICER) redirect("/");
  return m;
}

/** Server action 用：未登入直接丟錯（不 redirect，避免吞掉表單錯誤） */
export async function requireMemberAction(): Promise<SessionMember> {
  const m = await getSessionMember();
  if (!m) throw new Error("未登入");
  return m;
}

export function isDevAuth(): boolean {
  return process.env.DEV_AUTH === "true";
}
