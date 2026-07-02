"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMemberAction } from "@/lib/session";

export async function markAllRead() {
  const me = await requireMemberAction();
  await db.notification.updateMany({
    where: { memberId: me.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
  revalidatePath("/me");
}
