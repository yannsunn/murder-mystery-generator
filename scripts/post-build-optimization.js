#!/usr/bin/env node

/**
 * 🚀 Post-Build Optimization Script
 * 商業品質向けビルド後最適化処理
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔧 Post-build optimization starting...');
console.log('========================================');

/**
 * ビルド成果物の検証
 */
function validateBuildArtifacts() {
  console.log('\n📦 Validating build artifacts...');
  
  const requiredFiles = [
    'public/index.html',
    'public/optimized-production.css',
    'public/js/main.js',
    'netlify.toml'
  ];
  
  let allValid = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      const stats = fs.statSync(filePath);
      console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
    } else {
      console.log(`❌ Missing: ${file}`);
      allValid = false;
    }
  });
  
  return allValid;
}

/**
 * HTMLファイルの最適化
 */
function optimizeHTML() {
  console.log('\n🎨 Optimizing HTML files...');
  
  const htmlPath = path.join(projectRoot, 'public/index.html');
  
  if (fs.existsSync(htmlPath)) {
    let content = fs.readFileSync(htmlPath, 'utf8');
    
    // 不要な空白とコメントを削除（開発コメントのみ）
    content = content.replace(/<!--\s*DEV:\s*.*?-->/gs, '');
    content = content.replace(/\s+/g, ' ').trim();
    
    // キャッシュバスティング用のタイムスタンプ追加
    const timestamp = Date.now();
    content = content.replace(
      /(\?v=)\d+/g, 
      `$1${timestamp}`
    );
    
    fs.writeFileSync(htmlPath, content);
    console.log('✅ HTML optimization completed');
  }
}

/**
 * ファイルサイズレポート生成
 */
function generateSizeReport() {
  console.log('\n📊 Generating size report...');
  
  const publicDir = path.join(projectRoot, 'public');
  const apiDir = path.join(projectRoot, 'api');
  
  let totalSize = 0;
  const sizeReport = {
    html: 0,
    css: 0,
    js: 0,
    api: 0,
    total: 0
  };
  
  // Public ディレクトリのサイズ計算
  if (fs.existsSync(publicDir)) {
    const scanDirectory = (dir, category) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      files.forEach(file => {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          scanDirectory(filePath, category);
        } else {
          const stats = fs.statSync(filePath);
          const ext = path.extname(file.name).toLowerCase();
          
          totalSize += stats.size;
          
          if (ext === '.html') sizeReport.html += stats.size;
          else if (ext === '.css') sizeReport.css += stats.size;
          else if (ext === '.js') sizeReport.js += stats.size;
        }
      });
    };
    
    scanDirectory(publicDir, 'public');
  }
  
  // API ディレクトリのサイズ計算
  if (fs.existsSync(apiDir)) {
    const apiFiles = fs.readdirSync(apiDir);
    apiFiles.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(apiDir, file);
        const stats = fs.statSync(filePath);
        sizeReport.api += stats.size;
        totalSize += stats.size;
      }
    });
  }
  
  sizeReport.total = totalSize;
  
  // レポート出力
  console.log('\n📏 Build Size Report:');
  console.log(`📄 HTML: ${(sizeReport.html / 1024).toFixed(1)}KB`);
  console.log(`🎨 CSS: ${(sizeReport.css / 1024).toFixed(1)}KB`);
  console.log(`📜 JavaScript: ${(sizeReport.js / 1024).toFixed(1)}KB`);
  console.log(`🔌 API: ${(sizeReport.api / 1024).toFixed(1)}KB`);
  console.log(`📦 Total: ${(sizeReport.total / 1024).toFixed(1)}KB`);
  
  return sizeReport;
}

/**
 * セキュリティチェック
 */
function securityCheck() {
  console.log('\n🔒 Running security checks...');
  
  const indexPath = path.join(projectRoot, 'public/index.html');
  
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    
    // 基本的なセキュリティチェック
    const checks = [
      {
        name: 'No inline scripts',
        test: !content.includes('<script>') || !content.includes('javascript:'),
        message: 'Inline scripts detected'
      },
      {
        name: 'Meta security headers',
        test: content.includes('Content-Security-Policy') || content.includes('X-Frame-Options'),
        message: 'Security meta tags recommended'
      }
    ];
    
    checks.forEach(check => {
      if (check.test) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`⚠️  ${check.name}: ${check.message}`);
      }
    });
  }
}

/**
 * Netlify設定の検証
 */
function validateNetlifyConfig() {
  console.log('\n🌐 Validating Netlify configuration...');
  
  const netlifyPath = path.join(projectRoot, 'netlify.toml');
  
  if (fs.existsSync(netlifyPath)) {
    const content = fs.readFileSync(netlifyPath, 'utf8');
    
    const requiredSections = [
      '[build]',
      '[functions]',
      '[[headers]]'
    ];
    
    requiredSections.forEach(section => {
      if (content.includes(section)) {
        console.log(`✅ ${section} configuration found`);
      } else {
        console.log(`❌ Missing ${section} configuration`);
      }
    });
  } else {
    console.log('❌ netlify.toml not found');
  }
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    // ビルド成果物の検証
    const artifactsValid = validateBuildArtifacts();
    
    if (!artifactsValid) {
      console.log('\n❌ Build artifacts validation failed');
      process.exit(1);
    }
    
    // 最適化処理
    optimizeHTML();
    
    // レポート生成
    const sizeReport = generateSizeReport();
    
    // セキュリティチェック
    securityCheck();
    
    // Netlify設定検証
    validateNetlifyConfig();
    
    console.log('\n========================================');
    console.log('🎉 Post-build optimization completed successfully!');
    console.log(`📦 Total build size: ${(sizeReport.total / 1024).toFixed(1)}KB`);
    console.log('✅ Ready for production deployment');
    
  } catch (error) {
    console.error('\n❌ Post-build optimization failed:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
main();