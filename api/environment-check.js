// 環境変数チェック・最適化API
// FUNCTION_INVOCATION_TIMEOUTエラー対策用

export const config = {
  maxDuration: 30, // 軽量な環境チェック用
};

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
    console.log('Environment check starting...');
    
    // 環境変数の存在確認
    const envCheck = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
      VERCEL_ENV: process.env.VERCEL_ENV || 'development',
      VERCEL_REGION: process.env.VERCEL_REGION || 'unknown',
      NODE_ENV: process.env.NODE_ENV || 'development'
    };

    // API接続テスト
    const apiTests = {
      openai: false,
      groq: false
    };

    // OpenAI API接続テスト（軽量）
    if (envCheck.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        });
        apiTests.openai = response.ok;
      } catch (error) {
        console.warn('OpenAI API test failed:', error.message);
      }
    }

    // Groq API接続テスト（軽量）
    if (envCheck.GROQ_API_KEY) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          },
        });
        apiTests.groq = response.ok;
      } catch (error) {
        console.warn('Groq API test failed:', error.message);
      }
    }

    // パフォーマンス推奨事項
    const recommendations = [];
    
    if (!envCheck.GROQ_API_KEY) {
      recommendations.push({
        type: 'critical',
        message: 'GROQ_API_KEYが設定されていません。Groq APIは処理速度が5-10倍高速です。',
        action: 'https://console.groq.com でAPIキーを取得してVercelに設定してください。'
      });
    }

    if (!apiTests.groq && envCheck.GROQ_API_KEY) {
      recommendations.push({
        type: 'warning',
        message: 'Groq APIに接続できません。APIキーを確認してください。',
        action: 'APIキーの有効性を確認し、Vercelで正しく設定されているか確認してください。'
      });
    }

    if (envCheck.VERCEL_ENV !== 'production') {
      recommendations.push({
        type: 'info',
        message: 'プロダクション環境ではありません。最適化設定が適用されていない可能性があります。',
        action: 'vercel --prod でプロダクションデプロイを実行してください。'
      });
    }

    // タイムアウト対策の評価
    const timeoutRisk = {
      level: 'low',
      factors: []
    };

    if (!apiTests.groq) {
      timeoutRisk.level = 'high';
      timeoutRisk.factors.push('Groq API未使用（OpenAI APIは遅い）');
    }

    if (envCheck.VERCEL_ENV !== 'production') {
      timeoutRisk.level = 'medium';
      timeoutRisk.factors.push('非プロダクション環境');
    }

    console.log('Environment check completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        environment: envCheck,
        apiConnectivity: apiTests,
        timeoutRisk: timeoutRisk,
        recommendations: recommendations,
        nextSteps: [
          'vercel.jsonでmaxDuration設定を確認',
          'Groq APIを優先的に使用',
          '並列処理の同時実行数を制限',
          'エラーハンドリングとリトライ機構を実装'
        ]
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Environment check error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `環境チェックエラー: ${error.message}`,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers }
    );
  }
}