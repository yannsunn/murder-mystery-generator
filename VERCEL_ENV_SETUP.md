# 🚀 Vercel環境変数設定ガイド

## ⚠️ 重要: Vercel環境変数の設定は必須です！

ローカルの`.env`ファイルはVercelに自動的に同期されません。以下の手順で必ず設定してください。

## 📋 必要な環境変数

### 必須の環境変数
1. **GROQ_API_KEY** - AI生成機能の中核となるAPIキー
2. **SUPABASE_URL** - データベース接続URL
3. **SUPABASE_ANON_KEY** - Supabase公開キー
4. **SUPABASE_SERVICE_KEY** - Supabaseサービスキー

### オプションの環境変数
- **OPENAI_API_KEY** - フォールバックAIプロバイダー（未設定でも動作）
- **DEBUG_MODE** - デバッグログの有効化（true/false）

## 🔧 設定手順

### ステップ1: Vercelダッシュボードにアクセス
1. [Vercel](https://vercel.com) にログイン
2. プロジェクトを選択
3. **Settings** タブをクリック
4. 左メニューから **Environment Variables** を選択

### ステップ2: 環境変数を追加
各環境変数について以下を実行：

1. **Add New** ボタンをクリック
2. **Name** に変数名を入力（例: `GROQ_API_KEY`）
3. **Value** に値を入力
4. **Environment** で以下をすべて選択：
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Save** をクリック

### ステップ3: 値の入力例

```
GROQ_API_KEY = gsk_xxxxxxxxxxxxxxxxxxxxx
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
```

### ステップ4: 再デプロイ
環境変数を設定した後、必ず再デプロイが必要です：

#### 方法1: Vercelダッシュボードから
1. **Deployments** タブに移動
2. 最新のデプロイメントの右側の **...** メニューをクリック
3. **Redeploy** を選択
4. **Use existing Build Cache** のチェックを外す
5. **Redeploy** をクリック

#### 方法2: CLIから
```bash
vercel --prod --force
```

## 🔍 環境変数の確認方法

### ローカルで確認
```bash
npm run check-env
```

### Vercelで確認
1. Vercelダッシュボード → Settings → Environment Variables
2. 設定済みの変数が表示されていることを確認

## ❌ よくあるエラーと解決方法

### エラー: "Service configuration error"
**原因**: `GROQ_API_KEY`が設定されていない
**解決**: 上記手順でGroq APIキーを設定

### エラー: "AI service is temporarily unavailable"
**原因**: 環境変数が正しく読み込まれていない
**解決**: 
1. 環境変数の名前が正確か確認
2. 値に余分なスペースや引用符がないか確認
3. 再デプロイを実行

### エラー: データベース接続エラー
**原因**: Supabase関連の環境変数が未設定
**解決**: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEYをすべて設定

## 📝 チェックリスト

- [ ] Vercelにログイン済み
- [ ] プロジェクトのSettingsページを開いた
- [ ] GROQ_API_KEYを追加した
- [ ] SUPABASE_URLを追加した
- [ ] SUPABASE_ANON_KEYを追加した
- [ ] SUPABASE_SERVICE_KEYを追加した
- [ ] すべての環境（Production/Preview/Development）に適用した
- [ ] 再デプロイを実行した
- [ ] アプリケーションが正常に動作することを確認した

## 🆘 トラブルシューティング

問題が解決しない場合：
1. Vercelのログを確認: Deployments → 該当のデプロイ → Functions タブ
2. ブラウザのコンソールでエラーメッセージを確認
3. `npm run check-env`でローカル環境を再確認
4. Vercelのサポートドキュメントを参照: https://vercel.com/docs/environment-variables