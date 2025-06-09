// 自動APIテストスイート
// 全エンドポイントの機能・パフォーマンス・セキュリティテスト

import { validateAndSanitizeInput, checkRateLimit } from '../api/security-utils.js';

// テスト設定
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  adminToken: process.env.ADMIN_SECRET_KEY || 'test_admin_secret',
  testTimeout: 30000,
  performanceThreshold: 15000 // 15秒以内
};

// テスト結果格納
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  performance: [],
  security: []
};

// メインテスト実行
export async function runAllTests() {
  console.log('🧪 Starting comprehensive API test suite...');
  
  try {
    // 1. セキュリティテスト
    await runSecurityTests();
    
    // 2. 機能テスト
    await runFunctionalTests();
    
    // 3. パフォーマンステスト
    await runPerformanceTests();
    
    // 4. エラーハンドリングテスト
    await runErrorHandlingTests();
    
    // 5. ヘルスチェックテスト
    await runHealthCheckTests();
    
    // テスト結果出力
    generateTestReport();
    
  } catch (error) {
    console.error('Test suite failed:', error);
    testResults.errors.push(`Test suite error: ${error.message}`);
  }
  
  return testResults;
}

// セキュリティテスト
async function runSecurityTests() {
  console.log('🔒 Running security tests...');
  
  // 1. 入力検証テスト
  await testInputValidation();
  
  // 2. レート制限テスト
  await testRateLimit();
  
  // 3. 認証テスト
  await testAuthentication();
  
  // 4. CORSテスト
  await testCorsPolicy();
}

async function testInputValidation() {
  const testCases = [
    {
      name: 'Valid input',
      data: { participants: 5, era: 'modern', setting: 'closed-space' },
      shouldPass: true
    },
    {
      name: 'Invalid participant count (too low)',
      data: { participants: 2, era: 'modern', setting: 'closed-space' },
      shouldPass: false
    },
    {
      name: 'Invalid participant count (too high)', 
      data: { participants: 15, era: 'modern', setting: 'closed-space' },
      shouldPass: false
    },
    {
      name: 'Invalid era',
      data: { participants: 5, era: 'invalid_era', setting: 'closed-space' },
      shouldPass: false
    },
    {
      name: 'XSS attempt',
      data: { participants: 5, era: 'modern', setting: '<script>alert("xss")</script>' },
      shouldPass: false
    },
    {
      name: 'SQL injection attempt',
      data: { participants: 5, era: "modern'; DROP TABLE users; --", setting: 'closed-space' },
      shouldPass: false
    }
  ];

  for (const testCase of testCases) {
    try {
      validateAndSanitizeInput(testCase.data);
      if (!testCase.shouldPass) {
        recordTestResult(false, `Input validation: ${testCase.name} should have failed`);
      } else {
        recordTestResult(true, `Input validation: ${testCase.name}`);
      }
    } catch (error) {
      if (testCase.shouldPass) {
        recordTestResult(false, `Input validation: ${testCase.name} should have passed`);
      } else {
        recordTestResult(true, `Input validation: ${testCase.name}`);
      }
    }
  }
}

async function testRateLimit() {
  const clientIP = 'test_ip_123';
  
  // 正常リクエスト
  for (let i = 0; i < 5; i++) {
    const result = checkRateLimit(clientIP, 10, 15);
    if (!result.allowed) {
      recordTestResult(false, `Rate limit: Request ${i + 1} should be allowed`);
      return;
    }
  }
  
  // 制限超過リクエスト
  for (let i = 0; i < 10; i++) {
    checkRateLimit(clientIP, 10, 15);
  }
  
  const blockedResult = checkRateLimit(clientIP, 10, 15);
  if (blockedResult.allowed) {
    recordTestResult(false, 'Rate limit: Should block after limit exceeded');
  } else {
    recordTestResult(true, 'Rate limit: Correctly blocks after limit exceeded');
  }
}

async function testAuthentication() {
  const testEndpoint = `${TEST_CONFIG.baseUrl}/api/system-monitor`;
  
  // 認証なしアクセス
  try {
    const response = await fetch(testEndpoint);
    if (response.status === 401) {
      recordTestResult(true, 'Authentication: Correctly rejects unauthenticated access');
    } else {
      recordTestResult(false, 'Authentication: Should reject unauthenticated access');
    }
  } catch (error) {
    recordTestResult(false, `Authentication test failed: ${error.message}`);
  }
  
  // 正しい認証でアクセス
  try {
    const response = await fetch(testEndpoint, {
      headers: { 'Authorization': `Bearer ${TEST_CONFIG.adminToken}` }
    });
    if (response.ok) {
      recordTestResult(true, 'Authentication: Correctly accepts valid token');
    } else {
      recordTestResult(false, 'Authentication: Should accept valid token');
    }
  } catch (error) {
    recordTestResult(false, `Authentication with valid token failed: ${error.message}`);
  }
}

async function testCorsPolicy() {
  const testEndpoint = `${TEST_CONFIG.baseUrl}/api/health`;
  
  try {
    const response = await fetch(testEndpoint, {
      method: 'OPTIONS',
      headers: { 'Origin': 'https://malicious-site.com' }
    });
    
    const corsHeader = response.headers.get('Access-Control-Allow-Origin');
    if (corsHeader === '*' || corsHeader === 'https://malicious-site.com') {
      testResults.security.push('CORS policy may be too permissive');
      recordTestResult(false, 'CORS: Should not allow arbitrary origins');
    } else {
      recordTestResult(true, 'CORS: Correctly restricts origins');
    }
  } catch (error) {
    recordTestResult(false, `CORS test failed: ${error.message}`);
  }
}

