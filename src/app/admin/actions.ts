"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ROLE } from "@/lib/constants";
import { db } from "@/lib/db";
import { parsePalmsExcel } from "@/lib/palms-import";
import { getSessionMember } from "@/lib/session";

async function requireOfficerAction() {
  const me = await getSessionMember();
  if (!me || me.role !== ROLE.OFFICER) throw new Error("僅限幹部操作");
  return me;
}

export async function addMember(formData: FormData) {
  await requireOfficerAction();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("姓名必填");
  const count = await db.member.count();
  await db.member.create({
    data: {
      name,
      company: String(formData.get("company") ?? "").trim(),
      profession: String(formData.get("profession") ?? "").trim(),
      industryCategory: String(formData.get("industryCategory") ?? "").trim(),
      speechOrder: Number(formData.get("speechOrder")) || null,
      inviteCode: `FL${String(count + 1).padStart(3, "0")}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      avatarColor: ["#C0574F", "#3F6E8C", "#5D7A46", "#8C5A79", "#A0742B", "#4F6F6A"][count % 6],
    },
  });
  revalidatePath("/admin");
}

export async function toggleMemberActive(formData: FormData) {
  const me = await requireOfficerAction();
  const id = Number(formData.get("id"));
  if (id === me.id) throw new Error("不能停用自己");
  const m = await db.member.findUnique({ where: { id } });
  if (!m) throw new Error("成員不存在");
  await db.member.update({ where: { id }, data: { active: !m.active } });
  revalidatePath("/admin");
}

export async function toggleOfficer(formData: FormData) {
  const me = await requireOfficerAction();
  const id = Number(formData.get("id"));
  if (id === me.id) throw new Error("不能變更自己的角色");
  const m = await db.member.findUnique({ where: { id } });
  if (!m) throw new Error("成員不存在");
  await db.member.update({
    where: { id },
    data: { role: m.role === ROLE.OFFICER ? ROLE.MEMBER : ROLE.OFFICER },
  });
  revalidatePath("/admin");
}

export async function importPalms(formData: FormData) {
  const me = await requireOfficerAction();
  const file = formData.get("file") as File | null;
  const periodLabel = String(formData.get("periodLabel") ?? "").trim();
  const weekCount = Number(formData.get("weekCount"));
  if (!file || file.size === 0) redirect(`/admin?error=${encodeURIComponent("請選擇檔案")}`);
  if (!periodLabel || !Number.isInteger(weekCount) || weekCount < 1) {
    redirect(`/admin?error=${encodeURIComponent("請填寫統計期間與週數")}`);
  }

  let parsed;
  try {
    parsed = await parsePalmsExcel(await file!.arrayBuffer());
  } catch (e) {
    redirect(`/admin?error=${encodeURIComponent(e instanceof Error ? e.message : "解析失敗")}`);
  }

  const members = await db.member.findMany({ select: { id: true, name: true } });
  const byName = new Map(members.map((m) => [m.name, m.id]));

  const snapshot = await db.palmsSnapshot.create({
    data: { periodLabel, weekCount, importedBy: me.name },
  });
  let matched = 0;
  for (const row of parsed.rows) {
    const memberId = byName.get(row.memberName) ?? null;
    if (memberId) matched++;
    await db.palmsMemberStat.create({ data: { ...row, snapshotId: snapshot.id, memberId } });
  }
  const unmatched = parsed.rows.length - matched;
  const msg = [
    `匯入成功：${parsed.rows.length} 筆（對上站內成員 ${matched} 筆${unmatched ? `，未對上 ${unmatched} 筆` : ""}）`,
    ...parsed.warnings,
  ].join("；");
  redirect(`/admin?ok=${encodeURIComponent(msg)}`);
}

export async function deleteSnapshot(formData: FormData) {
  await requireOfficerAction();
  const id = Number(formData.get("id"));
  await db.palmsSnapshot.delete({ where: { id } });
  revalidatePath("/admin");
}
