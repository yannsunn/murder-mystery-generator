/**
 * 🔒 個人利用向けシンプル認証
 * 環境変数による簡単なアクセス制御
 */

/**
 * 個人利用のための簡単な認証チェック
 */
function checkPersonalAccess(req) {
  // 環境変数でアクセス制御（オプション）
  const ACCESS_KEY = process.env.PERSONAL_ACCESS_KEY;
  
  // アクセスキーが設定されていない場合は認証なし
  if (!ACCESS_KEY) {
    return { allowed: true, message: 'Open access' };
  }
  
  // クエリパラメータまたはヘッダーでキーを確認
  const providedKey = req.query.key || req.headers['x-access-key'];
  
  if (providedKey === ACCESS_KEY) {
    return { allowed: true, message: 'Access granted' };
  }
  
  return { 
    allowed: false, 
    message: 'アクセスが拒否されました。正しいキーを指定してください。',
    status: 401
  };
}

/**
 * 日次使用量チェック（簡易版）
 */
const dailyUsage = new Map();

function checkDailyUsage(identifier = 'personal') {
  const today = new Date().toDateString();
  const key = `${identifier}_${today}`;
  
  const currentUsage = dailyUsage.get(key) || 0;
  const MAX_DAILY_REQUESTS = 10; // 1日10回まで
  
  if (currentUsage >= MAX_DAILY_REQUESTS) {
    return {
      allowed: false,
      message: `1日の使用制限（${MAX_DAILY_REQUESTS}回）に達しました。`,
      currentUsage,
      resetTime: '24時間後'
    };
  }
  
  // 使用回数を増加
  dailyUsage.set(key, currentUsage + 1);
  
  return {
    allowed: true,
    currentUsage: currentUsage + 1,
    remaining: MAX_DAILY_REQUESTS - currentUsage - 1
  };
}

// CommonJS形式でエクスポート
module.exports = {
  checkPersonalAccess,
  checkDailyUsage
};