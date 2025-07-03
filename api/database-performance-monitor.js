/**
 * 📊 データベースパフォーマンス監視API
 * リアルタイムでクエリ性能を監視・レポート生成
 */

import { setSecurityHeaders } from './security-utils.js';
import { databaseOptimizer, generateDatabaseOptimizationSQL, getPerformanceReport } from './utils/database-optimizer.js';
import { getDatabaseStats } from './utils/database-pool.js';
import { logger } from './utils/logger.js';

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  setSecurityHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'report':
        return await generateReport(req, res);
      
      case 'optimization-sql':
        return await getOptimizationSQL(req, res);
      
      case 'pool-stats':
        return await getPoolStats(req, res);
      
      case 'reset-metrics':
        return await resetMetrics(req, res);
      
      case 'analysis':
        return await runAnalysis(req, res);
      
      default:
        return res.status(200).json({
          success: true,
          message: 'データベースパフォーマンス監視API',
          availableActions: [
            'report - パフォーマンスレポート取得',
            'optimization-sql - 最適化SQL生成',
            'pool-stats - 接続プール統計',
            'reset-metrics - メトリクスリセット',
            'analysis - 最適化分析実行'
          ],
          endpoints: {
            report: '/api/database-performance-monitor?action=report',
            optimizationSQL: '/api/database-performance-monitor?action=optimization-sql',
            poolStats: '/api/database-performance-monitor?action=pool-stats',
            resetMetrics: '/api/database-performance-monitor?action=reset-metrics',
            analysis: '/api/database-performance-monitor?action=analysis'
          }
        });
    }
  } catch (error) {
    logger.error('パフォーマンス監視エラー:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * パフォーマンスレポート生成
 */
async function generateReport(req, res) {
  try {
    const report = getPerformanceReport();
    const poolStats = getDatabaseStats();

    const combinedReport = {
      ...report,
      connectionPool: poolStats,
      recommendations: generateRecommendations(report, poolStats),
      healthScore: calculateHealthScore(report, poolStats)
    };

    return res.status(200).json({
      success: true,
      data: combinedReport
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * 最適化SQL取得
 */
async function getOptimizationSQL(req, res) {
  try {
    const sql = generateDatabaseOptimizationSQL();
    
    return res.status(200).json({
      success: true,
      sql: sql,
      instructions: [
        '1. Supabaseダッシュボードの「SQL Editor」にアクセス',
        '2. 以下のSQLを貼り付けて実行',
        '3. インデックス作成によりクエリ性能が向上します',
        '4. 実行後は必ず性能測定を行ってください'
      ]
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * 接続プール統計取得
 */
async function getPoolStats(req, res) {
  try {
    const stats = getDatabaseStats();
    
    return res.status(200).json({
      success: true,
      data: stats,
      analysis: {
        connectionEfficiency: stats.totalConnections > 0 
          ? Math.round((stats.connectionReuses / stats.totalQueries) * 100) 
          : 0,
        cacheEffectiveness: stats.cacheHitRate,
        errorRate: stats.totalQueries > 0 
          ? Math.round((stats.errors / stats.totalQueries) * 100) 
          : 0
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * メトリクスリセット
 */
async function resetMetrics(req, res) {
  try {
    databaseOptimizer.resetMetrics();
    
    return res.status(200).json({
      success: true,
      message: 'パフォーマンスメトリクスをリセットしました'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * 最適化分析実行
 */
async function runAnalysis(req, res) {
  try {
    const report = await databaseOptimizer.runOptimizationAnalysis();
    
    return res.status(200).json({
      success: true,
      data: report,
      message: '最適化分析が完了しました'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * 推奨事項生成
 */
function generateRecommendations(report, poolStats) {
  const recommendations = [];

  // 遅いクエリの推奨
  if (report.slowQueries > 0) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      title: '遅いクエリの最適化',
      description: `${report.slowQueries}件の遅いクエリが検出されました。インデックスの追加を検討してください。`,
      action: 'インデックス作成SQLを実行'
    });
  }

  // キャッシュ効率の推奨
  if (poolStats.cacheHitRate < 70) {
    recommendations.push({
      type: 'cache',
      priority: 'medium',
      title: 'キャッシュ効率の改善',
      description: `キャッシュヒット率が${poolStats.cacheHitRate}%と低いです。キャッシュ戦略の見直しを推奨します。`,
      action: 'クエリにcacheKeyを設定'
    });
  }

  // エラー率の推奨
  const errorRate = poolStats.totalQueries > 0 
    ? Math.round((poolStats.errors / poolStats.totalQueries) * 100) 
    : 0;
    
  if (errorRate > 5) {
    recommendations.push({
      type: 'reliability',
      priority: 'high',
      title: 'エラー率の改善',
      description: `エラー率が${errorRate}%と高いです。クエリの検証とエラーハンドリングを強化してください。`,
      action: 'エラーログの確認'
    });
  }

  // 接続効率の推奨
  const connectionEfficiency = poolStats.totalConnections > 0 
    ? Math.round((poolStats.connectionReuses / poolStats.totalQueries) * 100) 
    : 0;
    
  if (connectionEfficiency < 80) {
    recommendations.push({
      type: 'connection',
      priority: 'low',
      title: '接続効率の向上',
      description: `接続再利用率が${connectionEfficiency}%です。接続プールサイズの調整を検討してください。`,
      action: '接続プール設定の見直し'
    });
  }

  return recommendations;
}

/**
 * 健全性スコア計算
 */
function calculateHealthScore(report, poolStats) {
  let score = 100;

  // 遅いクエリのペナルティ
  if (report.slowQueries > 0) {
    score -= Math.min(report.slowQueries * 2, 20);
  }

  // キャッシュ効率のボーナス/ペナルティ
  if (poolStats.cacheHitRate >= 80) {
    score += 5;
  } else if (poolStats.cacheHitRate < 50) {
    score -= 10;
  }

  // エラー率のペナルティ
  const errorRate = poolStats.totalQueries > 0 
    ? (poolStats.errors / poolStats.totalQueries) * 100 
    : 0;
  score -= errorRate * 2;

  // 平均実行時間のペナルティ
  if (report.avgExecutionTime > 1000) {
    score -= 15;
  } else if (report.avgExecutionTime > 500) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}