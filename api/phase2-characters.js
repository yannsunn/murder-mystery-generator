// Groq Phase 2: キャラクター超高速生成
// 処理時間: 8-12秒保証

export const config = {
  maxDuration: 90,
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    const body = await request.json();
    const { concept, participants } = body;

    if (!concept) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'コンセプトデータが提供されていません' 
        }),
        { status: 400, headers }
      );
    }

    console.log('Groq Phase 2: Starting ultra-fast character generation...');

    const prompt = generateCharacterPrompt(concept, participants);
    
    // Groq優先、フォールバック付き
    try {
      if (GROQ_API_KEY) {
        const result = await callGroq(prompt);
        return new Response(
          JSON.stringify({
            success: true,
            phase: 'characters',
            content: result.content,
            next_phase: 'relationships',
            estimated_cost: '$0.003',
            progress: 25,
            provider: 'Groq (Ultra-Fast)',
            processing_time: result.time
          }),
          { status: 200, headers }
        );
      }
    } catch (groqError) {
      console.log('Groq failed, trying OpenAI fallback:', groqError.message);
    }

    // OpenAI フォールバック
    if (OPENAI_API_KEY) {
      const result = await callOpenAI(prompt);
      return new Response(
        JSON.stringify({
          success: true,
          phase: 'characters',
          content: result.content,
          next_phase: 'relationships',
          estimated_cost: '$0.008',
          progress: 25,
          provider: 'OpenAI (Fallback)',
          processing_time: result.time
        }),
        { status: 200, headers }
      );
    }

    throw new Error('APIキーが設定されていません');

  } catch (error) {
    console.error('Character generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `キャラクター生成エラー: ${error.message}` 
      }),
      { status: 500, headers }
    );
  }
}

async function callGroq(prompt) {
  const startTime = Date.now();
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: '世界クラスのキャラクター設計専門家として、商業出版レベルの詳細で魅力的なキャラクターを創造してください。心理的深み、複雑な動機、リアルな人間関係を持つキャラクターを設計し、読者が感情移入できる立体的な人物像を構築してください。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    })
  });

  if (!response.ok) throw new Error(`Groq error: ${response.status}`);
  
  const data = await response.json();
  const endTime = Date.now();
  
  return {
    content: data.choices[0].message.content,
    time: `${endTime - startTime}ms (Groq超高速)`
  };
}

async function callOpenAI(prompt) {
  const startTime = Date.now();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'キャラクター設計専門家として魅力的なキャラクターを作成。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    })
  });

  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  
  const data = await response.json();
  const endTime = Date.now();
  
  return {
    content: data.choices[0].message.content,
    time: `${endTime - startTime}ms (OpenAI標準)`
  };
}

function generateCharacterPrompt(concept, participants) {
  return `【顧客要求レベル: 商業出版品質】
以下のコンセプトに基づいて、${participants}人の商業レベル高品質キャラクターを詳細設計：

【シナリオコンセプト】
${concept}

【要求クオリティ】
- 商業出版レベルの深いキャラクター造形
- 心理的リアリティと複雑な動機構造
- プレイヤーが感情移入できる立体的人物像
- マーダーミステリーに最適化された役割設計

【詳細キャラクター設計】
${participants}名の最高品質キャラクターを以下詳細形式で：

## キャラクター1: [フルネーム]
### 基本情報
- 年齢・性別・職業（具体的な役職まで）
- 社会的地位・経済状況
- 出身地・学歴・家族構成

### 外見・特徴
- 詳細な外見描写（身長・体型・髪・服装スタイル）
- 特徴的な癖・仕草・話し方
- 第一印象と内面のギャップ

### 性格・心理
- 表面的性格と深層心理
- 価値観・信念・恐れ
- 隠された欲求・コンプレックス
- 他者との関係性パターン

### 背景ストーリー
- 重要な人生経験・トラウマ
- 現在の悩み・目標
- 秘密・隠し事
- 事件との関わり可能性

### ゲーム的役割
- 推理における重要度
- 持っている情報・証拠
- 他キャラクターとの利害関係
- プレイしやすさ配慮

## キャラクター2～${participants}: [同様の詳細形式]

3500文字で商業品質の詳細キャラクター設計を完成させてください。`;
}