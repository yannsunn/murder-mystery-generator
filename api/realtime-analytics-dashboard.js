/**
 * 📊 分析ダッシュボード（簡素化版）
 */

const { createClient } = require('@supabase/supabase-js');
const { setSecurityHeaders } = require('./security-utils.js');

const config = {
  maxDuration: 60,
};

class AnalyticsDashboard {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('環境設定エラー: 必要な環境変数を設定してください');
    }
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  /**
   * 基本統計情報取得
   */
  async getBasicStats() {
    const stats = {
      timestamp: new Date().toISOString(),
      database: {},
      usage: {}
    };
    
    try {
      // シナリオ数
      const { count: scenarioCount } = await this.supabase
        .from('scenarios')
        .select('*', { count: 'exact', head: true });
      
      stats.database.scenarios = scenarioCount || 0;
      
      // アクティブセッション数
      const { count: activeCount } = await this.supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_activity', new Date(Date.now() - 3600000).toISOString());
      
      stats.usage.activeSessions = activeCount || 0;
      
      // 最近のシナリオ生成数
      const { count: recentCount } = await this.supabase
        .from('scenarios')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 86400000).toISOString());
      
      stats.usage.recentScenarios = recentCount || 0;
      
      return stats;
    } catch (error) {
      stats.error = error.message;
      return stats;
    }
  }




  /**
   * システム状態確認
   */
  async getSystemStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      health: 'healthy',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    try {
      // データベース接続チェック
      const start = Date.now();
      const { error } = await this.supabase
        .from('scenarios')
        .select('id')
        .limit(1);
      
      status.databaseResponseTime = Date.now() - start;
      status.databaseStatus = !error ? 'connected' : 'error';
      
      if (error) {
        status.health = 'degraded';
      }
      
      return status;
    } catch (error) {
      status.health = 'error';
      status.error = error.message;
      return status;
    }
  }






}

// API エンドポイント
async function handler(req, res) {
  setSecurityHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;
  const dashboard = new AnalyticsDashboard();

  try {
    switch (action) {
      case 'stats':
        const stats = await dashboard.getBasicStats();
        return res.status(200).json({
          success: true,
          stats
        });

      case 'system':
        const system = await dashboard.getSystemStatus();
        return res.status(200).json({
          success: true,
          system
        });

      default:
        return res.status(200).json({
          success: true,
          message: '分析ダッシュボードAPI',
          availableActions: [
            'stats - 基本統計',
            'system - システム状態'
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

module.exports = handler;
module.exports.config = config;