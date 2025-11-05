# Palma拡張ストーリーマップViewer 使用ガイド

## 🎯 概要
新しく作成されたPalma拡張版ストーリーマップYAMLファイルをStoryMapViewerで表示するためのガイドです。

## 📁 対象ファイル
- **ソースファイル**: `/Users/daisukemiyata/aipm_v3/Flow/202509/2025-09-22/palma_enhanced_story_map.yaml`
- **内容**: 既存32ストーリー + 新規15ストーリー = 47ストーリーの統合版

## 🚀 起動方法（3つの方法）

### 方法1: npmスクリプト（推奨）
```bash
cd /Users/daisukemiyata/aipm_v3/Stock/programs/Tools/projects/story_map_viewer
npm run quick:palma
```

### 方法2: シェルスクリプト（詳細版）
```bash
/Users/daisukemiyata/aipm_v3/Stock/programs/Tools/projects/story_map_viewer/scripts/open-palma-enhanced.sh
```

### 方法3: シェルスクリプト（クイック版）
```bash
/Users/daisukemiyata/aipm_v3/Stock/programs/Tools/projects/story_map_viewer/scripts/quick-open-palma.sh
```

## 📱 使用手順

### 1. サーバー起動後
1. ブラウザで `http://localhost:8080` にアクセス
2. 左サイドバーの「ファイル管理」パネルを開く
3. `palma_enhanced_story_map.yaml` を選択
4. ストーリーマップが表示される

### 2. 表示内容
- **7つのアクティビティ**: 組織運営、プロジェクト管理、業務自動化、AI活用、認証・セキュリティ、統合・連携、分析・監視
- **15のバックボーン**: 既存12 + 新規3（高度分析・外部統合・モバイル）
- **6つのペルソナ**: 既存4 + 新規2（システム管理者、開発者・システム管理者）
- **47のストーリー**: MVP〜v2.0までの段階的リリース計画

### 3. 機能
- **ストーリーマップ可視化**: グリッドレイアウトでの表示
- **ペルソナ別色分け**: 各ペルソナごとの色分け表示
- **優先度フィルタ**: 優先度による表示切り替え
- **エクスポート機能**: PNG/PDF出力
- **編集機能**: インライン編集（要注意：元ファイルには自動反映されません）

## ⚠️ 注意事項

### ポート競合について
- ViewerはPalmaサーバー（ポート3000）と競合しないよう、ポート8080を使用
- ポート8080が使用中の場合、スクリプトが自動で対処

### ファイル管理について
- ファイルは`local_secrets/`ディレクトリにコピーされます（.gitignore対象）
- Viewer内で編集した場合、元ファイルへの反映は手動で行う必要があります

### 停止方法
- サーバーを停止するには `Ctrl+C` を押してください

## 🔧 トラブルシューティング

### ファイルが表示されない場合
```bash
# ファイルが正しくコピーされているか確認
ls -la /Users/daisukemiyata/aipm_v3/Stock/programs/Tools/projects/story_map_viewer/local_secrets/

# 手動でファイルをコピー
cp "/Users/daisukemiyata/aipm_v3/Flow/202509/2025-09-22/palma_enhanced_story_map.yaml" \
   "/Users/daisukemiyata/aipm_v3/Stock/programs/Tools/projects/story_map_viewer/local_secrets/"
```

### ポートエラーが発生する場合
```bash
# 使用中のポートを確認
lsof -i :8080

# プロセスを終了
lsof -ti :8080 | xargs kill -9

# 別のポートを使用
python3 -m http.server 8081
```

### ブラウザでアクセスできない場合
1. サーバーが正常に起動しているか確認
2. ファイアウォール設定を確認
3. 別のブラウザで試行
4. `http://127.0.0.1:8080` でアクセス試行

## 📊 表示されるストーリーマップの特徴

### 新規追加ストーリー（15個）
1. **ST-SEARCH-001**: 横断的な全文検索
2. **ST-DASH-CUSTOM-001**: 個人用ダッシュボード
3. **ST-AI-WF-OPT-001**: AIによるワークフロー最適化提案
4. **ST-AI-CTX-SMART-001**: プロジェクト全体を理解するAI
5. **ST-AI-DOC-AUTO-001**: 自動ドキュメント生成
6. **ST-PERM-RBAC-001**: 細かい権限設定
7. **ST-COLLAB-EXT-001**: 外部組織との安全な共有
8. **ST-INTEG-TOOLS-001**: 既存ツールとの連携
9. **ST-API-FULL-001**: 豊富なAPI
10. **ST-MOBILE-RESP-001**: モバイルでの快適な操作
11. **ST-MONITOR-USAGE-001**: 利用状況の詳細分析
12. **ST-BACKUP-DR-001**: データ保護機能

### リリース計画
- **MVP**: 8ストーリー（認証・組織・プロジェクト・ワークフロー基本）
- **Release1**: 6ストーリー（検索・統合・ダッシュボード・権限）
- **v1.0**: 4ストーリー（AI最適化・分析・モバイル）
- **v2.0**: 3ストーリー（完全API・自動ドキュメント・バックアップ）

## 🔄 更新方法

### 元ファイルが更新された場合
```bash
# 最新ファイルを再コピー
npm run quick:palma
```

### 新しいストーリーマップを追加する場合
```bash
# 新しいファイルをlocal_secretsにコピー
cp "新しいファイルのパス" \
   "/Users/daisukemiyata/aipm_v3/Stock/programs/Tools/projects/story_map_viewer/local_secrets/"

# Viewerを再起動
npm start
```

---

**これで、Palma拡張ストーリーマップを簡単にViewerで表示できるようになりました！** 🎉
