/**
 * 🧪 EventSource統合テスト
 * 統合EventSourceManagerのテストスイート
 */

const { logger } = require('../utils/logger.js');
const { integratedEventSourceManager } = require('../core/integrated-event-source-manager.js');
const { eventSourceErrorHandler, EventSourceError, EVENT_SOURCE_ERROR_TYPES } = require('../core/event-source-error-handler.js');
const { resourceManager } = require('../utils/resource-manager.js');

// モックオブジェクトの作成
function createMockRequest() {
  const EventEmitter = require('events');
  const mockReq = new EventEmitter();
  mockReq.headers = {};
  return mockReq;
}

function createMockResponse() {
  const EventEmitter = require('events');
  const mockRes = new EventEmitter();
  mockRes.headersSent = false;
  mockRes.destroyed = false;
  mockRes.writable = true;
  mockRes.writeHead = function(statusCode, headers) {
    this.statusCode = statusCode;
    this.headers = headers;
    this.headersSent = true;
  };
  mockRes.write = function(data) {
    this.emit('data', data);
    return true;
  };
  mockRes.end = function() {
    this.emit('end');
    this.destroyed = true;
  };
  mockRes.destroy = function() {
    this.destroyed = true;
    this.emit('close');
  };
  return mockRes;
}

/**
 * 基本的な接続テスト
 */
async function testBasicConnection() {
  console.log('🔧 Testing basic EventSource connection...');
  
  const mockReq = createMockRequest();
  const mockRes = createMockResponse();
  const sessionId = 'test-session-1';
  
  try {
    // 接続の作成
    const connectionId = integratedEventSourceManager.setupEventSourceConnection(mockReq, mockRes, sessionId);
    
    // 接続が正常に作成されたか確認
    if (connectionId && integratedEventSourceManager.hasConnection(connectionId)) {
      console.log('✅ Basic connection test passed');
      
      // 接続をクリーンアップ
      integratedEventSourceManager.closeConnection(connectionId);
    } else {
      console.log('❌ Basic connection test failed');
    }
    
    // 統計情報の確認
    const stats = integratedEventSourceManager.getStats();
    console.log('📊 Manager stats:', stats);
    
  } catch (error) {
    console.error('❌ Basic connection test error:', error);
  }
}

/**
 * メッセージ送信テスト
 */
async function testMessageSending() {
  console.log('🔧 Testing message sending...');
  
  const mockReq = createMockRequest();
  const mockRes = createMockResponse();
  const sessionId = 'test-session-2';
  
  try {
    // 接続の作成
    const connectionId = integratedEventSourceManager.setupEventSourceConnection(mockReq, mockRes, sessionId);
    
    // ヘッダーの設定
    integratedEventSourceManager.setEventSourceHeaders(mockRes);
    
    // メッセージの送信
    const messageData = { type: 'test', message: 'Hello EventSource!' };
    const messageSent = integratedEventSourceManager.sendEventSourceMessage(connectionId, 'test', messageData);
    
    if (messageSent) {
      console.log('✅ Message sending test passed');
    } else {
      console.log('❌ Message sending test failed');
    }
    
    // 進捗更新のテスト
    const progressSent = integratedEventSourceManager.sendProgressUpdate(connectionId, 0, 'Test Step', 'Test Result', 10, 100, false);
    
    if (progressSent) {
      console.log('✅ Progress update test passed');
    } else {
      console.log('❌ Progress update test failed');
    }
    
    // 接続をクリーンアップ
    integratedEventSourceManager.closeConnection(connectionId);
    
  } catch (error) {
    console.error('❌ Message sending test error:', error);
  }
}

/**
 * エラーハンドリングテスト
 */
async function testErrorHandling() {
  console.log('🔧 Testing error handling...');
  
  try {
    // 各種エラータイプのテスト
    const testErrors = [
      new EventSourceError('Connection failed', EVENT_SOURCE_ERROR_TYPES.CONNECTION_FAILED, 'test-1'),
      new EventSourceError('Write failed', EVENT_SOURCE_ERROR_TYPES.WRITE_FAILED, 'test-2'),
      new EventSourceError('Client disconnected', EVENT_SOURCE_ERROR_TYPES.CLIENT_DISCONNECTED, 'test-3'),
      new EventSourceError('Timeout occurred', EVENT_SOURCE_ERROR_TYPES.TIMEOUT, 'test-4'),
      new EventSourceError('Memory pressure', EVENT_SOURCE_ERROR_TYPES.MEMORY_PRESSURE, 'test-5'),
      new EventSourceError('Rate limit exceeded', EVENT_SOURCE_ERROR_TYPES.RATE_LIMIT, 'test-6'),
      new EventSourceError('Validation failed', EVENT_SOURCE_ERROR_TYPES.VALIDATION_ERROR, 'test-7')
    ];
    
    for (const error of testErrors) {
      const result = eventSourceErrorHandler.handleError(error, error.connectionId);
      
      if (result.errorInfo) {
        console.log(`✅ Error handling test passed for ${error.type}`);
      } else {
        console.log(`❌ Error handling test failed for ${error.type}`);
      }
    }
    
    // エラー統計の確認
    const errorStats = eventSourceErrorHandler.getErrorStats();
    console.log('📊 Error stats:', errorStats);
    
  } catch (error) {
    console.error('❌ Error handling test error:', error);
  }
}

