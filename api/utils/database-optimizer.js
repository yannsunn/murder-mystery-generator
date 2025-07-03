/**
 * 🎯 データベース最適化エンジン
 * インデックス管理、クエリ分析、パフォーマンス監視
 */

import { databasePool } from './database-pool.js';
import { logger } from './logger.js';

export class DatabaseOptimizer {
  constructor() {
    this.queryMetrics = new Map();
    this.slowQueries = [];
    this.indexRecommendations = [];
    this.performanceThreshold = 1000; // 1秒以上は遅いクエリ
  }

  /**
   * 推奨インデックスの作成（Supabaseダッシュボード用SQL生成）
   */
  generateOptimizationSQL() {
    const sqlCommands = [];

    // scenarios テーブル用インデックス
    sqlCommands.push(`
-- scenarios テーブル最適化インデックス
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_title_gin ON scenarios USING gin(to_tsvector('japanese', title));
CREATE INDEX IF NOT EXISTS idx_scenarios_description_gin ON scenarios USING gin(to_tsvector('japanese', description));
CREATE INDEX IF NOT EXISTS idx_scenarios_updated_at ON scenarios(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_composite ON scenarios(created_at DESC, title);

-- scenarios テーブル統計更新
ANALYZE scenarios;
`);

    // user_sessions テーブル用インデックス
    sqlCommands.push(`
-- user_sessions テーブル最適化インデックス
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at DESC);

-- user_sessions テーブル統計更新
ANALYZE user_sessions;
`);

    // パフォーマンス監視テーブル
    sqlCommands.push(`
-- パフォーマンス監視テーブル作成
CREATE TABLE IF NOT EXISTS query_performance (
  id SERIAL PRIMARY KEY,
  query_type VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  query_hash VARCHAR(64) NOT NULL,
  parameters JSONB,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id VARCHAR(100)
);

-- パフォーマンステーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_query_performance_type ON query_performance(query_type);
CREATE INDEX IF NOT EXISTS idx_query_performance_table ON query_performance(table_name);
CREATE INDEX IF NOT EXISTS idx_query_performance_time ON query_performance(execution_time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_executed_at ON query_performance(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_hash ON query_performance(query_hash);

-- Row Level Security (RLS) 設定
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 基本的なポリシー（全てのユーザーが読み書き可能）
CREATE POLICY IF NOT EXISTS "scenarios_all_access" ON scenarios FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "user_sessions_all_access" ON user_sessions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "query_performance_all_access" ON query_performance FOR ALL USING (true);
`);

    return sqlCommands.join('\n\n');
  }

  /**
   * クエリパフォーマンス監視付き実行
   */
  async executeWithMonitoring(queryConfig) {
    const startTime = Date.now();
    const queryHash = this.generateQueryHash(queryConfig);

    try {
      // 実際のクエリ実行
      const result = await databasePool.executeQuery(queryConfig);
      
      const executionTime = Date.now() - startTime;
      
      // メトリクス記録
      this.recordQueryMetrics(queryConfig, executionTime, true);
      
      // 遅いクエリの検出
      if (executionTime > this.performanceThreshold) {
        this.recordSlowQuery(queryConfig, executionTime);
      }

      // パフォーマンスデータをデータベースに記録（非同期）
      this.recordPerformanceData(queryConfig, executionTime, queryHash).catch(error => {
        logger.warn('パフォーマンスデータ記録エラー:', error);
      });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordQueryMetrics(queryConfig, executionTime, false);
      throw error;
    }
  }

  /**
   * クエリメトリクス記録
   */
  recordQueryMetrics(queryConfig, executionTime, success) {
    const key = `${queryConfig.table}_${queryConfig.operation}`;
    
    if (!this.queryMetrics.has(key)) {
      this.queryMetrics.set(key, {
        count: 0,
        totalTime: 0,
        successCount: 0,
        errorCount: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity
      });
    }

    const metrics = this.queryMetrics.get(key);
    metrics.count++;
    metrics.totalTime += executionTime;
    
    if (success) {
      metrics.successCount++;
    } else {
      metrics.errorCount++;
    }

    metrics.avgTime = metrics.totalTime / metrics.count;
    metrics.maxTime = Math.max(metrics.maxTime, executionTime);
    metrics.minTime = Math.min(metrics.minTime, executionTime);
  }

  /**
   * 遅いクエリ記録
   */
  recordSlowQuery(queryConfig, executionTime) {
    const slowQuery = {
      timestamp: new Date(),
      table: queryConfig.table,
      operation: queryConfig.operation,
      executionTime,
      filters: queryConfig.filters || {},
      options: queryConfig.options || {}
    };

    this.slowQueries.push(slowQuery);

    // 最大100件まで保持
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift();
    }

    logger.warn(`🐌 遅いクエリ検出: ${queryConfig.operation} on ${queryConfig.table} (${executionTime}ms)`);

