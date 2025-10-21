# 📋 Murder Mystery Generator - 要件定義書

**プロジェクト名**: Murder Mystery Generator
**バージョン**: 2.0.0
**最終更新日**: 2025-10-21
**ステータス**: Production Ready

---

## 1. プロジェクト概要

### 1.1 目的
AIを活用したマーダーミステリーシナリオの自動生成システムを提供し、TRPGユーザーに高品質なシナリオを短時間で提供する。

### 1.2 対象ユーザー
- **Primary**: TRPG愛好家（個人利用）
- **Secondary**: ゲームマスター（GM）
- **Tertiary**: マーダーミステリー制作者

### 1.3 主要価値提案
- プロフェッショナル品質のシナリオを5分以内で生成
- 完全カスタマイズ可能なパラメータ
- AI完全自律ランダム生成モード
- ZIP形式での即座ダウンロード

---

## 2. 機能要件 (Functional Requirements)

### 2.1 シナリオ生成機能

#### FR-001: カスタム生成
**優先度**: 🔴 CRITICAL
**説明**: ユーザー指定パラメータに基づくシナリオ生成

**入力パラメータ**:
- 参加人数: 4-8人
- 時代設定: 現代、昭和、近未来、ファンタジー等
- 舞台: 密室、山荘、軍事施設、海中施設等
- 難易度: 30分〜60分のプレイ時間
- トーン: シリアス、ライト、ホラー、コメディ
- 世界観: リアリスティック、ファンタジー、SF等
- 事件タイプ: 殺人、盗難、失踪等

**出力コンテンツ**:
- メインシナリオ (完全プロット・ストーリー)
- キャラクターハンドアウト (各役割詳細)
- GM用資料 (真相解説・進行ガイド)
- 証拠品リスト (手がかり・アイテム詳細)
- 商品情報 (プロ品質の説明書)

**制約事項**:
- 生成時間: 5秒以内 (目標)
- 出力サイズ: 最大10MB
- レート制限: 1日100回まで

#### FR-002: 完全ランダム生成
**優先度**: 🟡 HIGH
**説明**: AI完全自律創作モード

**特徴**:
- パラメータ指定不要
- AIが完全に自律的に創作
- 世界唯一のシナリオ生成

**出力**: FR-001と同様

#### FR-003: 9段階生成プロセス
**優先度**: 🔴 CRITICAL
**説明**: 高品質保証のための段階的生成システム

**Stage 0**: 初期設定・バリデーション
**Stage 1**: 基本プロット生成
**Stage 2**: キャラクター設定
**Stage 3**: 事件構造設計
**Stage 4**: 証拠品・手がかり生成
**Stage 5**: タイムライン構築
**Stage 6**: ハンドアウト作成
**Stage 7**: GM資料生成
**Stage 8**: 統合・最終調整

**各ステージ**:
- リアルタイム進捗表示
- エラーハンドリング
- 自動リトライ機能

#### FR-004: リアルタイム進捗表示
**優先度**: 🟡 HIGH
**説明**: ユーザーへのフィードバック

**機能**:
- 現在のステージ表示
- 進捗率（%）
- 推定残り時間
- ステージ完了通知

**技術**: EventSource / Polling

---

### 2.2 ダウンロード機能

#### FR-010: ZIP形式エクスポート
**優先度**: 🔴 CRITICAL
**説明**: 生成シナリオのパッケージ化

**ファイル構成**:
```
scenario_[timestamp].zip
├── main_scenario.md          # メインシナリオ
├── character_handouts/       # キャラクターハンドアウト
│   ├── character_1.md
│   ├── character_2.md
│   └── ...
├── gm_materials/            # GM用資料
│   ├── truth_explanation.md
│   └── progress_guide.md
├── evidence_list.md         # 証拠品リスト
└── product_info.md          # 商品情報
```

**フォーマット**: Markdown (GitHub Flavored)
**文字エンコーディング**: UTF-8
**圧縮形式**: ZIP

---

### 2.3 データ保存機能

#### FR-020: Supabaseデータベース統合
**優先度**: 🟢 MEDIUM
**説明**: シナリオの永続化

**保存データ**:
- シナリオID (UUID)
- 生成パラメータ
- 生成結果 (JSON)
- タイムスタンプ
- メタデータ

