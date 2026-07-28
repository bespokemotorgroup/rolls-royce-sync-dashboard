"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import type { ChangeDiff } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/review");
  revalidatePath("/approved");
  revalidatePath("/history");
  revalidatePath("/");
}

export async function approveChange(id: string) {
  await query(
    `UPDATE change_events SET status = 'approved', updated_at = now()
     WHERE id = $1 AND status = 'pending_review'`,
    [id],
  );
  revalidateAll();
}

export async function rejectChange(id: string) {
  await query(
    `UPDATE change_events SET status = 'rejected', updated_at = now()
     WHERE id = $1 AND status = 'pending_review'`,
    [id],
  );
  revalidateAll();
}

export async function saveReviewDiff(id: string, diff: ChangeDiff) {
  await query(
    `UPDATE change_events SET review_diff = $1, updated_at = now()
     WHERE id = $2 AND status = 'pending_review'`,
    [JSON.stringify(diff), id],
  );
  revalidateAll();
}
