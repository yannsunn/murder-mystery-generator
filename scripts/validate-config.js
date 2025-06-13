#!/usr/bin/env node
/**
 * 設定検証スクリプト
 * デプロイ前の設定検証
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('⚙️ Configuration Validation');
console.log('='.repeat(30));

let validationErrors = [];
let validationWarnings = [];

function addError(message) {
  validationErrors.push(message);
  console.log(`❌ ERROR: ${message}`);
}

function addWarning(message) {
  validationWarnings.push(message);
  console.log(`⚠️ WARNING: ${message}`);
}

function addSuccess(message) {
  console.log(`✅ ${message}`);
}

// 環境変数検証
function validateEnvironmentVariables() {
  console.log('\n🌍 Environment Variables');
  
  const requiredVars = ['GROQ_API_KEY'];
  const optionalVars = ['NODE_ENV', 'NETLIFY', 'BUILD_ID'];
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      addSuccess(`Required variable ${varName} is set`);
      
      // API キーの形式検証
      if (varName === 'GROQ_API_KEY') {
        const apiKey = process.env[varName];
        if (apiKey.length < 20) {
          addWarning(`${varName} seems too short, please verify`);
        } else if (apiKey.startsWith('gsk_')) {
          addSuccess(`${varName} has valid format`);
        } else {
          addWarning(`${varName} format may be incorrect`);
        }
      }
    } else {
      addError(`Required environment variable ${varName} is not set`);
    }
  });
  
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      addSuccess(`Optional variable ${varName} is set: ${process.env[varName]}`);
    }
  });
}

// Netlify設定検証
function validateNetlifyConfig() {
  console.log('\n📡 Netlify Configuration');
  
  const netlifyTomlPath = path.join(projectRoot, 'netlify.toml');
  
  if (!fs.existsSync(netlifyTomlPath)) {
    addError('netlify.toml file not found');
    return;
  }
  
  try {
    const content = fs.readFileSync(netlifyTomlPath, 'utf8');
    
    // ビルド設定
    if (content.includes('[build]')) {
      addSuccess('Build configuration found');
      
      if (content.includes('publish = "public"')) {
        addSuccess('Publish directory correctly set to "public"');
      } else {
        addWarning('Publish directory may not be set correctly');
      }
    } else {
      addError('Missing [build] configuration');
    }
    
    // Functions設定
    if (content.includes('[functions]')) {
      addSuccess('Functions configuration found');
      
      if (content.includes('directory = "api"')) {
        addSuccess('Functions directory correctly set to "api"');
      } else {
        addWarning('Functions directory may not be set correctly');
      }
    } else {
      addError('Missing [functions] configuration');
    }
    
    // セキュリティヘッダー
    if (content.includes('[[headers]]')) {
      addSuccess('Security headers configuration found');
      
      const securityHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options', 
        'Content-Security-Policy',
        'Strict-Transport-Security'
      ];
      
      securityHeaders.forEach(header => {
        if (content.includes(header)) {
          addSuccess(`Security header ${header} configured`);
        } else {
          addWarning(`Security header ${header} not found`);
        }
      });
    } else {
      addWarning('No security headers configuration found');
    }
    
    // リダイレクト設定
    if (content.includes('[[redirects]]')) {
      addSuccess('Redirects configuration found');
      
      if (content.includes('/api/*')) {
        addSuccess('API redirects configured');
      } else {
        addError('API redirects not configured');
      }
    } else {
      addError('Missing redirects configuration');
    }
    
  } catch (error) {
    addError(`Error reading netlify.toml: ${error.message}`);
  }
}

// API設定検証
function validateAPIConfiguration() {
  console.log('\n🔌 API Configuration');
  
  const apiDir = path.join(projectRoot, 'api');
  
  if (!fs.existsSync(apiDir)) {
    addError('API directory not found');
    return;
  }
  
  // 必須APIファイル
  const requiredAPIFiles = [
    'phase1-concept.js',
    'security-utils.js'
  ];
  
  requiredAPIFiles.forEach(fileName => {
    const filePath = path.join(apiDir, fileName);
    if (fs.existsSync(filePath)) {
      addSuccess(`API file ${fileName} exists`);
      
      // ファイル内容の基本検証
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('export default')) {
        addSuccess(`${fileName} has default export`);
      } else {
        addError(`${fileName} missing default export`);
      }
      
      if (fileName === 'security-utils.js') {
        const securityFunctions = [
          'validateAndSanitizeInput',
          'checkRateLimit',
          'setSecurityHeaders'
        ];
        
        securityFunctions.forEach(funcName => {
          if (content.includes(funcName)) {
            addSuccess(`Security function ${funcName} found`);
          } else {
            addError(`Security function ${funcName} missing`);
          }
        });
      }
      
    } else {
      addError(`Required API file ${fileName} not found`);
    }
  });
}

// フロントエンド設定検証
function validateFrontendConfiguration() {
  console.log('\n🖥️ Frontend Configuration');
  
  // HTML ファイル
  const indexPath = path.join(projectRoot, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    addSuccess('index.html exists');
    
    const content = fs.readFileSync(indexPath, 'utf8');
    
    if (content.includes('optimized-production.css')) {
      addSuccess('Production CSS linked');
    } else {
      addWarning('Production CSS may not be linked');
    }
    
    if (content.includes('viewport')) {
      addSuccess('Viewport meta tag found');
    } else {
      addWarning('Viewport meta tag missing');
    }
    
  } else {
    addError('index.html not found');
  }
  
  // CSS ファイル
  const cssPath = path.join(projectRoot, 'public', 'optimized-production.css');
  if (fs.existsSync(cssPath)) {
    addSuccess('Production CSS file exists');
    
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    if (cssContent.includes('@media')) {
      addSuccess('Responsive design rules found');
    } else {
      addWarning('Responsive design may not be implemented');
    }
    
    if (cssContent.includes('prefers-color-scheme')) {
      addSuccess('Dark mode support found');
    } else {
      addWarning('Dark mode support may be missing');
    }
    
  } else {
    addError('Production CSS file not found');
  }
  
  // JavaScript ファイル
  const jsFiles = [
    'public/js/main.js',
    'public/js/UltraMurderMysteryApp.js',
    'public/js/core/UIMessages.js'
  ];
  
  jsFiles.forEach(jsFile => {
    const jsPath = path.join(projectRoot, jsFile);
    if (fs.existsSync(jsPath)) {
      addSuccess(`JavaScript file ${jsFile} exists`);
    } else {
      addError(`JavaScript file ${jsFile} not found`);
    }
  });
}

// セキュリティ設定検証
function validateSecurityConfiguration() {
  console.log('\n🔒 Security Configuration');
  
  // セキュリティユーティリティ
  const securityUtilsPath = path.join(projectRoot, 'api', 'security-utils.js');
  
  if (fs.existsSync(securityUtilsPath)) {
    const content = fs.readFileSync(securityUtilsPath, 'utf8');
    
    const securityFeatures = [
      { name: 'Rate Limiting', pattern: /checkRateLimit|rateLimitStore/i },
      { name: 'Input Validation', pattern: /validateAndSanitizeInput|sanitize/i },
      { name: 'Security Headers', pattern: /setSecurityHeaders|X-Frame-Options/i },
      { name: 'Error Handling', pattern: /createErrorResponse|handleSecureError/i },
      { name: 'CORS Configuration', pattern: /Access-Control-Allow-Origin/i }
    ];
    
    securityFeatures.forEach(feature => {
      if (feature.pattern.test(content)) {
        addSuccess(`${feature.name} implemented`);
      } else {
        addWarning(`${feature.name} may not be implemented`);
      }
    });
    
  } else {
    addError('Security utilities not found');
  }
}

// パフォーマンス設定検証
function validatePerformanceConfiguration() {
  console.log('\n⚡ Performance Configuration');
  
  // CSS最適化チェック
  const cssPath = path.join(projectRoot, 'public', 'optimized-production.css');
  if (fs.existsSync(cssPath)) {
    const stats = fs.statSync(cssPath);
    const sizeKB = Math.round(stats.size / 1024);
    
    if (sizeKB < 100) {
      addSuccess(`CSS file size is optimal: ${sizeKB}KB`);
    } else if (sizeKB < 200) {
      addWarning(`CSS file size is acceptable: ${sizeKB}KB`);
    } else {
      addWarning(`CSS file size is large: ${sizeKB}KB - consider optimization`);
    }
  }
  
  // JavaScript最適化チェック
  const jsPath = path.join(projectRoot, 'public', 'js', 'UltraMurderMysteryApp.js');
  if (fs.existsSync(jsPath)) {
    const content = fs.readFileSync(jsPath, 'utf8');
    
    // console.log の残存チェック
    const consoleMatches = content.match(/console\.(log|debug|info)/g);
    if (!consoleMatches || consoleMatches.length === 0) {
      addSuccess('Console statements optimized for production');
    } else {
      addWarning(`Found ${consoleMatches.length} console statements that could be removed`);
    }
  }
}

// 結果サマリー
function printValidationSummary() {
  console.log('\n' + '='.repeat(30));
  console.log('📊 Validation Summary');
  console.log('='.repeat(30));
  
  if (validationErrors.length === 0 && validationWarnings.length === 0) {
    console.log('🎉 All configurations are valid!');
    console.log('✅ Ready for production deployment');
    return true;
  }
  
  if (validationErrors.length > 0) {
    console.log(`\n🚨 ${validationErrors.length} Error(s) found:`);
    validationErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  if (validationWarnings.length > 0) {
    console.log(`\n⚠️ ${validationWarnings.length} Warning(s) found:`);
    validationWarnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
  }
  
  if (validationErrors.length > 0) {
    console.log('\n❌ Please fix the errors before deploying to production');
    return false;
  } else {
    console.log('\n✅ Configuration is valid with minor warnings');
    console.log('💡 Consider addressing warnings for optimal performance');
    return true;
  }
}

// メイン実行
async function main() {
  try {
    validateEnvironmentVariables();
    validateNetlifyConfig();
    validateAPIConfiguration();
    validateFrontendConfiguration();
    validateSecurityConfiguration();
    validatePerformanceConfiguration();
    
    const isValid = printValidationSummary();
    
    if (!isValid) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    process.exit(1);
  }
}

main();