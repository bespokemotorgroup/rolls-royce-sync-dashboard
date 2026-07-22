export interface SyncRun {
  id: string;
  trigger: "api" | "cli" | "schedule";
  mode: "baseline" | "sync";
  status: "running" | "completed" | "completed_with_errors" | "failed";
  dry_run: boolean;
  started_at: string;
  completed_at: string | null;
  summary: {
    discovered?: number;
    checked?: number;
    unchanged?: number;
    changed?: number;
    published?: number;
    draftsCreated?: number;
    missingKnown?: number;
    blocked?: number;
    failed?: number;
    errors?: unknown[];
  } | null;
  error: string | null;
}

export interface SourcePage {
  id: string;
  source_url: string;
  locale: string;
  target_collection: "pages" | "models";
  target_slug: string | null;
  payload_document_id: string | null;
  enabled: boolean;
  current_hash: string | null;
  last_checked_at: string | null;
  last_changed_at: string | null;
  last_synced_at: string | null;
  sync_status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface FieldMapping {
  id: string;
  source_page_id: string;
  source_key: string;
  mapping_kind: "text" | "asset" | "link";
  payload_pointer: string;
  status: "pending" | "approved" | "rejected";
  confidence: string;
  metadata: {
    baselineValue?: string;
    sourceUrl?: string;
    currentPayloadMediaId?: string;
    label?: string;
    sourceHref?: string;
    [key: string]: unknown;
  } | null;
  created_at: string;
  updated_at: string;
  // joined
  source_url?: string;
  target_slug?: string | null;
  target_collection?: string;
}

export interface ChangeEvent {
  id: string;
  source_page_id: string;
  sync_run_id: string;
  status:
    | "detected"
    | "reported"
    | "published"
    | "draft_updated"
    | "requires_mapping"
    | "failed";
  previous_hash: string | null;
  current_hash: string | null;
  diff: {
    fields?: Array<{
      sourceKey: string;
      kind: "text" | "asset" | "link";
      previous?: unknown;
      current?: unknown;
    }>;
    sectionsAdded?: unknown[];
    sectionsRemoved?: unknown[];
  } | null;
  payload_result: {
    status?: string;
    blocked?: unknown[];
    applied?: unknown[];
  } | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  // joined
  source_url?: string;
  target_slug?: string | null;
}

export interface PageTemplate {
  id: string;
  target_collection: string;
  target_slug: string;
  source_page_id: string | null;
  block_sequence: Array<{
    index: number;
    blockType: string;
    settings: Record<string, unknown>;
  }> | null;
  created_at: string;
  updated_at: string;
}
