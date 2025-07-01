/**
 * シンプルなテストエンドポイント
 */

import { aiClient } from './utils/ai-client.js';

export default async function handler(req, res) {
  // CORSヘッダー設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔬 Test integrated generator called');
    
    const { formData } = req.body || {};
    
    if (!formData) {
      return res.status(400).json({
        success: false,
        error: 'formData is required'
      });
    }

    // ステップ1のテスト実行
    console.log('🔄 Testing step 1: タイトル・コンセプト生成');
    
    const systemPrompt = `あなたはプロフェッショナルマーダーミステリー制作専門家です。
簡潔で魅力的な作品基礎を構築してください。`;
    
    const userPrompt = `
参加人数: ${formData.participants}人
時代背景: ${formData.era}
舞台設定: ${formData.setting}
複雑さ: ${formData.complexity}

以下の形式で簡潔に生成してください：

## 作品タイトル
[魅力的なタイトル]

## 作品コンセプト
[300文字程度の世界観とテーマ]

## 事件の概要
[200文字程度の事件の概要]
`;

    const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
    
    console.log('✅ Step 1 completed successfully');
    
    return res.status(200).json({
      success: true,
      result: result.content,
      provider: result.provider,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.name || 'UnknownError',
      timestamp: new Date().toISOString()
    });
  }
}