# 🔒 Murder Mystery Generator - セキュリティ監査レポート

**監査日**: 2025-10-21
**監査者**: Claude AI System
**プロジェクトバージョン**: 2.0.0
**監査スコープ**: 全システム（フロントエンド・バックエンド・インフラ）

---

## 📊 エグゼクティブサマリー

### 総合セキュリティスコア: **8.0/10**

| カテゴリ | スコア | ステータス |
|---------|-------|----------|
| 認証・認可 | 7/10 | 🟡 改善推奨 |
| データ保護 | 9/10 | 🟢 良好 |
| 入力検証 | 9/10 | 🟢 良好 |
| レート制限 | 9/10 | 🟢 良好 |
| セキュリティヘッダー | 8/10 | 🟢 良好 |
| 脆弱性対策 | 7/10 | 🟡 改善推奨 |
| ロギング・監視 | 6/10 | 🟡 改善推奨 |

---

## 1. 認証・認可

### 1.1 現状

✅ **実装済み**:
- 環境変数ベースのアクセスキー認証
- オプショナル認証（未設定時はオープンアクセス）
- クエリパラメータ/ヘッダーでの認証対応

api/utils/simple-auth.js:9-30
```javascript
function checkPersonalAccess(req) {
  const ACCESS_KEY = process.env.PERSONAL_ACCESS_KEY;

  if (!ACCESS_KEY) {
    return { allowed: true, message: 'Open access' };
  }

  const providedKey = req.query.key || req.headers['x-access-key'];

  if (providedKey === ACCESS_KEY) {
    return { allowed: true, message: 'Access granted' };
  }

  return {
    allowed: false,
    reason: 'アクセスが拒否されました。正しいキーを指定してください。',
    status: 401
  };
}
```

⚠️ **改善点**:
1. **単一のアクセスキー**: 複数ユーザー対応不可
2. **キーのローテーション**: 未実装
3. **セッション管理**: なし

### 1.2 推奨事項

#### 短期 (1-2週間)
- [ ] アクセスキーの有効期限設定
- [ ] ログイン試行回数制限（現在は5回違反でIPブロック）

#### 中期 (1-2ヶ月)
- [ ] JWT認証への移行
- [ ] 複数ユーザーサポート
- [ ] OAuth2.0対応（Phase 3）

---

## 2. データ保護

### 2.1 現状

✅ **実装済み**:
- 環境変数による認証情報管理
- .env.exampleによるテンプレート提供
- .gitignoreによる機密情報除外

.env.example:1-39
```bash
# 🔑 Environment Variables Configuration
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here_optional
PERSONAL_ACCESS_KEY=your_secret_key_here_optional
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

✅ **Supabase統合**:
- PostgreSQL暗号化ストレージ
- Row Level Security (RLS) 対応可能

### 2.2 脆弱性

⚠️ **検出されたリスク**:
1. **環境変数の検証不足**: 起動時の検証が不完全
2. **Service Keyの露出**: SUPABASE_SERVICE_KEYが未使用だが定義あり

### 2.3 推奨事項

#### 即座対応
- [ ] 環境変数の起動時検証強化
- [ ] 未使用環境変数の削除

#### 短期
- [ ] Supabase RLSポリシーの実装
- [ ] データベース暗号化の確認

---

## 3. 入力検証とサニタイゼーション

### 3.1 現状

✅ **実装済み**:
- 包括的な入力検証
- ホワイトリスト方式の検証
- HTMLサニタイゼーション

api/security-utils.js:49-103
```javascript
function validateAndSanitizeInput(data) {
  const errors = [];
  const sanitized = {};

  // participants の検証
  if (data.participants) {
    const participants = parseInt(data.participants);
    if (isNaN(participants) || participants < 3 || participants > 10) {
      errors.push('参加者数は3-10人の範囲で指定してください');
    } else {
      sanitized.participants = participants;
    }
  }

  // era の検証（許可された値のみ）
  const allowedEras = ['ancient', 'medieval', 'modern', 'contemporary', 'future'];
  if (data.era && allowedEras.includes(data.era)) {
    sanitized.era = data.era;
  } else {
    sanitized.era = 'modern'; // デフォルト値
  }

  // ... (その他の検証)

  return { errors, sanitized };
}
```

### 3.2 検出された脆弱性

🔴 **XSS リスク** (6箇所):
- public/js/SkeletonLoader.js:337 - `container.innerHTML = ''`
- public/js/SkeletonLoader.js:400 - `container.innerHTML = ''`
- public/js/keyboard-shortcuts.js:82 - `helpModal.innerHTML = ...`
- public/js/core-app.js:830 - `successDiv.innerHTML = ...`
- public/js/core-app.js:1019 - `scenarioContent.innerHTML = ...`
- api/core/validation.js:526 - `errorContainer.innerHTML = ...`

### 3.3 推奨事項

#### 即座対応（実装済み）
- ✅ サニタイゼーション関数実装済み

#### 短期
- [ ] innerHTML使用箇所をtextContentまたはDOMParserに置換
- [ ] Content Security Policy (CSP) の厳格化

---

## 4. レート制限

### 4.1 現状

✅ **実装済み**:
- IP + User-Agentベースのレート制限
- 複数のレート制限設定（生成API、通常API、ヘルスチェック）
- 不正アクセス検知（5回違反で自動IPブロック）

api/middleware/rate-limiter.js:9-28
```javascript
const RATE_LIMITS = {
  generation: {
    windowMs: 24 * 60 * 60 * 1000, // 24時間
    maxRequests: 10, // 1日10回まで（約500円制限）
    message: '1日の生成制限に達しました。明日再度お試しください。',
    skipSuccessfulRequests: false
  },
  api: {
    windowMs: 1 * 60 * 1000, // 1分
    maxRequests: 60, // 60回まで
    message: 'Too many API requests. Please slow down.',
    skipSuccessfulRequests: true
  },
  health: {
    windowMs: 1 * 60 * 1000, // 1分
    maxRequests: 120, // 120回まで（ヘルスチェックは高頻度OK）
    message: 'Health check rate limit exceeded.',
    skipSuccessfulRequests: true
  }
};
```

### 4.2 推奨事項

✅ **現状で十分**: レート制限は適切に実装されている

#### 中期改善
- [ ] Redisベースの分散レート制限（スケール時）
- [ ] IPホワイトリスト機能の拡張

---

## 5. セキュリティヘッダー

### 5.1 現状

✅ **実装済み**:

api/security-utils.js:218-237
```javascript
function setSecurityHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // CSP ヘッダーの追加
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
}
```

### 5.2 検出された問題

⚠️ **CSP の脆弱性**:
- `'unsafe-inline'` が script-src と style-src で許可されている
- これによりXSS攻撃のリスクが残る

### 5.3 推奨事項

#### 短期
- [ ] CSPを nonce ベースに変更
- [ ] 'unsafe-inline' の削除
- [ ] Permissions-Policy ヘッダーの追加

**推奨CSP**:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'nonce-{random}';
  img-src 'self' data: https:;
  connect-src 'self' https://api.groq.com https://*.supabase.co;
  frame-ancestors 'none';
```

