/**
 * 🎯 段階0: ランダム全体構造・アウトライン生成
 * Vercel無料プラン対応（10秒制限）
 */

const { StageBase } = require('./stage-base.js');
const { withSecurity } = require('../security-utils.js');
const { getGroqApiKey } = require('../config/api-key-fallback.js');
const { debugEnvironmentVariables, getEnvironmentVariable } = require('../utils/env-debug.js');
const { initializeEnvVars, getVercelEnv } = require('../config/vercel-env-fix.js');

class Stage0Generator extends StageBase {
  constructor() {
    super('段階0: ランダム全体構造・アウトライン生成', 15);
  }

  async processStage(sessionData, stageData) {
    const { formData } = sessionData;
    
    // 詳細なログを追加
    console.log('[STAGE0] Processing stage with formData:', formData);
    
    // Vercel環境変数の初期化
    initializeEnvVars();
    
    // 環境変数の完全なデバッグ
    const envDebugInfo = debugEnvironmentVariables();
    console.log('[STAGE0] Environment debug complete');
    
    const systemPrompt = `あなたは商業レベルのマーダーミステリー企画者です。
30分-60分で完結する高品質なシナリオの基本構造を作成してください。
制限時間: 8秒以内で完了してください。`;
    
    const userPrompt = `
【ランダム全体構造生成】

参加人数: ${formData.participants}人
時代背景: ${formData.era}
舞台設定: ${formData.setting}
トーン: ${formData.tone}
複雑さ: ${formData.complexity}

以下の構造で簡潔に生成してください：

## 📖 シナリオタイトル
[魅力的なタイトル]

## 🎭 基本コンセプト
[200文字以内の核心概念]

## 🎯 事件の概要
[150文字以内の事件概要]

## 👥 参加者役割
[各参加者の基本役割を1行ずつ]

## ⏰ 基本タイムライン
[重要な時間帯を5つ以内で]

## 🔍 謎の核心
[解決すべき中心的な謎]

簡潔で効率的に生成してください。
`;

    // 環境変数からAPIキーを取得（複数の方法を試す）
    let apiKey = null;
    
    // 方法1: Vercel専用関数で取得
    apiKey = getVercelEnv('GROQ_API_KEY');
    
    // 方法2: 直接取得
    if (!apiKey) {
      apiKey = getEnvironmentVariable('GROQ_API_KEY');
    }
    
    // 方法3: フォールバック関数を使用
    if (!apiKey) {
      apiKey = getGroqApiKey();
    }
    
    // 方法4: セッションデータから
    if (!apiKey) {
      apiKey = sessionData.apiKey;
    }
    
    console.log('[STAGE0] Final API Key status:', apiKey ? 'FOUND' : 'NOT FOUND');
    console.log('[STAGE0] API Key source check:');
    console.log('  - process.env.GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'EXISTS' : 'NOT EXISTS');
    console.log('  - getVercelEnv result:', getVercelEnv('GROQ_API_KEY') ? 'FOUND' : 'NOT FOUND');
    
    if (!apiKey) {
      const errorInfo = {
        message: 'GROQ API key not found',
        envVarExists: process.env.GROQ_API_KEY !== undefined,
        envVarEmpty: process.env.GROQ_API_KEY === '',
        envVarValue: process.env.GROQ_API_KEY ? 'SET (hidden)' : 'NOT SET',
        sessionApiKey: sessionData.apiKey ? 'EXISTS' : 'NOT EXISTS',
        allEnvVars: Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY')).sort()
      };
      
      console.error('[STAGE0] API Key Error Details:', errorInfo);
      
      // Vercel環境変数設定ページへのリンクを含むエラーメッセージ
      const errorMessage = {
        id: 'API_KEY_MISSING',
        type: 'CONFIGURATION_ERROR',
        message: 'GROQ APIキーが設定されていません。',
        priority: 'CRITICAL',
        retryable: false,
        solution: 'Vercelダッシュボードから環境変数を設定してください: Settings → Environment Variables',
        helpUrl: 'https://vercel.com/docs/environment-variables',
        timestamp: new Date().toISOString()
      };
      
      throw new Error(JSON.stringify(errorMessage));
    }
    
    const result = await this.generateWithAI(
      systemPrompt, 
      userPrompt, 
      apiKey,
      { 
        maxTokens: 1500,
        timeout: 6000,
        temperature: 0.8
      }
    );

    return { 
      random_outline: result.content,
      stage0_completed: true,
      stage0_timestamp: new Date().toISOString()
    };
  }
}

const stage0Generator = new Stage0Generator();

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'POST method required' 
    });
  }

  return await stage0Generator.execute(req, res);
}

module.exports = withSecurity(handler, 'stage-generation');