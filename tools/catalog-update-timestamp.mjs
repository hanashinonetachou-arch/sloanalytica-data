/**
 * Preserve the original catalog insertion time while advancing updatedAt only
 * when the published MachineData bytes actually change. Legacy unchanged
 * entries intentionally remain without updatedAt so the app can fall back to addedAt.
 */
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
