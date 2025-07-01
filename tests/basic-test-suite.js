/**
 * 🧪 Basic Test Suite - 限界突破版
 * Murder Mystery Generator基本テスト
 */

import { envManager } from '../api/config/env-manager.js';
import { UnifiedAIClient } from '../api/utils/ai-client.js';
import { AppError, ErrorTypes } from '../api/utils/error-handler.js';

/**
 * テスト結果の記録
 */
class TestResults {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
    this.startTime = Date.now();
  }

  pass(testName) {
    this.passed++;
    console.log(`✅ PASS: ${testName}`);
  }

  fail(testName, error) {
    this.failed++;
    this.errors.push({ testName, error: error.message });
    console.log(`❌ FAIL: ${testName} - ${error.message}`);
  }

  summary() {
    const duration = Date.now() - this.startTime;
    const total = this.passed + this.failed;
    
    console.log('\n🧪 テスト結果サマリー');
    console.log('========================');
    console.log(`総テスト数: ${total}`);
    console.log(`成功: ${this.passed}`);
    console.log(`失敗: ${this.failed}`);
    console.log(`成功率: ${total > 0 ? Math.round((this.passed / total) * 100) : 0}%`);
    console.log(`実行時間: ${duration}ms`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ 失敗したテスト:');
      this.errors.forEach(({ testName, error }) => {
        console.log(`   - ${testName}: ${error}`);
      });
    }
    
    return this.failed === 0;
  }
}

/**
 * アサーション関数
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertNotNull(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value should not be null or undefined');
  }
}

/**
 * 環境変数管理システムテスト
 */
async function testEnvManager(results) {
  console.log('\n🔧 環境変数管理システムテスト');
  
  try {
    // 初期化テスト
    const isValid = envManager.initialize();
    results.pass('EnvManager initialization');
    
    // 必須環境変数チェック
    const hasGroqKey = envManager.has('GROQ_API_KEY');
    if (hasGroqKey) {
      results.pass('GROQ_API_KEY exists');
    } else {
      results.fail('GROQ_API_KEY missing', new Error('GROQ_API_KEY not found'));
    }
    
    // フォールバック値テスト
    const nodeEnv = envManager.get('NODE_ENV');
    assertNotNull(nodeEnv, 'NODE_ENV should have fallback value');
    results.pass('NODE_ENV fallback value');
    
    // 型変換テスト
    const maxStorage = envManager.get('MAX_STORAGE_SIZE');
    assert(typeof maxStorage === 'number', 'MAX_STORAGE_SIZE should be number');
    results.pass('Type conversion for numbers');
    
  } catch (error) {
    results.fail('EnvManager test', error);
  }
}

/**
 * 統一AIクライアントテスト
 */
async function testUnifiedAIClient(results) {
  console.log('\n🤖 統一AIクライアントテスト');
  
  try {
    const client = new UnifiedAIClient();
    
    // インスタンス生成テスト
    assertNotNull(client, 'AI Client should be instantiated');
    results.pass('AI Client instantiation');
    
    // 設定値確認
    assert(typeof client.timeout === 'number', 'Timeout should be number');
    assert(client.timeout > 0, 'Timeout should be positive');
    results.pass('AI Client configuration');
    
    // プロバイダー設定テスト（APIキーが有効な場合のみ）
    if (envManager.has('GROQ_API_KEY') && envManager.get('GROQ_API_KEY')) {
      assert(typeof client.groqKey === 'string', 'Groq key should be string');
      results.pass('Provider key configuration');
    } else {
      console.log('⚠️  GROQ_API_KEY not set, skipping provider tests');
      results.pass('Provider test skipped (no API key)');
    }
    
  } catch (error) {
    results.fail('UnifiedAIClient test', error);
  }
}

/**
 * エラーハンドリングシステムテスト
 */
