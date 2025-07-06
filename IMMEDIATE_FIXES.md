# 🚨 即座に必要な修正項目

## 1. **API設定 (必須)**

Vercelダッシュボードで以下の環境変数を設定してください：

```
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=your_supabase_url_here  
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 2. **本番環境のコンソールログ削除**

以下のコマンドを実行：
```bash
node scripts/remove-console-logs.js
```

## 3. **認証の実装**

APIエンドポイントに簡易認証を追加：
```javascript
// api/middleware/auth.js
export function requireAuth(req, res, next) {
  const token = req.headers.authorization;
  if (!token || token !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
```

## 4. **ESLint設定**

```bash
npm install --save-dev eslint @eslint/js
npx eslint --init
```

## 5. **TypeScript対応 (推奨)**

```bash
npm install --save-dev typescript @types/node
npx tsc --init
```

## 実行優先順位

1. **今すぐ**: API設定 (機能を動作させるため)
2. **デプロイ前**: コンソールログ削除
3. **1週間以内**: 認証実装
4. **将来的に**: TypeScript/ESLint導入

---

**注意**: API設定なしでは、シナリオ生成機能は動作しません。