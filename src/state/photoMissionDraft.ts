const drafts = new Map<string, string>();

export function getPhotoMissionDraft(key: string): string | null {
  return drafts.get(key) ?? null;
}

export function setPhotoMissionDraft(key: string, uri: string): void {
  const normalized = uri.trim();

  if (normalized.length === 0) {
    drafts.delete(key);
    return;
  }

  drafts.set(key, normalized);
}
