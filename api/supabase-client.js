/**
 * 🗄️ Supabase Client - 接続プール最適化版
 * 生成されたシナリオをSupabaseに自動保存
 * パフォーマンス向上とクエリ最適化
 */

// Load environment variables
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { envManager } = require('./config/env-manager.js');
const { databasePool, executeOptimizedQuery, initializeDatabasePool } = require('./utils/database-pool.js');
const { logger } = require('./utils/logger.js');

// Supabase接続情報（環境変数の検証）
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// 環境変数の事前検証
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  logger.error('❌ 必須環境変数が設定されていません: SUPABASE_URL, SUPABASE_ANON_KEY');
  logger.error('💡 .envファイルに環境変数を設定してください');
}

// Supabaseクライアント初期化
let supabase = null;
let supabaseAdmin = null;

/**
 * Supabase初期化（接続プール対応版）
 */
async function initializeSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logger.error('❌ Supabase初期化エラー: 環境変数が未設定');
    logger.error('  必要な環境変数:');
    logger.error('  - SUPABASE_URL: ' + (SUPABASE_URL ? '✓設定済み' : '✗未設定'));
    logger.error('  - SUPABASE_ANON_KEY: ' + (SUPABASE_ANON_KEY ? '✓設定済み' : '✗未設定'));
    return false;
  }

  try {
    // 従来の接続も保持（互換性のため）
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    if (SUPABASE_SERVICE_KEY) {
      supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }

    // 新しい接続プールを初期化
    await initializeDatabasePool();

    logger.success('✅ Supabase接続プール初期化完了');
    return true;
  } catch (error) {
    logger.error('❌ Supabase初期化エラー:', error);
    return false;
  }
}

/**
 * テーブル存在確認と作成
 */
async function ensureTablesExist() {
  if (!supabaseAdmin) {
    return false;
  }

  try {
    // scenariosテーブルの存在確認
    const { data: scenarios, error: scenariosError } = await supabaseAdmin
      .from('scenarios')
      .select('count')
      .limit(1);

    if (scenariosError && scenariosError.code === '42P01') {
      
      const { error: createError } = await supabaseAdmin.rpc('create_scenarios_table');
      
      if (createError) {
        return false;
      }
      
    }

    // user_sessionsテーブルの存在確認
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('user_sessions')
      .select('count')
      .limit(1);

    if (sessionsError && sessionsError.code === '42P01') {
      
      const { error: createError } = await supabaseAdmin.rpc('create_user_sessions_table');
      
      if (createError) {
        return false;
      }
      
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * シナリオをSupabaseに保存（最適化版）
 */
async function saveScenarioToSupabase(sessionId, scenarioData) {
  try {
    const data = {
      id: sessionId,
      title: scenarioData.title || '無題のシナリオ',
      description: scenarioData.description || '',
      characters: scenarioData.characters || [],
      scenario_data: scenarioData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 接続プール経由で最適化実行
    const result = await executeOptimizedQuery({
      table: 'scenarios',
      operation: 'upsert',
      data: data,
      options: {
        upsertOptions: { onConflict: 'id' }
      }
    });

    logger.success(`✅ シナリオ保存完了: ${sessionId}`);
    return { success: true, data: result.data };

  } catch (error) {
    logger.error('❌ シナリオ保存エラー:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Supabaseからシナリオを取得（最適化版）
 */
async function getScenarioFromSupabase(sessionId) {
  try {
    const result = await executeOptimizedQuery({
      table: 'scenarios',
      operation: 'select',
      filters: { id: sessionId },
      options: { select: '*' },
      cacheKey: `scenario_${sessionId}`
    });

    if (!result.data || result.data.length === 0) {
      return { success: false, error: 'シナリオが見つかりません' };
    }

    logger.success(`✅ シナリオ取得完了: ${sessionId}`);
    return { success: true, data: result.data[0] };

  } catch (error) {
    logger.error('❌ シナリオ取得エラー:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ユーザーセッションを保存
 */
async function saveUserSessionToSupabase(sessionId, userData) {
  if (!supabase) {
    return { success: false, error: 'Supabase未初期化' };
  }

  try {
    const data = {
      id: sessionId,
      session_id: sessionId,
      user_data: userData,
      last_activity: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data: result, error } = await supabase
      .from('user_sessions')
      .upsert(data, { onConflict: 'session_id' });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: result };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 全シナリオ一覧を取得（最適化版）
 */
async function getAllScenariosFromSupabase(limit = 50, offset = 0) {
  try {
    const result = await executeOptimizedQuery({
      table: 'scenarios',
      operation: 'select',
      options: {
        select: 'id, title, description, created_at, updated_at',
        orderBy: { column: 'created_at', ascending: false },
        limit: limit,
        offset: offset
      },
      cacheKey: `scenarios_list_${limit}_${offset}`
    });

    logger.success(`✅ ${result.data.length}件のシナリオ取得完了`);
    return { success: true, data: result.data };

  } catch (error) {
    logger.error('❌ シナリオ一覧取得エラー:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Supabase接続テスト
 */
async function testSupabaseConnection() {
  if (!supabase) {
    return { success: false, error: 'Supabase未初期化' };
  }

  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('count')
      .limit(1);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Supabase接続正常' };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 起動時にSupabaseを初期化（非同期対応）
setTimeout(() => {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    initializeSupabase().catch(error => {
      logger.error('Supabase初期化失敗:', error);
    });
  } else {
    logger.warn('⚠️  Supabase初期化をスキップ: 環境変数が未設定');
  }
}, 0);

// CommonJS形式でエクスポート
module.exports = { 
  supabase,
  supabaseAdmin,
  initializeSupabase,
  ensureTablesExist,
  saveScenarioToSupabase,
  getScenarioFromSupabase,
  saveUserSessionToSupabase,
  getAllScenariosFromSupabase,
  testSupabaseConnection
};