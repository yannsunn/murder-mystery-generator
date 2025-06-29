#!/usr/bin/env node
/**
 * 本番環境用ビルドスクリプト
 * 商業品質のデプロイメント準備
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🚀 Production Build Starting...');
console.log('='.repeat(50));

// ビルド設定
const BUILD_CONFIG = {
  minifyJS: true,
  minifyCSS: true,
  optimizeImages: false, // 画像最適化は手動で実装必要
  generateSourceMaps: false,
  enableCompression: true,
  removeComments: true,
  removeDebugCode: true
};

// 環境変数チェック（本番環境では警告のみ）
function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const requiredVars = ['GROQ_API_KEY'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing environment variables:', missingVars);
    console.log('💡 These should be set in your deployment configuration');
    // 本番ビルドでは環境変数不足でもビルドを継続
  } else {
    console.log('✅ Environment variables check passed');
  }
}

// ファイル最適化
function optimizeFiles() {
  console.log('🔧 Optimizing files...');
  
  // JavaScript最適化（基本的なminification）
  if (BUILD_CONFIG.minifyJS) {
    console.log('  📄 Optimizing JavaScript files...');
    optimizeJavaScriptFiles();
  }
  
  // CSS最適化
  if (BUILD_CONFIG.minifyCSS) {
    console.log('  🎨 Optimizing CSS files...');
    optimizeCSSFiles();
  }
  
  // 不要ファイルの削除
  cleanupFiles();
  
  console.log('✅ File optimization completed');
}

// JavaScript最適化
function optimizeJavaScriptFiles() {
  const jsFiles = [
    'public/js/MurderMysteryApp.js'
  ];
  
  jsFiles.forEach(filePath => {
    const fullPath = path.join(projectRoot, filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // 基本的な最適化
      if (BUILD_CONFIG.removeComments) {
        // 単行コメントの削除（但し、重要なコメントは保持）
        content = content.replace(/\/\/(?!\s*@|\s*TODO|\s*FIXME|\s*NOTE).*$/gm, '');
        
        // 複数行コメントの削除（但し、ライセンス等は保持）
        content = content.replace(/\/\*(?!\*\/|.*@license|.*@preserve)[\s\S]*?\*\//g, '');
      }
      
      if (BUILD_CONFIG.removeDebugCode) {
        // console.log等の削除（既に実装済み）
        content = content.replace(/console\.(log|debug|info|warn|error)\s*\([^)]*\)\s*;?/g, '');
      }
      
      // 不要な空行の削除
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      fs.writeFileSync(fullPath, content);
      console.log(`    ✓ Optimized ${filePath}`);
    }
  });
}

// CSS最適化
function optimizeCSSFiles() {
  const cssFile = 'public/ultra-modern-styles.css';
  const fullPath = path.join(projectRoot, cssFile);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // 基本的なCSS最適化
    if (BUILD_CONFIG.removeComments) {
      // CSSコメントの削除
      content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    }
    
    // 余分な空白の削除
    content = content.replace(/\s+/g, ' ');
    content = content.replace(/;\s*}/g, '}');
    content = content.replace(/\s*{\s*/g, '{');
    content = content.replace(/;\s*/g, ';');
    content = content.replace(/,\s*/g, ',');
    
    // 不要な空行の削除
    content = content.replace(/\n\s*\n\s*\n/g, '\n');
    
    fs.writeFileSync(fullPath, content);
    console.log(`    ✓ Optimized ${cssFile}`);
  }
}

// 不要ファイルの削除
function cleanupFiles() {
  console.log('  🧹 Cleaning up unnecessary files...');
  
  const filesToRemove = [
    '.env.example',
    'README.md.backup',
    'build-info.json.backup'
  ];
  
  filesToRemove.forEach(filePath => {
    const fullPath = path.join(projectRoot, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`    🗑️ Removed ${filePath}`);
    }
  });
}

// セキュリティチェック
function performSecurityCheck() {
  console.log('🔒 Performing security checks...');
  
  // APIキーの露出チェック
  const sensitivePatterns = [
    /GROQ_API_KEY\s*=\s*["'][^"']+["']/gi,
    /api[_-]?key\s*:\s*["'][^"']+["']/gi,
    /secret\s*:\s*["'][^"']+["']/gi,
    /password\s*:\s*["'][^"']+["']/gi,
    /token\s*:\s*["'][^"']+["']/gi
  ];
  
  const publicFiles = [
    'public/js/MurderMysteryApp.js',
    'public/index.html',
    'public/ultra-modern-styles.css'
  ];
  
  let securityIssues = [];
  
  publicFiles.forEach(filePath => {
    const fullPath = path.join(projectRoot, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      sensitivePatterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          securityIssues.push({
            file: filePath,
            pattern: index,
            matches: matches.length
          });
        }
      });
    }
  });
  
  if (securityIssues.length > 0) {
    console.error('🚨 Security issues found:');
    securityIssues.forEach(issue => {
      console.error(`  ❌ ${issue.file}: Found ${issue.matches} potential sensitive data exposure(s)`);
    });
    process.exit(1);
  }
  
  console.log('✅ Security check passed');
}

// ビルド情報の生成
function generateBuildInfo() {
  console.log('📋 Generating build information...');
  
  const buildInfo = {
    buildTime: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: 'production',
    features: {
      security: true,
      optimization: true,
      minification: BUILD_CONFIG.minifyJS && BUILD_CONFIG.minifyCSS,
      responsiveDesign: true,
      japaneseLocalization: true,
      errorHandling: true
    },
    dependencies: {
      jszip: true,
      pdfLib: true
    },
    buildConfig: BUILD_CONFIG
  };
  
  const buildInfoPath = path.join(projectRoot, 'public', 'build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  
  console.log('✅ Build information generated');
}

// メイン実行
async function main() {
  try {
    checkEnvironmentVariables();
    optimizeFiles();
    performSecurityCheck();
    generateBuildInfo();
    
    console.log('='.repeat(50));
    console.log('🎉 Production build completed successfully!');
    console.log('📦 Your application is ready for deployment');
    console.log('🚀 Run "npm run deploy" to deploy to production');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();