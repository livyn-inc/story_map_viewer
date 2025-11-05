---
name: Palma拡張ストーリーマップを開く
description: 新しく作成されたPalma拡張版ストーリーマップYAMLをViewerで表示
---

# Palma拡張ストーリーマップViewer起動コマンド

## 概要
新しく作成されたPalma拡張版ストーリーマップYAMLファイルをStoryMapViewerで表示するためのコマンドです。

## 対象ファイル
- **ソースファイル**: `/Users/daisukemiyata/aipm_v3/Flow/202509/2025-09-22/palma_enhanced_story_map.yaml`
- **Viewer**: `/Users/daisukemiyata/aipm_v3/Stock/programs/Tools/projects/story_map_viewer`

## 実行手順

### 1. ファイルコピー（自動化）
```bash
# 拡張ストーリーマップをViewerのlocal_secretsにコピー
cp "/Users/daisukemiyata/aipm_v3/Flow/202509/2025-09-22/palma_enhanced_story_map.yaml" \
   "/Users/daisukemiyata/aipm_v3/Stock/programs/Tools/projects/story_map_viewer/local_secrets/palma_enhanced_story_map.yaml"
```

### 2. Viewer起動
```bash
# ViewerディレクトリでHTTPサーバー起動
cd /Users/daisukemiyata/aipm_v3/Stock/programs/Tools/projects/story_map_viewer
python3 -m http.server 8080
```

### 3. ブラウザアクセス
```
http://localhost:8080
```

### 4. ファイル選択
1. 左サイドバーの「ファイル管理」から
2. `palma_enhanced_story_map.yaml` を選択
3. ストーリーマップが表示される

## 特徴
- **47ストーリー**: 既存32 + 新規15ストーリー
- **7アクティビティ**: 組織運営、プロジェクト管理、業務自動化、AI活用、認証・セキュリティ、統合・連携、分析・監視
- **15バックボーン**: 既存12 + 新規3バックボーン
- **6ペルソナ**: 既存4 + 新規2ペルソナ（システム管理者、開発者）

## 表示内容
- 統合版ストーリーマップ（v3）
- 実装優先度マトリックス
- リリース計画（MVP → Release1 → v1.0 → v2.0）
- 成功指標定義
- 技術的考慮事項

## 注意事項
- Viewerは既存のPalmaサーバー（ポート3000）と競合しないよう、ポート8080を使用
- ファイルは`local_secrets/`ディレクトリに配置（.gitignore対象）
- 編集機能を使用する場合は、元ファイルへの反映を手動で行う必要あり
