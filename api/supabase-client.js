/**
 * 🗄️ Supabase Client - データベース接続とCRUD操作
 * 生成されたシナリオをSupabaseに自動保存
 */

import { createClient } from '@supabase/supabase-js';
import { envManager } from './config/env-manager.js';

// Supabase接続情報
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Supabaseクライアント初期化
let supabase = null;
let supabaseAdmin = null;

/**
 * Supabase初期化
 */
export function initializeSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️  Supabase環境変数が設定されていません');
    return false;
  }

  try {
    // 匿名ユーザー用クライアント
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 管理者用クライアント（サービスキーがある場合）
    if (SUPABASE_SERVICE_KEY) {
      supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }

    console.log('✅ Supabase接続が初期化されました');
    return true;
  } catch (error) {
    console.error('❌ Supabase初期化エラー:', error);
    return false;
  }
}

/**
 * テーブル存在確認と作成
 */
export async function ensureTablesExist() {
  if (!supabaseAdmin) {
    console.warn('⚠️  管理者権限がないため、テーブル作成をスキップします');
    return false;
  }

  try {
    // scenariosテーブルの存在確認
    const { data: scenarios, error: scenariosError } = await supabaseAdmin
      .from('scenarios')
      .select('count')
      .limit(1);

    if (scenariosError && scenariosError.code === '42P01') {
      console.log('📋 scenariosテーブルを作成中...');
      
      const { error: createError } = await supabaseAdmin.rpc('create_scenarios_table');
      
      if (createError) {
        console.error('❌ テーブル作成エラー:', createError);
        return false;
      }
      
      console.log('✅ scenariosテーブルを作成しました');
    }

    // user_sessionsテーブルの存在確認
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('user_sessions')
      .select('count')
      .limit(1);

    if (sessionsError && sessionsError.code === '42P01') {
      console.log('📋 user_sessionsテーブルを作成中...');
      
      const { error: createError } = await supabaseAdmin.rpc('create_user_sessions_table');
      
      if (createError) {
        console.error('❌ テーブル作成エラー:', createError);
        return false;
      }
      
      console.log('✅ user_sessionsテーブルを作成しました');
    }

    return true;
  } catch (error) {
    console.error('❌ テーブル確認エラー:', error);
    return false;
  }
}

/**
 * シナリオをSupabaseに保存
 */
export async function saveScenarioToSupabase(sessionId, scenarioData) {
  if (!supabase) {
    console.warn('⚠️  Supabaseが初期化されていません');
    return { success: false, error: 'Supabase未初期化' };
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
      console.error('❌ Supabaseシナリオ保存エラー:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ シナリオをSupabaseに保存しました:', sessionId);
    return { success: true, data: result };

  } catch (error) {
    console.error('❌ シナリオ保存例外:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Supabaseからシナリオを取得
 */
export async function getScenarioFromSupabase(sessionId) {
  if (!supabase) {
    console.warn('⚠️  Supabaseが初期化されていません');
    return { success: false, error: 'Supabase未初期化' };
  }

  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'シナリオが見つかりません' };
      }
      console.error('❌ Supabaseシナリオ取得エラー:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ シナリオをSupabaseから取得しました:', sessionId);
    return { success: true, data };

  } catch (error) {
    console.error('❌ シナリオ取得例外:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ユーザーセッションを保存
 */
export async function saveUserSessionToSupabase(sessionId, userData) {
  if (!supabase) {
    console.warn('⚠️  Supabaseが初期化されていません');
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
      console.error('❌ Supabaseセッション保存エラー:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ セッションをSupabaseに保存しました:', sessionId);
    return { success: true, data: result };

  } catch (error) {
    console.error('❌ セッション保存例外:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 全シナリオ一覧を取得
 */
export async function getAllScenariosFromSupabase(limit = 50) {
  if (!supabase) {
    console.warn('⚠️  Supabaseが初期化されていません');
    return { success: false, error: 'Supabase未初期化' };
  }

  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('id, title, description, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Supabaseシナリオ一覧取得エラー:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ ${data.length}件のシナリオを取得しました`);
    return { success: true, data };

  } catch (error) {
    console.error('❌ シナリオ一覧取得例外:', error);
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

// 起動時にSupabaseを初期化
initializeSupabase();

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