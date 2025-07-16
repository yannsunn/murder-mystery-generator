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
    reason: 'アクセスが拒否されました。正しいキーを指定してください。',
    status: 401
  };
}

/**
 * 日次使用量チェック（メモリリーク対策版）
 */
const dailyUsage = new Map();
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24時間
let cleanupTimer = null;

// メモリリーク防止のための自動クリーンアップ
function startCleanupTimer() {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    // 古いエントリを削除
    for (const [key] of dailyUsage) {
      const keyDate = key.split('_').slice(1).join('_');
      if (keyDate !== new Date().toDateString()) {
        dailyUsage.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  
  // Node.jsプロセス終了時にタイマーをクリア
  if (typeof process !== 'undefined') {
    process.on('exit', () => {
      if (cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
      }
    });
  }
}

// 初回実行時にクリーンアップタイマーを開始
startCleanupTimer();

function checkDailyUsage(identifier = 'personal') {
  const today = new Date().toDateString();
  const key = `${identifier}_${today}`;
  
  const currentUsage = dailyUsage.get(key) || 0;
  const MAX_DAILY_REQUESTS = 100; // 1日100回まで
  
  if (currentUsage >= MAX_DAILY_REQUESTS) {
    return {
      allowed: false,
      reason: `1日の使用制限（${MAX_DAILY_REQUESTS}回）に達しました。`,
      currentUsage,
      resetTime: '24時間後'
    };
  }
  
  // 使用回数を増加
  dailyUsage.set(key, currentUsage + 1);
  
  // メモリ使用量の監視（デバッグ用）
  if (dailyUsage.size > 100) {
    console.warn(`[simple-auth] Warning: dailyUsage Map size is ${dailyUsage.size}`);
  }
  
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