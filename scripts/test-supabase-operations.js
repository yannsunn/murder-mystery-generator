#!/usr/bin/env node
/**
 * 🧪 Supabase Operations Test
 * 実際の保存・取得処理をテスト
 */

// Load environment variables
require('dotenv').config();

const {
  initializeSupabase,
  saveScenarioToSupabase,
  getScenarioFromSupabase,
  testSupabaseConnection
} = require('../api/supabase-client.js');

/**
 * テスト用のサンプルデータ
 */
const sampleScenario = {
  id: 'test_scenario_001',
  title: 'テストシナリオ',
  description: 'Supabase接続テスト用のサンプルシナリオ',
  characters: [
    { name: '田中太郎', role: '容疑者', background: 'テストキャラクター' },
    { name: '佐藤花子', role: '被害者', background: 'テストキャラクター' }
  ],
  phases: {
    setup: '事件の設定',
    investigation: '調査フェーズ',
    resolution: '解決フェーズ'
  },
  metadata: {
    generatedAt: new Date().toISOString(),
    version: '2.0.0'
  }
};

/**
 * 接続テスト
 */
async function testConnection() {
  console.log('🔌 Supabase接続テスト...');
  
  try {
    const result = await testSupabaseConnection();
    
    if (result.success) {
      console.log('✅ 接続成功:', result.message || 'OK');
      return true;
    } else {
      console.log('❌ 接続失敗:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ 接続エラー:', error.message);
    return false;
  }
}

/**
 * 保存テスト
 */
async function testSave() {
  console.log('\n💾 シナリオ保存テスト...');
  
  try {
    const result = await saveScenarioToSupabase(
      sampleScenario.id,
      sampleScenario
    );
    
    if (result.success) {
      console.log('✅ 保存成功:', sampleScenario.id);
      return true;
    } else {
      console.log('❌ 保存失敗:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ 保存エラー:', error.message);
    return false;
  }
}

/**
 * 取得テスト
 */
async function testRetrieve() {
  console.log('\n📁 シナリオ取得テスト...');
  
  try {
    const result = await getScenarioFromSupabase(sampleScenario.id);
    
    if (result.success) {
      console.log('✅ 取得成功');
      console.log('   - ID:', result.data.id);
      console.log('   - Title:', result.data.title);
      console.log('   - Characters:', result.data.characters.length + '名');
      return true;
    } else {
      console.log('❌ 取得失敗:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ 取得エラー:', error.message);
    return false;
  }
}

/**
 * エラーハンドリングテスト
 */
async function testErrorHandling() {
  console.log('\n🚨 エラーハンドリングテスト...');
  
  try {
    // 存在しないシナリオの取得を試行
    const result = await getScenarioFromSupabase('non_existent_scenario');
    
    if (!result.success) {
      console.log('✅ エラーハンドリング正常:', result.error);
      return true;
    } else {
      console.log('⚠️  予期しない成功 (データが存在?)');
      return false;
    }
  } catch (error) {
    console.log('✅ 例外処理正常:', error.message);
    return true;
  }
}

/**
 * メイン実行
 */
async function main() {
  console.log('🧪 Supabase Operations Test Suite');
  console.log('==================================');

  // 初期化
  console.log('⚙️  Supabase初期化中...');
  try {
    const initialized = await initializeSupabase();
    if (!initialized) {
      console.log('❌ 初期化失敗');
      return;
    }
    console.log('✅ 初期化完了');
  } catch (error) {
    console.log('❌ 初期化エラー:', error.message);
    return;
  }

  const results = {
    connection: false,
    save: false,
    retrieve: false,
    errorHandling: false
  };

  // テスト実行
  results.connection = await testConnection();
  
  if (results.connection) {
    results.save = await testSave();
    
    if (results.save) {
      results.retrieve = await testRetrieve();
    }
    
    results.errorHandling = await testErrorHandling();
  }

  // 結果サマリー
  console.log('\n📊 テスト結果サマリー');
  console.log('========================');
  console.log('接続テスト:', results.connection ? '✅ 成功' : '❌ 失敗');
  console.log('保存テスト:', results.save ? '✅ 成功' : '❌ 失敗');
  console.log('取得テスト:', results.retrieve ? '✅ 成功' : '❌ 失敗');
  console.log('エラーハンドリング:', results.errorHandling ? '✅ 成功' : '❌ 失敗');

  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  console.log(`\n成功率: ${successCount}/${totalCount} (${Math.round(successCount / totalCount * 100)}%)`);

  if (successCount === totalCount) {
    console.log('\n🎉 全テスト成功! Supabase接続が正常に動作しています。');
  } else {
    console.log('\n⚠️  一部のテストが失敗しました。上記の詳細を確認してください。');
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testConnection,
  testSave,
  testRetrieve,
  testErrorHandling
};