**テーブル構造**:
```sql
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameters JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

---

### 2.4 認証・アクセス制御

#### FR-030: パーソナルアクセス制御
**優先度**: 🟡 HIGH
**説明**: 個人利用向けシンプル認証

**方法**:
- 環境変数ベースのアクセスキー
- クエリパラメータ or ヘッダー認証
- 未設定時は認証なし（オープンアクセス）

**環境変数**:
```bash
PERSONAL_ACCESS_KEY=your_secret_key  # オプション
```

---

## 3. 非機能要件 (Non-Functional Requirements)

### 3.1 パフォーマンス

#### NFR-001: レスポンスタイム
- **目標**: AI生成 < 5秒
- **許容**: AI生成 < 10秒
- **最大**: AI生成 < 30秒

#### NFR-002: 同時ユーザー数
- **目標**: 100ユーザー
- **スケーラビリティ**: Vercel Serverless（無限スケール）

#### NFR-003: Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5秒
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### 3.2 セキュリティ

#### NFR-010: 入力検証
- **XSS対策**: HTMLサニタイゼーション
- **SQLインジェクション対策**: パラメータ化クエリ
- **CSRF対策**: トークンベース

#### NFR-011: レート制限
- **日次制限**: 100リクエスト/日
- **分次制限**: 60リクエスト/分
- **IP制限**: 5回違反でブロック

#### NFR-012: セキュリティヘッダー
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: default-src 'self'

### 3.3 可用性

#### NFR-020: アップタイム
- **目標**: 99.9%
- **ダウンタイム許容**: 43分/月

#### NFR-021: エラーハンドリング
- **統一エラー形式**: UnifiedError
- **自動リトライ**: 最大3回
- **フォールバック**: OpenAI API (Groq障害時)

### 3.4 保守性

#### NFR-030: コード品質
- **テストカバレッジ**: 75%以上 (目標)
- **TypeScript**: 80%以上 (段階的移行)
- **Linting**: ESLint + Prettier準拠

#### NFR-031: ドキュメント
- **API仕様書**: OpenAPI 3.0
- **README**: GitHub標準
- **コードコメント**: JSDoc形式

---

## 4. システム制約

### 4.1 技術制約
- **プラットフォーム**: Vercel
- **ランタイム**: Node.js 18+
- **AIプロバイダー**: Groq API (primary), OpenAI (fallback)
- **データベース**: Supabase (PostgreSQL)

### 4.2 外部依存
- **Groq API**: 月額$50制限
- **Supabase**: Free Tier (500MB DB)
- **Vercel**: Hobby Plan

### 4.3 リソース制約
- **メモリ**: 512MB (Vercel Functions)
- **実行時間**: 10秒 (Vercel Functions)
- **バンドルサイズ**: < 1MB (目標)

---

## 5. データ要件

### 5.1 データモデル

#### SessionData
```typescript
interface SessionData {
  sessionId: string;
  formData: FormData;
  apiKey?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### FormData
```typescript
interface FormData {
  participants: string;  // "4-8"
  era: string;          // "modern", "showa", "future"
  setting: string;      // "mansion", "hotel", etc.
  tone: string;         // "serious", "light", etc.
  complexity: string;   // "30min", "60min"
  worldview?: string;   // "realistic", "fantasy"
  incident_type?: string; // "murder", "theft"
}
```

### 5.2 データフロー
```
User Input → Validation → AI Generation (9 stages) →
Database Save → ZIP Generation → Download
```

---

## 6. インターフェース要件

### 6.1 UI要件
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ
- **アクセシビリティ**: WCAG 2.1 Level AA準拠
- **多言語**: 日本語のみ (v2.0)

### 6.2 API要件
- **プロトコル**: HTTP/HTTPS
- **フォーマット**: JSON
- **認証**: Optional (環境変数ベース)

---

## 7. 運用要件

### 7.1 監視
- **エラー監視**: Vercel Analytics
- **パフォーマンス監視**: Lighthouse CI
- **セキュリティ監視**: npm audit

### 7.2 バックアップ
- **データベース**: Supabaseの自動バックアップ
- **コード**: GitHubリポジトリ

### 7.3 デプロイメント
- **CD**: Vercel自動デプロイ (main branch)
- **環境**: Production, Preview, Development

---

## 8. 品質基準

### 8.1 受入基準
- [ ] 全機能要件の実装完了
- [ ] テストカバレッジ75%以上
- [ ] Lighthouse Performance 85+
- [ ] セキュリティ脆弱性0個
- [ ] ドキュメント完備

### 8.2 品質指標
| 項目 | 現在 | 目標 |
|------|------|------|
| テストカバレッジ | 5% | 75% |
| TypeScript化率 | 10% | 80% |
| パフォーマンススコア | 85 | 90 |
| セキュリティスコア | 8/10 | 9/10 |

---

## 9. リスクと対策

### 9.1 技術リスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| Groq API障害 | 高 | OpenAIフォールバック |
| Vercel制限超過 | 中 | レート制限・キャッシング |
| Supabase容量超過 | 低 | データアーカイブ |

### 9.2 セキュリティリスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| DDoS攻撃 | 中 | レート制限・IP制限 |
| XSS攻撃 | 高 | 入力サニタイゼーション |
| APIキー漏洩 | 高 | 環境変数管理 |

---

## 10. 将来拡張

### Phase 3 (計画中)
- データベース統合強化
- ユーザーアカウント
- リアルタイム協調編集
- モバイルアプリ

### Phase 4 (未来)
- マーケットプレイス
- コミュニティ機能
- VR/AR対応
- 多言語サポート

---

**承認者**: プロジェクトオーナー
**作成日**: 2025-10-21
**レビュー日**: N/A
**次回レビュー**: 2025-11-21
