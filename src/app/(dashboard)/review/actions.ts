"use server";

import { revalidatePath } from "next/cache";
import { transaction } from "@/lib/db";
import type { ChangeDiff } from "@/lib/types";

type ReviewStatus = "pending_review" | "approved" | "rejected";
type Decision = "approved" | "rejected";
type DecisionResult = {
  resolved: boolean;
  status: ReviewStatus | "published";
  error?: string;
};

interface ReviewRow {
  diff: ChangeDiff | null;
  review_diff: ChangeDiff | null;
}

function revalidateAll() {
  revalidatePath("/review");
  revalidatePath("/approved");
  revalidatePath("/history");
  revalidatePath("/");
}

async function publishThroughSyncService(id: string): Promise<void> {
  const baseUrl = process.env.SYNC_SERVICE_URL?.replace(/\/$/, "");
  const token = process.env.SYNC_ADMIN_TOKEN;
  if (!baseUrl || !token) {
    throw new Error("Immediate publishing is not configured. Set SYNC_SERVICE_URL and SYNC_ADMIN_TOKEN.");
  }

  const response = await fetch(`${baseUrl}/sync/changes/${encodeURIComponent(id)}/publish`, {
    method: "POST",
    headers: { "x-sync-token": token },
    cache: "no-store",
    signal: AbortSignal.timeout(110_000),
  });
  const text = await response.text();
  let body: { published?: number; errors?: Array<{ error?: string }>; message?: string } = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // Keep the raw response below for a useful operator-facing error.
  }
  if (!response.ok) throw new Error(body.message ?? text ?? `Publisher returned ${response.status}`);
  if (body.published !== 1) {
    throw new Error(body.errors?.map((entry) => entry.error).filter(Boolean).join("; ") || "Payload did not publish the approved change.");
  }
}

async function publishApproved(id: string, result: DecisionResult): Promise<DecisionResult> {
  if (result.status !== "approved") {
    revalidateAll();
    return result;
  }
  try {
    await publishThroughSyncService(id);
    revalidateAll();
    return { resolved: true, status: "published" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await transaction((client) =>
      client.query(
        `UPDATE change_events SET error = $1, updated_at = now()
         WHERE id = $2 AND status = 'approved'`,
        [message, id],
      ).then(() => undefined),
    );
    revalidateAll();
    return { resolved: true, status: "approved", error: message };
  }
}

async function decideAllFields(id: string, decision: Decision): Promise<DecisionResult> {
  const result = await transaction(async (client) => {
    const selected = await client.query<ReviewRow>(
      `SELECT diff, review_diff
       FROM change_events
       WHERE id = $1 AND status = 'pending_review'
       FOR UPDATE`,
      [id],
    );
    const row = selected.rows[0];
    if (!row) return { resolved: true, status: "rejected" } as const;

    const working = row.review_diff ?? row.diff ?? {};
    const fields = working.fields ?? [];
    const decisions = Object.fromEntries(fields.map((field) => [field.sourceKey, decision]));
    const approvedFields = decision === "approved" ? fields : [];
    const status: ReviewStatus = approvedFields.length > 0 ? "approved" : "rejected";
    const reviewDiff: ChangeDiff = { ...working, fields: approvedFields, decisions };

    await client.query(
      `UPDATE change_events
       SET review_diff = $1, status = $2, error = NULL, updated_at = now()
       WHERE id = $3 AND status = 'pending_review'`,
      [JSON.stringify(reviewDiff), status, id],
    );
    return { resolved: true, status };
  });

  return publishApproved(id, result);
}

export async function approveChange(id: string): Promise<DecisionResult> {
  return decideAllFields(id, "approved");
}

export async function rejectChange(id: string): Promise<DecisionResult> {
  return decideAllFields(id, "rejected");
}

export async function saveReviewDiff(id: string, diff: ChangeDiff) {
  await transaction(async (client) => {
    const selected = await client.query<ReviewRow>(
      `SELECT diff, review_diff
       FROM change_events
       WHERE id = $1 AND status = 'pending_review'
       FOR UPDATE`,
      [id],
    );
    const row = selected.rows[0];
    if (!row) return;

    const working = row.review_diff ?? row.diff ?? {};
    const reviewDiff: ChangeDiff = {
      ...working,
      fields: diff.fields ?? working.fields,
      sectionsAdded: diff.sectionsAdded ?? working.sectionsAdded,
      sectionsRemoved: diff.sectionsRemoved ?? working.sectionsRemoved,
      decisions: working.decisions ?? {},
    };

    await client.query(
      `UPDATE change_events SET review_diff = $1, updated_at = now()
       WHERE id = $2 AND status = 'pending_review'`,
      [JSON.stringify(reviewDiff), id],
    );
  });
  revalidateAll();
}

export async function decideChangeField(
  id: string,
  sourceKey: string,
  decision: Decision,
): Promise<DecisionResult> {
  const result = await transaction(async (client) => {
    const selected = await client.query<ReviewRow>(
      `SELECT diff, review_diff
       FROM change_events
       WHERE id = $1 AND status = 'pending_review'
       FOR UPDATE`,
      [id],
    );
    const row = selected.rows[0];
    if (!row) return { resolved: true, status: "rejected" } as const;

    const working = row.review_diff ?? row.diff ?? {};
    const fields = working.fields ?? [];
    if (!fields.some((field) => field.sourceKey === sourceKey)) {
      throw new Error("Unknown review field");
    }

    const decisions = { ...(working.decisions ?? {}), [sourceKey]: decision };
    const resolved = fields.every((field) => decisions[field.sourceKey] !== undefined);
    const approvedFields = resolved
      ? fields.filter((field) => decisions[field.sourceKey] === "approved")
      : fields;
    const status: ReviewStatus = resolved
      ? approvedFields.length > 0
        ? "approved"
        : "rejected"
      : "pending_review";
    const reviewDiff: ChangeDiff = { ...working, fields: approvedFields, decisions };

    await client.query(
      `UPDATE change_events
       SET review_diff = $1, status = $2, error = NULL, updated_at = now()
       WHERE id = $3 AND status = 'pending_review'`,
      [JSON.stringify(reviewDiff), status, id],
    );
    return { resolved, status };
  });

  return publishApproved(id, result);
}

export async function retryPublish(id: string): Promise<void> {
  await publishApproved(id, { resolved: true, status: "approved" });
}