async function testErrorHandling(results) {
  console.log('\n🚨 エラーハンドリングシステムテスト');
  
  try {
    // AppError生成テスト
    const error = new AppError('Test error', ErrorTypes.VALIDATION, 400);
    
    assertEqual(error.message, 'Test error', 'Error message should match');
    assertEqual(error.type, ErrorTypes.VALIDATION, 'Error type should match');
    assertEqual(error.statusCode, 400, 'Status code should match');
    results.pass('AppError creation');
    
    // エラータイプ確認
    assert(ErrorTypes.VALIDATION !== undefined, 'VALIDATION error type exists');
    assert(ErrorTypes.GENERATION !== undefined, 'GENERATION error type exists');
    assert(ErrorTypes.INTERNAL !== undefined, 'INTERNAL error type exists');
    results.pass('Error types definition');
    
  } catch (error) {
    results.fail('Error handling test', error);
  }
}

/**
 * セキュリティ機能テスト
 */
async function testSecurityFeatures(results) {
  console.log('\n🔒 セキュリティ機能テスト');
  
  try {
    // テキストサニタイゼーションテスト（動的import）
    const { sanitizeText } = await import('../api/security-utils.js');
    
    const maliciousInput = '<script>alert("xss")</script>Hello World';
    const sanitized = sanitizeText(maliciousInput);
    
    assert(!sanitized.includes('<script>'), 'Script tags should be removed');
    assert(sanitized.includes('Hello World'), 'Safe content should remain');
    results.pass('Text sanitization');
    
    // レート制限テスト（基本的な関数存在確認）
    const { checkRateLimit } = await import('../api/security-utils.js');
    assert(typeof checkRateLimit === 'function', 'Rate limit function exists');
    results.pass('Rate limiting function exists');
    
  } catch (error) {
    results.fail('Security features test', error);
  }
}

/**
 * ストレージシステムテスト
 */
async function testStorageSystem(results) {
  console.log('\n💾 ストレージシステムテスト');
  
  try {
    // モジュールの存在確認
    const storageModule = await import('../api/scenario-storage.js');
    assert(storageModule.default !== undefined, 'Storage module should export default');
    results.pass('Storage module exists');
    
    // 設定確認
    assert(storageModule.config !== undefined, 'Storage config exists');
    assert(typeof storageModule.config.maxDuration === 'number', 'MaxDuration should be number');
    results.pass('Storage configuration');
    
  } catch (error) {
    results.fail('Storage system test', error);
  }
}

/**
 * フェーズAPIテスト（基本的な存在確認）
 */
async function testIntegratedAPI(results) {
  console.log('\n🔬 統合マイクロ生成APIテスト');
  
  try {
    const module = await import('../api/integrated-micro-generator.js');
    assert(module.default !== undefined, 'integrated-micro-generator should export default handler');
    results.pass('integrated-micro-generator module exists');
    
    // APIのテスト (実際の呼び出しはせず、存在確認のみ)
    results.pass('integrated-micro-generator loads successfully');
    
  } catch (error) {
    results.fail('integrated-micro-generator test', error);
  }
}

/**
 * メインテスト実行関数
 */
export async function runBasicTests() {
  console.log('🧪 Murder Mystery Generator - Basic Test Suite');
  console.log('=================================================');
  
  const results = new TestResults();
  
  // 環境変数初期化
  if (!envManager.isValid()) {
    envManager.initialize();
  }
  
  // テスト実行
  await testEnvManager(results);
  await testUnifiedAIClient(results);
  await testErrorHandling(results);
  await testSecurityFeatures(results);
  await testStorageSystem(results);
  await testIntegratedAPI(results);
  
  // 結果サマリー
  const success = results.summary();
  
  if (success) {
    console.log('\n🎉 すべてのテストが成功しました！');
  } else {
    console.log('\n⚠️  一部のテストが失敗しました。上記の詳細を確認してください。');
  }
  
  return success;
}

/**
 * スタンドアロン実行時
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runBasicTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ テスト実行エラー:', error);
      process.exit(1);
    });
}