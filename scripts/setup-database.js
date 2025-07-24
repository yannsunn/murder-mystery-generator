#!/usr/bin/env node
/**
 * 🗄️ Database Setup Script
 * Supabaseテーブル構造の作成と初期化
 */

// Load environment variables
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 必要な環境変数が設定されていません:');
  console.error('   - SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   - SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * テーブル作成SQL
 */
const CREATE_SCENARIOS_TABLE = `
CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Scenario',
  description TEXT DEFAULT '',
  characters JSONB DEFAULT '[]'::jsonb,
  scenario_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_title ON scenarios(title);
`;

const CREATE_USER_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_data JSONB DEFAULT '{}'::jsonb,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity ON user_sessions(last_activity DESC);
`;

/**
 * テーブル作成実行
 */
async function createTables() {
  console.log('🚀 データベーステーブルの作成を開始...');

  try {
    // scenarios テーブルの作成
    console.log('📋 scenarios テーブルを作成中...');
    const { error: scenariosError } = await supabase.rpc('exec_sql', {
      sql: CREATE_SCENARIOS_TABLE
    });

    if (scenariosError) {
      // RPCが利用できない場合は直接SQLを実行
      const { error: directError } = await supabase
        .from('scenarios')
        .select('count')
        .limit(1);

      if (directError && directError.code === '42P01') {
        console.log('⚠️  直接SQL実行機能が制限されています');
        console.log('💡 Supabase Web UIでテーブルを手動作成してください:');
        console.log('\n--- scenarios table ---');
        console.log(CREATE_SCENARIOS_TABLE);
        console.log('\n--- user_sessions table ---');
        console.log(CREATE_USER_SESSIONS_TABLE);
        return false;
      }
    } else {
      console.log('✅ scenarios テーブル作成完了');
    }

    // user_sessions テーブルの作成
    console.log('👤 user_sessions テーブルを作成中...');
    const { error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: CREATE_USER_SESSIONS_TABLE
    });

    if (!sessionsError) {
      console.log('✅ user_sessions テーブル作成完了');
    }

    // 作成されたテーブルの確認
    const { data: scenariosTest } = await supabase
      .from('scenarios')
      .select('count')
      .limit(1);

    const { data: sessionsTest } = await supabase
      .from('user_sessions')
      .select('count')
      .limit(1);

    console.log('\n📊 テーブル作成結果:');
    console.log('   scenarios:', scenariosTest ? '✅ 利用可能' : '❌ 作成失敗');
    console.log('   user_sessions:', sessionsTest ? '✅ 利用可能' : '❌ 作成失敗');

    return true;

  } catch (error) {
    console.error('❌ テーブル作成エラー:', error.message);
    return false;
  }
}

/**
 * 接続テスト
 */
async function testConnection() {
  console.log('🔌 Supabase接続をテスト中...');

  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('count')
      .limit(1);

    if (error) {
      console.log('⚠️  接続エラー:', error.message);
      return false;
    }

    console.log('✅ Supabase接続正常');
    return true;

  } catch (error) {
    console.error('❌ 接続テストエラー:', error.message);
    return false;
  }
}

/**
 * メイン実行
 */
async function main() {
  console.log('🗄️  Murder Mystery Database Setup');
  console.log('==================================\n');

  // 接続テスト
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ データベース接続に失敗しました');
    process.exit(1);
  }

  // テーブル作成
  const created = await createTables();
  if (created) {
    console.log('\n🎉 データベースセットアップ完了!');
  } else {
    console.log('\n⚠️  一部のテーブル作成に失敗しました');
  }

  console.log('\n🔗 次のステップ:');
  console.log('   1. npm run test でテスト実行');
  console.log('   2. npm run dev でアプリケーション起動');
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createTables,
  testConnection
};