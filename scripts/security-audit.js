#!/usr/bin/env node

/**
 * 🔐 Security Audit Script
 * 商業品質向けセキュリティ監査システム
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔐 Running security audit...');
console.log('========================================');

/**
 * ファイル内容のセキュリティスキャン
 */
function scanFileForSecrets(filePath, fileName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // 潜在的な秘密情報のパターン
    const secretPatterns = [
      {
        name: 'API Key',
        pattern: /api[_-]?key\s*[=:]\s*['"][^'"]{10,}['"]/gi,
        severity: 'HIGH'
      },
      {
        name: 'Secret Key',
        pattern: /secret[_-]?key\s*[=:]\s*['"][^'"]{10,}['"]/gi,
        severity: 'HIGH'
      },
      {
        name: 'Password',
        pattern: /password\s*[=:]\s*['"][^'"]{5,}['"]/gi,
        severity: 'HIGH'
      },
      {
        name: 'Token',
        pattern: /token\s*[=:]\s*['"][^'"]{20,}['"]/gi,
        severity: 'MEDIUM'
      },
      {
        name: 'Database URL',
        pattern: /(mongodb|mysql|postgres):\/\/[^\s'"]+/gi,
        severity: 'HIGH'
      }
    ];
    
    secretPatterns.forEach(({ name, pattern, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          type: 'SECRET',
          severity,
          message: `Potential ${name} found`,
          file: fileName,
          matches: matches.length
        });
      }
    });
    
    return issues;
  } catch (error) {
    return [{
      type: 'ERROR',
      severity: 'LOW',
      message: `Cannot read file: ${error.message}`,
      file: fileName
    }];
  }
}

/**
 * セキュリティヘッダーの検証
 */
function validateSecurityHeaders() {
  console.log('\n🛡️  Validating security headers...');
  
  const netlifyPath = path.join(projectRoot, 'netlify.toml');
  const issues = [];
  
  if (!fs.existsSync(netlifyPath)) {
    issues.push({
      type: 'CONFIG',
      severity: 'HIGH',
      message: 'netlify.toml not found',
      file: 'netlify.toml'
    });
    return issues;
  }
  
  const content = fs.readFileSync(netlifyPath, 'utf8');
  
  const requiredHeaders = [
    { name: 'X-Frame-Options', severity: 'HIGH' },
    { name: 'X-Content-Type-Options', severity: 'HIGH' },
    { name: 'Referrer-Policy', severity: 'MEDIUM' },
    { name: 'Content-Security-Policy', severity: 'HIGH' },
    { name: 'X-XSS-Protection', severity: 'MEDIUM' }
  ];
  
  requiredHeaders.forEach(({ name, severity }) => {
    if (!content.includes(name)) {
      issues.push({
        type: 'HEADER',
        severity,
        message: `Missing security header: ${name}`,
        file: 'netlify.toml'
      });
    } else {
      console.log(`✅ Security header found: ${name}`);
    }
  });
  
  return issues;
}

/**
 * API セキュリティの検証
 */
