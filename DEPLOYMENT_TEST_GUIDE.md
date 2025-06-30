# デプロイ後のテスト手順

## 1. ヘルスチェック
curl https://murdermysterynetlify.vercel.app/api/health

## 2. 生成APIテスト
curl -X POST https://murdermysterynetlify.vercel.app/api/ultra-integrated-generator \
-H "Content-Type: application/json" \
-d '{"action": "health_check"}'

## 3. エクスポートAPIテスト
curl -X POST https://murdermysterynetlify.vercel.app/api/simple-export \
-H "Content-Type: application/json" \
-d '{"sessionData": {"phases": {"phase1": {"concept": "テスト"}}}}' \
--output test.zip

## 4. フロントエンドテスト
# ブラウザで https://murdermysterynetlify.vercel.app にアクセス
# フォーム入力 → 生成 → ZIPダウンロード の流れをテスト

