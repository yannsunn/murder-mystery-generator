# 🎯 プロジェクト管理システム

## 📋 概要

複数のプロジェクトを効率的に管理するための環境変数管理システムです。各プロジェクトごとに独立した環境設定を維持しながら、共通設定を共有できます。

## 🏗️ ディレクトリ構造

```
murder_mystery_netlify/
├── .env                           # 開発環境（gitignore対象）
├── .env.local                     # ローカル開発専用（gitignore対象）
├── .env.example                   # テンプレート（Git管理対象）
├── .env.production               # 本番環境設定（Git管理対象）
├── env-configs/                  # プロジェクト別設定
│   ├── shared.env               # 共通設定
│   └── murder-mystery.env       # プロジェクト固有設定
├── scripts/
│   ├── env-loader.js            # 環境変数ローダー
│   └── project-manager.js       # プロジェクト管理
└── README-PROJECT-MANAGEMENT.md # このファイル
```

## 🚀 使用方法

### 1. プロジェクト一覧表示
```bash
npm run project:list
```

### 2. プロジェクト読み込み
```bash
npm run project:load murder-mystery
```

### 3. 現在のプロジェクト状態表示
```bash
npm run project:status
```

### 4. ヘルスチェック
```bash
npm run project:health murder-mystery
```

### 5. 全プロジェクトステータス確認
```bash
npm run project:check-all
```

### 6. Vercelにデプロイ
```bash
npm run project:deploy murder-mystery production
```

### 7. 環境変数の読み込み
```bash
npm run env:load murder-mystery
```

### 8. 環境変数の状態表示
```bash
npm run env:status
```

## 🔧 環境変数の優先順位

1. **実際の環境変数**（最優先）
2. **`.env`ファイル**
3. **`.env.local`ファイル**
4. **`.env.{NODE_ENV}`ファイル**
5. **プロジェクト固有設定**（`env-configs/{project}.env`）
6. **共通設定**（`env-configs/shared.env`）

## 📁 新しいプロジェクトの追加

### 1. プロジェクト設定ファイル作成
```bash
# env-configs/new-project.env
SUPABASE_URL=https://your-new-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
PROJECT_SPECIFIC_VAR=your_value_here
```

### 2. project-manager.jsに設定追加
```javascript
const PROJECT_CONFIGS = {
  'new-project': {
    name: 'New Project',
    description: 'Description of new project',
    requiredVars: ['GROQ_API_KEY', 'SUPABASE_URL'],
    optionalVars: ['OPENAI_API_KEY'],
    vercelProject: 'new-project-vercel'
  }
};
```

### 3. プロジェクトを読み込み
```bash
npm run project:load new-project
```

## 🔒 セキュリティ考慮事項

- **API キーの管理**: 本番環境のキーは`.env.local`または環境変数で管理
- **Gitignore設定**: 機密情報を含むファイルは必ずgitignoreに追加
- **権限管理**: Vercelプロジェクトへの環境変数設定権限を適切に管理

## 🎯 ベストプラクティス

### 1. 環境の分離
- 開発、ステージング、本番環境を明確に分離
- 各環境専用のSupabaseプロジェクトを使用

### 2. 設定の共有
- 共通設定は`shared.env`に集約
- プロジェクト固有設定のみ個別ファイルに記述

### 3. 検証の自動化
- デプロイ前に必ずヘルスチェック実行
- 必須環境変数の検証を自動化

### 4. ドキュメント化
- 各プロジェクトの設定要件を明確に記述
- 環境変数の役割と値の説明を追加

## 🛠️ トラブルシューティング

### 環境変数が読み込まれない場合
1. ファイルパスの確認
2. 環境変数の優先順位確認
3. デバッグモードでの詳細ログ確認

```bash
DEBUG_MODE=true npm run env:status
```

### Vercelデプロイエラー
1. プロジェクト名の確認
2. 必須環境変数の設定確認
3. Vercel CLIの認証状態確認

```bash
vercel whoami
```

## 📊 監視とメンテナンス

### 定期的なチェック項目
- [ ] 環境変数の有効性確認
- [ ] APIキーの更新状況確認
- [ ] プロジェクトの依存関係更新
- [ ] セキュリティ設定の見直し

### 月次メンテナンス
```bash
# 全プロジェクトの健全性確認
npm run project:check-all

# 依存関係の更新
npm audit fix

# 環境変数の棚卸し
npm run env:status
```

## 🔄 継続的改善

このシステムは継続的に改善されています。新しい機能やベストプラクティスを発見した場合は、このドキュメントを更新してください。

---

**🎯 このシステムにより、複数プロジェクトの環境管理が効率化され、デプロイメントの安全性と再現性が向上します。**