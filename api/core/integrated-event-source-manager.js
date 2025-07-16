/**
 * 🌐 統合EventSourceManager
 * EventSource接続の統一管理とメモリリーク対策
 */

const { logger } = require('../utils/logger.js');
const { resourceManager } = require('../utils/resource-manager.js');

class IntegratedEventSourceManager {
  constructor() {
    this.connections = new Map();
    this.heartbeatInterval = null;
    this.heartbeatTimeout = 30000; // 30秒
    this.cleanupInterval = null;
    this.cleanupTimeout = 60000; // 1分間隔でクリーンアップ
    this.maxConnections = 100;
    this.connectionTimeout = 300000; // 5分でタイムアウト
    
    // 定期的なクリーンアップの開始
    this.startCleanupInterval();
    
    // プロセス終了時のクリーンアップ
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
    process.on('uncaughtException', () => this.cleanup());
  }

  /**
   * EventSource接続の初期化
   */
  setupEventSourceConnection(req, res, sessionId) {
    const connectionId = sessionId || `eventsource_${Date.now()}`;
    
    // 接続数制限チェック
    if (this.connections.size >= this.maxConnections) {
      logger.warn(`🚨 EventSource connection limit exceeded: ${this.connections.size}`);
      this.cleanupOldestConnection();
    }
    
    // 既存の接続があれば閉じる
    if (this.connections.has(connectionId)) {
      this.closeConnection(connectionId);
    }
    
    // 新しい接続を作成
    const connection = {
      id: connectionId,
      req,
      res,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      heartbeatTimer: null,
      timeoutTimer: null
    };
    
    this.connections.set(connectionId, connection);
    
    // イベントリスナーの設定
    this.setupConnectionEventListeners(connection);
    
    // ハートビートの開始
    this.startHeartbeat(connection);
    
    // タイムアウトタイマーの設定
    this.setConnectionTimeout(connection);
    
    // ResourceManagerに登録
    resourceManager.registerEventSource(connectionId, {
      close: () => this.closeConnection(connectionId)
    });
    
    logger.info(`🌐 EventSource connection established: ${connectionId}`);
    logger.debug(`📊 Active connections: ${this.connections.size}`);
    
    return connectionId;
  }

  /**
   * 接続のイベントリスナー設定
   */
  setupConnectionEventListeners(connection) {
    // クライアント切断時の処理
    connection.req.on('close', () => {
      logger.debug(`🔌 Client disconnected: ${connection.id}`);
      this.closeConnection(connection.id);
    });
    
    // エラー発生時の処理
    connection.req.on('error', (error) => {
      logger.warn(`❌ EventSource error for ${connection.id}: ${error.message}`);
      this.closeConnection(connection.id);
    });
    
    // レスポンスのfinish/closeイベント
    connection.res.on('finish', () => {
      logger.debug(`✅ Response finished for: ${connection.id}`);
      this.closeConnection(connection.id);
    });
    
    connection.res.on('close', () => {
      logger.debug(`🔒 Response closed for: ${connection.id}`);
      this.closeConnection(connection.id);
    });
  }

  /**
   * EventSourceヘッダーの設定
   */
  setEventSourceHeaders(res) {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx buffering無効
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
    
    res.writeHead(200, headers);
    
    // 初期接続確認メッセージ
    this.sendRawMessage(res, 'connected', { timestamp: new Date().toISOString() });
  }

