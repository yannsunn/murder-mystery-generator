# 🎨 画像生成機能ガイド

**Murder Mystery Generator - Image Generation with Gemini 2.5 Flash & DALL-E 3**

---

## 📋 概要

このアプリケーションは、マーダーミステリーシナリオに合わせた高品質な画像を自動生成する機能を提供しています。

### サポートする画像生成AI

1. **Gemini 2.5 Flash** (推奨) - Google AI
2. **DALL-E 3** - OpenAI

---

## 🚀 クイックスタート

### 1. APIキーの取得

#### Gemini 2.5 Flash (推奨)

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. 「Create API Key」をクリック
3. APIキーをコピー

#### DALL-E 3

1. [OpenAI Platform](https://platform.openai.com/api-keys) にアクセス
2. 「Create new secret key」をクリック
3. APIキーをコピー

### 2. 環境変数の設定

`.env.local` ファイルを作成：

```bash
# Gemini 2.5 Flashを使用する場合（推奨）
GEMINI_API_KEY=your_gemini_api_key_here
IMAGE_PROVIDER=gemini

# DALL-E 3を使用する場合
OPENAI_API_KEY=your_openai_api_key_here
IMAGE_PROVIDER=dalle
```

### 3. Vercelデプロイの場合

Vercel Dashboardで環境変数を設定：

1. Project Settings → Environment Variables
2. 以下を追加：
   - `GEMINI_API_KEY` (Gemini使用時)
   - `OPENAI_API_KEY` (DALL-E使用時)
   - `IMAGE_PROVIDER` (値: `gemini` or `dalle`)

---

## 🎨 画像生成の仕組み

### 自動生成される画像

1. **メインコンセプトアート** (1枚)
   - シナリオ全体の雰囲気を表現
   - アスペクト比: 16:9 (Gemini) / 1792x1024 (DALL-E)
   - 用途: カバーアート、プレゼンテーション

2. **キャラクターポートレート** (参加人数分)
   - 各キャラクターの肖像画
   - アスペクト比: 1:1 (正方形)
   - 用途: ハンドアウト、キャラクターカード

### プロンプト自動生成

シナリオの以下の情報から自動的にプロンプトを生成：

- **タイトル**: シナリオ名
- **時代設定**: 現代、昭和、近未来等
- **舞台**: 密室、山荘、軍事施設等
- **トーン**: シリアス、ライト、ホラー等

**例**:
```
A dramatic and atmospheric murder mystery scene for "孤島の惨劇".
Serious tone, modern era setting in a mansion.
Professional book cover art style with mysterious ambiance,
cinematic lighting, high quality illustration, no text or watermarks.
```

---

## 🔧 使用方法

### フロントエンドでの有効化

シナリオ生成リクエスト時に `generate_artwork` フラグを追加：

```javascript
const formData = {
  participants: "6",
  era: "modern",
  setting: "mansion",
  tone: "serious",
  complexity: "60min",
  generate_artwork: true  // 画像生成を有効化
};

const response = await fetch('/api/index', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});

const result = await response.json();
console.log(result.data.images);  // 生成された画像
```

### レスポンス形式

```json
{
  "success": true,
  "data": {
    "scenarioId": "...",
    "mainScenario": "...",
    "characters": [...],
    "images": [
      {
        "type": "main_concept",
        "description": "メインコンセプトアート",
        "provider": "gemini",
        "model": "gemini-2.5-flash",
        "url": "data:image/png;base64,...",
        "data": "base64_encoded_image_data",
        "mimeType": "image/png",
        "status": "success"
      },
      {
        "type": "character_1",
        "description": "キャラクター1のポートレート",
        "provider": "gemini",
        "url": "...",
        "status": "success"
      }
    ]
  }
}
```

---

## 🆚 Gemini vs DALL-E 比較

| 項目 | Gemini 2.5 Flash | DALL-E 3 |
|------|------------------|----------|
| **価格** | 低コスト | 高コスト |
| **速度** | 高速 | 中速 |
| **品質** | 高品質 | 最高品質 |
| **出力形式** | Base64 (データURI) | URL |
| **アスペクト比** | 1:1, 16:9, 9:16 | 1024x1024, 1792x1024, 1024x1792 |
| **セーフティ** | 厳格 | 標準 |
| **推奨** | ✅ デフォルト | オプション |

---

## 🛠️ 高度な設定

### プロバイダーの切り替え

環境変数 `IMAGE_PROVIDER` で選択：

```bash
# Gemini 2.5 Flash
IMAGE_PROVIDER=gemini

# DALL-E 3
IMAGE_PROVIDER=dalle

# 未設定時のフォールバック
# 1. GeminiのAPIキーがあればGemini
# 2. OpenAIのAPIキーがあればDALL-E
# 3. どちらもなければ画像生成スキップ
```

### セーフティ設定 (Gemini)

Gemini APIクライアントでセーフティレベルを調整可能：

```javascript
// api/utils/gemini-client.js
const result = await geminiClient.generateImage(prompt, {
  safetySettings: 'default'  // default, strict, permissive
});
```

**レベル詳細**:
- `default`: 中程度のブロック（推奨）
- `strict`: 厳格なブロック
- `permissive`: 緩いブロック（慎重に使用）

---

## 📊 コスト計算

### Gemini 2.5 Flash

**料金**: 無料枠内で利用可能（Google AI Studioの制限に依存）

**例**: 6人用シナリオ
- メインコンセプト: 1枚
- キャラクター: 6枚
- **合計**: 7枚

### DALL-E 3

**料金**: $0.04/image (1024x1024) / $0.08/image (1024x1792)

**例**: 6人用シナリオ
- メインコンセプト (1792x1024): $0.08
- キャラクター (1024x1024) x 6: $0.24
- **合計**: $0.32/シナリオ

**💡 推奨**: コスト削減にはGemini 2.5 Flashを使用

---

## 🔍 トラブルシューティング

### 画像が生成されない

**原因1**: APIキーが未設定
```bash
# .env.local を確認
cat .env.local | grep GEMINI_API_KEY
```

**解決**: APIキーを設定して再起動

**原因2**: `generate_artwork` フラグが無効
```javascript
// リクエスト確認
formData.generate_artwork = true
```

**原因3**: APIクォータ超過
```
Error: 429 Too Many Requests
```

**解決**: APIキーのクォータを確認

### 画像の品質が低い

**Gemini**: プロンプトを詳細化
```javascript
// より詳細なプロンプトに修正
prompt: `High quality professional illustration of a murder mystery scene,
photorealistic, 8k resolution, detailed, atmospheric lighting...`
```

**DALL-E**: `quality` パラメータを変更
```javascript
// api/core/image-generator.js
quality: 'hd'  // standard → hd
```

### レート制限エラー

```
Error: Rate limit exceeded
```

**解決**:
1. リクエスト間隔を調整（現在1秒）
2. 生成する画像数を削減
3. APIプランをアップグレード

---

## 🔐 セキュリティ

### APIキーの保護

✅ **推奨**:
- 環境変数で管理
- `.env.local` を `.gitignore` に追加
- Vercelの環境変数機能を使用

❌ **避けること**:
- コードにハードコード
- GitHubにコミット
- フロントエンドに公開

### 安全なBase64画像の扱い

Gemini生成の画像はBase64データURIで返されます：

```javascript
// セキュアな画像表示
<img src={imageData.url} alt={imageData.description} />

// データURIの検証
if (imageData.url.startsWith('data:image/')) {
  // 安全
}
```

---

## 📚 参考リンク

- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [OpenAI DALL-E 3](https://platform.openai.com/docs/guides/images)
- [Murder Mystery Generator API仕様](./API_SPECIFICATION.md)

---

## 🎯 次のステップ

1. **APIキーの取得** - Gemini 2.5 Flash推奨
2. **環境変数の設定** - `.env.local` または Vercel Dashboard
3. **テスト生成** - `generate_artwork: true` でリクエスト
4. **画像の確認** - レスポンスの `images` 配列をチェック

---

**💡 ヒント**: まずはGemini 2.5 Flashで試して、より高品質が必要な場合にDALL-E 3を検討してください。

**🎨 お楽しみください！**
