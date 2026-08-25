const trim = value => typeof value === 'string' ? value.trim() : '';

const GENERIC_SELECTED = /^(採用|主Featureとして採用|補助Featureとして採用|Fallbackとして採用|設定推測に使用|設定差があるため採用)[。.]?$/;
const GENERIC_REJECTED = /^(低頻度|設定差が小さい|必要試行量が多い|参考|不採用|重複)[。.]?$/;
const CONCRETE_BASIS = /(分母|観測|判別|設定差|公開|振り分け|独立|重複|二重評価|必要試行|試行量|確率|構成|情報量|確定|否定|示唆|部分集合|低頻度|高頻度|全設定|サンプル|母数|排他|条件|状態|経路|Fallback|抑制)/;

function collectEvidenceRefs(selection) {
  const refs = new Set();
  for (const item of selection.evidence ?? []) {
    if (item.researchEvidenceId) refs.add(item.researchEvidenceId);
    for (const id of item.sourceEvidenceIds ?? []) refs.add(id);
  }
  for (const group of selection.evidenceUi?.groups ?? []) {
    for (const option of group.options ?? []) {
      for (const id of option.sourceEvidenceIds ?? []) refs.add(id);
    }
  }
  for (const decision of selection.evidenceDecisions ?? []) {
    if (decision.researchEvidenceId) refs.add(decision.researchEvidenceId);
  }
  return refs;
}

export function assessSelectionQuality(research, selection) {
  const blockers = [];
  const reviews = [];
  const featureDecisions = new Map();
  for (const feature of selection.features ?? []) {
    if (!feature.researchFeatureId) continue;
    if (featureDecisions.has(feature.researchFeatureId)) blockers.push(`duplicate feature decision: ${feature.researchFeatureId}`);
    featureDecisions.set(feature.researchFeatureId, feature);
  }

  const researchFeatureIds = (research.features ?? []).map(f => f.researchFeatureId).filter(Boolean);
  const missingFeatureDecisions = researchFeatureIds.filter(id => !featureDecisions.has(id));
  for (const id of missingFeatureDecisions) blockers.push(`unclassified research feature: ${id}`);

  const evidenceRefs = collectEvidenceRefs(selection);
  const researchEvidenceIds = (research.evidenceCandidates ?? []).map(e => e.researchEvidenceId).filter(Boolean);
  const missingEvidenceDecisions = researchEvidenceIds.filter(id => !evidenceRefs.has(id));
  for (const id of missingEvidenceDecisions) blockers.push(`unclassified research evidence: ${id}`);

  for (const feature of selection.features ?? []) {
    const id = feature.featureId ?? feature.researchFeatureId ?? '(unknown)';
    const included = ['INCLUDE_PRIMARY', 'INCLUDE_SUPPORT', 'INCLUDE_FALLBACK'].includes(feature.adoptionCategory);
    const rejected = feature.adoptionCategory === 'EXCLUDE';
    if (included) {
      const reason = trim(feature.userReason);
      if (!reason) blockers.push(`selected ${id}: missing userReason`);
      else {
        if (GENERIC_SELECTED.test(reason) || reason.length < 18) reviews.push(`selected ${id}: reason is too generic: ${reason}`);
        if (!CONCRETE_BASIS.test(reason)) reviews.push(`selected ${id}: reason lacks a concrete statistical/observational basis`);
      }
    }
    if (rejected) {
      const reason = trim(feature.userFacingReason) || trim(feature.userReason) || trim(feature.rejectionReason);
      if (!reason) blockers.push(`rejected ${id}: missing user-facing reason`);
      else {
        if (GENERIC_REJECTED.test(reason) || reason.length < 10) reviews.push(`rejected ${id}: reason is too generic: ${reason}`);
        if (!CONCRETE_BASIS.test(reason)) reviews.push(`rejected ${id}: reason lacks a concrete basis`);
      }
    }
  }

  return {
    status: blockers.length ? 'BLOCKED' : reviews.length ? 'REVIEW' : 'PASS',
    blockers,
    reviews,
    coverage: {
      researchFeatures: researchFeatureIds.length,
      classifiedFeatures: researchFeatureIds.length - missingFeatureDecisions.length,
      researchEvidence: researchEvidenceIds.length,
      classifiedEvidence: researchEvidenceIds.length - missingEvidenceDecisions.length,
      missingFeatureDecisions,
      missingEvidenceDecisions,
    },
  };
}
