/**
 * 🚀 Application Startup & Environment Validation
 * アプリケーション起動時の環境変数検証
 */

import { envManager } from './config/env-manager.js';

/**
 * アプリケーション起動時の初期化
 */
export function initializeApplication() {
  console.log('🚀 Murder Mystery Generator - アプリケーション起動');
  
  // 環境変数マネージャーの初期化
  const isValid = envManager.initialize();
  
  if (!isValid) {
    console.error('❌ 環境変数の検証に失敗しました:');
    envManager.getErrors().forEach(error => {
      console.error(`   - ${error}`);
    });
    
    console.error('\n💡 解決方法:');
    console.error('   1. .env ファイルを作成してください');
    console.error('   2. .env.example を参考に必要な環境変数を設定してください');
    console.error('   3. 特に GROQ_API_KEY は必須です');
    
    // 開発環境では警告のみ、本番環境では停止
    if (envManager.get('NODE_ENV') === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️  開発環境のため、警告のみで続行します');
    }
  }
  
  console.log('✅ アプリケーション初期化完了');
  return true;
}

/**
 * 起動時ヘルスチェック
 */
export function healthCheck() {
  const checks = {
    envManager: envManager.isValid(),
    groqKey: envManager.has('GROQ_API_KEY'),
    nodeEnv: envManager.has('NODE_ENV')
  };
  
  const allHealthy = Object.values(checks).every(check => check);
  
  console.log('\n🏥 ヘルスチェック結果:');
  Object.entries(checks).forEach(([service, status]) => {
    console.log(`   ${status ? '✅' : '❌'} ${service}: ${status ? 'OK' : 'FAILED'}`);
  });
  
  return allHealthy;
}

// 自動初期化（importされた時に実行）
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  initializeApplication();
}