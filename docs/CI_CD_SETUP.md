# 🔄 CI/CD パイプライン セットアップガイド

**重要**: GitHub Appの権限制約により、`.github/workflows/ci-cd.yml`は自動的にプッシュできませんでした。
このファイルはローカルに作成済みのため、手動でGitHubリポジトリに追加してください。

---

## 📋 セットアップ手順

### 1. CI/CDファイルの追加

ローカルに作成済みのCI/CDファイルをGitHubに追加します：

```bash
# ファイルを確認
cat .github/workflows/ci-cd.yml

# Gitに追加（手動）
git add .github/workflows/ci-cd.yml
git commit -m "Add CI/CD pipeline configuration"
git push origin claude/review-project-requirements-011CULo2SFhkMe5yPmBCYysE
```

### 2. GitHub Secretsの設定

CI/CDパイプラインが正常に動作するには、以下のシークレットをGitHubリポジトリに設定する必要があります：

#### 必須シークレット

**GitHub Settings → Secrets and variables → Actions** で以下を設定：

| シークレット名 | 説明 | 取得方法 |
|---------------|------|----------|
| `VERCEL_TOKEN` | Vercelデプロイトークン | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel組織ID | Vercel CLI: `vercel whoami` |
| `VERCEL_PROJECT_ID` | VercelプロジェクトID | `.vercel/project.json` |
| `GROQ_API_KEY` | Groq APIキー | https://console.groq.com/ |
| `SUPABASE_URL` | Supabase URL | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase匿名キー | Supabase Dashboard → Settings → API |

#### シークレット設定手順

1. GitHubリポジトリページを開く
2. **Settings** タブをクリック
3. 左サイドバーの **Secrets and variables** → **Actions** をクリック
4. **New repository secret** ボタンをクリック
5. 各シークレットを追加

---

## 🔧 CI/CDパイプライン構成

### パイプライン概要

`.github/workflows/ci-cd.yml` には以下の6つのジョブが含まれています：

```yaml
1. quality-check      # コード品質チェック
2. security-scan      # セキュリティスキャン
3. test               # テスト実行
4. build              # ビルドテスト
5. deploy             # Vercelデプロイ（mainブランチのみ）
6. notify             # 通知
```

### 実行タイミング

- **Push**: `main` または `claude/*` ブランチへのプッシュ時
- **Pull Request**: `main` ブランチへのPR作成時

### 各ジョブの詳細

#### 1. quality-check
```bash
- ESLint実行
- TypeScript型チェック
```

#### 2. security-scan
```bash
- npm audit実行
- 脆弱性レポート生成
- アーティファクトとしてレポート保存
```

#### 3. test
```bash
- ユニットテスト実行
- カバレッジレポート生成
- アーティファクトとして保存
```

#### 4. build
```bash
- 本番ビルド実行
- ビルド成功確認
```

#### 5. deploy (mainブランチのみ)
```bash
- Vercelへの本番デプロイ
- 環境変数の自動設定
```

#### 6. notify
```bash
- ワークフロー完了通知
- ステータス確認
```

---

## 📊 パイプライン実行確認

### GitHubでの確認

1. GitHubリポジトリページを開く
2. **Actions** タブをクリック
3. 実行中/完了したワークフローを確認

### ローカルでの確認

```bash
# 最新のワークフロー実行状況を確認（GitHub CLI使用）
gh run list

# 特定のワークフロー実行の詳細
gh run view <run-id>
```

---

## 🔍 トラブルシューティング

### ワークフローが失敗する場合

#### 1. シークレットの確認
```bash
# GitHub Secretsが正しく設定されているか確認
# Settings → Secrets and variables → Actions
```

#### 2. ログの確認
```bash
# GitHubのActionsタブでログを確認
# 失敗したステップの詳細を確認
```

#### 3. ローカルでのテスト
```bash
# ローカルで各ステップを手動実行
npm run lint:check
npm run type-check
npm run test
npm run build
```

### よくあるエラーと対処法

#### エラー: "VERCEL_TOKEN is not set"
**対処**: GitHub Secretsに `VERCEL_TOKEN` を追加

#### エラー: "npm audit failed"
**対処**:
```bash
npm audit fix
git commit -am "Fix security vulnerabilities"
git push
```

#### エラー: "TypeScript type check failed"
**対処**:
```bash
npm run type-check
# エラーを修正
git commit -am "Fix TypeScript errors"
git push
```

---

## 🚀 デプロイフロー

### 開発フロー

```
1. ローカルで開発
   ↓
2. コミット・プッシュ
   ↓
3. CI/CDパイプライン自動実行
   - コード品質チェック
   - セキュリティスキャン
   - テスト実行
   - ビルド確認
   ↓
4. (mainブランチの場合) Vercel本番デプロイ
   ↓
5. デプロイ完了通知
```

### ブランチ戦略

- **main**: 本番環境（自動デプロイ）
- **claude/***: 開発ブランチ（CI/CDのみ、デプロイなし）
- **feature/***: 機能開発ブランチ（CI/CDのみ）

---

## 📈 CI/CD最適化のヒント

### 1. キャッシュの活用
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # npm キャッシュを有効化
```

### 2. 並列実行
```yaml
jobs:
  quality-check:
    # ...
  security-scan:
    # 並列実行（依存関係なし）
```

### 3. 条件付き実行
```yaml
if: github.ref == 'refs/heads/main'  # mainブランチのみ
```

---

## 🔒 セキュリティベストプラクティス

### 1. シークレット管理
- ✅ GitHub Secretsを使用（ハードコード禁止）
- ✅ 最小権限の原則
- ✅ 定期的なトークンローテーション

### 2. 依存関係スキャン
- ✅ npm audit自動実行
- ✅ 脆弱性レポート保存
- ✅ 定期的な依存関係更新

### 3. コード品質維持
- ✅ ESLint自動チェック
- ✅ TypeScript型チェック
- ✅ テストカバレッジ測定

---

## 📚 参考リンク

- [GitHub Actions公式ドキュメント](https://docs.github.com/ja/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/deployments/git/vercel-for-github)
- [amondnet/vercel-action](https://github.com/amondnet/vercel-action)

---

## ✅ セットアップチェックリスト

- [ ] `.github/workflows/ci-cd.yml` をGitHubにプッシュ
- [ ] GitHub Secretsを全て設定
  - [ ] VERCEL_TOKEN
  - [ ] VERCEL_ORG_ID
  - [ ] VERCEL_PROJECT_ID
  - [ ] GROQ_API_KEY
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
- [ ] ワークフローの初回実行を確認
- [ ] 各ジョブが正常に完了することを確認
- [ ] デプロイが成功することを確認（mainブランチ）

---

**📝 注意事項**

- CI/CDパイプラインは作成済みですが、手動での追加が必要です
- GitHub Secretsの設定は必須です
- 初回実行時はセットアップに時間がかかる場合があります

**🎯 このセットアップにより、自動化された品質保証とデプロイメントが実現します！**
