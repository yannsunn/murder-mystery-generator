/**
 * 緊急デバッグエンドポイント
 * APIキー問題の根本原因を特定するため
 */

const { withSecurity } = require('./security-utils.js');

async function emergencyDebug(req, res) {
  // セキュリティトークン確認
  const { token } = req.query;
  if (token !== 'emergency-debug-2025') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // 環境変数の詳細分析
    const envAnalysis = {
      timestamp: new Date().toISOString(),
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      },
      vercelInfo: {
        isVercel: process.env.VERCEL === '1',
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL,
        vercelRegion: process.env.VERCEL_REGION,
        vercelBranch: process.env.VERCEL_GIT_COMMIT_REF
      },
      environmentVariables: {
        total: Object.keys(process.env).length,
        groqApiKey: {
          exists: process.env.GROQ_API_KEY !== undefined,
          type: typeof process.env.GROQ_API_KEY,
          length: process.env.GROQ_API_KEY?.length || 0,
          isEmpty: process.env.GROQ_API_KEY === '',
          prefix: process.env.GROQ_API_KEY?.substring(0, 8) || 'N/A',
          validFormat: process.env.GROQ_API_KEY?.startsWith('gsk_') || false
        },
        supabase: {
          url: process.env.SUPABASE_URL ? 'SET' : 'NOT_SET',
          anonKey: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
          serviceKey: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT_SET'
        },
        allKeys: Object.keys(process.env).filter(k => 
          k.includes('GROQ') || 
          k.includes('SUPABASE') || 
          k.includes('API') ||
          k.includes('KEY')
        ).sort()
      }
    };

    // テスト用のGROQ API呼び出し
    let apiTest = { status: 'skipped', reason: 'No API key' };
    if (process.env.GROQ_API_KEY) {
      try {
        const testResponse = await fetch('https://api.groq.com/openai/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          method: 'GET'
        });

        apiTest = {
          status: testResponse.ok ? 'success' : 'failed',
          httpStatus: testResponse.status,
          responseOk: testResponse.ok
        };

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          apiTest.errorDetails = errorText.substring(0, 200);
        }
      } catch (error) {
        apiTest = {
          status: 'error',
          error: error.message
        };
      }
    }

    // 段階的初期化テスト
    const initTests = [];
    
    // テスト1: 直接アクセス
    initTests.push({
      test: 'Direct process.env access',
      result: process.env.GROQ_API_KEY ? 'PASS' : 'FAIL'
    });

    // テスト2: 環境変数manager経由
    try {
      const { envManager } = require('./config/env-manager.js');
      if (!envManager.initialized) {
        envManager.initialize();
      }
      initTests.push({
        test: 'EnvManager initialization',
        result: envManager.isValid() ? 'PASS' : 'FAIL',
        errors: envManager.getErrors()
      });
    } catch (e) {
      initTests.push({
        test: 'EnvManager initialization',
        result: 'ERROR',
        error: e.message
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        envAnalysis,
        apiTest,
        initTests,
        recommendations: generateRecommendations(envAnalysis, apiTest)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

function generateRecommendations(envAnalysis, apiTest) {
  const recommendations = [];

  if (!envAnalysis.environmentVariables.groqApiKey.exists) {
    recommendations.push({
      priority: 'CRITICAL',
      issue: 'GROQ_API_KEY not found',
      solution: 'Set GROQ_API_KEY in Vercel Environment Variables',
      steps: [
        'Go to Vercel Dashboard → Your Project → Settings',
        'Click on Environment Variables',
        'Add GROQ_API_KEY with your API key from console.groq.com',
        'Set for Production, Preview, and Development',
        'Redeploy with: vercel --prod'
      ]
    });
  } else if (!envAnalysis.environmentVariables.groqApiKey.validFormat) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Invalid GROQ API key format',
      solution: 'GROQ API keys should start with "gsk_"',
      steps: [
        'Verify your API key from console.groq.com',
        'Ensure it starts with "gsk_"',
        'Update the environment variable in Vercel'
      ]
    });
  }

  if (apiTest.status === 'failed') {
    recommendations.push({
      priority: 'HIGH',
      issue: 'GROQ API authentication failed',
      solution: 'Verify API key validity and permissions'
    });
  }

  return recommendations;
}

module.exports = withSecurity(emergencyDebug);