function validateAPITSecurity() {
  console.log('\n🔌 Validating API security...');
  
  const apiDir = path.join(projectRoot, 'api');
  const issues = [];
  
  if (!fs.existsSync(apiDir)) {
    issues.push({
      type: 'CONFIG',
      severity: 'HIGH',
      message: 'API directory not found',
      file: 'api/'
    });
    return issues;
  }
  
  const apiFiles = fs.readdirSync(apiDir)
    .filter(file => file.endsWith('.js'));
  
  apiFiles.forEach(file => {
    const filePath = path.join(apiDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // セキュリティ機能のチェック
    const securityChecks = [
      {
        name: 'Input validation',
        pattern: /(validate|sanitize|escape)/i,
        severity: 'HIGH'
      },
      {
        name: 'Error handling',
        pattern: /try\s*{[\s\S]*catch/i,
        severity: 'HIGH'
      },
      {
        name: 'Rate limiting',
        pattern: /(rate|limit|throttle)/i,
        severity: 'MEDIUM'
      }
    ];
    
    securityChecks.forEach(({ name, pattern, severity }) => {
      if (!pattern.test(content)) {
        issues.push({
          type: 'API_SECURITY',
          severity,
          message: `Missing ${name} in API endpoint`,
          file: file
        });
      }
    });
  });
  
  return issues;
}

/**
 * 依存関係のセキュリティチェック
 */
function validateDependencies() {
  console.log('\n📦 Validating dependencies...');
  
  const packagePath = path.join(projectRoot, 'package.json');
  const issues = [];
  
  if (!fs.existsSync(packagePath)) {
    issues.push({
      type: 'CONFIG',
      severity: 'HIGH',
      message: 'package.json not found',
      file: 'package.json'
    });
    return issues;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // 既知の脆弱性のある依存関係（例）
    const vulnerablePackages = [
      'lodash@4.17.20',  // 例：古いバージョンのlodash
      'axios@0.21.0'     // 例：古いバージョンのaxios
    ];
    
    Object.keys(dependencies).forEach(pkg => {
      const version = dependencies[pkg];
      const fullName = `${pkg}@${version}`;
      
      if (vulnerablePackages.includes(fullName)) {
        issues.push({
          type: 'DEPENDENCY',
          severity: 'HIGH',
          message: `Vulnerable package: ${fullName}`,
          file: 'package.json'
        });
      }
    });
    
    console.log(`✅ Checked ${Object.keys(dependencies).length} dependencies`);
    
  } catch (error) {
    issues.push({
      type: 'CONFIG',
      severity: 'HIGH',
      message: `Invalid package.json: ${error.message}`,
      file: 'package.json'
    });
  }
  
  return issues;
}

/**
 * ファイルシステムのセキュリティ監査
 */
function auditFileSystem() {
  console.log('\n📁 Auditing file system...');
  
  const issues = [];
  const sensitiveDirectories = ['public', 'api', 'scripts'];
  
  sensitiveDirectories.forEach(dir => {
    const dirPath = path.join(projectRoot, dir);
    
    if (fs.existsSync(dirPath)) {
      const scanDirectory = (currentPath, relativePath = '') => {
        const items = fs.readdirSync(currentPath, { withFileTypes: true });
        
        items.forEach(item => {
          const itemPath = path.join(currentPath, item.name);
          const relativeItemPath = path.join(relativePath, item.name);
          
          if (item.isDirectory()) {
            scanDirectory(itemPath, relativeItemPath);
          } else if (item.isFile()) {
            // ファイル内容のスキャン
            const fileIssues = scanFileForSecrets(itemPath, relativeItemPath);
            issues.push(...fileIssues);
            
            // ファイル権限のチェック（Unix系のみ）
            try {
              const stats = fs.statSync(itemPath);
              if (stats.mode & 0o002) { // world-writable
                issues.push({
                  type: 'PERMISSION',
                  severity: 'MEDIUM',
                  message: 'File is world-writable',
                  file: relativeItemPath
                });
              }
            } catch (error) {
              // Windows環境では権限チェックをスキップ
            }
          }
        });
      };
      
      scanDirectory(dirPath, dir);
    }
  });
  
  return issues;
}

/**
 * セキュリティレポートの生成
 */
function generateSecurityReport(allIssues) {
  console.log('\n========================================');
  console.log('🔐 Security Audit Report');
  console.log('========================================');
  
  const severityCounts = {
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };
  
  const issuesByType = {};
  
  allIssues.forEach(issue => {
    severityCounts[issue.severity]++;
    
    if (!issuesByType[issue.type]) {
      issuesByType[issue.type] = [];
    }
    issuesByType[issue.type].push(issue);
  });
  
  // 重要度別サマリー
  console.log('\n📊 Issues by Severity:');
  console.log(`🔴 HIGH: ${severityCounts.HIGH}`);
  console.log(`🟡 MEDIUM: ${severityCounts.MEDIUM}`);
  console.log(`🟢 LOW: ${severityCounts.LOW}`);
  
  // タイプ別詳細
  Object.keys(issuesByType).forEach(type => {
    console.log(`\n📋 ${type} Issues:`);
    issuesByType[type].forEach(issue => {
      const emoji = issue.severity === 'HIGH' ? '🔴' : issue.severity === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`  ${emoji} ${issue.message} (${issue.file})`);
    });
  });
  
  return {
    total: allIssues.length,
    high: severityCounts.HIGH,
    medium: severityCounts.MEDIUM,
    low: severityCounts.LOW
  };
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    const allIssues = [];
    
    // 各種セキュリティチェックの実行
    allIssues.push(...validateSecurityHeaders());
    allIssues.push(...validateAPITSecurity());
    allIssues.push(...validateDependencies());
    allIssues.push(...auditFileSystem());
    
    // レポート生成
    const summary = generateSecurityReport(allIssues);
    
    console.log('\n========================================');
    
    if (summary.high === 0 && summary.medium === 0) {
      console.log('✅ Security audit passed! No critical issues found.');
      process.exit(0);
    } else if (summary.high === 0) {
      console.log('⚠️  Security audit completed with minor issues.');
      process.exit(0);
    } else {
      console.log('❌ Security audit failed! Critical issues found.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Security audit failed:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
main();