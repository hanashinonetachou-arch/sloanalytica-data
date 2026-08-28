import fs from 'node:fs';

const selectionPath = 'research/S_MHW_ICEBORNE_ZF/selection-data.json';
const s = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));
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
fs.writeFileSync(selectionPath, JSON.stringify(s, null, 2) + '\n');
console.log('UPDATED', selectionPath);

const uiPath = 'research/S_MHW_ICEBORNE_ZF/ui-design-data.json';
const ui = JSON.parse(fs.readFileSync(uiPath, 'utf8'));
const special = ui.sections?.['特殊契機・昇格チャレンジ'];
if (!special) throw new Error('UI special evidence section not found');
special.description = 'レイア希少種パネル、BAR狙え以外からのAT直撃・ロングフリーズなど、Observation条件が確認済みの設定下限確定事象が出た場合に選択します。';
const auditNotes = ui.auditNotes ??= [];
const uiNote = '高確弱レア役からセリエナ防衛戦はResearch候補として保持するが、通常/高確の識別条件が未確定のため現版のEvidence UIには露出しない。';
if (!auditNotes.includes(uiNote)) auditNotes.push(uiNote);
fs.writeFileSync(uiPath, JSON.stringify(ui, null, 2) + '\n');
console.log('UPDATED', uiPath);
