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

    // 段階的APIキー取得アプローチ
    let apiKey = null;
    const keySearchLog = [];
    
    // 方法1: 直接環境変数アクセス
    if (process.env.GROQ_API_KEY) {
      apiKey = process.env.GROQ_API_KEY;
      keySearchLog.push('✅ process.env.GROQ_API_KEY');
    } else {
      keySearchLog.push('❌ process.env.GROQ_API_KEY');
    }
    
    // 方法2: Vercel専用関数
    if (!apiKey) {
      try {
        apiKey = getVercelEnv('GROQ_API_KEY');
        if (apiKey) {
          keySearchLog.push('✅ getVercelEnv');
        } else {
          keySearchLog.push('❌ getVercelEnv');
        }
      } catch (e) {
        keySearchLog.push('❌ getVercelEnv (error): ' + e.message);
      }
    }
    
    // 方法3: 環境変数ユーティリティ
    if (!apiKey) {
      try {
        apiKey = getEnvironmentVariable('GROQ_API_KEY');
        if (apiKey) {
          keySearchLog.push('✅ getEnvironmentVariable');
        } else {
          keySearchLog.push('❌ getEnvironmentVariable');
        }
      } catch (e) {
        keySearchLog.push('❌ getEnvironmentVariable (error): ' + e.message);
      }
    }
    
    // 方法4: フォールバック関数
    if (!apiKey) {
      try {
        apiKey = getGroqApiKey();
        if (apiKey) {
          keySearchLog.push('✅ getGroqApiKey');
        } else {
          keySearchLog.push('❌ getGroqApiKey');
        }
      } catch (e) {
        keySearchLog.push('❌ getGroqApiKey (error): ' + e.message);
      }
    }
    
    // 方法5: セッションデータから
    if (!apiKey && sessionData.apiKey) {
      apiKey = sessionData.apiKey;
      keySearchLog.push('✅ sessionData.apiKey');
    } else if (!apiKey) {
      keySearchLog.push('❌ sessionData.apiKey');
    }
    
    // 詳細ログ出力
    console.log('[STAGE0] API Key Search Results:');
    keySearchLog.forEach(log => console.log('  ' + log));
    console.log('[STAGE0] Final API Key Found:', apiKey ? 'YES' : 'NO');
    if (apiKey) {
      console.log('[STAGE0] API Key Length:', apiKey.length);
      console.log('[STAGE0] API Key Prefix:', apiKey.substring(0, 8) + '...');
    }
    
    if (!apiKey) {
      // 全環境変数のデバッグ情報
      const allEnvKeys = Object.keys(process.env);
      const apiRelatedKeys = allEnvKeys.filter(k => 
        k.includes('GROQ') || 
        k.includes('API') || 
        k.includes('KEY')
      ).sort();
      
      console.error('[STAGE0] ❌ CRITICAL: No API key found after all attempts');
      console.error('[STAGE0] Environment Analysis:');
      console.error('  - Total env vars:', allEnvKeys.length);
      console.error('  - API-related vars:', apiRelatedKeys);
      console.error('  - NODE_ENV:', process.env.NODE_ENV);
      console.error('  - VERCEL:', process.env.VERCEL);
      console.error('  - VERCEL_ENV:', process.env.VERCEL_ENV);
      
      // 具体的な解決手順を含むエラー
      const troubleshootingSteps = [
        '1. Vercel Dashboard → Settings → Environment Variables',
        '2. GROQ_API_KEY を Production, Preview, Development すべてに設定',
        '3. 再デプロイを実行 (vercel --prod)',
        '4. APIキーが gsk_ で始まっていることを確認'
      ];
      
      const errorMessage = {
        id: `API_KEY_MISSING_${Date.now()}`,
        type: 'CONFIGURATION_ERROR',
        message: 'GROQ APIキーが利用できません。環境変数の設定を確認してください。',
        priority: 'CRITICAL',
        retryable: true,
        troubleshooting: troubleshootingSteps,
        searchResults: keySearchLog,
        debugInfo: {
          totalEnvVars: allEnvKeys.length,
          apiRelatedVars: apiRelatedKeys,
          vercelEnv: process.env.VERCEL_ENV,
          nodeEnv: process.env.NODE_ENV
        },
        helpUrl: 'https://console.groq.com/keys',
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