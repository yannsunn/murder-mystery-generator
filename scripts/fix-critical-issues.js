#!/usr/bin/env node

/**
 * 🔧 Critical Issues Fix Script
 * Addresses the most critical issues found in the final analysis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('🔧 Starting critical issues fix...\n');

// 1. Create .env file if it doesn't exist
const envPath = path.join(projectRoot, '.env');
const envExamplePath = path.join(projectRoot, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('📋 Creating .env file from .env.example...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ .env file created. Please add your API keys.\n');
} else if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists.\n');
}

// 2. Check for required environment variables
console.log('🔍 Checking environment variables...');
const requiredVars = [
  'GROQ_API_KEY',
  'SUPABASE_URL', 
  'SUPABASE_ANON_KEY'
];

const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const missingVars = requiredVars.filter(varName => !envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your_`));

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n⚠️  Please update your .env file with actual values.\n');
} else {
  console.log('✅ All required environment variables are configured.\n');
}

// 3. Create ESLint configuration
const eslintConfig = {
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-var": "error",
    "prefer-const": "error"
  }
};

const eslintPath = path.join(projectRoot, '.eslintrc.json');
if (!fs.existsSync(eslintPath)) {
  console.log('📝 Creating ESLint configuration...');
  fs.writeFileSync(eslintPath, JSON.stringify(eslintConfig, null, 2));
  console.log('✅ ESLint configuration created.\n');
}

// 4. Add lint script to package.json
console.log('📦 Updating package.json scripts...');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.scripts.lint) {
  packageJson.scripts.lint = "eslint . --ext .js,.jsx --fix";
  packageJson.scripts["lint:check"] = "eslint . --ext .js,.jsx";
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Lint scripts added to package.json.\n');
}

// 5. Create production logger wrapper
const productionLoggerPath = path.join(projectRoot, 'api/utils/production-logger.js');
const productionLoggerContent = `/**
 * Production-safe logger wrapper
 */

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args) => !isProduction && console.log(...args),
  info: (...args) => !isProduction && console.info(...args),
  warn: (...args) => console.warn(...args), // Keep warnings in production
  error: (...args) => console.error(...args), // Keep errors in production
  debug: (...args) => !isProduction && console.log('[DEBUG]', ...args)
};

export default logger;
`;

if (!fs.existsSync(productionLoggerPath)) {
  console.log('📝 Creating production-safe logger...');
  fs.writeFileSync(productionLoggerPath, productionLoggerContent);
  console.log('✅ Production logger created.\n');
}

// 6. Summary
console.log('📊 Fix Summary:');
console.log('================');
console.log('✅ Environment file setup');
console.log('✅ ESLint configuration added');
console.log('✅ Lint scripts added to package.json');
console.log('✅ Production logger wrapper created');

console.log('\n🎯 Next Steps:');
console.log('1. Add your API keys to .env file');
console.log('2. Run: npm install --save-dev eslint');
console.log('3. Run: npm run lint to check code');
console.log('4. Replace console.log with production logger in code');

console.log('\n✨ Critical issues fix script completed!');