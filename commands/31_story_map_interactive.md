---
name: Story Map Interactive Creation (integrated_story_map v2)
---

対話でユーザーから要件を収集し、`integrated_story_map` v2 形式のYAMLを生成してください。

## 進め方（要約）
1. プロジェクト概要（目的/ユーザー/期間）
2. ペルソナ定義（名前/役割/課題/価値）
3. アクティビティとバックボーンの洗い出し
4. ユーザーストーリー作成（`I want …, So that …`）
5. 優先度(1-5)とバージョン（MVP/Release1/…）の付与
6. 受け入れ条件・UI・関連モジュール・コード参照（任意）

## 出力形式（最小例）
```yaml
integrated_story_map:
  meta:
    created_date: "YYYY-MM-DD"
    project: "<ProjectName>"
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
        name: "アクティビティ名"
        description: "ユーザーの大目標"
        users: ["ペルソナ1", "ペルソナ2"]
    backbones:
      - id: BB-01
        activity_id: ACT-01
        name: "バックボーン名"
        description: "機能グループ説明"
        sequence: 1

  personas_stories:
    P001:
      name: "ペルソナ名"
      role: "役割"
      description: "説明"
      stories:
        - id: ST-XXX-001
          story: "I want 機能, So that 価値"
          backbone_id: BB-01
          version: "MVP"
          priority: 1
          acceptance_criteria: ["条件1", "条件2"]
          ui_screens: ["/path"]
          linked_modules: ["features/…"]

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

## メモ
- ストーリー文から「As a …」は除去（カード上でペルソナ表示するため）
- `version_definitions.order` を定義しておくと、ビューアのスライス順に反映
- `CrossPersona` 用に `cross_persona_stories` を作成可能


