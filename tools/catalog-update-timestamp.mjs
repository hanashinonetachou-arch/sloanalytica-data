export function resolveCatalogTimestamps(existing, actualSha, now) {
  const addedAt = existing?.addedAt ?? now;
  if (!existing || existing.sha256 !== actualSha) {
    return { addedAt, updatedAt: now };
  }
  if (existing.updatedAt !== undefined) {
    return { addedAt, updatedAt: existing.updatedAt };
  }
  return { addedAt };
}
