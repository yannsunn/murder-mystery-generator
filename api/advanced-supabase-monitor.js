/**
 * 📊 Supabase監視システム（最適化版）
 */

import { createClient } from '@supabase/supabase-js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 60,
};

class SupabaseMonitor {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('環境設定エラー: 必要な環境変数を設定してください');
    }
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    this.metrics = {
      queryCount: 0,
      errorCount: 0,
      avgResponseTime: 0
    };
  }

  /**
   * 基本的なシステムチェック
   */
  async performHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      metrics: {}
    };

    try {
      // データベース接続チェック
      const start = Date.now();
      const { error } = await this.supabase
        .from('scenarios')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - start;
      this.metrics.queryCount++;
      this.metrics.avgResponseTime = 
        (this.metrics.avgResponseTime * (this.metrics.queryCount - 1) + responseTime) / this.metrics.queryCount;
      
      results.metrics = {
        ...this.metrics,
        databaseStatus: !error ? 'connected' : 'error'
      };
      
      if (error) {
        this.metrics.errorCount++;
        results.status = 'unhealthy';
      }
      
      return results;
    } catch (error) {
      results.status = 'error';
      results.error = error.message;
      return results;
    }
  }

  /**
   * テーブル統計取得
   */
  async getTableStats() {
    const stats = {};

    try {
      // scenarios テーブル統計
      const { count: scenarioCount } = await this.supabase
        .from('scenarios')
        .select('*', { count: 'exact', head: true });
      
      stats.scenarios = {
        count: scenarioCount || 0
      };

      // user_sessions テーブル統計
      const { count: sessionCount } = await this.supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true });
      
      stats.user_sessions = {
        count: sessionCount || 0
      };

      return stats;
    } catch (error) {
      return { error: error.message };
    }
  }








}

// API エンドポイント
export default async function handler(req, res) {
  setSecurityHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;
  const monitor = new SupabaseMonitor();

  try {
    switch (action) {
      case 'health':
        const health = await monitor.performHealthCheck();
        return res.status(200).json({
          success: true,
          health
        });

      case 'stats':
        const stats = await monitor.getTableStats();
        return res.status(200).json({
          success: true,
          stats
        });

      default:
        return res.status(200).json({
          success: true,
          message: 'Supabase監視システム',
          availableActions: [
            'health - ヘルスチェック',
            'stats - テーブル統計'
          ]
        });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}