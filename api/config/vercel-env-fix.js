/**
 * Vercel環境変数修正ユーティリティ
 * Vercelでの環境変数読み込み問題を解決
 * Google Gemini API対応
 */

// Vercel環境での環境変数の取得を確実にする
function getVercelEnv(key) {
  // 1. 直接アクセス
  if (process.env[key]) {
    return process.env[key];
  }

  // 2. Vercel特有の環境変数チェック
  if (process.env.VERCEL) {
    // Vercelの環境変数は時々_で始まることがある
    const underscoreKey = `_${key}`;
    if (process.env[underscoreKey]) {
      return process.env[underscoreKey];
    }

    // NEXT_PUBLIC_プレフィックスをチェック
    const nextPublicKey = `NEXT_PUBLIC_${key}`;
    if (process.env[nextPublicKey]) {
      return process.env[nextPublicKey];
    }
  }

  return null;
}

// 必要な環境変数を確実に取得
function getRequiredEnvVars() {
  return {
    GEMINI_API_KEY: getVercelEnv('GEMINI_API_KEY') || getVercelEnv('GOOGLE_API_KEY'),
    GOOGLE_API_KEY: getVercelEnv('GOOGLE_API_KEY'),
    SUPABASE_URL: getVercelEnv('SUPABASE_URL'),
    SUPABASE_ANON_KEY: getVercelEnv('SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_KEY: getVercelEnv('SUPABASE_SERVICE_KEY')
  };
}

// 環境変数の初期化
function initializeEnvVars() {
  const envVars = getRequiredEnvVars();

  // グローバルに設定（他のモジュールからアクセス可能にする）
  for (const [key, value] of Object.entries(envVars)) {
    if (value && !process.env[key]) {
      process.env[key] = value;
    }
  }

  return envVars;
}

module.exports = {
  getVercelEnv,
  getRequiredEnvVars,
  initializeEnvVars
};
