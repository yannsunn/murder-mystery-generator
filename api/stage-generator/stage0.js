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

  async processStage(sessionData, _stageData) {
    const { formData } = sessionData;

    // 詳細なログを追加
    console.log('[STAGE0] Processing stage with formData:', formData);

    // Vercel環境変数の初期化
    initializeEnvVars();

    // 環境変数の完全なデバッグ
    debugEnvironmentVariables();
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

    // 直接環境変数アクセス（最も確実）
    let apiKey = process.env.GROQ_API_KEY;
    const keySearchLog = [];
    
    console.log('[STAGE0] Direct env access:');
    console.log('  GROQ_API_KEY exists:', process.env.GROQ_API_KEY !== undefined);
    console.log('  GROQ_API_KEY length:', process.env.GROQ_API_KEY?.length || 0);
    console.log('  GROQ_API_KEY valid format:', process.env.GROQ_API_KEY?.startsWith('gsk_') || false);
    
    if (apiKey) {
      keySearchLog.push('✅ Direct process.env.GROQ_API_KEY - SUCCESS');
      console.log('[STAGE0] ✅ API Key found via direct access');
    } else {
      keySearchLog.push('❌ Direct process.env.GROQ_API_KEY - FAILED');
      console.log('[STAGE0] ❌ API Key NOT found via direct access');
    }
    
    // 環境変数は確実に存在することが確認されているので、
    // 他のフォールバック手段はスキップ
    if (apiKey) {
      console.log('[STAGE0] Using API key from direct environment access');
    } else {
      console.log('[STAGE0] WARNING: Environment variable exists but not accessible');
      console.log('[STAGE0] Attempting alternative access methods...');
      
      // 代替手段を試す
      const alternativeMethods = [
        () => getVercelEnv('GROQ_API_KEY'),
        () => getEnvironmentVariable('GROQ_API_KEY'),
        () => getGroqApiKey(),
        () => sessionData.apiKey
      ];
      
      for (let i = 0; i < alternativeMethods.length && !apiKey; i++) {
        try {
          apiKey = alternativeMethods[i]();
          if (apiKey) {
            console.log(`[STAGE0] ✅ Success with method ${i + 1}`);
            keySearchLog.push(`✅ Alternative method ${i + 1}`);
            break;
          }
        } catch (e) {
          console.log(`[STAGE0] Method ${i + 1} failed:`, e.message);
          keySearchLog.push(`❌ Method ${i + 1}: ${e.message}`);
        }
      }
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