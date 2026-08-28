import fs from 'node:fs';

const path = 'research/S_MHW_ICEBORNE_ZF/selection-data.json';
const s = JSON.parse(fs.readFileSync(path, 'utf8'));
const group = s.evidenceUi?.groups?.find(g => g.groupId === 'EVID_SPECIAL');
if (!group) throw new Error('EVID_SPECIAL not found');
const before = group.options.length;
group.options = group.options.filter(o => !(o.sourceEvidenceIds ?? []).includes('RE_HIGH_WEAK_SELIANA'));
if (group.options.length !== before - 1) throw new Error('RE_HIGH_WEAK_SELIANA UI option not found exactly once');

s.evidenceReview ??= { policyVersion: 1, exclusions: [] };
s.evidenceReview.policyVersion = 1;
const exclusions = s.evidenceReview.exclusions ??= [];
if (!exclusions.some(x => x.researchEvidenceId === 'RE_HIGH_WEAK_SELIANA')) {
  exclusions.push({
    researchEvidenceId: 'RE_HIGH_WEAK_SELIANA',
    reason: '通常/高確を実戦中に確実に識別できるObservation条件が未確定のため、Research候補として保持しつつ現版のEvidence UIには公開しません。実機識別条件の確認後に再評価します。'
  });
}

const notes = s.selectionNotes ??= [];
const note = 'RE_HIGH_WEAK_SELIANAはResearch候補として保持し、通常/高確のObservation識別条件が確定するまでevidenceReviewで明示的に非公開とする。';
if (!notes.includes(note)) notes.push(note);

fs.writeFileSync(path, JSON.stringify(s, null, 2) + '\n');
console.log('UPDATED', path);
