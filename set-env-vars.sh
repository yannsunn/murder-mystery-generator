#!/bin/bash

echo "🔑 Vercel環境変数設定スクリプト"
echo "================================"
echo ""

# GROQ API Key
echo "1. GROQ API Keyを入力してください:"
echo "   (https://console.groq.com で取得)"
read -p "GROQ_API_KEY: " GROQ_KEY

# OpenAI API Key
echo ""
echo "2. OpenAI API Keyを入力してください:"
echo "   (https://platform.openai.com/api-keys で取得)"
read -p "OPENAI_API_KEY: " OPENAI_KEY

# 環境変数を設定
echo ""
echo "⚙️ 環境変数を設定中..."

# GROQ_API_KEY
vercel env add GROQ_API_KEY production < <(echo "$GROQ_KEY")
vercel env add GROQ_API_KEY preview < <(echo "$GROQ_KEY")
vercel env add GROQ_API_KEY development < <(echo "$GROQ_KEY")

# OPENAI_API_KEY
vercel env add OPENAI_API_KEY production < <(echo "$OPENAI_KEY")
vercel env add OPENAI_API_KEY preview < <(echo "$OPENAI_KEY")
vercel env add OPENAI_API_KEY development < <(echo "$OPENAI_KEY")

echo ""
echo "✅ 環境変数の設定が完了しました！"
echo ""
echo "🚀 再デプロイを実行します..."
vercel --prod --force

echo ""
echo "🎉 完了！サイトが更新されました。"