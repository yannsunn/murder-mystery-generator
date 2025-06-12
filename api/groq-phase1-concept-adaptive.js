// Groq Adaptive API - 品質とコストのバランス最適化
// 初期生成 → 品質チェック → 必要に応じて拡張

export const config = {
  maxDuration: 90,
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const params = req.body;
    const { participants } = params;

    if (!GROQ_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Groq APIキーが設定されていません' 
      });
    }

    console.log('Groq Adaptive: Starting intelligent concept generation...');

    // ステップ1: 基本コンセプト生成（短時間・低コスト）
    const basicConcept = await generateBasicConcept(params);
    
    // ステップ2: 品質チェック
    const qualityScore = assessQuality(basicConcept);
    console.log(`Quality score: ${qualityScore}/100`);

    let finalConcept = basicConcept;
    let apiCalls = 1;
    let totalTokens = 800;

    // ステップ3: 必要に応じて拡張（品質が低い場合のみ）
    if (qualityScore < 70 || basicConcept.length < 500) {
      console.log('Quality below threshold, enhancing...');
      
      // 並列で不足部分を補完
      const enhancements = await Promise.all([
        needsCharacterDetails(basicConcept) ? enhanceCharacters(basicConcept, participants) : null,
        needsPlotDetails(basicConcept) ? enhancePlot(basicConcept) : null,
        needsSettingDetails(basicConcept) ? enhanceSetting(basicConcept) : null
      ]);

      finalConcept = integrateEnhancements(basicConcept, enhancements.filter(Boolean));
      apiCalls += enhancements.filter(Boolean).length;
      totalTokens += enhancements.filter(Boolean).length * 400;
    }

    console.log(`Groq Adaptive: Generated with ${apiCalls} API calls, ~${totalTokens} tokens`);

    return res.status(200).json({
      success: true,
      content: finalConcept,
      provider: 'groq-adaptive',
      model: 'llama-3.1-8b-instant',
      processing_time: `${Date.now() - startTime}ms`,
      quality_score: qualityScore,
      api_calls: apiCalls,
      estimated_tokens: totalTokens,
      cost_efficiency: `${(qualityScore / apiCalls).toFixed(1)} quality/call`
    });

  } catch (error) {
    console.error('Groq adaptive generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Groq生成エラー: ${error.message}`,
      processing_time: `${Date.now() - startTime}ms`
    });
  }
}

async function generateBasicConcept(params) {
  const { participants, era, setting, incident_type, worldview, tone } = params;
  
  const systemPrompt = `マーダーミステリーのコンセプト作成専門家として、簡潔で完結したシナリオコンセプトを作成してください。

【出力フォーマット】
## 🏆 タイトル
《[独創的なタイトル]》

## 🎭 シナリオ概要
[2-3文で本質を説明]

## 📋 基本設定
[時代・場所・状況を具体的に]

## 🕵️ 事件概要
[被害者・死因・発生状況]

## 🎯 ゲームの目的
[プレイヤーの目標]

以上で完結。追加説明不要。`;

  const userPrompt = `${participants}人参加、${era}時代の${setting}を舞台とした${incident_type}事件。${worldview}的世界観で${tone}なトーン。ユニークで論理的なコンセプトを作成してください。`;

  return await callGroqAPI(systemPrompt, userPrompt, 800);
}

async function enhanceCharacters(concept, participants) {
  const systemPrompt = `以下のシナリオコンセプトに、${participants}人のキャラクター概要を追加してください。各キャラクターは異なる動機・秘密・背景を持つこと。

【追加フォーマット】
## 👥 キャラクター概要
[各キャラクターの名前・役割・秘密を1-2行で]`;

  return await callGroqAPI(systemPrompt, `コンセプト:\n${concept}`, 400);
}

async function enhancePlot(concept) {
  const systemPrompt = `以下のシナリオコンセプトに、事件の詳細とトリックを追加してください。

【追加フォーマット】
## 🔍 事件詳細
[トリック・証拠・タイムラインの概要]`;

  return await callGroqAPI(systemPrompt, `コンセプト:\n${concept}`, 400);
}

async function enhanceSetting(concept) {
  const systemPrompt = `以下のシナリオコンセプトに、舞台設定の詳細を追加してください。

【追加フォーマット】
## 🏛️ 舞台詳細
[場所の特徴・制約・雰囲気]`;

  return await callGroqAPI(systemPrompt, `コンセプト:\n${concept}`, 400);
}

async function callGroqAPI(systemPrompt, userPrompt, maxTokens) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
        top_p: 0.85,
        frequency_penalty: 1.2,
        presence_penalty: 1.0,
        stream: false
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

function assessQuality(content) {
  let score = 0;
  
  // 長さチェック
  if (content.length > 300) score += 20;
  if (content.length > 600) score += 10;
  
  // 構造チェック
  if (content.includes('## 🏆')) score += 15;
  if (content.includes('## 🎭')) score += 15;
  if (content.includes('## 📋')) score += 15;
  if (content.includes('## 🕵️')) score += 15;
  if (content.includes('## 🎯')) score += 10;
  
  // 具体性チェック
  if (content.match(/\d{1,2}:\d{2}/)) score += 5; // 時刻
  if (content.match(/[A-Za-z\u4e00-\u9faf]{2,}/g)?.length > 10) score += 5; // 固有名詞
  
  // 重複チェック（ペナルティ）
  const lines = content.split('\n');
  const duplicates = lines.filter((line, i) => 
    lines.indexOf(line) !== i && line.trim().length > 10
  );
  score -= duplicates.length * 10;
  
  return Math.max(0, Math.min(100, score));
}

function needsCharacterDetails(content) {
  return !content.includes('👥') && !content.match(/キャラクター|人物|登場人物/);
}

function needsPlotDetails(content) {
  return !content.includes('🔍') && !content.match(/トリック|証拠|謎/);
}

function needsSettingDetails(content) {
  return !content.includes('🏛️') && content.split('## 📋')[1]?.length < 100;
}

function integrateEnhancements(basicConcept, enhancements) {
  return basicConcept + '\n\n' + enhancements.join('\n\n');
}