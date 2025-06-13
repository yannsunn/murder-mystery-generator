#!/usr/bin/env node
/**
 * ビルド前チェックスクリプト
 * コード品質、依存関係、設定の検証
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 Pre-build checks starting...');
console.log('='.repeat(40));

let checksPassed = 0;
let checksTotal = 0;
const issues = [];

// チェック結果の記録
function recordCheck(name, passed, message = '') {
  checksTotal++;
  if (passed) {
    checksPassed++;
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name}: ${message}`);
    issues.push({ check: name, message });
  }
}

// 必須ファイルの存在確認
function checkRequiredFiles() {
  console.log('\n📁 Checking required files...');
  
  const requiredFiles = [
    'public/index.html',
    'public/optimized-production.css',
    'public/js/main.js',
    'public/js/UltraMurderMysteryApp.js',
    'public/js/core/UIMessages.js',
    'api/security-utils.js',
    'api/phase1-concept.js',
    'netlify.toml',
    'package.json'
  ];
  
  requiredFiles.forEach(filePath => {
    const fullPath = path.join(projectRoot, filePath);
    const exists = fs.existsSync(fullPath);
    recordCheck(
      `Required file: ${filePath}`, 
      exists, 
      exists ? '' : 'File not found'
    );
  });
}

// package.json の検証
function checkPackageJson() {
  console.log('\n📦 Checking package.json...');
  
  try {
    const packagePath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    recordCheck(
      'Package.json exists and is valid JSON',
      true
    );
    
    recordCheck(
      'Package has name field',
      !!packageJson.name,
      'Missing name field'
    );
    
    recordCheck(
      'Package has version field',
      !!packageJson.version,
      'Missing version field'
    );
    
    recordCheck(
      'Package has required dependencies',
      packageJson.dependencies && packageJson.dependencies['jszip'] && packageJson.dependencies['pdf-lib'],
      'Missing required dependencies'
    );
    
    recordCheck(
      'Package has build script',
      packageJson.scripts && packageJson.scripts.build,
      'Missing build script'
    );
    
  } catch (error) {
    recordCheck(
      'Package.json validation',
      false,
      error.message
    );
  }
}

// netlify.toml の検証
function checkNetlifyConfig() {
  console.log('\n⚙️ Checking Netlify configuration...');
  
  try {
    const netlifyPath = path.join(projectRoot, 'netlify.toml');
    const content = fs.readFileSync(netlifyPath, 'utf8');
    
    recordCheck(
      'Netlify.toml exists',
      true
    );
    
    recordCheck(
      'Has build configuration',
      content.includes('[build]'),
      'Missing [build] section'
    );
    
    recordCheck(
      'Has functions configuration',
      content.includes('[functions]'),
      'Missing [functions] section'
    );
    
    recordCheck(
      'Has security headers',
      content.includes('X-Frame-Options') && content.includes('Content-Security-Policy'),
      'Missing security headers'
    );
    
    recordCheck(
      'Has API redirects',
      content.includes('/api/*'),
      'Missing API redirects'
    );
    
  } catch (error) {
    recordCheck(
      'Netlify configuration',
      false,
      error.message
    );
  }
}

// JavaScript構文チェック
function checkJavaScriptSyntax() {
  console.log('\n🔍 Checking JavaScript syntax...');
  
  const jsFiles = [
    'public/js/main.js',
    'public/js/UltraMurderMysteryApp.js',
    'public/js/core/UIMessages.js',
    'public/js/core/Logger.js',
    'api/security-utils.js',
    'api/phase1-concept.js'
  ];
  
  jsFiles.forEach(filePath => {
    try {
      const fullPath = path.join(projectRoot, filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // 基本的な構文チェック
        const hasUnclosedBraces = (content.match(/\{/g) || []).length !== (content.match(/\}/g) || []).length;
        const hasUnclosedParens = (content.match(/\(/g) || []).length !== (content.match(/\)/g) || []).length;
        const hasUnclosedBrackets = (content.match(/\[/g) || []).length !== (content.match(/\]/g) || []).length;
        
        recordCheck(
          `JS syntax: ${filePath}`,
          !hasUnclosedBraces && !hasUnclosedParens && !hasUnclosedBrackets,
          'Possible syntax error - unmatched brackets/braces/parentheses'
        );
      }
    } catch (error) {
      recordCheck(
        `JS syntax: ${filePath}`,
        false,
        error.message
      );
    }
  });
}

// CSS構文チェック
function checkCSSyntax() {
  console.log('\n🎨 Checking CSS syntax...');
  
  const cssFile = 'public/optimized-production.css';
  const fullPath = path.join(projectRoot, cssFile);
  
  try {
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // 基本的な構文チェック
      const hasUnclosedBraces = (content.match(/\{/g) || []).length !== (content.match(/\}/g) || []).length;
      const hasInvalidSelectors = content.match(/[^a-zA-Z0-9\s\-_.:,#\[\]()>+~*='"@]/g);
      
      recordCheck(
        `CSS syntax: ${cssFile}`,
        !hasUnclosedBraces,
        'Unmatched braces in CSS'
      );
      
      recordCheck(
        `CSS selectors: ${cssFile}`,
        !hasInvalidSelectors,
        'Potentially invalid characters in selectors'
      );
    }
  } catch (error) {
    recordCheck(
      `CSS syntax: ${cssFile}`,
      false,
      error.message
    );
  }
}

// API エンドポイントチェック
function checkAPIEndpoints() {
  console.log('\n🔌 Checking API endpoints...');
  
  const apiFiles = [
    'api/phase1-concept.js',
    'api/phase2-characters.js',
    'api/phase5-clues.js',
    'api/phase6-timeline.js',
    'api/phase8-gamemaster.js',
    'api/generate-pdf.js',
    'api/security-utils.js'
  ];
  
  apiFiles.forEach(filePath => {
    const fullPath = path.join(projectRoot, filePath);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasDefaultExport = content.includes('export default');
        const hasHandlerFunction = content.includes('function') || content.includes('=>');
        
        recordCheck(
          `API endpoint: ${filePath}`,
          hasDefaultExport && hasHandlerFunction,
          'Missing default export or handler function'
        );
      } catch (error) {
        recordCheck(
          `API endpoint: ${filePath}`,
          false,
          error.message
        );
      }
    } else {
      recordCheck(
        `API endpoint: ${filePath}`,
        false,
        'File not found'
      );
    }
  });
}

// セキュリティ設定チェック
function checkSecuritySettings() {
  console.log('\n🔒 Checking security settings...');
  
  // セキュリティユーティリティの存在確認
  const securityUtilsPath = path.join(projectRoot, 'api/security-utils.js');
  const securityUtilsExists = fs.existsSync(securityUtilsPath);
  
  recordCheck(
    'Security utilities exist',
    securityUtilsExists,
    'security-utils.js not found'
  );
  
  if (securityUtilsExists) {
    const content = fs.readFileSync(securityUtilsPath, 'utf8');
    
    recordCheck(
      'Rate limiting implemented',
      content.includes('checkRateLimit'),
      'Rate limiting function not found'
    );
    
    recordCheck(
      'Input validation implemented',
      content.includes('validateAndSanitizeInput'),
      'Input validation function not found'
    );
    
    recordCheck(
      'Security headers implemented',
      content.includes('setSecurityHeaders'),
      'Security headers function not found'
    );
  }
}

// 環境変数テンプレートチェック
function checkEnvironmentTemplate() {
  console.log('\n🌍 Checking environment configuration...');
  
  // .env.example または設定ドキュメントの確認
  const envExamplePath = path.join(projectRoot, '.env.example');
  const setEnvPath = path.join(projectRoot, 'set-env-vars.sh');
  
  recordCheck(
    'Environment configuration guide exists',
    fs.existsSync(envExamplePath) || fs.existsSync(setEnvPath),
    'No environment configuration guide found'
  );
  
  // 必要な環境変数の文書化確認
  if (fs.existsSync(setEnvPath)) {
    const content = fs.readFileSync(setEnvPath, 'utf8');
    recordCheck(
      'GROQ_API_KEY documented',
      content.includes('GROQ_API_KEY'),
      'GROQ_API_KEY not documented in environment setup'
    );
  }
}

// 結果サマリー
function printSummary() {
  console.log('\n' + '='.repeat(40));
  console.log('📊 Pre-build Check Summary');
  console.log('='.repeat(40));
  
  console.log(`✅ Passed: ${checksPassed}`);
  console.log(`❌ Failed: ${checksTotal - checksPassed}`);
  console.log(`📊 Total: ${checksTotal}`);
  
  if (issues.length > 0) {
    console.log('\n🚨 Issues found:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.check}: ${issue.message}`);
    });
    console.log('\n💡 Please fix these issues before building for production.');
    return false;
  } else {
    console.log('\n🎉 All pre-build checks passed!');
    console.log('✅ Ready for production build');
    return true;
  }
}

// メイン実行
async function main() {
  try {
    checkRequiredFiles();
    checkPackageJson();
    checkNetlifyConfig();
    checkJavaScriptSyntax();
    checkCSSyntax();
    checkAPIEndpoints();
    checkSecuritySettings();
    checkEnvironmentTemplate();
    
    const success = printSummary();
    
    if (!success) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Pre-build checks failed:', error.message);
    process.exit(1);
  }
}

main();