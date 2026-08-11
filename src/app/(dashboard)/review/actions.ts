"use server";

import { revalidatePath } from "next/cache";
import { queryOne, transaction } from "@/lib/db";
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

async function waitForPublication(id: string): Promise<void> {
  for (let attempt = 0; attempt < 110; attempt += 1) {
    const change = await queryOne<{ status: string; error: string | null }>(
      `SELECT status, error FROM change_events WHERE id = $1`,
      [id],
    );
    if (!change) throw new Error("The approved change no longer exists.");
    if (change.status === "published" || change.status === "draft_updated") return;
    if (change.error) throw new Error(change.error);
    if (change.status !== "approved") {
      throw new Error(`Publishing stopped with status: ${change.status}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("Approved successfully; the publisher is still processing this change.");
}

async function publishApproved(id: string, result: DecisionResult): Promise<DecisionResult> {
  if (result.status !== "approved") {
    revalidateAll();
    return result;
  }
  try {
    await waitForPublication(id);
    revalidateAll();
    return { resolved: true, status: "published" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
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
  await transaction((client) =>
    client.query(
      `UPDATE change_events SET error = NULL, updated_at = now()
       WHERE id = $1 AND status = 'approved'`,
      [id],
    ).then(() => undefined),
  );
  await publishApproved(id, { resolved: true, status: "approved" });
}
