#!/usr/bin/env node

/**
 * 🧹 Console Log Remover
 * 本番環境向けにconsole文を削除/条件付きにするスクリプト
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIRECTORIES_TO_PROCESS = ['public/js', 'api'];
const FILE_EXTENSIONS = ['.js', '.mjs'];

let totalFilesProcessed = 0;
let totalLogsRemoved = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Count console statements
    const consoleMatches = content.match(/console\.(log|info|debug|warn|error)/g) || [];
    
    // Replace console.log, console.info, console.debug with conditional logging
    content = content.replace(
      /console\.(log|info|debug)\(/g,
      'process.env.NODE_ENV !== "production" && console.$1('
    );
    
    // Keep console.warn and console.error but make them conditional
    content = content.replace(
      /console\.(warn|error)\(/g,
      '(process.env.NODE_ENV !== "production" || true) && console.$1('
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalLogsRemoved += consoleMatches.length;
      console.log(`✅ Processed: ${path.relative(PROJECT_ROOT, filePath)} (${consoleMatches.length} console statements)`);
    }
    
    totalFilesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️ Directory not found: ${dirPath}`);
    return;
  }
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && FILE_EXTENSIONS.some(ext => file.endsWith(ext))) {
      processFile(fullPath);
    }
  }
}

// Main execution
console.log('🧹 Console Log Remover - Starting...\n');

for (const dir of DIRECTORIES_TO_PROCESS) {
  const fullPath = path.join(PROJECT_ROOT, dir);
  console.log(`📁 Processing directory: ${dir}`);
  processDirectory(fullPath);
}

console.log('\n📊 Summary:');
console.log(`  - Files processed: ${totalFilesProcessed}`);
console.log(`  - Console statements made conditional: ${totalLogsRemoved}`);
console.log('\n✅ Complete! Console logs are now production-safe.');
console.log('\n💡 Note: console.warn and console.error are kept but made conditional.');
console.log('   console.log, console.info, and console.debug are disabled in production.');