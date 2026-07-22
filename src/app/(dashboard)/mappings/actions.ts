"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";

export async function setMappingStatus(id: string, status: "approved" | "rejected") {
  await query(
    `UPDATE field_mappings SET status = $1, updated_at = now() WHERE id = $2`,
    [status, id],
  );
  revalidatePath("/mappings");
  revalidatePath("/");
}

export async function setMappingStatusBulk(ids: string[], status: "approved" | "rejected") {
  if (ids.length === 0) return;
  await query(
    `UPDATE field_mappings SET status = $1, updated_at = now() WHERE id = ANY($2::bigint[])`,
    [status, ids],
  );
  revalidatePath("/mappings");
  revalidatePath("/");
}
