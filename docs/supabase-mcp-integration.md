# 🔗 SupabaseMCP統合ガイド

## 概要
CursorのSupabaseMCPサーバーと既存のSupabase実装を統合し、開発効率を最大化する方法。

## 🎯 統合戦略

### 1. 開発時
**SupabaseMCP活用:**
- スキーマ確認・変更
- データの即座確認
- SQLクエリのテスト実行
- パフォーマンス分析

### 2. 本番運用時
**既存API活用:**
- `api/supabase-client.js` 経由でのデータ操作
- エラーハンドリング
- レート制限・セキュリティ

## 🛠️ 実践的活用方法

### データベース設計フェーズ
```sql
-- MCPで即座にテーブル作成・確認
CREATE TABLE new_feature_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data JSONB
);

-- 即座にデータ確認
SELECT * FROM scenarios LIMIT 3;
```

### 開発・デバッグフェーズ
```javascript
// 1. MCPでデータ状況確認
// 2. api/supabase-client.js で実装
// 3. MCPで結果検証
```

### 運用監視フェーズ
```sql
-- MCPでパフォーマンス監視
SELECT 
    COUNT(*) as total_scenarios,
    AVG(jsonb_array_length(characters)) as avg_characters,
    MAX(created_at) as latest_scenario
FROM scenarios;
```

## 📊 統合ワークフロー

### 新機能開発時
1. **設計**: MCPでスキーマ設計・テスト
2. **実装**: api/supabase-client.js でAPI実装
3. **検証**: MCPで直接データ検証
4. **監視**: MCPで運用状況確認

### 既存機能改善時
1. **分析**: MCPで現状データ分析
2. **計画**: パフォーマンス改善計画
3. **実装**: API層の最適化
4. **確認**: MCPで改善効果測定

## 🔧 推奨設定

### MCPサーバー活用場面
- [x] データベーススキーマ確認
- [x] リアルタイムデータ確認
- [x] SQLクエリテスト
- [x] パフォーマンス分析
- [x] トラブルシューティング

### 既存API活用場面
- [x] アプリケーションロジック
- [x] エラーハンドリング
- [x] セキュリティ制御
- [x] レート制限
- [x] 本番データ操作

## 🎯 次のアクション

1. **現在のデータベース状況確認**
   - MCPでテーブル構造確認
   - 既存データの状況把握

2. **統合テスト実行**
   - MCP経由でのデータ挿入テスト
   - API経由での同期確認

3. **開発ワークフロー最適化**
   - MCPとAPI の適切な使い分け
   - 効率的な開発フロー確立

---

**🎯 SupabaseMCPにより、データベース開発の効率が大幅に向上します！**