/**
 * Guard categorical setting likelihoods against accidental double counting of
 * the same displayed result as an independent setting-hint Evidence outcome.
 *
 * Staging may retain both representations for research/provenance. Promotion
 * must wait for a single canonical observation input and runtime route.
 */
export function categoricalEvidenceMirrorIssues(research: any): string[] {
  const findings: any[] = Array.isArray(research?.findings) ? research.findings : [];
  const evidence = findings.filter(f => f?.observationType === 'evidence');
  const errors: string[] = [];
  const linked = new Set<string>();
  const labels = (e: any): string[] => Array.isArray(e?.semanticCategories)
    ? e.semanticCategories.map((c: any) => c?.label).filter((s: any) => typeof s === 'string' && s.length > 0)
    : [];
  const equalLabels = (a: string[], b: string[]) =>
    a.length === b.length && a.every((s, i) => s === b[i]);
  const equalCategorySets = (a: string[], b: string[]) => {
    const members = new Set(a);
    return a.length === b.length && members.size === a.length
      && new Set(b).size === b.length && b.every(s => members.has(s));
  };
  const numericLabels = (f: any, unordered = false): string[] | null => {
    if (!f?.settingDistribution || typeof f.settingDistribution !== 'object') return null;
    const rows = Object.values(f.settingDistribution);
    if (!rows.length || rows.some(v => typeof v !== 'string')) return null;
    let canonical: string[] | null = null;
    for (const row of rows) {
      const tokens = (row as string).split('/');
      const parsed: string[] = [];
      for (const token of tokens) {
        // Research also retains the established "label 60%" notation.
        // Parse both spellings without changing the concrete label identity.
        const normalized = token.trim();
        const match = normalized.includes(':')
          ? normalized.match(/^(.+?)\s*:\s*(\d+(?:\.\d+)?)%$/)
          : normalized.match(/^(.+?)\s*(\d+(?:\.\d+)?)%$/);
        if (!match) return null;
        const label = match[1].trim();
        if (!label || Number(match[2]) > 100) return null;
        parsed.push(label);
      }
      if (new Set(parsed).size !== parsed.length) return null;
      if (canonical !== null && !(unordered ? equalCategorySets(canonical, parsed) : equalLabels(canonical, parsed))) return null;
      canonical = parsed;
    }
    return canonical;
  };
  for (const f of findings) {
    if (f?.observationType !== 'appearance_distribution') continue;
    const id = String(f.findingId ?? '');
    const cats = numericLabels(f);
    const categorySet = numericLabels(f, true);
    const mirrorId = f?.mirrorsEvidenceFindingId;
    // Malformed or inconsistent rows must not suppress all mirror detection
    // when the explicit link has also been removed.
    if (!categorySet && !mirrorId)
      errors.push('INVALID_CATEGORICAL_MIRROR_DISTRIBUTION:' + id);
    if (mirrorId) {
      const target = evidence.find(e => e.findingId === mirrorId);
      if (!target) errors.push('MIRROR_EVIDENCE_NOT_FOUND:' + id);
      else {
        if (linked.has(mirrorId)) errors.push('MIRROR_EVIDENCE_REUSED:' + id);
        linked.add(mirrorId);
        if (!cats) errors.push('INVALID_CATEGORICAL_MIRROR_DISTRIBUTION:' + id);
        if (cats && !equalLabels(cats, labels(target)))
          errors.push('MIRROR_CATEGORY_MISMATCH:' + id);
        // Runtime already resolves explicit category links into the numerical
        // counter and reuses it for exact constraints. Require every reviewed
        // category to link to this same finding; a status flag alone is insufficient.
        const reconciliation = f.categoricalEvidenceReconciliation;
        const allLinked = Array.isArray(target.semanticCategories)
          && target.semanticCategories.length > 0
          && target.semanticCategories.every((c: any) => c.linkedFindingId === id);
        const reconciled = reconciliation?.type === 'SINGLE_CANONICAL_CATEGORY_INPUT'
          && reconciliation.evidenceFindingId === mirrorId
          && reconciliation.runtimeLinkContract === 'EXPLICIT_CATEGORY_LINK_V1'
          && cats !== null && equalLabels(cats, labels(target)) && allLinked;
        if (!reconciled)
          errors.push('MIRRORED_CATEGORICAL_EVIDENCE_NOT_RECONCILED:' + id);
      }
    } else if (categorySet) {
      // Missing mirror links must not bypass the gate. Identical
      // sets of >=3 concrete categories identify the same observation even
      // when source *IDs* differ (e.g. independently reviewed articles).
      // For small/generic category sets, require an overlapping source ID.
      for (const e of evidence) {
        const sharedSource = (f.sourceIds ?? []).some((sid: string) => (e.sourceIds ?? []).includes(sid));
        const unambiguousCategories = categorySet.length >= 3;
        if ((sharedSource || unambiguousCategories) && equalCategorySets(categorySet, labels(e))) {
          errors.push('UNDECLARED_CATEGORICAL_EVIDENCE_MIRROR:' + id);
          break;
        }
      }
    }
    if (typeof f?.numericRouteStatus === 'string' && f.numericRouteStatus.startsWith('PENDING_'))
      errors.push('PENDING_CATEGORICAL_ROUTE:' + id);
  }
  return errors;
}
