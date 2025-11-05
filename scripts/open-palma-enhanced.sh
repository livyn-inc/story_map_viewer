#!/bin/bash
# Palma拡張ストーリーマップViewer起動スクリプト

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# パス定義
SOURCE_FILE="/Users/daisukemiyata/aipm_v3/Flow/202509/2025-09-22/palma_enhanced_story_map.yaml"
VIEWER_DIR="/Users/daisukemiyata/aipm_v3/Stock/programs/Tools/projects/story_map_viewer"
TARGET_FILE="${VIEWER_DIR}/local_secrets/palma_enhanced_story_map.yaml"
PORT=8080

echo -e "${BLUE}🚀 Palma拡張ストーリーマップViewer起動スクリプト${NC}"
echo "=================================================="

# 1. ソースファイル存在確認
echo -e "${YELLOW}📋 ソースファイル確認中...${NC}"
if [ ! -f "$SOURCE_FILE" ]; then
    echo -e "${RED}❌ ソースファイルが見つかりません: $SOURCE_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✅ ソースファイル確認完了${NC}"

# 2. Viewerディレクトリ確認
echo -e "${YELLOW}📁 Viewerディレクトリ確認中...${NC}"
if [ ! -d "$VIEWER_DIR" ]; then
    echo -e "${RED}❌ Viewerディレクトリが見つかりません: $VIEWER_DIR${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Viewerディレクトリ確認完了${NC}"

# 3. local_secretsディレクトリ作成（存在しない場合）
echo -e "${YELLOW}📂 local_secretsディレクトリ準備中...${NC}"
mkdir -p "${VIEWER_DIR}/local_secrets"
echo -e "${GREEN}✅ local_secretsディレクトリ準備完了${NC}"

# 4. ファイルコピー
echo -e "${YELLOW}📄 ストーリーマップファイルコピー中...${NC}"
cp "$SOURCE_FILE" "$TARGET_FILE"
echo -e "${GREEN}✅ ファイルコピー完了: $(basename "$TARGET_FILE")${NC}"

# 5. ポート使用確認
echo -e "${YELLOW}🔍 ポート${PORT}使用状況確認中...${NC}"
if lsof -i :$PORT > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  ポート${PORT}は既に使用中です。${NC}"
    echo -e "${YELLOW}   既存プロセスを終了しますか？ (y/N): ${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🔄 既存プロセス終了中...${NC}"
        lsof -ti :$PORT | xargs kill -9 2>/dev/null || true
        sleep 2
        echo -e "${GREEN}✅ 既存プロセス終了完了${NC}"
    else
        echo -e "${BLUE}💡 別のポートを使用してください。${NC}"
        echo -e "${BLUE}   例: python3 -m http.server 8081${NC}"
        exit 0
    fi
fi

# 6. Viewerディレクトリに移動
echo -e "${YELLOW}📂 Viewerディレクトリに移動中...${NC}"
cd "$VIEWER_DIR"
echo -e "${GREEN}✅ 移動完了: $(pwd)${NC}"

# 7. HTTPサーバー起動
echo -e "${YELLOW}🌐 HTTPサーバー起動中...${NC}"
echo -e "${BLUE}📱 ブラウザで以下のURLにアクセスしてください:${NC}"
echo -e "${GREEN}   http://localhost:${PORT}${NC}"
echo ""
echo -e "${BLUE}📋 使用方法:${NC}"
echo -e "   1. 左サイドバーの「ファイル管理」を開く"
echo -e "   2. 'palma_enhanced_story_map.yaml' を選択"
echo -e "   3. ストーリーマップが表示されます"
echo ""
echo -e "${YELLOW}⚠️  サーバーを停止するには Ctrl+C を押してください${NC}"
echo "=================================================="

# サーバー起動（フォアグラウンド）
python3 -m http.server $PORT
