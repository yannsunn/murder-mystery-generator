/**
 * 🧪 Supabaseテストエンドポイント
 * データベース接続とテーブル作成のテスト
 */

import { setSecurityHeaders } from './security-utils.js';
import { 
  testSupabaseConnection, 
  ensureTablesExist,
  getAllScenariosFromSupabase,
  saveScenarioToSupabase 
} from './supabase-client.js';

export const config = {
  maxDuration: 30,
};

/**
 * Supabaseテストエンドポイント
 */
export default async function handler(req, res) {
  setSecurityHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'connection':
        return await testConnection(req, res);
      
      case 'tables':
        return await testTables(req, res);
      
      case 'scenarios':
        return await listScenarios(req, res);
      
      case 'test-save':
        return await testSave(req, res);
      
      case 'all':
        return await runAllTests(req, res);
      
      default:
        return res.status(200).json({
          success: true,
          message: 'Supabaseテストエンドポイント',
          availableActions: [
            'connection - 接続テスト',
            'tables - テーブル作成テスト',
            'scenarios - シナリオ一覧',
            'test-save - 保存テスト',
            'all - 全テスト実行'
          ]
        });
    }
  } catch (error) {
    console.error('❌ テストエラー:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * 接続テスト
 */
async function testConnection(req, res) {
  const result = await testSupabaseConnection();
  
  return res.status(result.success ? 200 : 500).json({
    test: 'connection',
    ...result
  });
}

/**
 * テーブル作成テスト
 */
async function testTables(req, res) {
  const result = await ensureTablesExist();
  
  return res.status(result ? 200 : 500).json({
    test: 'tables',
    success: result,
    message: result ? 'テーブル確認/作成完了' : 'テーブル作成失敗'
  });
}

/**
 * シナリオ一覧取得
 */
async function listScenarios(req, res) {
  const result = await getAllScenariosFromSupabase();
  
  return res.status(result.success ? 200 : 500).json({
    test: 'scenarios',
    ...result
  });
}

/**
 * 保存テスト
 */
async function testSave(req, res) {
  const testData = {
    title: 'テストシナリオ',
    description: 'Supabase接続テスト用のシナリオ',
    characters: [
      { name: 'テストキャラクター1', role: 'テスト役' },
      { name: 'テストキャラクター2', role: 'テスト役' }
    ],
    generatedAt: new Date().toISOString()
  };

  const sessionId = `test_${Date.now()}`;
  const result = await saveScenarioToSupabase(sessionId, testData);
  
  return res.status(result.success ? 200 : 500).json({
    test: 'test-save',
    sessionId,
    ...result
  });
}

/**
 * 全テスト実行
 */
async function runAllTests(req, res) {
  const results = {
    tests: {},
    summary: { passed: 0, failed: 0, total: 0 }
  };

  // 1. 接続テスト
  const connectionResult = await testSupabaseConnection();
  results.tests.connection = connectionResult;
  results.summary.total++;
  if (connectionResult.success) results.summary.passed++;
  else results.summary.failed++;

  // 2. テーブルテスト
  const tablesResult = await ensureTablesExist();
  results.tests.tables = { success: tablesResult };
  results.summary.total++;
  if (tablesResult) results.summary.passed++;
  else results.summary.failed++;

  // 3. シナリオ一覧テスト
  const scenariosResult = await getAllScenariosFromSupabase();
  results.tests.scenarios = scenariosResult;
  results.summary.total++;
  if (scenariosResult.success) results.summary.passed++;
  else results.summary.failed++;

  // 4. 保存テスト
  const testData = {
    title: '全テスト用シナリオ',
    description: 'Supabase全テスト実行用',
    characters: [{ name: 'テストキャラクター', role: 'テスト' }],
    generatedAt: new Date().toISOString()
  };

  const sessionId = `all_test_${Date.now()}`;
  const saveResult = await saveScenarioToSupabase(sessionId, testData);
  results.tests.save = { ...saveResult, sessionId };
  results.summary.total++;
  if (saveResult.success) results.summary.passed++;
  else results.summary.failed++;

  // 結果判定
  const allPassed = results.summary.failed === 0;
  results.success = allPassed;
  results.message = allPassed 
    ? '✅ 全テストパス' 
    : `❌ ${results.summary.failed}/${results.summary.total} テスト失敗`;

  return res.status(allPassed ? 200 : 500).json(results);
}