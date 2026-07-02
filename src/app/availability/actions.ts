"use server";

import { revalidatePath } from "next/cache";
import { OVERRIDE_TYPE } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireMemberAction } from "@/lib/session";
import { todayTaipei } from "@/lib/taipei-time";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseRange(formData: FormData) {
  const startMin = Number(formData.get("startMin"));
  const endMin = Number(formData.get("endMin"));
  if (!Number.isInteger(startMin) || !Number.isInteger(endMin)) throw new Error("時間格式錯誤");
  if (startMin < 0 || endMin > 1440 || endMin <= startMin) throw new Error("結束時間需晚於開始時間");
  return { startMin, endMin };
}

export async function addPattern(formData: FormData) {
  const me = await requireMemberAction();
  const weekday = Number(formData.get("weekday"));
  if (weekday < 0 || weekday > 6) throw new Error("星期錯誤");
  const { startMin, endMin } = parseRange(formData);
  await db.availabilityPattern.create({ data: { memberId: me.id, weekday, startMin, endMin } });
  revalidatePath("/availability");
}

export async function deletePattern(formData: FormData) {
  const me = await requireMemberAction();
  const id = Number(formData.get("id"));
  await db.availabilityPattern.deleteMany({ where: { id, memberId: me.id } }); // memberId 條件防越權
  revalidatePath("/availability");
}

export async function addExtra(formData: FormData) {
  const me = await requireMemberAction();
  const date = String(formData.get("date"));
  if (!DATE_RE.test(date) || date < todayTaipei()) throw new Error("日期錯誤");
  const { startMin, endMin } = parseRange(formData);
  await db.availabilityOverride.create({
    data: { memberId: me.id, date, type: OVERRIDE_TYPE.EXTRA, startMin, endMin },
  });
  revalidatePath("/availability");
}

export async function addBlock(formData: FormData) {
  const me = await requireMemberAction();
  const date = String(formData.get("date"));
  if (!DATE_RE.test(date) || date < todayTaipei()) throw new Error("日期錯誤");
  await db.availabilityOverride.create({
    data: { memberId: me.id, date, type: OVERRIDE_TYPE.BLOCK, startMin: null, endMin: null },
  });
  revalidatePath("/availability");
}

export async function deleteOverride(formData: FormData) {
  const me = await requireMemberAction();
  const id = Number(formData.get("id"));
  await db.availabilityOverride.deleteMany({ where: { id, memberId: me.id } });
  revalidatePath("/availability");
}
