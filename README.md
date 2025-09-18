# StoryMapViewer (OSS)

YAMLのユーザーストーリーマップをブラウザで可視化・編集する軽量ビューアです。静的ファイルのみで動作します。

## すぐ使う
- ローカルで `index.html` を開くか、簡易HTTPサーバで配信してください（例）
  - Python: `python -m http.server` 実行後、`http://localhost:8000` を開く
  - VS Code Live Server / 任意の静的サーバでも可
- 初回起動時は `examples/sample.yaml` が自動登録・表示されます。

## 主な機能
- アクティビティ/バックボーン/ストーリーの3段グリッド表示（CSS Grid）
- バージョン（例: MVP/Release1/…）による水平スライスと順序制御（`version_definitions.order`）
- インライン編集（ペルソナ選択、I want / So that、受け入れ条件、優先度、バージョン）
  - ペルソナ変更時は、該当ストーリーが対象ペルソナ配下へ移動
  - 特殊ペルソナ「全ユーザー（CrossPersona）」に移動可能（`cross_persona_stories`へ）
- YAMLのバリデーション（参照整合・必須キー）
- 永続化（IndexedDB）
- エクスポート：PNG / PDF / Markdown / YAML
- サイドバー開閉、ファイルタブ（一覧/検索/削除/プレビュー/編集）、アップロードタブ（ドラッグ&ドロップ）、
  フォルダ同期タブ（File System Access API: Chrome/Edge）

## 使い方
1. 左サイドバー「ファイル」タブから、表示したいYAMLを選択
2. 必要に応じて「アップロード」タブからYAMLをドラッグ&ドロップ
3. フォルダの自動取り込みを使う場合は「フォルダ同期」タブでローカルフォルダを選択（Chrome/Edge）
4. 右上の「編集」ボタンでインライン編集を開始/終了
5. 右上の各ボタンから PNG / PDF / Markdown / YAML を保存

### インライン編集
- Want/So that はそれぞれ独立入力。保存時に `I want …, So that …` 形式に再構成されます。
- ペルソナはプルダウン選択。変更するとYAMLの所属が移動します。
- CrossPersona を選ぶと `cross_persona_stories` セクションへ移動（セクションが無い場合は作成）。

### エクスポート
- PNG / PDF: 画面全体をキャプチャしてファイル出力
- Markdown: ストーリーマップの概要をテキスト化
- YAML: 現在編集中の内容を再インポート可能な形式で保存（推奨）

## YAML 仕様（サマリ）
StoryMapViewer v2 互換の最小構成は以下です。

```yaml
integrated_story_map:
  meta:
    created_date: "YYYY-MM-DD"
    project: "<ProjectName>"
    phase: "Discovery - ストーリーマップ"
    description: "説明"
    version: "v2"
    ui_options:
      hide_priority_2: false

  version_definitions:
    order: [MVP, Release1, Release2, Future]

  story_map_structure:
    activities:
      - id: ACT-01
        name: "…"
        description: "…"
        users: ["ペルソナ名"]
    backbones:
      - id: BB-01
        activity_id: ACT-01
        name: "…"
        description: "…"
        sequence: 1

  personas_stories:
    P001:
      name: "ペルソナ名"
      role: "役割"
      description: "説明"
      stories:
        - id: ST-XXX-001
          story: "I want 機能, So that 価値"   # As a … は不要
          backbone_id: BB-01
          version: "MVP"
          priority: 1                     # 1-5
          acceptance_criteria: ["…", "…"]
          ui_screens: ["/path"]
          linked_modules: ["features/…"]
          code_refs: ["apps/.../file"]

  display_order:
    backbones: [BB-01]

  story_mapping:
    ST-XXX-001: { backbone_id: BB-01, sequence: 1 }

  cross_persona_stories:
    - id: CST-001
      story: "I want 共通機能, So that 共通価値"
      backbone_id: BB-99
      version: "MVP"
      priority: 2
```

主な検証ポイント（抜粋）
- `activities[].id` と `backbones[].activity_id` の対応
- `stories[].backbone_id` は `backbones[].id` に存在
- 必須キーの存在（`id`, `name`, `sequence` など）

## フォルダ構成
```
index.html
examples/
  └─ sample.yaml               # 初期サンプル
modules/                        # 表示・編集・検証に関するJSモジュール
styles/                         # スタイル（レイアウト/ファイル一覧/フォルダ同期）
commands/                      # Cursor用コマンド（ダウンロード同等の内容を同梱）
deploy/                         # デプロイ関連（公開対象外/.gitignore）
```

## ライセンス
MIT License © 2025

## 参考リンク
- Live Demo: [StoryMapViewer (Cloud Run)](https://story-map-viewer-663564722264.asia-northeast1.run.app/)

## Cursor Commands（ヘルプからダウンロードできる内容と同等）
このリポジトリには、ヘルプUIからDLできるコマンドファイルと同等の内容を `commands/` に同梱しています。必要に応じて `.cursor/commands/` 配下へコピーしてお使いください。

- `commands/30_story_map_from_code.md` … 既存コードからストーリーマップを逆算生成
- `commands/31_story_map_interactive.md` … 対話でストーリーマップを生成