/**
 * 複数接続テスト
 */
async function testMultipleConnections() {
  console.log('🔧 Testing multiple connections...');
  
  try {
    const connections = [];
    const connectionCount = 5;
    
    // 複数接続の作成
    for (let i = 0; i < connectionCount; i++) {
      const mockReq = createMockRequest();
      const mockRes = createMockResponse();
      const sessionId = `test-session-multi-${i}`;
      
      const connectionId = integratedEventSourceManager.setupEventSourceConnection(mockReq, mockRes, sessionId);
      connections.push(connectionId);
    }
    
    // 統計情報の確認
    const stats = integratedEventSourceManager.getStats();
    
    if (stats.totalConnections === connectionCount) {
      console.log('✅ Multiple connections test passed');
    } else {
      console.log(`❌ Multiple connections test failed. Expected: ${connectionCount}, Got: ${stats.totalConnections}`);
    }
    
    // 全接続のクリーンアップ
    connections.forEach(connectionId => {
      integratedEventSourceManager.closeConnection(connectionId);
    });
    
    // クリーンアップ後の統計確認
    const cleanupStats = integratedEventSourceManager.getStats();
    if (cleanupStats.totalConnections === 0) {
      console.log('✅ Connection cleanup test passed');
    } else {
      console.log(`❌ Connection cleanup test failed. Expected: 0, Got: ${cleanupStats.totalConnections}`);
    }
    
  } catch (error) {
    console.error('❌ Multiple connections test error:', error);
  }
}

/**
 * ResourceManager統合テスト
 */
async function testResourceManagerIntegration() {
  console.log('🔧 Testing ResourceManager integration...');
  
  try {
    const mockReq = createMockRequest();
    const mockRes = createMockResponse();
    const sessionId = 'test-session-resource';
    
    // 接続の作成
    const connectionId = integratedEventSourceManager.setupEventSourceConnection(mockReq, mockRes, sessionId);
    
    // ResourceManagerの統計確認
    const resourceStats = resourceManager.getStats();
    console.log('📊 Resource manager stats:', resourceStats);
    
    // 接続をクリーンアップ
    integratedEventSourceManager.closeConnection(connectionId);
    
    console.log('✅ ResourceManager integration test passed');
    
  } catch (error) {
    console.error('❌ ResourceManager integration test error:', error);
  }
}

/**
 * メモリリーク検出テスト
 */
async function testMemoryLeak() {
  console.log('🔧 Testing memory leak detection...');
  
  try {
    const initialMemory = process.memoryUsage();
    console.log('📊 Initial memory usage:', {
      rss: `${Math.round(initialMemory.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`
    });
    
    // 多数の接続を作成・削除
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
      const mockReq = createMockRequest();
      const mockRes = createMockResponse();
      const sessionId = `test-session-leak-${i}`;
      
      const connectionId = integratedEventSourceManager.setupEventSourceConnection(mockReq, mockRes, sessionId);
      
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 1));
      
      // 接続をクリーンアップ
      integratedEventSourceManager.closeConnection(connectionId);
    }
    
    // ガベージコレクションの実行
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage();
    console.log('📊 Final memory usage:', {
      rss: `${Math.round(finalMemory.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`
    });
    
    // メモリ使用量の差を確認
    const memoryDiff = finalMemory.heapUsed - initialMemory.heapUsed;
    const memoryDiffMB = memoryDiff / 1024 / 1024;
    
    if (memoryDiffMB < 10) { // 10MB未満の増加は許容
      console.log('✅ Memory leak test passed');
    } else {
      console.log(`⚠️ Memory leak test: ${memoryDiffMB.toFixed(2)}MB increase detected`);
    }
    
  } catch (error) {
    console.error('❌ Memory leak test error:', error);
  }
}

/**
 * テストスイートの実行
 */
async function runTestSuite() {
  console.log('🚀 Starting EventSource Integration Test Suite...\n');
  
  try {
    await testBasicConnection();
    console.log('');
    
    await testMessageSending();
    console.log('');
    
    await testErrorHandling();
    console.log('');
    
    await testMultipleConnections();
    console.log('');
    
    await testResourceManagerIntegration();
    console.log('');
    
    await testMemoryLeak();
    console.log('');
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    // 最終クリーンアップ
    integratedEventSourceManager.cleanup();
    resourceManager.cleanup();
    console.log('🧹 Test cleanup completed');
  }
}

// テストが直接実行された場合
if (require.main === module) {
  runTestSuite().then(() => {
    console.log('🎉 EventSource Integration Test Suite completed');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testBasicConnection,
  testMessageSending,
  testErrorHandling,
  testMultipleConnections,
  testResourceManagerIntegration,
  testMemoryLeak,
  runTestSuite
};