# StoryMapViewer (OSS)

ブラウザでYAMLのユーザーストーリーマップを可視化/編集する軽量ビューア。

## クイックスタート
1) 任意の静的サーバで  を開く（例: python -m http.server）
2) 初回起動時に examples/sample.yaml が自動登録・表示

## 機能
- CSS Gridでのアクティビティ/バックボーン/ストーリー表示
- バージョン別のスライス線・順序定義 (version_definitions)
- インライン編集（ペルソナ選択/Want/So that/受入条件）とYAML保存
- IndexedDB 永続化
- 画像(PNG)/PDF/Markdown/YAML出力

## デプロイ (Cloud Run)
gcloud builds submit --tag gcr.io/<PROJECT>/story-map-viewer
gcloud run deploy story-map-viewer --image gcr.io/<PROJECT>/story-map-viewer --region asia-northeast1 --allow-unauthenticated --port 8080
