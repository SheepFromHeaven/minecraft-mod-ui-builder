import pkg from "../package.json";
import type { ScreenSpec } from "./types";

/** Current webapp version, stamped onto every exported screen/project JSON. */
export const APP_VERSION: string = pkg.version;

/**
 * Registry of format migrations for exported screen/project JSON.
 *
 * Register one entry here whenever the exported ScreenSpec or ProjectFile shape changes in a
 * way that older exported files can no longer be read as-is (renamed/restructured field, changed
 * meaning, etc — NOT simply adding a new optional field, which is backwards compatible for free).
 * `version` is the webapp version that INTRODUCED the change; `migrateScreen`/`migrateProject`
 * transform a file last saved on an older version into the shape that version expects. Entries
 * are applied in ascending version order, each on top of the previous one's output, so a file
 * from long ago runs through every migration it missed.
 *
 * Only start registering entries here once the webapp has shipped 1.0.0 — see
 * webapp/AGENTS.md and memory `feedback_format_migrations`.
 */
export interface FormatMigration {
  version: string;
  migrateScreen?: (json: Record<string, unknown>) => Record<string, unknown>;
  migrateProject?: (json: Record<string, unknown>) => Record<string, unknown>;
}

export const MIGRATIONS: FormatMigration[] = [];

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Migrates a possibly-old exported ScreenSpec JSON to the current format, then stamps APP_VERSION. */
export function migrateScreenJson(json: Record<string, unknown>): ScreenSpec {
  const fromVersion = typeof json.appVersion === "string" ? json.appVersion : "0.0.0";
  let result = json;
  for (const m of MIGRATIONS) {
    if (m.migrateScreen && compareVersions(fromVersion, m.version) < 0) {
      result = m.migrateScreen(result);
    }
  }
  return { ...result, appVersion: APP_VERSION } as unknown as ScreenSpec;
}

/** Migrates a possibly-old exported ProjectFile JSON to the current format, then stamps APP_VERSION. */
export function migrateProjectJson(json: Record<string, unknown>): Record<string, unknown> {
  const fromVersion = typeof json.appVersion === "string" ? json.appVersion : "0.0.0";
  let result = json;
  for (const m of MIGRATIONS) {
    if (m.migrateProject && compareVersions(fromVersion, m.version) < 0) {
      result = m.migrateProject(result);
    }
  }
  return { ...result, appVersion: APP_VERSION };
}
