// タイムアウト最適化ユーティリティ
// Vercel Pro 300秒制限内での効率的な処理管理

export const config = {
  maxDuration: 300, // Vercel Proの最大制限
};

// タイムアウト回避のための設定
export const TIMEOUT_CONFIG = {
  // API呼び出しタイムアウト設定
  OPENAI_TIMEOUT: 60000,     // 60秒
  GROQ_TIMEOUT: 30000,       // 30秒（Groqは高速）
  PDF_TIMEOUT: 45000,        // 45秒
  
  // フェーズ別推奨時間設定
  PHASE_LIMITS: {
    concept: 30,      // コンセプト生成
    characters: 45,   // キャラクター生成
    relationships: 30, // 関係性生成
    incident: 40,     // 事件生成
    clues: 35,        // 手がかり生成
    timeline: 30,     // タイムライン生成
    solution: 40,     // 解決生成
    gamemaster: 60    // ゲームマスター（最も複雑）
  },
  
  // リトライ設定
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000, // 1秒
  
  // 並列処理制限
  MAX_CONCURRENT: 2, // 同時実行数を制限
};

// タイムアウト対応のfetch関数
export async function fetchWithTimeout(url, options, timeoutMs = 60000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// リトライ機能付きAPI呼び出し
export async function apiCallWithRetry(apiCall, maxRetries = TIMEOUT_CONFIG.MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`API call attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 指数バックオフ
      const delay = TIMEOUT_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export default async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Timeout optimizer utilities available',
        config: TIMEOUT_CONFIG,
        recommendations: [
          '1. Use Groq APIs for faster processing (5-10x speed improvement)',
          '2. Implement chunked processing for large scenarios',
          '3. Use parallel processing with concurrency limits',
          '4. Implement proper retry mechanisms',
          '5. Monitor and optimize slow API endpoints'
        ]
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Timeout optimizer error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Optimizer error: ${error.message}` 
      }),
      { status: 500, headers }
    );
  }
}