---

## 6. 依存関係の脆弱性

### 6.1 npm audit 結果

```
3 vulnerabilities (1 moderate, 2 high)

esbuild  <=0.24.2
Severity: moderate
esbuild enables any website to send any requests to the development server

path-to-regexp  4.0.0 - 6.2.2
Severity: high
path-to-regexp outputs backtracking regular expressions
```

### 6.2 対応状況

✅ **部分的に対応済み**:
- Lighthouse を 11.4.0 → 13.0.0 にアップデート
- 一部依存関係を最新化

⚠️ **残存脆弱性**:
- esbuild: 開発用依存関係のため本番環境への影響は限定的
- path-to-regexp: @vercel/nodeの依存関係

### 6.3 推奨事項

#### 短期
- [ ] @vercel/nodeの最新版への更新
- [ ] 代替パッケージの検討

---

## 7. ロギングと監視

### 7.1 現状

✅ **実装済み**:
- 統一ロガー (api/utils/logger.js)
- エラー追跡
- パフォーマンス監視

⚠️ **不足点**:
- セキュリティイベントの専用ログなし
- ログの長期保存なし
- アラート通知なし

### 7.2 推奨事項

#### 中期
- [ ] セキュリティイベントログの実装
- [ ] Vercel Analyticsの活用
- [ ] Sentryなどのエラートラッキングツール導入

---

## 8. インフラストラクチャ

### 8.1 Vercel セキュリティ

✅ **実装済み**:
- HTTPS強制
- 自動スケーリング
- DDoS保護（Vercel提供）
- 環境変数の暗号化ストレージ

vercel.json:14-46
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {"key": "X-Content-Type-Options", "value": "nosniff"},
        {"key": "X-Frame-Options", "value": "DENY"},
        {"key": "X-XSS-Protection", "value": "1; mode=block"},
        {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
        {"key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload"},
        {"key": "Content-Security-Policy", "value": "..."}
      ]
    }
  ]
}
```

### 8.2 Supabase セキュリティ

✅ **実装済み**:
- PostgreSQL暗号化
- SSL/TLS通信
- Row Level Security対応

⚠️ **未実装**:
- RLSポリシーの設定
- 定期バックアップの確認

---

## 9. コンプライアンス

### 9.1 GDPR/プライバシー

✅ **対応済み**:
- 個人情報の最小収集（IP、User-Agent のみ）
- データ保持期間の制限（24時間自動削除）

⚠️ **要対応**:
- プライバシーポリシーなし
- Cookie同意バナーなし（必要に応じて）

---

## 10. アクションプラン

### 🔴 即座対応 (24時間以内)
1. [ ] XSS脆弱性の修正（innerHTML → textContent）
2. [ ] 環境変数検証の強化
3. [ ] セキュリティドキュメントの配布

### 🟡 短期 (1-2週間)
1. [ ] CSPの厳格化（nonceベース）
2. [ ] 依存関係の脆弱性修正
3. [ ] Supabase RLSポリシー実装
4. [ ] セキュリティテストの追加

### 🟢 中期 (1-2ヶ月)
1. [ ] JWT認証への移行
2. [ ] セキュリティイベントログ実装
3. [ ] エラートラッキングツール導入（Sentry）
4. [ ] ペネトレーションテスト実施

---

## 11. 結論

### 総合評価: **8.0/10 - 良好**

**強み**:
- 包括的な入力検証とサニタイゼーション
- 適切なレート制限実装
- セキュアなインフラストラクチャ（Vercel + Supabase）
- セキュリティヘッダーの実装

**弱み**:
- XSS脆弱性（innerHTML使用）
- CSPの緩和設定（'unsafe-inline'）
- セキュリティ監視の不足
- 認証機能の限定性

### 推奨アクション

1. **即座対応**: XSS脆弱性の修正
2. **短期**: CSP厳格化、依存関係更新
3. **中期**: JWT認証移行、監視強化

### 次回監査予定

**2025-11-21** (1ヶ月後)

---

**監査署名**
- **監査者**: Claude AI System
- **日付**: 2025-10-21
- **承認**: プロジェクトオーナー
