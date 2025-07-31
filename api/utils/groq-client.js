/**
 * GROQ APIクライアント - シンプルで信頼性の高い実装
 */

const { logger } = require('./logger.js');

/**
 * GROQ APIを直接呼び出す
 */
async function callGroqAPI(systemPrompt, userPrompt, apiKey) {
  if (!apiKey) {
    throw new Error('GROQ API key is required');
  }

  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  const body = {
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.8,
    max_tokens: 1800,
    top_p: 0.9,
    frequency_penalty: 0.3,
    presence_penalty: 0.4,
    stream: false
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000) // 25秒タイムアウト
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`GROQ API error: ${response.status} - ${errorText}`);
      throw new Error(`GROQ API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from GROQ API');
    }

    return {
      success: true,
      content: data.choices[0].message.content,
      usage: data.usage
    };

  } catch (error) {
    logger.error('GROQ API call failed:', error);
    throw error;
  }
}

/**
 * 環境変数からAPIキーを取得（複数の方法を試す）
 */
function getGroqApiKey() {
  // 1. 直接アクセス
  if (process.env.GROQ_API_KEY) {
    return process.env.GROQ_API_KEY;
  }
  
  // 2. 大文字小文字の違いを考慮
  const envKeys = Object.keys(process.env);
  const groqKey = envKeys.find(k => k.toUpperCase() === 'GROQ_API_KEY');
  if (groqKey && process.env[groqKey]) {
    return process.env[groqKey];
  }
  
  // 3. プレフィックス付きを探す
  const prefixedKey = envKeys.find(k => k.includes('GROQ') && k.includes('API') && k.includes('KEY'));
  if (prefixedKey && process.env[prefixedKey]) {
    return process.env[prefixedKey];
  }
  
  return null;
}

module.exports = {
  callGroqAPI,
  getGroqApiKey
};