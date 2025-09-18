/**
 * HelpView - ヘルプ＆ドキュメントUI
 * 使い方、YAML仕様、Cursorコマンドのダウンロードを提供
 */

class HelpView {
  constructor() {
    this.container = null;
  }

  /**
   * ヘルプビューの初期化
   * @param {HTMLElement} container - コンテナ要素
   */
  init(container) {
    this.container = container;
    this.render();
    this.attachEventListeners();
  }

  /**
   * ヘルプコンテンツのレンダリング
   */
  render() {
    this.container.innerHTML = `
      <div class="help-sections">
        <!-- 使い方セクション -->
        <section class="help-section">
          <h4>📖 使い方</h4>
          <div class="help-content-block">
            <h5>基本的な操作</h5>
            <ol>
              <li><strong>YAMLファイルの読み込み</strong>
                <ul>
                  <li>「アップロード」タブからファイルをドラッグ＆ドロップ</li>
                  <li>「フォルダ」タブからローカルフォルダを監視</li>
                  <li>初回起動時はサンプルファイルが自動読み込み</li>
                </ul>
              </li>
              <li><strong>ストーリーマップの表示</strong>
                <ul>
                  <li>ファイル一覧から表示したいYAMLを選択</li>
                  <li>ストーリーカードをクリックで詳細表示</li>
                  <li>横スクロールで全体を確認</li>
                </ul>
              </li>
              <li><strong>YAMLの編集</strong>
                <ul>
                  <li>ファイル一覧の👁ボタンで表示</li>
                  <li>「編集」ボタンで編集モード</li>
                  <li>保存するとストーリーマップに即反映</li>
                </ul>
              </li>
              <li><strong>エクスポート</strong>
                <ul>
                  <li>PNG/PDFで画像として保存</li>
                  <li>編集済みYAMLもダウンロード可能</li>
                </ul>
              </li>
            </ol>
          </div>
        </section>

        <!-- YAML仕様セクション -->
        <section class="help-section">
          <h4>📋 YAML仕様</h4>
          <div class="help-content-block">
            <h5>完全なYAML構造</h5>
            <pre class="yaml-spec"><code>integrated_story_map:
  meta:
    created_date: "2024-01-15"
    project: "ProjectName"
    phase: "Discovery - ストーリーマップ"
    description: "プロジェクトの概要説明"
    version: "v2"
    source: "コード解析ベースor手動作成"
    ui_options:
      hide_priority_2: false

  version_definitions:
    order: [MVP, Release1, Release2, v1.0, Future]

  analysis_targets:
    frontend_routes: ["apps/web/src/routes/(auth)", ".../project/**"]
    domain_features: ["features/organization", "features/project"]
    backend_schema: ["packages/prisma/schema/_schema.prisma"]

  story_map_structure:
    activities:
      - id: ACT-01
        name: "組織運営"
        description: "組織の管理と運営に関する活動"
        users: ["組織管理者", "チームリーダー"]

    backbones:
      - id: BB-01
        activity_id: ACT-01
        name: "組織セットアップ"
        description: "組織の初期設定と構築"
        sequence: 1

  personas_stories:
    P001:
      name: "組織管理者"
      role: "組織全体の管理・設定"
      description: "組織の構造やメンバーを管理する責任者"
      stories:
        - id: ST-ORG-001
          story: "As an 組織管理者, I want チーム作成, So that 組織を構築できる"
          backbone_id: BB-01
          version: "MVP"
          priority: 1
          acceptance_criteria:
            - "新規チーム作成が成功し、DBに反映される"
            - "権限のないユーザーは作成操作ができない"
            - "作成後、チーム一覧に即座に反映される"
          ui_screens: ["/team/new", "/organization/select"]
          linked_modules: ["features/organization", "features/team"]
          code_refs:
            - "apps/web/src/lib/features/organization/workflows/createTeamWorkflow.ts"
            - "apps/web/src/routes/team/new/+page.server.ts"
            - "packages/prisma/schema/organization.prisma"

  display_order:
    backbones: [BB-01, BB-04, BB-11]

  story_mapping:
    ST-ORG-001: { backbone_id: BB-01, sequence: 1 }

  mvp_release_plan:
    mvp:
      total_stories: 32
      implementation_period: "1-4ヶ月"
      release_criteria:
        - "優先度1のストーリーがすべて完了"
        - "基本的な認証・組織・プロジェクト機能が動作"
        - "最低限のワークフロー実行が可能"

  cross_persona_stories:
    - id: CST-UX-PERF-001
      story: "As 全ユーザー, I want 主要画面のパフォーマンス最適化, So that 快適に利用できる"
      acceptance_criteria:
        - "初期表示が2秒以内"
        - "遅延ロードの実装"
        - "重いコンポーネントの分離"

  success_metrics_by_story:
    ST-ORG-001:
      metric: "チーム作成成功率"
      measurement: "エラー率 < 1%"</code></pre>
            
            <h5>ID命名規則</h5>
            <div class="help-content-block">
              <p><strong>アクティビティ:</strong> ACT-01, ACT-02, ...</p>
              <p><strong>バックボーン:</strong> BB-01, BB-02, ...</p>
              <p><strong>ストーリーID（ドメイン別）:</strong></p>
              <ul>
                <li>組織関連: ST-ORG-###</li>
                <li>チーム関連: ST-TEAM-###</li>
                <li>プロジェクト: ST-PRJ-###</li>
                <li>ワークフロー: ST-WF-###</li>
                <li>コンテキスト: ST-CB-###</li>
                <li>チャット: ST-CHAT-###</li>
                <li>認証: ST-AUTH-###</li>
                <li>アクティビティ: ST-ACT-###</li>
                <li>クロスペルソナ: CST-###</li>
              </ul>
            </div>
            
            <h5>バリデーションルール</h5>
            <ul>
              <li><strong>必須フィールド:</strong> integrated_story_map, story_map_structure, activities, backbones</li>
              <li><strong>参照整合性:</strong> backbone.activity_id は activities.id に存在する必要あり</li>
              <li><strong>ストーリー整合性:</strong> story.backbone_id は backbones.id に存在する必要あり</li>
              <li><strong>優先度:</strong> 1（必須）〜 5（将来検討）の5段階</li>
              <li><strong>バージョン:</strong> 任意の文字列（例: MVP, Release1, v1.0）</li>
            </ul>
            
            <h5>ストーリーの形式</h5>
            <p>各ペルソナの <code>stories</code> 配列にすべてのストーリーを格納し、各ストーリーに <code>priority</code> 属性（1-5）と <code>version</code> 属性を設定します。</p>
            
            <h5>注意事項</h5>
            <ul>
              <li>すべての参照（activity_id, backbone_id）は存在するIDを指定する必要があります</li>
              <li>表示順序を制御したい場合は <code>display_order.backbones</code> を使用</li>
              <li>ストーリーIDは重複しないようにドメイン別の命名規則に従ってください</li>
              <li>受け入れ条件は実装の根拠が分かるように具体的に記述することを推奨</li>
            </ul>
          </div>
        </section>

        <!-- Cursorコマンドセクション -->
        <section class="help-section">
          <h4>🚀 Cursorコマンド</h4>
          <div class="help-content-block">
            <h5>ストーリーマップ生成コマンド</h5>
            <p>以下のコマンドファイルをダウンロードして、Cursorで使用できます：</p>
            
            <div class="command-item">
              <h6>📝 リバースエンジニアリング版</h6>
              <p>既存のソースコードからユーザーストーリーマップを逆算生成</p>
              <button class="download-btn" data-command="reverse-engineering">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                ダウンロード
              </button>
            </div>
            
            <div class="command-item">
              <h6>💬 インタラクティブ版</h6>
              <p>対話形式で要件を整理しながらストーリーマップを作成</p>
              <button class="download-btn" data-command="interactive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                ダウンロード
              </button>
            </div>
            
            <h5>Cursorでの使い方</h5>
            <ol>
              <li>ダウンロードしたファイルを <code>.cursor/commands/</code> フォルダに配置</li>
              <li>Cursorを再起動（またはコマンドパレットでリロード）</li>
              <li>チャット画面で <code>/</code> を入力してコマンドを選択</li>
              <li>指示に従って情報を提供</li>
              <li>生成されたYAMLをこのツールで可視化</li>
            </ol>
            
            <div class="help-note">
              <strong>💡 ヒント：</strong> SerenaMCPと組み合わせることで、より高度なコード解析とストーリー生成が可能です。
            </div>
          </div>
        </section>

        
      </div>
    `;
  }

