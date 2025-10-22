# 🔌 Murder Mystery Generator - API仕様書

**バージョン**: 2.0.0
**プロトコル**: HTTP/HTTPS
**ベースURL**: `https://murder-mystery-generator.vercel.app`
**フォーマット**: JSON
**最終更新日**: 2025-10-21

---

## 目次
1. [認証](#1-認証)
2. [エンドポイント一覧](#2-エンドポイント一覧)
3. [データモデル](#3-データモデル)
4. [エラーハンドリング](#4-エラーハンドリング)
5. [レート制限](#5-レート制限)
6. [セキュリティ](#6-セキュリティ)

---

## 1. 認証

### 1.1 認証方式

**オプショナル認証** (環境変数ベース)

#### Method 1: Query Parameter
```
GET /api/index?key=YOUR_ACCESS_KEY
```

#### Method 2: HTTP Header
```
X-Access-Key: YOUR_ACCESS_KEY
```

#### 環境変数設定
```bash
PERSONAL_ACCESS_KEY=your_secret_key_here
```

**注意**: アクセスキーが未設定の場合、認証は不要（オープンアクセス）

---

## 2. エンドポイント一覧

### 2.1 メイン生成API

#### **POST /api/index**
マーダーミステリーシナリオを生成する

**Headers**:
```http
Content-Type: application/json
X-Access-Key: YOUR_ACCESS_KEY (optional)
```

**Request Body**:
```json
{
  "participants": "6",
  "era": "modern",
  "setting": "mansion",
  "tone": "serious",
  "complexity": "60min",
  "worldview": "realistic",
  "incident_type": "murder",
  "random_mode": false
}
```

**Request Parameters**:

| パラメータ | 型 | 必須 | 説明 | 許可値 |
|-----------|---|------|------|--------|
| participants | string | ✅ | 参加人数 | "4"-"8" |
| era | string | ✅ | 時代設定 | "ancient", "medieval", "modern", "contemporary", "future" |
| setting | string | ✅ | 舞台 | "mansion", "hotel", "school", "office", "island", "train", "ship", "closed-space" |
| tone | string | ✅ | トーン | "serious", "light", "dark", "comedic", "dramatic" |
| complexity | string | ✅ | 複雑度 | "30min", "45min", "60min" |
| worldview | string | ❌ | 世界観 | "realistic", "fantasy", "sci-fi", "historical", "supernatural" |
| incident_type | string | ❌ | 事件タイプ | "murder", "theft", "disappearance", "fraud", "blackmail" |
| random_mode | boolean | ❌ | ランダムモード | true, false (default: false) |

**Response** (Success - 200):
```json
{
  "success": true,
  "data": {
    "scenarioId": "550e8400-e29b-41d4-a716-446655440000",
    "mainScenario": "...",
    "characters": [
      {
        "id": 1,
        "name": "田中太郎",
        "role": "主人公",
        "background": "...",
        "handout": "..."
      }
    ],
    "gmMaterials": {
      "truth": "...",
      "guide": "..."
    },
    "evidence": [
      {
        "id": 1,
        "name": "血痕のついたナイフ",
        "description": "...",
        "significance": "..."
      }
    ],
    "productInfo": {
      "title": "孤島の惨劇",
      "description": "...",
      "duration": "60min",
      "playerCount": 6
    },
    "metadata": {
      "generatedAt": "2025-10-21T12:00:00Z",
      "version": "2.0.0",
      "stages": 9,
      "totalTime": 4.5
    }
  },
  "metadata": {
    "stage": "completed",
    "duration": 4500,
    "timestamp": "2025-10-21T12:00:00Z"
  }
}
```

**Response** (Error - 400):
```json
{
  "success": false,
  "error": {
    "id": "err_12345",
    "type": "VALIDATION_ERROR",
    "message": "参加者数は4-8人の範囲で指定してください",
    "priority": "MEDIUM",
    "retryable": false,
    "timestamp": "2025-10-21T12:00:00Z"
  }
}
```

**Response** (Rate Limit - 429):
```json
{
  "success": false,
  "error": {
    "id": "err_67890",
    "type": "RATE_LIMIT_ERROR",
    "message": "1日の使用制限（100回）に達しました。",
    "priority": "MEDIUM",
    "retryable": true,
    "retryAfter": 3600,
    "timestamp": "2025-10-21T12:00:00Z",
    "recovery": {
      "attempted": false,
      "successful": false,
      "retryScheduled": true,
      "reason": "Daily limit exceeded"
    }
  }
}
```

---

### 2.2 ヘルスチェックAPI

#### **GET /api/health**
システムの健全性を確認する

**Response** (200):
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-21T12:00:00Z",
  "services": {
    "groqAPI": "operational",
    "supabase": "operational",
    "vercel": "operational"
  },
  "version": "2.0.0"
}
```

---

### 2.3 環境変数デバッグAPI

#### **GET /api/debug-env?debug_token=check-env-2025**
環境変数の状態を確認する（開発用）

**Query Parameters**:
- `debug_token`: 認証トークン (必須)

**Response** (200):
```json
{
  "success": true,
  "timestamp": "2025-10-21T12:00:00Z",
  "runtime": {
    "NODE_ENV": "production",
    "VERCEL": "1",
    "VERCEL_ENV": "production",
    "VERCEL_REGION": "hnd1"
  },
  "groqApiKey": {
    "exists": true,
    "empty": false,
    "length": 64,
    "validPrefix": true,
    "firstChars": "gsk_***"
  },
  "supabaseKeys": {
    "url": "configured",
    "anonKey": "configured",
    "serviceKey": "not_configured"
  },
  "allEnvVarNames": [
    "NODE_ENV",
    "GROQ_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "VERCEL",
    "VERCEL_ENV"
  ]
}
```

---

### 2.4 データベースセットアップAPI

#### **GET /api/setup-database?action=check-tables**
Supabaseデータベースのテーブル状況を確認する

**Query Parameters**:
- `action`: 実行するアクション
  - `check-tables`: テーブル存在確認
  - `create-tables`: テーブル作成
  - `reset-database`: データベースリセット（注意）

**Response** (200):
```json
{
  "success": true,
  "action": "check-tables",
  "tables": {
    "scenarios": {
      "exists": true,
      "rowCount": 42
    },
    "sessions": {
      "exists": true,
      "rowCount": 128
    }
  },
  "timestamp": "2025-10-21T12:00:00Z"
}
```

---

## 3. データモデル

### 3.1 FormData

```typescript
interface FormData {
  participants: string;      // "4"-"8"
  era: string;              // 時代設定
  setting: string;          // 舞台
  tone: string;             // トーン
  complexity: string;       // 複雑度
  worldview?: string;       // 世界観 (optional)
  incident_type?: string;   // 事件タイプ (optional)
  random_mode?: boolean;    // ランダムモード (optional)
}
```

### 3.2 Scenario Response

```typescript
interface ScenarioResponse {
  success: boolean;
  data: {
    scenarioId: string;           // UUID
    mainScenario: string;         // Markdown形式
    characters: Character[];      // キャラクター配列
    gmMaterials: GMMaterials;    // GM用資料
    evidence: Evidence[];         // 証拠品
    productInfo: ProductInfo;     // 商品情報
    metadata: Metadata;           // メタデータ
  };
  metadata: {
    stage: string;                // 現在のステージ
    duration: number;             // 処理時間(ms)
    timestamp: string;            // ISO 8601
  };
}
```

### 3.3 Character

```typescript
interface Character {
  id: number;
  name: string;
  role: string;
  age: number;
  background: string;
  secret: string;
  handout: string;          // プレイヤー配布用
}
```

### 3.4 Evidence

```typescript
interface Evidence {
  id: number;
  name: string;
  description: string;
  significance: string;
  discoveryCondition: string;
}
```

### 3.5 Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: {
    id: string;                   // エラーID
    type: ErrorType;              // エラータイプ
    message: string;              // ユーザー向けメッセージ
    priority: ErrorPriority;      // 優先度
    retryable: boolean;           // リトライ可能か
    retryAfter?: number;          // リトライまでの秒数
    timestamp: string;            // ISO 8601
    recovery?: {
      attempted: boolean;
      successful: boolean;
      retryScheduled: boolean;
      reason?: string;
    };
  };
}
```

### 3.6 Error Types

```typescript
type ErrorType =
  | 'SYSTEM_FAILURE'
  | 'DATABASE_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'SECURITY_BREACH'
  | 'API_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'RESOURCE_EXHAUSTION'
  | 'VALIDATION_ERROR'
  | 'BUSINESS_LOGIC_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'NETWORK_ERROR'
  | 'USER_INPUT_ERROR';
```

---

## 4. エラーハンドリング

### 4.1 HTTPステータスコード

| コード | 説明 | 対応 |
|--------|------|------|
| 200 | 成功 | - |
| 400 | 不正なリクエスト | パラメータを確認 |
| 401 | 認証エラー | アクセスキーを確認 |
| 429 | レート制限超過 | `retryAfter`秒後に再試行 |
| 500 | サーバーエラー | 後で再試行 |
| 503 | サービス利用不可 | メンテナンス中 |

### 4.2 エラー例

#### バリデーションエラー
```json
{
  "success": false,
  "error": {
    "id": "err_val_001",
    "type": "VALIDATION_ERROR",
    "message": "参加者数は4-8人の範囲で指定してください",
    "priority": "MEDIUM",
    "retryable": false,
    "timestamp": "2025-10-21T12:00:00Z"
  }
}
```

#### AI APIエラー
```json
{
  "success": false,
  "error": {
    "id": "err_api_001",
    "type": "EXTERNAL_SERVICE_ERROR",
    "message": "AI生成中にエラーが発生しました。再度お試しください。",
    "priority": "HIGH",
    "retryable": true,
    "retryAfter": 5,
    "timestamp": "2025-10-21T12:00:00Z",
    "recovery": {
      "attempted": true,
      "successful": false,
      "retryScheduled": true,
      "reason": "Groq API timeout, attempting OpenAI fallback"
    }
  }
}
```

---

## 5. レート制限

### 5.1 制限値

| エンドポイント | 制限 | ウィンドウ |
|---------------|------|-----------|
| POST /api/index | 100回 | 24時間 |
| POST /api/index | 60回 | 1分 |
| GET /api/health | 120回 | 1分 |
| GET /api/* | 100回 | 1分 |

### 5.2 レート制限ヘッダー

**Response Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698163200
Retry-After: 3600
```

### 5.3 レート制限超過時の対応

1. `retryAfter`秒後に再試行
2. Exponential Backoff実装推奨
3. 5回違反でIP自動ブロック

---

## 6. セキュリティ

### 6.1 セキュリティヘッダー

**Response Headers**:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Access-Control-Allow-Origin: *
```

### 6.2 CORS設定

**Allowed Origins**: `*` (現在)
**Allowed Methods**: GET, POST, OPTIONS
**Allowed Headers**: Content-Type, X-Access-Key

### 6.3 入力検証

全ての入力パラメータは以下の検証を実施:
- 型チェック
- 範囲チェック
- ホワイトリストチェック
- HTMLサニタイゼーション
- SQLインジェクション対策

---

## 7. リトライ戦略

### 7.1 推奨リトライ戦略

```typescript
async function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries = 3,
  baseDelay = 1000
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1 || !error.retryable) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 7.2 使用例

```javascript
try {
  const response = await retryWithBackoff(() =>
    fetch('/api/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
  );
  const data = await response.json();
} catch (error) {
  console.error('Failed after retries:', error);
}
```

---

## 8. Webhook (将来実装予定)

### 8.1 POST /api/webhooks/scenario-completed

シナリオ生成完了時のコールバック（Phase 3で実装予定）

**Request Body**:
```json
{
  "scenarioId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "timestamp": "2025-10-21T12:00:00Z",
  "downloadUrl": "https://..."
}
```

---

## 9. バージョニング

### 9.1 バージョン管理

**現在のバージョン**: v2.0.0
**バージョン形式**: Semantic Versioning (MAJOR.MINOR.PATCH)

### 9.2 後方互換性

- MAJOR: 破壊的変更
- MINOR: 機能追加（後方互換性あり）
- PATCH: バグ修正

---

## 10. サンプルコード

### 10.1 JavaScript (Fetch API)

```javascript
async function generateScenario(formData) {
  try {
    const response = await fetch('https://murder-mystery-generator.vercel.app/api/index', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': 'YOUR_ACCESS_KEY' // Optional
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Generation failed:', error);
    throw error;
  }
}

// 使用例
const formData = {
  participants: "6",
  era: "modern",
  setting: "mansion",
  tone: "serious",
  complexity: "60min"
};

generateScenario(formData)
  .then(scenario => console.log('Success:', scenario))
  .catch(error => console.error('Error:', error));
```

### 10.2 cURL

```bash
curl -X POST https://murder-mystery-generator.vercel.app/api/index \
  -H "Content-Type: application/json" \
  -H "X-Access-Key: YOUR_ACCESS_KEY" \
  -d '{
    "participants": "6",
    "era": "modern",
    "setting": "mansion",
    "tone": "serious",
    "complexity": "60min"
  }'
```

### 10.3 Python (requests)

```python
import requests

def generate_scenario(form_data):
    url = "https://murder-mystery-generator.vercel.app/api/index"
    headers = {
        "Content-Type": "application/json",
        "X-Access-Key": "YOUR_ACCESS_KEY"  # Optional
    }

    response = requests.post(url, json=form_data, headers=headers)
    response.raise_for_status()
    return response.json()

# 使用例
form_data = {
    "participants": "6",
    "era": "modern",
    "setting": "mansion",
    "tone": "serious",
    "complexity": "60min"
}

try:
    scenario = generate_scenario(form_data)
    print("Success:", scenario)
except requests.exceptions.HTTPError as e:
    print("Error:", e.response.json())
```

---

## 11. 制限事項

### 11.1 現在の制限
- 日本語のみ対応
- 最大参加者数: 8人
- 1リクエストあたりの最大生成時間: 30秒
- ZIP最大サイズ: 10MB

### 11.2 将来の拡張
- 多言語サポート (Phase 4)
- 画像生成機能 (Phase 3)
- カスタムテンプレート (Phase 3)
- リアルタイムコラボレーション (Phase 3)

---

**文書管理**
- **作成日**: 2025-10-21
- **作成者**: AI System
- **承認者**: Project Owner
- **次回レビュー**: 2025-11-21
