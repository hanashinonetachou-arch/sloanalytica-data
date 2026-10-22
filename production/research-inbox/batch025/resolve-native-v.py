"""One-time contract-format correction using already retained source values.

Does not perform public research or regenerate the original handoff. Run before
formal Research invalidation/reacceptance; do not rerun on the accepted revision.
"""
import json
import pathlib
import shutil

root = pathlib.Path(__file__).resolve().parents[2]
machine = 'LB_NEW_KING_HANAHANA_V_PF'
batch = root / 'batches/batch-20261022-025'
reviewed = root / 'research-inbox/batch025/reviewed' / (machine + '.json')
doc = json.loads(reviewed.read_text())
assert doc['nativeSettingModelContract']['formalNumericEvaluation'] == 'DEFERRED_UNSUPPORTED_NATIVE_IDENTIFIER'
snapshot = batch / 'revisions/native-v-format-r2'
assert not snapshot.exists(), 'Already snapshotted; do not regenerate history'
snapshot.mkdir(parents=True)
shutil.copy2(reviewed, snapshot / 'reviewed-research.json')
shutil.copytree(batch / 'artifacts' / machine, snapshot / 'artifacts')
shutil.copytree(batch / 'machines' / machine / 'stages', snapshot / 'stages')
for stage in ['RESEARCH', 'EVALUATION', 'ELIGIBILITY', 'CANDIDATE_CONTRACT']:
    shutil.copy2(batch / 'validation' / (machine + '-' + stage + '.json'), snapshot)
shutil.copy2(batch / 'validation/final-contract-verification.json', snapshot)

rows = []
for key in ['BIG', 'REG', 'BONUS_COMBINED']:
    block = next(b for b in doc['blockedItems'] if b['blockId'] == key)
    values = block['retainedSourceValues']
    assert list(values) == ['1', '2', '3', '4', 'V']
    denominator = '総G（ボーナス・BT中を除く）を母数とし、BIG前半・後半は1回のBIGとして記録する。'
    finding = dict(findingId=key, label=block['label'],
                   observationType='reference_distribution' if key == 'BONUS_COMBINED' else 'probability',
                   settingDistribution=values, sourceIds=block['sourceIds'],
                   trialUniverse='BONUS_ELIGIBLE_GAME_TRIAL', denominatorSemantics=denominator,
                   liveObservation=dict(status='EXACT_WITH_SCOPE_TRACKING', reason=denominator),
                   details=[denominator])
    if key != 'BONUS_COMBINED':
        finding.update(dependencyGroupId='BONUS_OUTCOME', dependencyKind='MUTUALLY_EXCLUSIVE',
                       dependencyReason='同じ総GでBIG・REGは排他的な当選結果であり、その他の結果を残余として1つの観測にまとめる。独立には加算しない。')
    else:
        finding['details'].append('合算はBIG・REGからの自動表示のみ。公表合算値は丸めを含む参考値として保持し、独立した推測計算には加算しない。')
    rows.append(finding)
    ledger = next(r for r in doc['researchCompleteness']['candidateLedger'] if r['candidateId'] == key)
    claim = block['label'] + '：設定1・2・3・4・Vの順に' + '／'.join(values.values()) + '。'
    for sc in ledger['sourceClaims']:
        source = next(s for s in doc['sources'] if s['sourceId'] == sc['sourceId'])
        source['claims'][source['claims'].index(sc['claim'])] = claim
        sc['claim'] = claim
    ledger['disposition'] = dict(type='FINDING', refId=key)
doc['findings'] = rows + doc['findings']
doc['blockedItems'] = [b for b in doc['blockedItems'] if b['blockId'] not in ['BIG', 'REG', 'BONUS_COMBINED']]
doc['nativeSettingModelContract'].update(formalNumericEvaluation='NATIVE_IDENTIFIER_SUPPORTED',
    otherProbability='1 - P(BIG) - P(REG)', otherInput='AUTOMATIC_FROM_TRIALS_MINUS_BIG_MINUS_REG',
    implementationRequired=True, implementationScope='APP_IMPLEMENTATION_OUTSIDE_THIS_BATCH_SCOPE')
for row in doc['researchCompleteness']['domains']:
    if row['domain'] == 'MACHINE_SPECIFIC':
        row['note'] = 'LBニューキングハナハナVPF。設定1・2・3・4・Vを固有仮説として保持し、BIG・REG・その他を排他的に扱う。公開値の再調査は不要。'
doc['audit']['nativeSettingFormatResolution'] = dict(
    previousCommit='fa860efe13e1f876801c01f48de79641ae91d37a',
    previousRevision='revisions/native-v-format-r2', retainedRatesUnchanged=True,
    newPublicSearch=False, requiredReacceptance=['RESEARCH', 'EVALUATION', 'ELIGIBILITY', 'CANDIDATE_CONTRACT'],
    schemaChange='Only explicitly SOURCE_DERIVED SET_V enables numeric key V; no renumbering',
    stageStatus='FORMAL_VALIDATION_REQUIRED')
reviewed.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(dict(machineId=machine, status='READY_FOR_FORMAL_REACCEPTANCE', snapshot=str(snapshot))))
