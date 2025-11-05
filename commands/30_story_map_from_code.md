---
name: Serena: ユーザーストーリーマップを生成（コードから逆算・integrated_story_map v2）
---

以下のガイドラインに従い、指定したコードベースからユーザーストーリー（受け入れ条件・UI・コード参照付き）を網羅的に抽出し、`integrated_story_map` v2 形式のYAMLで出力してください。

## 対象の主な探索領域（例）
- apps/web/src/routes/**（(auth)/(dashboard)/organization/project/team/api）
- apps/web/src/lib/features/**（organization/project/workflow/context-bucket/thread 等）
- packages/prisma/schema/**（_schema.prisma, auth.prisma など）

## ID命名（例）
- ORG: ST-ORG-###, TEAM: ST-TEAM-###, PRJ: ST-PRJ-###, WF: ST-WF-###
- CB: ST-CB-###, CHAT: ST-CHAT-###, AUTH: ST-AUTH-###, ACT: ST-ACT-###

## 出力要件（各ストーリーに必須）
- id / story(`I want …, So that …`) 形式（As a … は含めない）
- acceptance_criteria（実装根拠が分かる形で 2-3+ 件）
- ui_screens / linked_modules / code_refs（実ファイル相対パスを2-4件）
- version（例: MVP） / priority（1-5）

## 追加で必ず含める
- version_definitions.order（例: [MVP, Release1, Release2, v1.0, Future]）
- story_map_structure.activities / backbones
- display_order.backbones（表示順定義）
- story_mapping（各STの配置: backbone_id, sequence）
- cross_persona_stories（少なくとも1-2件）
- mvp_release_plan（total_stories / 期間 / 受入基準）

## 出力例（サマリ）
```yaml
integrated_story_map:
  meta:
    created_date: "2024-01-15"
    project: "Example"
    phase: "Discovery - ストーリーマップ"
    description: "コード解析ベースの初回ドラフト（自動生成）"
    version: "v2"
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
      stories:
        - id: ST-ORG-001
          story: "I want チーム作成・切替, So that 組織の作業単位を柔軟に管理できる"
          backbone_id: BB-01
          version: "MVP"
          priority: 1
          acceptance_criteria:
            - "作成成功がDBへ反映"
            - "アクティブ切替でダッシュボード更新"
            - "権限外は拒否"
          ui_screens: ["/team/new", "/organization/select"]
          linked_modules: ["features/organization"]
          code_refs:
            - "apps/web/src/lib/features/organization/workflows/createTeamWorkflow.ts"
            - "apps/web/src/routes/organization/select/+page.server.ts"

  display_order:
    backbones: [BB-01]

  story_mapping:
    ST-ORG-001: { backbone_id: BB-01, sequence: 1 }

  mvp_release_plan:
    mvp:
      total_stories: 25
      implementation_period: "1-4ヶ月"
      release_criteria:
        - "優先度1のストーリーがすべて完了"
        - "主要機能が動作"
        - "最低限のワークフロー実行が可能"
```

## 出力先（例）
- Flow/<YYYYMM>/<YYYY-MM-DD>/<Project>/3_discovery/04_ストーリーマップ/integrated_story_map_draft.yaml



