/**
 * 🔧 データベース接続プール - 最適化クエリシステム
 * Supabase接続を効率的に管理し、パフォーマンスを向上
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.js';

export class DatabasePool {
  constructor() {
    this.connections = new Map();
    this.activeConnections = 0;
    this.maxConnections = 10; // 最大接続数
    this.connectionTimeout = 30000; // 30秒タイムアウト
    this.queryCache = new Map();
    this.cacheTimeout = 300000; // 5分キャッシュ
    
    // 統計情報
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      connectionReuses: 0,
      errors: 0
    };
  }

  /**
   * 接続プール初期化
   */
  async initialize() {
    try {
      const SUPABASE_URL = process.env.SUPABASE_URL;
      const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
      const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        const missingVars = [];
        if (!SUPABASE_URL) missingVars.push('SUPABASE_URL');
        if (!SUPABASE_ANON_KEY) missingVars.push('SUPABASE_ANON_KEY');
        
        throw new Error(
          `Supabase環境変数が設定されていません: ${missingVars.join(', ')}\n` +
          '💡 .envファイルに必要な環境変数を設定してください'
        );
      }

      // 基本接続を事前作成
      for (let i = 0; i < 3; i++) {
        const connectionId = `pool_${i}`;
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          db: {
            schema: 'public'
          },
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        this.connections.set(connectionId, {
          client,
          inUse: false,
          created: Date.now(),
          lastUsed: Date.now()
        });
      }

      // 管理者接続（サービスキーがある場合）
      if (SUPABASE_SERVICE_KEY) {
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
          db: {
            schema: 'public'
          },
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        this.connections.set('admin', {
          client: adminClient,
          inUse: false,
          created: Date.now(),
          lastUsed: Date.now()
        });
      }

      logger.debug('✅ データベース接続プール初期化完了');
      
      // 定期クリーンアップ開始
      this.startCleanupTimer();
      
      return true;

    } catch (error) {
      logger.error('データベース接続プール初期化エラー:', error);
      throw error;
    }
  }

  /**
   * 接続取得（プールから再利用または新規作成）
   */
  async getConnection(requireAdmin = false) {
    this.stats.totalQueries++;

    try {
      // 管理者接続が必要な場合
      if (requireAdmin) {
        const adminConnection = this.connections.get('admin');
        if (adminConnection && !adminConnection.inUse) {
          adminConnection.inUse = true;
          adminConnection.lastUsed = Date.now();
          this.stats.connectionReuses++;
          return { connectionId: 'admin', client: adminConnection.client };
        }
      }

      // 利用可能な接続を検索
      for (const [id, connection] of this.connections) {
        if (!connection.inUse && id !== 'admin') {
          connection.inUse = true;
          connection.lastUsed = Date.now();
          this.stats.connectionReuses++;
          logger.debug(`🔄 接続再利用: ${id}`);
          return { connectionId: id, client: connection.client };
        }
      }

      // 新しい接続を作成（上限チェック）
      if (this.activeConnections < this.maxConnections) {
        const newId = `dynamic_${Date.now()}`;
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
          throw new Error('環境変数が未設定のため、新しい接続を作成できません');
        }
        
        const newClient = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_ANON_KEY,
          {
            db: { schema: 'public' },
            auth: { autoRefreshToken: false, persistSession: false }
          }
        );

        this.connections.set(newId, {
          client: newClient,
          inUse: true,
          created: Date.now(),
          lastUsed: Date.now()
        });

        this.activeConnections++;
        logger.debug(`🆕 新規接続作成: ${newId}`);
        return { connectionId: newId, client: newClient };
      }

      // 接続上限に達した場合は待機
      await this.waitForAvailableConnection();
      return await this.getConnection(requireAdmin);

    } catch (error) {
      this.stats.errors++;
      logger.error('接続取得エラー:', error);
      throw error;
    }
  }

  /**
   * 接続解放
   */
  releaseConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
      logger.debug(`🔓 接続解放: ${connectionId}`);
    }
  }

  /**
   * 最適化クエリ実行
   */
  async executeQuery(queryConfig) {
    const {
      table,
      operation, // 'select', 'insert', 'update', 'delete', 'upsert'
      data = null,
      filters = {},
      options = {},
      cacheKey = null,
      requireAdmin = false
    } = queryConfig;

    try {
      // キャッシュチェック（SELECT操作のみ）
      if (operation === 'select' && cacheKey) {
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
          this.stats.cacheHits++;
          logger.debug(`💾 キャッシュヒット: ${cacheKey}`);
          return cached;
        }
      }

      // 接続取得
      const { connectionId, client } = await this.getConnection(requireAdmin);

      try {
        let query = client.from(table);
        let result;

        // 操作に応じてクエリを構築
        switch (operation) {
          case 'select':
            query = query.select(options.select || '*');
            
            // フィルター適用
            Object.entries(filters).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                query = query.in(key, value);
              } else if (typeof value === 'object' && value.operator) {
                switch (value.operator) {
                  case 'gte':
                    query = query.gte(key, value.value);
                    break;
                  case 'lte':
                    query = query.lte(key, value.value);
                    break;
                  case 'like':
                    query = query.like(key, value.value);
                    break;
                  case 'ilike':
                    query = query.ilike(key, value.value);
                    break;
                  default:
                    query = query.eq(key, value.value);
                }
              } else {
                query = query.eq(key, value);
              }
            });

            // ソート・ページング
            if (options.orderBy) {
              query = query.order(options.orderBy.column, {
                ascending: options.orderBy.ascending !== false
              });
            }
            if (options.limit) {
              query = query.limit(options.limit);
            }
            if (options.offset) {
              query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
            }

            result = await query;
            break;

          case 'insert':
            result = await query.insert(data);
            break;

          case 'update':
            query = query.update(data);
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
            result = await query;
            break;

          case 'upsert':
            result = await query.upsert(data, options.upsertOptions || {});
            break;

          case 'delete':
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
            result = await query;
            break;

          default:
            throw new Error(`未対応の操作: ${operation}`);
        }

        // エラーチェック
        if (result.error) {
          throw new Error(`クエリエラー: ${result.error.message}`);
        }

        // キャッシュに保存（SELECT操作のみ）
        if (operation === 'select' && cacheKey) {
          this.setCachedResult(cacheKey, result);
        }

        logger.debug(`✅ クエリ実行成功: ${operation} on ${table}`);
        return result;

      } finally {
        // 必ず接続を解放
        this.releaseConnection(connectionId);
      }

    } catch (error) {
      this.stats.errors++;
      logger.error('クエリ実行エラー:', error);
      throw error;
    }
  }

  /**
   * キャッシュ結果取得
   */
  getCachedResult(key) {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    // 期限切れの場合は削除
    if (cached) {
      this.queryCache.delete(key);
    }
    
    return null;
  }

  /**
   * キャッシュ結果保存
   */
  setCachedResult(key, data) {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    });

    // キャッシュサイズ制限（最大100件）
    if (this.queryCache.size > 100) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }
  }

  /**
   * 利用可能な接続を待機
   */
  async waitForAvailableConnection() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        for (const connection of this.connections.values()) {
          if (!connection.inUse) {
            clearInterval(checkInterval);
            resolve();
            return;
          }
        }
      }, 100);

      // タイムアウト
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, this.connectionTimeout);
    });
  }

  /**
   * 定期クリーンアップ開始
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanup();
    }, 60000); // 1分ごと
  }

  /**
   * 未使用接続のクリーンアップ
   */
  cleanup() {
    const now = Date.now();
    const maxIdleTime = 600000; // 10分

    for (const [id, connection] of this.connections) {
      // 基本的な接続は保持
      if (id.startsWith('pool_') || id === 'admin') {
        continue;
      }

      // 長時間未使用の動的接続を削除
      if (!connection.inUse && now - connection.lastUsed > maxIdleTime) {
        this.connections.delete(id);
        this.activeConnections--;
        logger.debug(`🧹 未使用接続をクリーンアップ: ${id}`);
      }
    }

    // キャッシュのクリーンアップ
    for (const [key, cached] of this.queryCache) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * 統計情報取得
   */
  getStats() {
    return {
      ...this.stats,
      activeConnections: Array.from(this.connections.values()).filter(c => c.inUse).length,
      totalConnections: this.connections.size,
      cacheSize: this.queryCache.size,
      cacheHitRate: this.stats.totalQueries > 0 
        ? Math.round((this.stats.cacheHits / this.stats.totalQueries) * 100) 
        : 0
    };
  }

  /**
   * プール終了
   */
  async shutdown() {
    logger.info('データベース接続プールをシャットダウンしています...');
    
    // 全接続を解放
    for (const [id, connection] of this.connections) {
      if (connection.client && typeof connection.client.removeAllChannels === 'function') {
        connection.client.removeAllChannels();
      }
    }
    
    this.connections.clear();
    this.queryCache.clear();
    
    logger.info('✅ データベース接続プール正常終了');
  }
}

// シングルトンインスタンス
export const databasePool = new DatabasePool();

// 便利な関数エクスポート
export async function executeOptimizedQuery(config) {
  return await databasePool.executeQuery(config);
}

export async function initializeDatabasePool() {
  return await databasePool.initialize();
}

export function getDatabaseStats() {
  return databasePool.getStats();
}