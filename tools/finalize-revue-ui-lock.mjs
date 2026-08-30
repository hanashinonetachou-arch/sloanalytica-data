import fs from 'node:fs';

// Finalize after 2026-08-30 physical-device verification.
const path = 'research/S_REVUE_STARLIGHT_CX/user-verified-ui-lock.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
data.status = 'USER_VERIFIED_UI_LOCKED';
data.verifiedAt = '2026-08-30';
data.policy.reason = '2026-08-30のSelection再検討後、実機で着席時入力「通常ゲーム数＋Challenge Revue回数」の2項目構成と前任者CZの推測反映を再確認済み。履歴保持・タブ切替時スクロールを含む関連修正も実機確認済みとして、このUI契約を正式ロックする。';
fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Finalized ${path}`);
