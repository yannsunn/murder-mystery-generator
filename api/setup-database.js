/**
 * 🗄️ データベースセットアップAPI
 * SQLエラー対応 - アプリケーション経由でテーブル作成
 */

import { createClient } from '@supabase/supabase-js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 60,
};

// Supabase設定（セキュリティ強化）
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// 環境変数の詳細な検証
function validateEnvironment() {
  const errors = [];
  
  if (!SUPABASE_URL) {
    errors.push('SUPABASE_URLが設定されていません');
  }
  
  if (!SUPABASE_SERVICE_KEY) {
    errors.push('SUPABASE_SERVICE_KEYまたはSUPABASE_ANON_KEYが設定されていません');
  }
  
  if (errors.length > 0) {
    console.error('❌ 環境変数エラー:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('💡 .envファイルを確認してください');
    return false;
  }
  
  return true;
}

/**
 * データベースセットアップエンドポイント
 */
export default async function handler(req, res) {
  setSecurityHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 環境変数の検証
  if (!validateEnvironment()) {
    return res.status(500).json({ 
      success: false, 
      error: '環境設定エラー', 
      message: '必要な環境変数が設定されていません' 
    });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'create-tables':
        return await createTables(req, res);
      
      case 'check-tables':
        return await checkTables(req, res);
      
      case 'insert-sample':
        return await insertSampleData(req, res);
      
      case 'setup-all':
        return await setupAll(req, res);
      
      default:
        return res.status(200).json({
          success: true,
          message: 'データベースセットアップAPI',
          availableActions: [
            'create-tables - テーブル作成',
            'check-tables - テーブル確認',
            'insert-sample - サンプルデータ挿入',
            'setup-all - 全セットアップ実行'
          ]
        });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * テーブル作成（REST API経由）
 */
async function createTables(req, res) {
  const results = [];
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // scenarios テーブル作成をREST APIで試行
    
    // 最初にテーブル存在確認
    const { data: existingData, error: checkError } = await supabase
      .from('scenarios')
      .select('count')
      .limit(1);
    
    if (!checkError) {
      results.push({ table: 'scenarios', status: 'already_exists', message: 'テーブルは既に存在します' });
    } else if (checkError.code === '42P01') {
      // テーブルが存在しない場合、サンプルデータでテーブル作成を試行
      const { data: createData, error: createError } = await supabase
        .from('scenarios')
        .insert([
          {
            title: 'セットアップテスト',
            description: 'テーブル作成テスト',
            characters: [],
            scenario_data: { setup: true }
          }
        ]);
      
      if (createError) {
        results.push({ 
          table: 'scenarios', 
          status: 'error', 
          error: createError.message,
          suggestion: 'Supabase ダッシュボードでの手動作成が必要です'
        });
      } else {
        results.push({ table: 'scenarios', status: 'created', message: 'テーブル作成成功' });
      }
    } else {
      results.push({ table: 'scenarios', status: 'error', error: checkError.message });
    }
    
    // user_sessions テーブル作成
    
    const { data: sessionCheck, error: sessionCheckError } = await supabase
      .from('user_sessions')
      .select('count')
      .limit(1);
    
    if (!sessionCheckError) {
      results.push({ table: 'user_sessions', status: 'already_exists', message: 'テーブルは既に存在します' });
    } else if (sessionCheckError.code === '42P01') {
      const { data: sessionCreate, error: sessionCreateError } = await supabase
        .from('user_sessions')
        .insert([
          {
            session_id: 'setup_test_session',
            user_data: { setup: true }
          }
        ]);
      
      if (sessionCreateError) {
        results.push({ 
          table: 'user_sessions', 
          status: 'error', 
          error: sessionCreateError.message,
          suggestion: 'Supabase ダッシュボードでの手動作成が必要です'
        });
      } else {
        results.push({ table: 'user_sessions', status: 'created', message: 'テーブル作成成功' });
      }
    } else {
      results.push({ table: 'user_sessions', status: 'error', error: sessionCheckError.message });
    }
    
    return res.status(200).json({
      success: true,
      message: 'テーブル作成処理完了',
      results
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      results
    });
  }
}

/**
 * テーブル確認
 */
async function checkTables(req, res) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const results = [];
    
    // scenarios テーブル確認
    const { data: scenariosData, error: scenariosError } = await supabase
      .from('scenarios')
      .select('count')
      .limit(1);
    
    results.push({
      table: 'scenarios',
      exists: !scenariosError,
      error: scenariosError?.message || null
    });
    
    // user_sessions テーブル確認
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('count')
      .limit(1);
    
    results.push({
      table: 'user_sessions',
      exists: !sessionsError,
      error: sessionsError?.message || null
    });
    
    return res.status(200).json({
      success: true,
      message: 'テーブル確認完了',
      results
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * サンプルデータ挿入
 */
async function insertSampleData(req, res) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // scenarios テーブルにサンプルデータ
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('scenarios')
      .insert([
        {
          title: 'サンプル: 図書館の謎',
          description: '静かな図書館で起こった不可解な事件',
          characters: [
            { name: '司書', role: '図書館員' },
            { name: '学生', role: '利用者' }
          ],
          scenario_data: {
            setting: '市立図書館',
            difficulty: '初級',
            duration: '2時間'
          }
        }
      ]);
    
    return res.status(200).json({
      success: !scenarioError,
      message: scenarioError ? `エラー: ${scenarioError.message}` : 'サンプルデータ挿入成功',
      data: scenarioData
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * 全セットアップ実行
 */
async function setupAll(req, res) {
  const results = {
    steps: [],
    success: true,
    errors: []
  };
  
  try {
    // 1. テーブル確認
    const checkResponse = await checkTables(req, { json: () => {} });
    results.steps.push({ step: 'check', completed: true });
    
    // 2. テーブル作成（必要に応じて）
    const createResponse = await createTables(req, { json: () => {} });
    results.steps.push({ step: 'create', completed: true });
    
    // 3. サンプルデータ挿入
    const sampleResponse = await insertSampleData(req, { json: () => {} });
    results.steps.push({ step: 'sample', completed: true });
    
    return res.status(200).json({
      success: true,
      message: '全セットアップ完了',
      results
    });
    
  } catch (error) {
    results.success = false;
    results.errors.push(error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      results
    });
  }
}