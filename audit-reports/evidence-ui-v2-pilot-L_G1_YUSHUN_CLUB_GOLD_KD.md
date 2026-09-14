# Evidence UI v2 dry-run pilot: GI優駿倶楽部黄金

- Mode: **DRY RUN / canonical未変更**
- Legacy input: INP_EVI_SETTING_FLOOR / 確認した設定下限 (enum)
- Legacy Evidence definitions: 5
- Proposed observation groups: 2
- Proposed observation inputs: 7
- Research coverage: PASS
- Legacy Evidence coverage: PASS
- Errors: 0

## Proposed groups

### トロフィー

- [ ] 銅 → allowed: SET_2/SET_3/SET_4/SET_5/SET_6; denied: SET_1; source: RE_TROPHY_2PLUS
- [ ] 銀 → allowed: SET_3/SET_4/SET_5/SET_6; denied: SET_1/SET_2; source: RE_TROPHY_3PLUS
- [ ] 金 → allowed: SET_4/SET_5/SET_6; denied: SET_1/SET_2/SET_3; source: RE_TROPHY_4PLUS
- [ ] クローバー柄 → allowed: SET_5/SET_6; denied: SET_1/SET_2/SET_3/SET_4; source: RE_TROPHY_5PLUS
- [ ] 虹 → allowed: SET_6; denied: SET_1/SET_2/SET_3/SET_4/SET_5; source: RE_TROPHY_6

### AT終了画面

- [ ] まこ&アリア → allowed: SET_4/SET_5/SET_6; denied: SET_1/SET_2/SET_3; source: RE_END_4PLUS
- [ ] 黄金衣装 → allowed: SET_6; denied: SET_1/SET_2/SET_3/SET_4/SET_5; source: RE_END_6

## Safety

- 設定結果そのものを入力させず、実際に観測した現象をチェックする。
- 設定下限／否定結果はResearchのallowedSettings / deniedSettingsから導出する。
- このpilotは監査レポートのみを生成し、machine-package.json / Research / Selection / canonical UI / catalogを変更しない。

## Errors

- none