  /**
   * イベントリスナーの設定
   */
  attachEventListeners() {
    // ダウンロードボタンのイベント
    const downloadBtns = this.container.querySelectorAll('.download-btn');
    downloadBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const commandType = btn.dataset.command;
        this.downloadCommand(commandType);
      });
    });
  }

  /**
   * コマンドファイルのダウンロード
   */
  downloadCommand(type) {
    let filename, content;
    
    if (type === 'reverse-engineering') {
      filename = '30_story_map_from_code.md';
      content = this.getReverseEngineeringCommand();
    } else if (type === 'interactive') {
      filename = '31_story_map_interactive.md';
      content = this.getInteractiveCommand();
    }
    
    // ダウンロード実行
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * リバースエンジニアリング版コマンド内容
   */
  getReverseEngineeringCommand() {
    return `---
name: Serena: ユーザーストーリーマップを生成（深度強化・integrated_story_map.yaml形式）
---

以下のガイドラインに従い、コードからユーザーストーリー（受け入れ条件・UI・コード参照付き）を網羅的に抽出し、\`integrated_story_map.yaml\`と同構造で出力してください。

【対象ディレクトリ（例）】
- apps/web/src/routes/**（(auth)/(dashboard)/organization/project/team/api）
- apps/web/src/lib/features/**（organization/project/workflow/context-bucket/thread 等）
- packages/prisma/schema/**（_schema.prisma, auth.prisma）

【ID命名規則】
- ORG: ST-ORG-###, TEAM: ST-TEAM-###, PRJ: ST-PRJ-###, WF: ST-WF-###,
  CB: ST-CB-###, CHAT: ST-CHAT-###, AUTH: ST-AUTH-###, ACT: ST-ACT-###

【ストーリー生成ルール】各ドメインで主要機能を洗い出し、最低25件以上を初回で生成:
- 組織/チーム: 組織一覧・切替・作成・ダッシュボード・所属切替UI、チーム作成/メンバー管理/ロール
- プロジェクト: 作成/一覧/更新/削除、ダッシュボード、検索/並び替え
- ワークフロー: 一覧/参照/実行、編集（ノード/エッジ/設定検証）、新規作成、YAML入出力、検索、テンプレ起点作成、自動レイアウト
- コンテキスト/チャット: ファイルツリー/プレビュー/CRUD、D&Dアップロード、WF入出力、チャット、会話履歴
- 認証/文脈切替: サインアップ/ログイン/ログアウト、アクティブTeam/Org切替、セッション復元

【各ストーリーに必須で含める項目】
- id: 上記命名に従う（例: ST-ORG-LIST-001, ST-TEAM-001, ST-PRJ-UPDATE-001, ST-WF-AUTO-001 など）
- story: As a ..., I want ..., So that ...
- acceptance_criteria: 3項目以上（実装から根拠が分かる形で）
- ui_screens: 関連ルート/画面（例: "/project/[projectId]"）
- linked_modules: 関連する機能モジュール（例: "features/workflow"）
- code_refs: 実装ファイルの相対パス（例: "apps/web/src/lib/features/workflow/components/WorkflowEditor.svelte"）を2-4件
- version: "MVP" など
- priority: 1-5の数値

【受け入れ条件の作り方（実装根拠ベース）】
- スキーマ/型の検証（schema.ts / *.prisma / dto 等）
- APIエンドポイントの成功/失敗（routes/api/**/+server.ts）とCookie/Session反映
- UIコンポーネントの動作（*.svelte / *.remote.ts）とバリデーション/エラーハンドリング
- パフォーマンス/UX（遅延ロード、重コンポーネントの分離）

【追加出力（必須）】
- version_definitions.order（例: [MVP, Release1, Release2, v1.0, Future]）
- story_map_structure.activities / backbones
- display_order.backbones（表示順定義）
- story_mapping（各STの配置: backbone_id, sequence）
- mvp_release_plan.total_stories / implementation_period / release_criteria
- cross_persona_stories（少なくとも2件）
- success_metrics_by_story（各STごとに1セット）

【出力例（v2スキーマ）】
\`\`\`yaml
integrated_story_map:
  meta:
    created_date: "2024-01-15"
    project: "Palma MVP1"
    phase: "Discovery - ストーリーマップ"
    description: "コード解析ベースの初回ドラフト（自動生成）"
    version: "v2"
    source: "apps/web + packages/prisma からの抽出"
    ui_options:
      hide_priority_2: false

  version_definitions:
    order: [MVP, Release1, Release2, v1.0, Future]

  story_map_structure:
    activities:
      - id: ACT-01
        name: "組織運営"
        description: "組織の管理・運営に関する活動"
        users: ["組織管理者", "チームリーダー"]
    
    backbones:
      - id: BB-01
        activity_id: ACT-01
        name: "組織セットアップ"
        description: "組織の初期設定と構築"
        sequence: 1

  personas_stories:
    P001:
      name: "組織管理者"
      role: "Org/Team 管理・設定"
      stories:
        - id: ST-ORG-001
          story: "As an 組織管理者, I want チーム作成・切替, So that 組織の作業単位を柔軟に管理できる"
          backbone_id: BB-01
          version: "MVP"
          priority: 1
          acceptance_criteria:
            - "新規チーム作成が成功し、DBに反映される（createTeamWorkflow）"
            - "アクティブチーム切替が反映され、ダッシュボードが更新される（setActiveTeamWorkflow）"
            - "権限のないユーザーは作成/切替操作ができない"
          ui_screens: ["/team/new", "/organization/select"]
          linked_modules: ["features/organization"]
          code_refs:
            - "apps/web/src/lib/features/organization/workflows/createTeamWorkflow.ts"
            - "apps/web/src/routes/organization/select/+page.server.ts"

  display_order:
    backbones: [BB-01, BB-04, BB-11]

  story_mapping:
    ST-ORG-001: { backbone_id: BB-01, sequence: 1 }

  mvp_release_plan:
    mvp:
      total_stories: 32
      implementation_period: "1-4ヶ月"
      release_criteria:
        - "優先度1のストーリーがすべて完了"
        - "基本的な認証・組織・プロジェクト機能が動作"
        - "最低限のワークフロー実行が可能"
\`\`\`

【出力先】
- Flow/＜YYYYMM＞/＜YYYY-MM-DD＞/＜ProjectName＞/3_discovery/04_ストーリーマップ/integrated_story_map_draft.yaml
`;
  }

  /**
   * インタラクティブ版コマンド内容
   */
  getInteractiveCommand() {
    return `---
name: Story Map Interactive Creation
---

対話形式でユーザーストーリーマップを作成します。

## プロセス

### Phase 1: プロジェクト概要の把握

以下の情報を教えてください：

1. **プロジェクト基本情報**
   - プロジェクト名：
   - プロジェクトの目的（解決したい課題）：
   - 想定する利用者層：
   - 主な競合サービス（あれば）：

2. **参考資料の確認**
   - 既存の企画書やPRDはありますか？
   - ワイヤーフレームやデザインはありますか？
   - 既存システムとの連携要件はありますか？

### Phase 2: ペルソナの定義

各ペルソナについて以下を定義します：

1. **ペルソナ名**（例：一般ユーザー、管理者、ゲストユーザー）
2. **ペルソナの特徴**
   - 役割・立場
   - 課題・ニーズ
   - システムを使う目的
3. **利用シナリオ**
   - どんな時に使うか
   - どんな価値を得たいか

### Phase 3: 機能の洗い出し

1. **アクティビティ（大分類）**
   - ユーザーが達成したい大きな目標
   - 例：「商品を購入する」「コンテンツを管理する」

2. **バックボーン（機能グループ）**
   - アクティビティを構成する機能群
   - 例：「商品検索」「カート管理」「決済処理」

3. **ユーザーストーリー**
   - 各バックボーンに含まれる具体的な機能
   - As a [ペルソナ], I want [機能], So that [価値] の形式で記述

### Phase 4: 優先順位付け

1. **バージョン分け**
   - MVP（最小限の機能セット）
   - Version 1.0
   - Future（将来的な拡張）

2. **優先度設定**
   - 1: 必須（ないとサービスが成立しない）
   - 2: 重要（ユーザー体験に大きく影響）
   - 3: 標準（あると便利）
   - 4: Nice to have
   - 5: 将来的な検討事項

### Phase 5: 詳細化

選択したストーリーについて：

1. **受け入れ条件**
   - 機能が完成したと言える条件
   - テスト可能な具体的な基準

2. **UI/UX要件**
   - 関連する画面
   - 操作フロー

3. **技術的考慮事項**
   - API設計
   - データモデル
   - セキュリティ要件

## 質問テンプレート

### 初回質問セット
1. プロジェクトの名前と概要を教えてください
2. 誰がこのシステムを使いますか？（複数可）
3. それぞれのユーザーは何を達成したいですか？
4. 最も重要な機能は何ですか？（3つまで）
5. いつまでにMVPをリリースしたいですか？

### 深掘り質問例
- 「[機能名]について、具体的にどのような操作を想定していますか？」
- 「[ペルソナ]が[機能]を使う際の、理想的な体験を教えてください」
- 「この機能がないと、どんな問題が起きますか？」
- 「類似サービスでの良い点・改善したい点は何ですか？」

## 出力形式（StoryMapViewer v2 互換）

対話を通じて収集した情報を基に、StoryMapViewer互換のYAML形式で出力します。

\`\`\`yaml
integrated_story_map:
  meta:
    created_date: "2024-01-15"
    project: "[プロジェクト名]"
    phase: "Discovery - ストーリーマップ"
    description: "対話形式で作成したストーリーマップ"
    version: "v2"
    ui_options:
      hide_priority_2: false

  version_definitions:
    order: [MVP, Release1, Release2, v1.0, Future]

  story_map_structure:
    activities:
      - id: ACT-01
        name: "[アクティビティ名]"
        description: "[ユーザーの大きな目標]"
        users: ["ペルソナ1", "ペルソナ2"]

    backbones:
      - id: BB-01
        activity_id: ACT-01
        name: "[バックボーン名]"
        description: "[機能グループの説明]"
        sequence: 1

  personas_stories:
    P001:
      name: "[ペルソナ名]"
      role: "[役割・立場]"
      description: "[ペルソナの詳細説明]"
      stories:
        - id: ST-XXX-001
          story: "As a [ペルソナ], I want [機能], So that [価値]"
          backbone_id: BB-01
          version: "MVP"
          priority: 1
          acceptance_criteria:
            - "[具体的な受け入れ条件1]"
            - "[具体的な受け入れ条件2]"
            - "[具体的な受け入れ条件3]"
          ui_screens: ["/画面パス"]
          linked_modules: ["関連モジュール"]

  display_order:
    backbones: [BB-01]

  story_mapping:
    ST-XXX-001: { backbone_id: BB-01, sequence: 1 }

  mvp_release_plan:
    mvp:
      total_stories: 20
      implementation_period: "3ヶ月"
      release_criteria:
        - "優先度1のストーリーがすべて完了"
        - "基本的な機能が動作"
        - "ユーザビリティテスト合格"

  cross_persona_stories:
    - id: CST-001
      story: "As 全ユーザー, I want [共通機能], So that [共通価値]"
      backbone_id: BB-99
      version: "MVP"
      priority: 2
      acceptance_criteria:
        - "[共通の受け入れ条件]"
\`\`\`

## Tips

- 最初は大まかに、徐々に詳細化していきましょう
- 完璧を求めず、後から修正可能なことを前提に進めましょう
- ユーザー視点を常に意識し、技術的な詳細は後回しにしましょう
- 不明な点は仮説を立てて進め、後で検証しましょう
`;
  }
}

export default HelpView;
