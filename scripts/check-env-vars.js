#!/usr/bin/env node
/**
 * 環境変数チェックスクリプト
 * Vercelデプロイ前の環境変数確認用
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

console.log('🔍 環境変数チェック開始...\n');

const requiredVars = [
  'GROQ_API_KEY',
  'SUPABASE_URL', 
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY'
];

const optionalVars = [
  'OPENAI_API_KEY',
  'DATABASE_URL',
  'NODE_ENV',
  'DEBUG_MODE'
];

let hasErrors = false;

console.log('📋 必須環境変数:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value === `your_${varName.toLowerCase()}_here`) {
    console.log(`❌ ${varName}: 未設定`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: 設定済み (${value.substring(0, 10)}...)`);
  }
});

console.log('\n📋 オプション環境変数:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value === `your_${varName.toLowerCase()}_here_optional`) {
    console.log(`⚠️  ${varName}: 未設定 (オプション)`);
  } else {
    console.log(`✅ ${varName}: 設定済み`);
  }
});

if (hasErrors) {
  console.log('\n❌ エラー: 必須環境変数が設定されていません！');
  console.log('\n📝 対処方法:');
  console.log('1. ローカル開発の場合: .env ファイルに値を設定してください');
  console.log('2. Vercelデプロイの場合:');
  console.log('   - Vercelダッシュボード → Settings → Environment Variables');
  console.log('   - 上記の必須環境変数をすべて追加');
  console.log('   - Production/Preview/Development すべてに適用');
  console.log('   - 保存後、再デプロイを実行');
  process.exit(1);
} else {
  console.log('\n✅ すべての必須環境変数が設定されています！');
  console.log('\n⚠️  注意: Vercelに環境変数を設定することを忘れないでください！');
  console.log('詳細: https://vercel.com/docs/environment-variables');
}