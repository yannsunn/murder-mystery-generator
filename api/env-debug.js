// より詳細な環境変数デバッグ
module.exports = function handler(req, res) {
  try {
    // すべての環境変数を確認
    const allEnvVars = {};
    for (const key in process.env) {
      if (key.includes('GROQ') || key.includes('API') || key.includes('VERCEL') || key.includes('NODE')) {
        allEnvVars[key] = process.env[key] ? 
          (key.includes('KEY') || key.includes('SECRET') ? 
            process.env[key].substring(0, 10) + '...' : 
            process.env[key]) : 'NOT_SET';
      }
    }

    // GROQ_API_KEY の詳細確認
    const groqKey = process.env.GROQ_API_KEY;
    const groqDetails = {
      exists: !!groqKey,
      type: typeof groqKey,
      length: groqKey ? groqKey.length : 0,
      prefix: groqKey ? groqKey.substring(0, 4) : 'NONE',
      isString: typeof groqKey === 'string',
      truthyCheck: !!groqKey,
      emptyStringCheck: groqKey === '',
      undefinedCheck: groqKey === undefined,
      nullCheck: groqKey === null
    };

    // process.env の直接確認
    const processEnvKeys = Object.keys(process.env).filter(key => 
      key.includes('GROQ') || key.includes('API')
    );

    res.status(200).json({
      status: 'Environmental Debug',
      timestamp: new Date().toISOString(),
      groqApiKeyDetails: groqDetails,
      relevantEnvVars: allEnvVars,
      processEnvKeys: processEnvKeys,
      vercelEnvironment: {
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_REGION: process.env.VERCEL_REGION,
        NODE_ENV: process.env.NODE_ENV
      },
      functionContext: {
        platform: process.platform,
        version: process.version,
        cwd: process.cwd(),
        memoryUsage: process.memoryUsage()
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Environment debug error',
      message: error.message,
      stack: error.stack
    });
  }
};