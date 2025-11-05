#!/bin/bash
# Palma拡張ストーリーマップViewer クイック起動（ワンライナー版）

# ファイルコピー & サーバー起動
cp "/Users/daisukemiyata/aipm_v3/Flow/202509/2025-09-22/palma_enhanced_story_map.yaml" \
   "/Users/daisukemiyata/aipm_v3/Stock/programs/Tools/projects/story_map_viewer/local_secrets/palma_enhanced_story_map.yaml" && \
cd "/Users/daisukemiyata/aipm_v3/Stock/programs/Tools/projects/story_map_viewer" && \
echo "🚀 Palma拡張ストーリーマップViewer起動中..." && \
echo "📱 ブラウザで http://localhost:8080 にアクセス" && \
echo "📋 左サイドバーから 'palma_enhanced_story_map.yaml' を選択" && \
python3 -m http.server 8080
