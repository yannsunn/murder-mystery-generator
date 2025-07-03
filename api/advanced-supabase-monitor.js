/**
 * 🔥 高度なSupabaseリアルタイム監視システム
 * 限界突破: リアルタイムパフォーマンス分析・自動最適化
 */

import { createClient } from '@supabase/supabase-js';
import { setSecurityHeaders } from './security-utils.js';
import { performance } from 'perf_hooks';

export const config = {
  maxDuration: 300, // 5分のロングランニング対応
};

// 監視メトリクス収集クラス
class SupabaseAdvancedMonitor {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://cjnsewifvnhakvhqlgoy.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqbnNld2lmdm5oYWt2aHFsZ295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Mjk4NzAsImV4cCI6MjA2NzEwNTg3MH0.PeroMweKdOaKKf3cXYCJnWPd8sfTvHU2MZX7ZhBBwaM'
    );
    this.metrics = {
      queries: [],
      performance: [],
      errors: [],
      realtime: []
    };
    this.isMonitoring = false;
  }

  /**
   * 🔍 包括的システム分析
   */
  async comprehensiveAnalysis() {
    const analysisStart = performance.now();
    const results = {
      timestamp: new Date().toISOString(),
      database: {},
      performance: {},
      health: {},
      recommendations: [],
      alerts: []
    };

    try {
      // 1. データベース構造分析
      console.log('🔍 データベース構造分析中...');
      results.database = await this.analyzeDatabaseStructure();

      // 2. パフォーマンス分析
      console.log('⚡ パフォーマンス分析中...');
      results.performance = await this.analyzePerformance();

      // 3. データ品質分析
      console.log('📊 データ品質分析中...');
      results.health = await this.analyzeDataHealth();

      // 4. 自動最適化提案
      console.log('🚀 最適化提案生成中...');
      results.recommendations = await this.generateOptimizationRecommendations(results);

      // 5. アラート生成
      results.alerts = this.generateAlerts(results);

      results.analysisTime = performance.now() - analysisStart;
      
      console.log(`✅ 包括的分析完了 (${results.analysisTime.toFixed(2)}ms)`);
      return results;

    } catch (error) {
      console.error('❌ 分析エラー:', error);
      results.error = error.message;
      return results;
    }
  }

  /**
   * 📊 データベース構造分析
   */
  async analyzeDatabaseStructure() {
    const structure = {
      tables: {},
      indexes: {},
      relationships: {},
      storage: {}
    };

    try {
      // scenarios テーブル分析
      const scenariosAnalysis = await this.analyzeTable('scenarios');
      structure.tables.scenarios = scenariosAnalysis;

      // user_sessions テーブル分析
      const sessionsAnalysis = await this.analyzeTable('user_sessions');
      structure.tables.user_sessions = sessionsAnalysis;

      // ストレージ使用量推定
      structure.storage = await this.estimateStorageUsage();

      return structure;
    } catch (error) {
      console.error('Database structure analysis error:', error);
      return { error: error.message };
    }
  }

  /**
   * 🔍 テーブル詳細分析
   */
  async analyzeTable(tableName) {
    const analysis = {
      name: tableName,
      recordCount: 0,
      dataSize: 0,
      columns: {},
      performance: {},
      lastUpdated: null
    };

    try {
      // レコード数取得
      const { count, error: countError } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        analysis.recordCount = count || 0;
      }

      // サンプルデータ分析
      const { data: sampleData, error: sampleError } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(100);

      if (!sampleError && sampleData?.length > 0) {
        analysis.columns = this.analyzeColumns(sampleData);
        analysis.dataSize = this.estimateDataSize(sampleData);
        analysis.lastUpdated = this.findLatestUpdate(sampleData);
      }

      // パフォーマンステスト
      analysis.performance = await this.testTablePerformance(tableName);

      return analysis;
    } catch (error) {
      console.error(`Table analysis error for ${tableName}:`, error);
      return { ...analysis, error: error.message };
    }
  }

  /**
   * ⚡ パフォーマンス分析
   */
  async analyzePerformance() {
    const performance = {
      querySpeed: {},
      concurrency: {},
      optimization: {}
    };

    const queries = [
      { name: 'simple_select', query: () => this.supabase.from('scenarios').select('id, title').limit(10) },
      { name: 'complex_select', query: () => this.supabase.from('scenarios').select('*').order('created_at', { ascending: false }).limit(20) },
      { name: 'aggregation', query: () => this.supabase.from('scenarios').select('id', { count: 'exact' }) },
      { name: 'json_query', query: () => this.supabase.from('scenarios').select('characters').limit(5) }
    ];

    for (const { name, query } of queries) {
      const start = performance.now();
      try {
        const { data, error } = await query();
        const duration = performance.now() - start;
        
        performance.querySpeed[name] = {
          duration,
          success: !error,
          recordCount: data?.length || 0,
          error: error?.message
        };
      } catch (err) {
        performance.querySpeed[name] = {
          duration: performance.now() - start,
          success: false,
          error: err.message
        };
      }
    }

    // 並行処理テスト
    performance.concurrency = await this.testConcurrency();

    return performance;
  }

  /**
   * 🔄 並行処理テスト
   */
  async testConcurrency() {
    const concurrentQueries = 5;
    const start = performance.now();

    try {
      const promises = Array(concurrentQueries).fill().map(() => 
        this.supabase.from('scenarios').select('id, title').limit(1)
      );

      const results = await Promise.all(promises);
      const duration = performance.now() - start;

      return {
        concurrent: concurrentQueries,
        totalDuration: duration,
        avgDuration: duration / concurrentQueries,
        successRate: results.filter(r => !r.error).length / concurrentQueries,
        allSuccessful: results.every(r => !r.error)
      };
    } catch (error) {
      return {
        concurrent: concurrentQueries,
        error: error.message,
        successRate: 0
      };
    }
  }

  /**
   * 📈 データ品質分析
   */
  async analyzeDataHealth() {
    const health = {
      dataIntegrity: {},
      consistency: {},
      completeness: {}
    };

    try {
      // scenarios データ品質
      const { data: scenarios } = await this.supabase
        .from('scenarios')
        .select('*')
        .limit(100);

      if (scenarios) {
        health.dataIntegrity.scenarios = this.checkDataIntegrity(scenarios);
        health.completeness.scenarios = this.checkDataCompleteness(scenarios);
      }

      // user_sessions データ品質
      const { data: sessions } = await this.supabase
        .from('user_sessions')
        .select('*')
        .limit(100);

      if (sessions) {
        health.dataIntegrity.user_sessions = this.checkDataIntegrity(sessions);
        health.completeness.user_sessions = this.checkDataCompleteness(sessions);
      }

      return health;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 🎯 最適化提案生成
   */
  async generateOptimizationRecommendations(analysisResults) {
    const recommendations = [];

    // パフォーマンス最適化
    if (analysisResults.performance?.querySpeed) {
      Object.entries(analysisResults.performance.querySpeed).forEach(([query, metrics]) => {
        if (metrics.duration > 1000) { // 1秒以上
          recommendations.push({
            type: 'performance',
            priority: 'high',
            title: `${query} クエリの最適化`,
            description: `実行時間: ${metrics.duration.toFixed(2)}ms - インデックス追加を推奨`,
            action: 'add_index'
          });
        }
      });
    }

    // データ品質最適化
    if (analysisResults.health?.completeness) {
      Object.entries(analysisResults.health.completeness).forEach(([table, metrics]) => {
        if (metrics.completeness < 0.9) {
          recommendations.push({
            type: 'data_quality',
            priority: 'medium',
            title: `${table} テーブルのデータ完全性改善`,
            description: `完全性: ${(metrics.completeness * 100).toFixed(1)}% - バリデーション強化を推奨`,
            action: 'improve_validation'
          });
        }
      });
    }

    // ストレージ最適化
    if (analysisResults.database?.storage?.totalSize > 100 * 1024 * 1024) { // 100MB以上
      recommendations.push({
        type: 'storage',
        priority: 'medium',
        title: 'ストレージ最適化',
        description: '大容量データの圧縮・アーカイブを推奨',
        action: 'optimize_storage'
      });
    }

    return recommendations;
  }

  /**
   * 🚨 アラート生成
   */
  generateAlerts(analysisResults) {
    const alerts = [];

    // パフォーマンスアラート
    if (analysisResults.performance?.concurrency?.successRate < 0.8) {
      alerts.push({
        level: 'warning',
        type: 'performance',
        message: '並行処理の成功率が低下しています',
        value: `${(analysisResults.performance.concurrency.successRate * 100).toFixed(1)}%`
      });
    }

    // エラーアラート
    if (analysisResults.error) {
      alerts.push({
        level: 'error',
        type: 'system',
        message: 'システム分析中にエラーが発生しました',
        value: analysisResults.error
      });
    }

    return alerts;
  }

  /**
   * 🔄 リアルタイム監視開始
   */
  async startRealTimeMonitoring() {
    if (this.isMonitoring) {
      return { success: false, message: '既に監視中です' };
    }

    this.isMonitoring = true;
    console.log('🔄 リアルタイム監視開始');

    // リアルタイム変更監視
    const channel = this.supabase
      .channel('db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'scenarios' },
        (payload) => this.handleRealtimeChange('scenarios', payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_sessions' },
        (payload) => this.handleRealtimeChange('user_sessions', payload)
      )
      .subscribe();

    // 定期的な健全性チェック（5分毎）
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    return { success: true, message: 'リアルタイム監視開始' };
  }

  /**
   * リアルタイム変更ハンドラ
   */
  handleRealtimeChange(table, payload) {
    const change = {
      timestamp: new Date().toISOString(),
      table,
      event: payload.eventType,
      new: payload.new,
      old: payload.old
    };

    this.metrics.realtime.push(change);
    console.log(`📊 リアルタイム変更検知 [${table}]: ${payload.eventType}`);

    // 異常検知
    this.detectAnomalies(change);
  }

  /**
   * 異常検知
   */
  detectAnomalies(change) {
    // 急激な変更頻度の増加
    const recentChanges = this.metrics.realtime.filter(
      c => Date.now() - new Date(c.timestamp).getTime() < 60000 // 1分以内
    );

    if (recentChanges.length > 50) {
      console.warn('🚨 異常検知: 急激な変更頻度の増加');
    }
  }

  // ユーティリティメソッド
  analyzeColumns(data) {
    const columns = {};
    if (data.length === 0) return columns;

    Object.keys(data[0]).forEach(column => {
      const values = data.map(row => row[column]).filter(v => v !== null);
      columns[column] = {
        nullCount: data.length - values.length,
        uniqueCount: new Set(values).size,
        dataType: typeof values[0],
        avgLength: values.length > 0 ? values.join('').length / values.length : 0
      };
    });

    return columns;
  }

  estimateDataSize(data) {
    return JSON.stringify(data).length * 2; // UTF-16概算
  }

  findLatestUpdate(data) {
    const dates = data
      .map(row => row.updated_at || row.created_at)
      .filter(Boolean)
      .map(d => new Date(d));
    
    return dates.length > 0 ? new Date(Math.max(...dates)) : null;
  }

  async testTablePerformance(tableName) {
    const start = performance.now();
    try {
      await this.supabase.from(tableName).select('*').limit(1);
      return { responseTime: performance.now() - start, accessible: true };
    } catch (error) {
      return { responseTime: performance.now() - start, accessible: false, error: error.message };
    }
  }

  checkDataIntegrity(data) {
    const issues = [];
    data.forEach((row, index) => {
      // ID検証
      if (!row.id) issues.push(`Row ${index}: Missing ID`);
      
      // JSON検証
      if (row.characters && typeof row.characters !== 'object') {
        issues.push(`Row ${index}: Invalid characters JSON`);
      }
      if (row.scenario_data && typeof row.scenario_data !== 'object') {
        issues.push(`Row ${index}: Invalid scenario_data JSON`);
      }
    });

    return {
      totalChecked: data.length,
      issuesFound: issues.length,
      issues: issues.slice(0, 10), // 最初の10件のみ
      integrity: 1 - (issues.length / data.length)
    };
  }

  checkDataCompleteness(data) {
    let totalFields = 0;
    let filledFields = 0;

    data.forEach(row => {
      Object.values(row).forEach(value => {
        totalFields++;
        if (value !== null && value !== undefined && value !== '') {
          filledFields++;
        }
      });
    });

    return {
      totalFields,
      filledFields,
      completeness: totalFields > 0 ? filledFields / totalFields : 0
    };
  }

  async estimateStorageUsage() {
    // 概算計算
    const { count: scenariosCount } = await this.supabase
      .from('scenarios')
      .select('*', { count: 'exact', head: true });

    const { count: sessionsCount } = await this.supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true });

    return {
      scenarios: {
        count: scenariosCount || 0,
        estimatedSize: (scenariosCount || 0) * 2048 // 2KB per record estimate
      },
      user_sessions: {
        count: sessionsCount || 0,
        estimatedSize: (sessionsCount || 0) * 512 // 512B per record estimate
      },
      totalSize: ((scenariosCount || 0) * 2048) + ((sessionsCount || 0) * 512)
    };
  }
}

// API エンドポイント
export default async function handler(req, res) {
  setSecurityHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;
  const monitor = new SupabaseAdvancedMonitor();

  try {
    switch (action) {
      case 'comprehensive-analysis':
        const analysis = await monitor.comprehensiveAnalysis();
        return res.status(200).json({
          success: true,
          analysis,
          timestamp: new Date().toISOString()
        });

      case 'start-monitoring':
        const monitorResult = await monitor.startRealTimeMonitoring();
        return res.status(200).json(monitorResult);

      case 'performance-test':
        const perfAnalysis = await monitor.analyzePerformance();
        return res.status(200).json({
          success: true,
          performance: perfAnalysis
        });

      default:
        return res.status(200).json({
          success: true,
          message: '高度なSupabase監視システム',
          availableActions: [
            'comprehensive-analysis - 包括的システム分析',
            'start-monitoring - リアルタイム監視開始',
            'performance-test - パフォーマンス分析'
          ]
        });
    }
  } catch (error) {
    console.error('Advanced monitor error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}