# KM Template Generator 作業メモ（2025-09-23）

## 依頼
- 出力ファイル名: `HHMM_{依頼名}.km`
- 出力フォルダ: `Flow/YYYYMM/YYYY-MM-DD/requests/`

## 実装
- `km_template_generator.py`
  - 依存追加: `re`
  - ファイル名安全化関数 `_sanitize_filename()` を追加
  - 出力先を `.../requests` サブフォルダへ変更
  - 命名を `HHMM_{依頼名}.km` に変更、重複時は `_2`, `_3` 連番
- `README.md`
  - フォルダ構造図を `requests/` 付きに更新
  - デフォルト保存先の説明を `requests/` に更新

## テスト
- 実行コマンド:
  - `python3 Stock/programs/Tools/projects/km-template-generator/km_template_generator.py "AI依頼テスト"`
- 生成結果:
  - `/Users/daisukemiyata/aipm_v3/Flow/202509/2025-09-23/requests/0936_AI依頼テスト.km`
- 内容確認:
  - JSON生成OK（root.text に依頼タイトル、テンプレート構造も生成）
- 補足:
  - 自動オープンで `.km` を開けるアプリが無い環境では OS 既定アプリ起動に失敗メッセージが出るが、ファイル生成自体は成功

## 次アクション
- Git コミット＆プッシュ完了後、ユーザー受け入れ確認
