import * as DB from "../db";
import * as LocalDb from "./local-db";
import * as Notifications from "../elements/notifications";
import * as AuthEvent from "../observables/auth-event";
import { Snapshot } from "../constants/default-snapshot";

const EXPORT_VERSION = 1;

type ExportedData = {
  version: number;
  exportedAt: number;
  snapshot: Snapshot;
};

export function exportUserData(): void {
  const snapshot = DB.getSnapshot();
  if (!snapshot) {
    Notifications.add("No user data to export", -1);
    return;
  }

  const exportData: ExportedData = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    snapshot: structuredClone(snapshot),
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().split("T")[0];
  a.download = `monkeytype-userdata-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  Notifications.add("User data exported", 1);
}

export function importUserData(): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text) as ExportedData;

        if (parsed.version !== EXPORT_VERSION) {
          Notifications.add("Unsupported export version", -1);
          return;
        }

        if (
          parsed.snapshot === null ||
          parsed.snapshot === undefined ||
          typeof parsed.snapshot !== "object"
        ) {
          Notifications.add("Invalid user data file", -1);
          return;
        }

        DB.setSnapshot(parsed.snapshot);
        LocalDb.saveSnapshotToLocalStorage(parsed.snapshot);

        AuthEvent.dispatch({
          type: "snapshotUpdated",
          data: { isInitial: false },
        });

        Notifications.add("User data imported successfully", 1);
      } catch {
        Notifications.add("Failed to parse user data file", -1);
      }
    });

    reader.readAsText(file);
  });

  input.click();
}