    // インデックス推奨の生成
    this.generateIndexRecommendation(queryConfig);
  }

  /**
   * インデックス推奨生成
   */
  generateIndexRecommendation(queryConfig) {
    const { table, filters = {}, options = {} } = queryConfig;
    
    // フィルター条件からインデックス推奨
    Object.keys(filters).forEach(column => {
      const recommendation = {
        table,
        column,
        type: 'btree',
        reason: `フィルター条件 WHERE ${column} で使用`,
        sql: `CREATE INDEX IF NOT EXISTS idx_${table}_${column} ON ${table}(${column});`
      };

      if (!this.indexRecommendations.find(r => 
        r.table === table && r.column === column
      )) {
        this.indexRecommendations.push(recommendation);
      }
    });

    // ORDER BY からインデックス推奨
    if (options.orderBy) {
      const { column, ascending } = options.orderBy;
      const direction = ascending === false ? 'DESC' : 'ASC';
      
      const recommendation = {
        table,
        column,
        type: 'btree',
        reason: `ソート条件 ORDER BY ${column} ${direction} で使用`,
        sql: `CREATE INDEX IF NOT EXISTS idx_${table}_${column}_sort ON ${table}(${column} ${direction});`
      };

      if (!this.indexRecommendations.find(r => 
        r.table === table && r.column === column && r.reason.includes('ソート')
      )) {
        this.indexRecommendations.push(recommendation);
      }
    }
  }

  /**
   * パフォーマンスデータをデータベースに記録
   */
  async recordPerformanceData(queryConfig, executionTime, queryHash) {
    try {
      await databasePool.executeQuery({
        table: 'query_performance',
        operation: 'insert',
        data: {
          query_type: queryConfig.operation,
          table_name: queryConfig.table,
          execution_time_ms: executionTime,
          query_hash: queryHash,
          parameters: queryConfig.filters || {},
          session_id: queryConfig.sessionId || null
        }
      });
    } catch (error) {
      // エラーログは出すが、メイン処理は止めない
      logger.debug('パフォーマンス記録失敗:', error.message);
    }
  }

  /**
   * クエリハッシュ生成
   */
  generateQueryHash(queryConfig) {
    const hashSource = JSON.stringify({
      table: queryConfig.table,
      operation: queryConfig.operation,
      filters: queryConfig.filters || {},
      options: queryConfig.options || {}
    });

    // 簡単なハッシュ関数
    let hash = 0;
    for (let i = 0; i < hashSource.length; i++) {
      const char = hashSource.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * パフォーマンスレポート生成
   */
  generatePerformanceReport() {
    const report = {
      timestamp: new Date(),
      totalQueries: Array.from(this.queryMetrics.values()).reduce((sum, m) => sum + m.count, 0),
      avgExecutionTime: 0,
      slowQueries: this.slowQueries.length,
      indexRecommendations: this.indexRecommendations,
      tableMetrics: {},
      connectionPoolStats: databasePool.getStats()
    };

    // テーブル別メトリクス
    let totalTime = 0;
    let totalCount = 0;

    for (const [key, metrics] of this.queryMetrics) {
      const [table, operation] = key.split('_');
      
      if (!report.tableMetrics[table]) {
        report.tableMetrics[table] = {
          operations: {},
          totalQueries: 0,
          avgTime: 0
        };
      }

      report.tableMetrics[table].operations[operation] = {
        count: metrics.count,
        avgTime: metrics.avgTime,
        maxTime: metrics.maxTime,
        minTime: metrics.minTime === Infinity ? 0 : metrics.minTime,
        successRate: metrics.count > 0 ? (metrics.successCount / metrics.count) * 100 : 0
      };

      report.tableMetrics[table].totalQueries += metrics.count;
      totalTime += metrics.totalTime;
      totalCount += metrics.count;
    }

    report.avgExecutionTime = totalCount > 0 ? totalTime / totalCount : 0;

    return report;
  }

  /**
   * メトリクスリセット
   */
  resetMetrics() {
    this.queryMetrics.clear();
    this.slowQueries = [];
    this.indexRecommendations = [];
    logger.info('📊 パフォーマンスメトリクスをリセットしました');
  }

  /**
   * 自動最適化推奨の実行
   */
  async runOptimizationAnalysis() {
    const report = this.generatePerformanceReport();
    
    logger.info('🔍 データベース最適化分析結果:');
    logger.info(`総クエリ数: ${report.totalQueries}`);
    logger.info(`平均実行時間: ${Math.round(report.avgExecutionTime)}ms`);
    logger.info(`遅いクエリ数: ${report.slowQueries}`);
    logger.info(`推奨インデックス数: ${report.indexRecommendations.length}`);

    if (report.indexRecommendations.length > 0) {
      logger.info('📋 推奨インデックス:');
      report.indexRecommendations.forEach(rec => {
        logger.info(`  - ${rec.table}.${rec.column}: ${rec.reason}`);
      });
    }

    return report;
  }
}

// シングルトンインスタンス
export const databaseOptimizer = new DatabaseOptimizer();

// 便利な関数エクスポート
export async function executeOptimizedQueryWithMonitoring(config) {
  return await databaseOptimizer.executeWithMonitoring(config);
}

export function generateDatabaseOptimizationSQL() {
  return databaseOptimizer.generateOptimizationSQL();
}

export function getPerformanceReport() {
  return databaseOptimizer.generatePerformanceReport();
}