// 機能テスト
async function runFunctionalTests() {
  console.log('⚙️ Running functional tests...');
  
  // ヘルスチェック機能テスト
  await testHealthEndpoint();
  
  // API機能テスト（モックデータ使用）
  await testApiEndpoints();
}

async function testHealthEndpoint() {
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);
    const data = await response.json();
    
    if (response.ok && data.status) {
      recordTestResult(true, 'Health endpoint: Returns valid response');
    } else {
      recordTestResult(false, 'Health endpoint: Invalid response format');
    }
  } catch (error) {
    recordTestResult(false, `Health endpoint test failed: ${error.message}`);
  }
}

async function testApiEndpoints() {
  const testData = {
    participants: 5,
    era: 'modern',
    setting: 'closed-space',
    incident_type: 'murder',
    worldview: 'realistic',
    tone: 'serious'
  };

  const endpoints = [
    '/api/groq-phase1-concept',
    '/api/failsafe-concept'
  ];

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${TEST_CONFIG.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_CONFIG.adminToken}`
        },
        body: JSON.stringify(testData)
      });
      
      const responseTime = Date.now() - startTime;
      testResults.performance.push({ endpoint, responseTime });
      
      if (response.ok) {
        recordTestResult(true, `${endpoint}: Functional test passed`);
      } else {
        recordTestResult(false, `${endpoint}: Returned status ${response.status}`);
      }
    } catch (error) {
      recordTestResult(false, `${endpoint}: ${error.message}`);
    }
  }
}

// パフォーマンステスト
async function runPerformanceTests() {
  console.log('⚡ Running performance tests...');
  
  const testEndpoint = `${TEST_CONFIG.baseUrl}/api/health`;
  const iterations = 10;
  const responseTimes = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    try {
      await fetch(testEndpoint);
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
    } catch (error) {
      recordTestResult(false, `Performance test iteration ${i + 1}: ${error.message}`);
    }
  }
  
  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    
    testResults.performance.push({
      endpoint: testEndpoint,
      average: avgResponseTime,
      maximum: maxResponseTime,
      iterations
    });
    
    if (avgResponseTime < 1000) {
      recordTestResult(true, `Performance: Average response time ${avgResponseTime.toFixed(2)}ms (excellent)`);
    } else if (avgResponseTime < 3000) {
      recordTestResult(true, `Performance: Average response time ${avgResponseTime.toFixed(2)}ms (acceptable)`);
    } else {
      recordTestResult(false, `Performance: Average response time ${avgResponseTime.toFixed(2)}ms (too slow)`);
    }
  }
}

// エラーハンドリングテスト
async function runErrorHandlingTests() {
  console.log('🚫 Running error handling tests...');
  
  // 無効なメソッドテスト
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`, { method: 'DELETE' });
    if (response.status === 405) {
      recordTestResult(true, 'Error handling: Correctly handles invalid methods');
    } else {
      recordTestResult(false, 'Error handling: Should return 405 for invalid methods');
    }
  } catch (error) {
    recordTestResult(false, `Error handling test failed: ${error.message}`);
  }
  
  // 無効なJSONテスト
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/groq-phase1-concept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    });
    
    if (response.status === 400) {
      recordTestResult(true, 'Error handling: Correctly handles invalid JSON');
    } else {
      recordTestResult(false, 'Error handling: Should return 400 for invalid JSON');
    }
  } catch (error) {
    recordTestResult(false, `Invalid JSON test failed: ${error.message}`);
  }
}

// ヘルスチェックテスト
async function runHealthCheckTests() {
  console.log('🏥 Running health check tests...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);
    const data = await response.json();
    
    // 必須フィールドチェック
    const requiredFields = ['status', 'timestamp', 'checks'];
    for (const field of requiredFields) {
      if (data[field] !== undefined) {
        recordTestResult(true, `Health check: Contains required field '${field}'`);
      } else {
        recordTestResult(false, `Health check: Missing required field '${field}'`);
      }
    }
    
    // ステータス値チェック
    const validStatuses = ['healthy', 'warning', 'critical', 'unhealthy'];
    if (validStatuses.includes(data.status)) {
      recordTestResult(true, 'Health check: Valid status value');
    } else {
      recordTestResult(false, `Health check: Invalid status '${data.status}'`);
    }
    
  } catch (error) {
    recordTestResult(false, `Health check test failed: ${error.message}`);
  }
}

// テスト結果記録
function recordTestResult(passed, message) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${message}`);
  } else {
    testResults.failed++;
    testResults.errors.push(message);
    console.log(`❌ ${message}`);
  }
}

// テストレポート生成
function generateTestReport() {
  console.log('\n📊 Test Report:');
  console.log(`Total tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed tests:');
    testResults.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (testResults.performance.length > 0) {
    console.log('\n⚡ Performance metrics:');
    testResults.performance.forEach(metric => {
      console.log(`  - ${metric.endpoint}: ${metric.responseTime || metric.average}ms`);
    });
  }
  
  if (testResults.security.length > 0) {
    console.log('\n🔒 Security notices:');
    testResults.security.forEach(notice => console.log(`  - ${notice}`));
  }
}

// Node.js環境でのテスト実行
if (typeof process !== 'undefined' && process.argv && process.argv[2] === 'run') {
  runAllTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}