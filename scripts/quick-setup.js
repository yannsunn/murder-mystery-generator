/**
 * 🚀 クイックセットアップスクリプト
 * Supabaseテーブルを最小限の設定で作成
 */

import { createClient } from '@supabase/supabase-js';

// 環境変数
const SUPABASE_URL = 'https://cjnsewifvnhakvhqlgoy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqbnNld2lmdm5oYWt2aHFsZ295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Mjk4NzAsImV4cCI6MjA2NzEwNTg3MH0.PeroMweKdOaKKf3cXYCJnWPd8sfTvHU2MZX7ZhBBwaM';

async function setupDatabase() {
  console.log('🚀 Supabaseデータベースセットアップ開始');
  console.log('=======================================');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Step 1: scenarios テーブル作成を試行（データ挿入でテーブル作成）
    console.log('\n📋 Step 1: scenarios テーブル作成');
    
    const scenarioResult = await supabase
      .from('scenarios')
      .insert([
        {
          title: 'セットアップテストシナリオ',
          description: 'データベースセットアップ用のテストシナリオ',
          characters: [
            { name: 'テストキャラクター1', role: 'テスト役' },
            { name: 'テストキャラクター2', role: 'テスト役' }
          ],
          scenario_data: {
            setting: 'テスト環境',
            difficulty: 'テスト',
            created_by: 'setup_script',
            version: '1.0.0'
          }
        }
      ]);
    
    if (scenarioResult.error) {
      if (scenarioResult.error.code === '42P01') {
        console.log('❌ scenarios テーブルが存在しません');
        console.log('💡 解決策: Supabaseダッシュボードでテーブル作成が必要です');
      } else {
        console.log('✅ scenarios テーブル: データ挿入成功');
      }
    } else {
      console.log('✅ scenarios テーブル: セットアップ完了');
    }
    
    // Step 2: user_sessions テーブル作成を試行
    console.log('\n📋 Step 2: user_sessions テーブル作成');
    
    const sessionResult = await supabase
      .from('user_sessions')
      .insert([
        {
          session_id: `setup_${Date.now()}`,
          user_data: {
            setup: true,
            created_by: 'setup_script',
            timestamp: new Date().toISOString()
          }
        }
      ]);
    
    if (sessionResult.error) {
      if (sessionResult.error.code === '42P01') {
        console.log('❌ user_sessions テーブルが存在しません');
        console.log('💡 解決策: Supabaseダッシュボードでテーブル作成が必要です');
      } else {
        console.log('✅ user_sessions テーブル: データ挿入成功');
      }
    } else {
      console.log('✅ user_sessions テーブル: セットアップ完了');
    }
    
    // Step 3: データ確認
    console.log('\n📋 Step 3: データ確認');
    
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('id, title, created_at')
      .limit(3);
    
    if (!scenariosError) {
      console.log('✅ scenarios データ確認:');
      scenarios.forEach(scenario => {
        console.log(`   - ${scenario.title} (${scenario.id})`);
      });
    }
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('session_id, created_at')
      .limit(3);
    
    if (!sessionsError) {
      console.log('✅ user_sessions データ確認:');
      sessions.forEach(session => {
        console.log(`   - ${session.session_id}`);
      });
    }
    
    console.log('\n🎉 セットアップ完了！');
    
  } catch (error) {
    console.error('❌ セットアップエラー:', error.message);
  }
}

// 実行
setupDatabase();