  /**
   * メッセージ送信（低レベル）
   */
  sendRawMessage(res, event, data) {
    if (!res || res.destroyed || !res.writable) {
      return false;
    }
    
    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      res.write(message);
      return true;
    } catch (error) {
      logger.error(`❌ EventSource write error: ${error.message}`);
      return false;
    }
  }

  /**
   * 安全なメッセージ送信
   */
  sendEventSourceMessage(connectionId, event, data) {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isActive) {
      logger.debug(`⚠️ Connection not active: ${connectionId}`);
      return false;
    }
    
    // 最終活動時刻を更新
    connection.lastActivity = new Date();
    
    const success = this.sendRawMessage(connection.res, event, data);
    
    if (!success) {
      logger.warn(`❌ Failed to send message to ${connectionId}`);
      this.closeConnection(connectionId);
    }
    
    return success;
  }

  /**
   * 進捗更新の送信
   */
  sendProgressUpdate(connectionId, stepIndex, stepName, result, currentWeight, totalWeight, isComplete = false) {
    const progressData = {
      step: stepIndex + 1,
      totalSteps: 9,
      stepName: stepName,
      content: result,
      progress: Math.round((currentWeight / totalWeight) * 100),
      isComplete,
      timestamp: new Date().toISOString(),
      estimatedTimeRemaining: Math.max(0, Math.floor((totalWeight - currentWeight) * 2 / totalWeight))
    };
    
    const success = this.sendEventSourceMessage(connectionId, 'progress', progressData);
    
    if (success) {
      logger.debug(`📡 Progress sent to ${connectionId}: ${stepName} (${progressData.progress}%)`);
    }
    
    return success;
  }

  /**
   * ハートビートの開始
   */
  startHeartbeat(connection) {
    if (connection.heartbeatTimer) {
      clearInterval(connection.heartbeatTimer);
    }
    
    connection.heartbeatTimer = setInterval(() => {
      if (connection.isActive) {
        const success = this.sendRawMessage(connection.res, 'heartbeat', {
          timestamp: new Date().toISOString(),
          connectionId: connection.id
        });
        
        if (!success) {
          logger.warn(`💔 Heartbeat failed for ${connection.id}`);
          this.closeConnection(connection.id);
        }
      }
    }, this.heartbeatTimeout);
  }

  /**
   * 接続タイムアウトの設定
   */
  setConnectionTimeout(connection) {
    if (connection.timeoutTimer) {
      clearTimeout(connection.timeoutTimer);
    }
    
    connection.timeoutTimer = setTimeout(() => {
      logger.info(`⏰ Connection timeout for ${connection.id}`);
      this.closeConnection(connection.id);
    }, this.connectionTimeout);
  }

  /**
   * 接続のクローズ
   */
  closeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    // 状態を非アクティブに
    connection.isActive = false;
    
    // タイマーのクリア
    if (connection.heartbeatTimer) {
      clearInterval(connection.heartbeatTimer);
    }
    
    if (connection.timeoutTimer) {
      clearTimeout(connection.timeoutTimer);
    }
    
    // レスポンスのクローズ
    try {
      if (connection.res && !connection.res.destroyed) {
        if (!connection.res.headersSent) {
          connection.res.end();
        } else {
          connection.res.destroy();
        }
      }
    } catch (error) {
      logger.debug(`⚠️ Error closing response for ${connectionId}: ${error.message}`);
    }
    
    // 接続を削除
    this.connections.delete(connectionId);
    
    // ResourceManagerからも削除
    resourceManager.cleanupEventSource(connectionId);
    
    logger.info(`🔌 Connection closed: ${connectionId}`);
    logger.debug(`📊 Active connections: ${this.connections.size}`);
  }

  /**
   * 最古の接続を閉じる
   */
  cleanupOldestConnection() {
    if (this.connections.size === 0) return;
    
    let oldestConnection = null;
    let oldestTime = new Date();
    
    for (const connection of this.connections.values()) {
      if (connection.createdAt < oldestTime) {
        oldestTime = connection.createdAt;
        oldestConnection = connection;
      }
    }
    
    if (oldestConnection) {
      logger.info(`🧹 Cleanup oldest connection: ${oldestConnection.id}`);
      this.closeConnection(oldestConnection.id);
    }
  }

  /**
   * 非アクティブな接続のクリーンアップ
   */
  cleanupInactiveConnections() {
    const now = new Date();
    const inactiveTimeout = 120000; // 2分間非アクティブで削除
    
    for (const [connectionId, connection] of this.connections) {
      const timeSinceActivity = now - connection.lastActivity;
      
      if (timeSinceActivity > inactiveTimeout) {
        logger.info(`🧹 Cleanup inactive connection: ${connectionId}`);
        this.closeConnection(connectionId);
      }
    }
  }

  /**
   * 定期的なクリーンアップの開始
   */
  startCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveConnections();
    }, this.cleanupTimeout);
  }

  /**
   * 全接続のクリーンアップ
   */
  cleanup() {
    logger.info('🧹 Starting EventSource cleanup...');
    
    // 全接続を閉じる
    for (const connectionId of this.connections.keys()) {
      this.closeConnection(connectionId);
    }
    
    // インターバルのクリア
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    logger.info('✅ EventSource cleanup completed');
  }

  /**
   * 統計情報の取得
   */
  getStats() {
    const stats = {
      totalConnections: this.connections.size,
      activeConnections: 0,
      oldestConnection: null,
      memoryUsage: process.memoryUsage()
    };
    
    let oldestTime = new Date();
    
    for (const connection of this.connections.values()) {
      if (connection.isActive) {
        stats.activeConnections++;
      }
      
      if (connection.createdAt < oldestTime) {
        oldestTime = connection.createdAt;
        stats.oldestConnection = {
          id: connection.id,
          createdAt: connection.createdAt,
          lastActivity: connection.lastActivity
        };
      }
    }
    
    return stats;
  }

  /**
   * 接続の存在確認
   */
  hasConnection(connectionId) {
    return this.connections.has(connectionId);
  }

  /**
   * 接続情報の取得
   */
  getConnection(connectionId) {
    return this.connections.get(connectionId);
  }
}

// シングルトンインスタンス
const integratedEventSourceManager = new IntegratedEventSourceManager();

module.exports = { 
  IntegratedEventSourceManager,
  integratedEventSourceManager 
};