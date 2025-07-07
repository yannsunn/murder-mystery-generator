/**
 * 🗄️ Supabase Client - 接続プール最適化版
 * 生成されたシナリオをSupabaseに自動保存
 * パフォーマンス向上とクエリ最適化
 */

import { createClient } from '@supabase/supabase-js';
import { envManager } from './config/env-manager.js';
import { databasePool, executeOptimizedQuery, initializeDatabasePool } from './utils/database-pool.js';
import { logger } from './utils/logger.js';

// Supabase接続情報
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Supabaseクライアント初期化
let supabase = null;
let supabaseAdmin = null;

/**
 * Supabase初期化（接続プール対応版）
 */
export async function initializeSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logger.warn('⚠️  Supabase環境変数が設定されていません');
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
export async function ensureTablesExist() {
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
export async function saveScenarioToSupabase(sessionId, scenarioData) {
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
export async function getScenarioFromSupabase(sessionId) {
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
export async function saveUserSessionToSupabase(sessionId, userData) {
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
export async function getAllScenariosFromSupabase(limit = 50, offset = 0) {
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
export async function testSupabaseConnection() {
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
  initializeSupabase().catch(error => {
    logger.error('Supabase初期化失敗:', error);
  });
}, 0);

export { supabase, supabaseAdmin };
export default { 
  initializeSupabase,
  ensureTablesExist,
  saveScenarioToSupabase,
  getScenarioFromSupabase,
  saveUserSessionToSupabase,
  getAllScenariosFromSupabase,
  testSupabaseConnection
};