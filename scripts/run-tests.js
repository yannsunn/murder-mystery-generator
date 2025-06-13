#!/usr/bin/env node

/**
 * 🧪 Test Runner Script
 * 商業品質向けテスト実行システム
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🧪 Running test suite...');
console.log('========================================');

/**
 * 基本的な構文チェック
 */
function syntaxTests() {
  console.log('\n📝 Running syntax tests...');
  
  const jsFiles = [
    'public/js/main.js',
    'public/js/MurderMysteryApp.js',
    'public/js/UltraMurderMysteryApp.js',
    'public/js/core/UIMessages.js'
  ];
  
  let passed = 0;
  let failed = 0;
  
  jsFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 基本的な構文チェック
        const hasUnmatchedBraces = (content.match(/\{/g) || []).length !== (content.match(/\}/g) || []).length;
        const hasUnmatchedParens = (content.match(/\(/g) || []).length !== (content.match(/\)/g) || []).length;
        
        if (hasUnmatchedBraces || hasUnmatchedParens) {
          console.log(`❌ ${file}: Syntax error detected`);
          failed++;
        } else {
          console.log(`✅ ${file}: Syntax OK`);
          passed++;
        }
      } catch (error) {
        console.log(`❌ ${file}: ${error.message}`);
        failed++;
      }
    } else {
      console.log(`⚠️  ${file}: File not found`);
    }
  });
  
  return { passed, failed };
}

/**
 * API エンドポイントテスト
 */
function apiTests() {
  console.log('\n🔌 Running API tests...');
  
  const apiDir = path.join(projectRoot, 'api');
  let passed = 0;
  let failed = 0;
  
  if (fs.existsSync(apiDir)) {
    const apiFiles = fs.readdirSync(apiDir)
      .filter(file => file.endsWith('.js'))
      .filter(file => !file.includes('security-utils'));
    
    apiFiles.forEach(file => {
      const filePath = path.join(apiDir, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // API エンドポイントの基本チェック
        const hasHandler = content.includes('export') || content.includes('handler') || content.includes('exports');
        const hasErrorHandling = content.includes('try') && content.includes('catch');
        
        if (hasHandler && hasErrorHandling) {
          console.log(`✅ ${file}: API structure OK`);
          passed++;
        } else {
          console.log(`❌ ${file}: Missing handler or error handling`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${file}: ${error.message}`);
        failed++;
      }
    });
  }
  
  return { passed, failed };
}

/**
 * 設定ファイルテスト
 */
function configTests() {
  console.log('\n⚙️ Running configuration tests...');
  
  const configFiles = [
    { file: 'package.json', required: true },
    { file: 'netlify.toml', required: true },
    { file: '.gitignore', required: false }
  ];
  
  let passed = 0;
  let failed = 0;
  
  configFiles.forEach(({ file, required }) => {
    const filePath = path.join(projectRoot, file);
    
    if (fs.existsSync(filePath)) {
      try {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(filePath, 'utf8');
          JSON.parse(content); // JSON 構文チェック
        }
        console.log(`✅ ${file}: Configuration OK`);
        passed++;
      } catch (error) {
        console.log(`❌ ${file}: ${error.message}`);
        failed++;
      }
    } else if (required) {
      console.log(`❌ ${file}: Required file missing`);
      failed++;
    } else {
      console.log(`⚠️  ${file}: Optional file missing`);
    }
  });
  
  return { passed, failed };
}

/**
 * セキュリティテスト
 */
function securityTests() {
  console.log('\n🔒 Running security tests...');
  
  let passed = 0;
  let failed = 0;
  
  // Netlify 設定のセキュリティチェック
  const netlifyPath = path.join(projectRoot, 'netlify.toml');
  if (fs.existsSync(netlifyPath)) {
    const content = fs.readFileSync(netlifyPath, 'utf8');
    
    const securityHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy'
    ];
    
    securityHeaders.forEach(header => {
      if (content.includes(header)) {
        console.log(`✅ Security header: ${header}`);
        passed++;
      } else {
        console.log(`❌ Missing security header: ${header}`);
        failed++;
      }
    });
  }
  
  // APIファイルのセキュリティチェック
  const securityUtilsPath = path.join(projectRoot, 'api/security-utils.js');
  if (fs.existsSync(securityUtilsPath)) {
    const content = fs.readFileSync(securityUtilsPath, 'utf8');
    
    const securityFeatures = [
      'validateInput',
      'sanitizeInput',
      'rateLimiter'
    ];
    
    securityFeatures.forEach(feature => {
      if (content.includes(feature)) {
        console.log(`✅ Security feature: ${feature}`);
        passed++;
      } else {
        console.log(`❌ Missing security feature: ${feature}`);
        failed++;
      }
    });
  }
  
  return { passed, failed };
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    console.log('🚀 Starting comprehensive test suite...\n');
    
    const results = {
      syntax: syntaxTests(),
      api: apiTests(),
      config: configTests(),
      security: securityTests()
    };
    
    // 結果集計
    const totalPassed = Object.values(results).reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = Object.values(results).reduce((sum, result) => sum + result.failed, 0);
    const totalTests = totalPassed + totalFailed;
    
    console.log('\n========================================');
    console.log('📊 Test Results Summary');
    console.log('========================================');
    console.log(`✅ Passed: ${totalPassed}/${totalTests}`);
    console.log(`❌ Failed: ${totalFailed}/${totalTests}`);
    console.log(`📈 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! Ready for deployment.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
main();