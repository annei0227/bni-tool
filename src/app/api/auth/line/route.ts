import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { lineAuthorizeUrl, lineLoginConfigured } from "@/lib/line-auth";

export async function GET() {
  if (!lineLoginConfigured()) {
    return NextResponse.redirect(new URL("/login", process.env.APP_BASE_URL));
  }
  const state = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set("line_oauth_state", state, { httpOnly: true, maxAge: 600, path: "/" });
  return NextResponse.redirect(lineAuthorizeUrl(state));
}
