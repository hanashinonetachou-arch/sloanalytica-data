# Phase 11B Selection Policy Migration Report

## 目的
設定推測要素の「評価件数 / 採用 / 不採用 / 必要試行量」を既存機種へ展開するため、SelectionDataの説明情報とBuilder再現性を監査する。

## 実施内容
- 化物語・東京喰種の不採用理由を、既存Research / 運用レポート / 公開MachineDataに残る根拠からSelectionDataへ反映。
- レヴュースタァライトの conditional_partial_multinomial と named implicit residual multinomial をBuilderで再現可能にした。
- レヴュースタァライトの旧Evidence入力・ID契約を、公開済みMachineDataからSelectionDataへ逆移植。
- 旧DISPLAY_ONLYを廃止。無職転生はヒトガミ突入率をEXCLUDEへ移行し入力は依存入力として維持。コードギアスとエウレカの不要な参考入力は削除。
- 公開数値モデルが存在しない場合、必要試行量を無理に生成せず「算出不能が正常」とReadinessで区別。
- `selection:summary-readiness` と `selection:migration-audit` により、説明データ準備と推測契約維持を別々に監査可能にした。

## Readiness
- READY 10 / REVIEW 0 / BLOCKED 0
- Legacy DISPLAY_ONLY: 0

## Runtime migration audit
推測計算契約を変えずに現時点でそのまま移行可能:
- L_INITIAL_D_2ND
- L_KAGUYA_SAMA_JA
- L_TOKYO_GHOUL
- S_IM_JUGGLER_EX_TP
- S_REVUE_STARLIGHT_CX

個別の既存契約調整が必要:
- L_MUSHOKU_TENSEI_NM: Evidence契約差
- L_SMASLO_BAKEMONOGATARI_KH: Evidence契約差
- S_CODE_GEASS_3_CC_FS: AT終了画面 denominatorInputIds / Evidence契約差
- S_EUREKA_SEVEN_HIEVO_XS: Evidence契約差
- S_MY_JUGGLER_V_KD: marginal_multinomial契約、およびREG単独構成のSelection weight 0.35 と公開MachineData weight 1.0 の差

## 原則
今回のSelection UI追加を理由に、既存の推測ロジックを暗黙に変更しない。Runtime migration auditがPASSした機種だけを自動移行候補とする。
