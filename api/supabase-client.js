/**
 * 🗄️ Supabase Client - 接続プール最適化版
 * 生成されたシナリオをSupabaseに自動保存
 * パフォーマンス向上とクエリ最適化
 */

// Load environment variables with error handling
try {
  require('dotenv').config();
} catch (e) {
  // Dotenv might not be available in some environments
  console.warn('dotenv not loaded:', e.message);
}

const { createClient } = require('@supabase/supabase-js');
const { logger } = require('./utils/logger.js');

// Supabase接続情報（環境変数の検証）
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// 環境変数の事前検証（エラーをスローしない）
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  logger.warn('⚠️  Supabase環境変数が設定されていません');
  logger.warn('💡 Supabaseを使用する場合は、環境変数を設定してください');
  // エラーをスローせず、機能を無効化
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
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    if (SUPABASE_SERVICE_KEY) {
      supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }

    logger.success('✅ Supabase初期化完了');
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
    const { error: scenariosError } = await supabaseAdmin
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
    const { error: sessionsError } = await supabaseAdmin
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
  // Supabaseが初期化されていない場合はスキップ
  if (!supabase) {
    logger.warn('⚠️ Supabase not initialized, skipping save');
    
    // デモモードの場合はメモリ内に保存（実際には保存されない）
    if (scenarioData.mockGenerated || scenarioData.demoMode) {
      logger.info('🎭 Demo mode: Scenario would be saved to database in production');
      return { 
        success: true, 
        data: { id: sessionId, demo: true },
        message: 'Demo mode - データは保存されません' 
      };
    }
    
    return { success: false, error: 'Supabase not initialized' };
  }
  
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

    const { data: result, error } = await supabase
      .from('scenarios')
      .upsert(data, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    logger.success(`✅ シナリオ保存完了: ${sessionId}`);
    return { success: true, data: result };

  } catch (error) {
    logger.error('❌ シナリオ保存エラー:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Supabaseからシナリオを取得（最適化版）
 */
async function getScenarioFromSupabase(sessionId) {
  // Supabaseが初期化されていない場合はスキップ
  if (!supabase) {
    logger.warn('⚠️ Supabase not initialized, skipping read');
    
    // デモモードメッセージ
    if (sessionId && sessionId.includes('mock')) {
      return { 
        success: false, 
        error: 'Demo mode - データベースは利用できません',
        demo: true 
      };
    }
    
    return { success: false, error: 'Supabase not initialized' };
  }
  
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return { success: false, error: 'シナリオが見つかりません' };
    }

    logger.success(`✅ シナリオ取得完了: ${sessionId}`);
    return { success: true, data: data };

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
    const { data, error } = await supabase
      .from('scenarios')
      .select('id, title, description, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    logger.success(`✅ ${data.length}件のシナリオ取得完了`);
    return { success: true, data: data };

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
    const { error } = await supabase
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