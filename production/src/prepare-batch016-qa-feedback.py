"""Apply the user's 2026-10-15 presentation feedback without changing rates or IDs."""
import copy
import json
from pathlib import Path

base=Path(__file__).resolve().parents[1]/'batches/batch-20261014-016'
groups={
 'S_KIZUMONOGATARI_FS': ('KIZU_ROLE_INPUT','小役カウント',{'role-joint':'まとめて入力','weak':'弱チェリーのみ','bell':'共通ベルのみ'}),
 'L_GEGEGE_NO_KITARO_KAKUSEI_JC': ('KITARO_PRECURSOR','前兆内訳',{'precursor-12':'通常・チャンス目','precursor-13':'通常・強チャンス目','precursor-17':'百鬼夜行・100G以外'}),
 'L_ASLOT_KONOSUBA_FX': ('KONOSUBA_ROLE_BONUS','小役からのボーナス当選',{'overlap-チェリー':'チェリー','overlap-スイカ':'スイカ','overlap-チャンス目':'チャンス目'}),
 'S_FAMISTA_KAIDO_FB': ('FAMISTA_CHANCE_TIME','チャンスタイム移行',{'cherry-cz':'チェリー','water-cz':'スイカ'}),
}
for mid,(opportunity,title,members) in groups.items():
 paths=list((base/'research-drafts').glob('*/'+mid+'.json'));assert len(paths)==1
 p=paths[0];d=json.loads(p.read_text());before=copy.deepcopy(d)
 history=base/'research-history/pre-qa-feedback-20261015'/p.name;history.parent.mkdir(parents=True,exist_ok=True)
 if not history.exists():history.write_text(json.dumps(before,ensure_ascii=False,indent=2)+'\n')
 for f in d['findings']:
  fid=f['findingId']
  if fid in members:
   f['observationContext']={'groupingApproved':True,'opportunityId':opportunity,'conditionId':fid,'groupTitle':title,'conditionLabel':members[fid]}
   if mid=='S_KIZUMONOGATARI_FS':
    note='同じ小役の別の入力方法です。まとめて入力できる場合は「まとめて入力」を使い、個別タブへ重ねて入力する必要はありません。以前の個別入力は保持します。'
    if note not in f['details']:f['details'].append(note)
 d['packageRevision']=2
 d.setdefault('uiPresentation',{'hiddenDerivedFindingIds':[],'sectionOrder':[],'evidenceSectionMerges':[],'tabGroups':[]})
 if mid=='S_KIZUMONOGATARI_FS':
  d['uiPresentation']['sectionOrder']=['OBS_at','OBS_role-joint','OBS_weak','OBS_bell','EVI_medals','EVI_screen','EVI_panel','EVI_trophy']
 if mid=='L_ASLOT_KONOSUBA_FX':
  pkg=json.loads((base/'artifacts'/mid/'app_runtime/result.json').read_text())['package']
  old=[s['id'] for s in pkg['ui']['v8Sections']]
  bonus=['EVI_mini','EVI_mini-sequences','EVI_stamp','OBS_big-screen','EVI_reg-character']
  numeric=[s for s in old if s.startswith('OBS_') and s not in bonus]
  remaining=[s for s in old if s not in numeric and s not in bonus]
  d['uiPresentation']['sectionOrder']=numeric+bonus+remaining
 assert [f['findingId'] for f in before['findings']]==[f['findingId'] for f in d['findings']]
 assert [f.get('settingDistribution') for f in before['findings']]==[f.get('settingDistribution') for f in d['findings']]
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('Four presentation revisions authored; all rates and finding IDs preserved.')
