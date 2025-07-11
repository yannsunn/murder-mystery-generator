/**
 * 🚀 クイックセットアップスクリプト
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function validateEnvironmentVariables() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ 必要な環境変数が設定されていません');
    return false;
  }
  return true;
}

if (!validateEnvironmentVariables()) {
  process.exit(1);
}

async function setupDatabase() {
  console.log('🚀 Supabaseデータベースセットアップ開始');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // scenarios テーブル確認
    const { error: scenarioError } = await supabase
      .from('scenarios')
      .select('id')
      .limit(1);
    
    if (scenarioError?.code === '42P01') {
      console.log('❌ scenarios テーブルが存在しません');
      console.log('💡 Supabaseダッシュボードでテーブルを作成してください');
    } else {
      console.log('✅ scenarios テーブル: 存在確認');
    }
    
    // user_sessions テーブル確認
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .select('id')
      .limit(1);
    
    if (sessionError?.code === '42P01') {
      console.log('❌ user_sessions テーブルが存在しません');
      console.log('💡 Supabaseダッシュボードでテーブルを作成してください');
    } else {
      console.log('✅ user_sessions テーブル: 存在確認');
    }
    
    console.log('\n🎉 セットアップ完了！');
    
  } catch (error) {
    console.error('❌ セットアップエラー:', error.message);
  }
}

// 実行
setupDatabase();