/**
 * 🔧 環境変数ローダー - プロジェクト別環境設定管理
 * 複数プロジェクトの環境変数を効率的に管理
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

/**
 * 環境ファイルを読み込んで環境変数を設定
 */
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, 'utf8');
  const vars = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    
    // コメントや空行をスキップ
    if (!line || line.startsWith('#')) {
      return;
    }
    
    // KEY=VALUE形式をパース
    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) {
      return;
    }
    
    const key = line.substring(0, equalIndex).trim();
    const value = line.substring(equalIndex + 1).trim();
    
    // クォートを除去
    vars[key] = value.replace(/^["']|["']$/g, '');
  });
  
  return vars;
}

/**
 * プロジェクト別環境変数ローダー
 */
class ProjectEnvLoader {
  constructor() {
    this.loadedProjects = new Set();
    this.envCache = new Map();
  }

  /**
   * プロジェクトの環境変数を読み込み
   */
  loadProject(projectName) {
    if (this.loadedProjects.has(projectName)) {
      console.log(`🔧 Project ${projectName} already loaded`);
      return this.envCache.get(projectName);
    }

    console.log(`🔧 Loading environment for project: ${projectName}`);
    
    const envVars = {};
    
    // 1. 共通設定を読み込み
    const sharedPath = join(ROOT_DIR, 'env-configs', 'shared.env');
    Object.assign(envVars, loadEnvFile(sharedPath));
    
    // 2. プロジェクト固有設定を読み込み
    const projectPath = join(ROOT_DIR, 'env-configs', `${projectName}.env`);
    Object.assign(envVars, loadEnvFile(projectPath));
    
    // 3. 環境別設定を読み込み（NODE_ENVに基づく）
    const nodeEnv = process.env.NODE_ENV || 'development';
    const envPath = join(ROOT_DIR, `.env.${nodeEnv}`);
    Object.assign(envVars, loadEnvFile(envPath));
    
    // 4. ローカル設定を読み込み（最優先）
    const localPath = join(ROOT_DIR, '.env.local');
    Object.assign(envVars, loadEnvFile(localPath));
    
    // 5. 既存の環境変数を読み込み（最優先）
    const defaultPath = join(ROOT_DIR, '.env');
    Object.assign(envVars, loadEnvFile(defaultPath));
    
    // 6. 実際の環境変数で上書き（最優先）
    Object.keys(envVars).forEach(key => {
      if (process.env[key] !== undefined) {
        envVars[key] = process.env[key];
      }
    });
    
    // 環境変数を設定
    Object.assign(process.env, envVars);
    
    // キャッシュに保存
    this.envCache.set(projectName, envVars);
    this.loadedProjects.add(projectName);
    
    console.log(`✅ Loaded ${Object.keys(envVars).length} environment variables for ${projectName}`);
    return envVars;
  }

  /**
   * 複数プロジェクトを同時に読み込み
   */
  loadMultipleProjects(projectNames) {
    const results = {};
    
    projectNames.forEach(projectName => {
      results[projectName] = this.loadProject(projectName);
    });
    
    return results;
  }

  /**
   * 環境変数の状態を表示
   */
  displayStatus() {
    console.log('\n🔧 Environment Status:');
    console.log(`   Loaded Projects: ${Array.from(this.loadedProjects).join(', ')}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Total ENV vars: ${Object.keys(process.env).length}`);
    
    if (process.env.DEBUG_MODE === 'true') {
      console.log('\n🔍 Project Environment Variables:');
      this.envCache.forEach((vars, projectName) => {
        console.log(`\n   ${projectName}:`);
        Object.keys(vars).forEach(key => {
          const value = key.includes('KEY') || key.includes('SECRET') 
            ? `${vars[key].substring(0, 3)}***` 
            : vars[key];
          console.log(`     ${key}: ${value}`);
        });
      });
    }
  }

  /**
   * 特定のプロジェクトの環境変数を取得
   */
  getProjectEnv(projectName) {
    return this.envCache.get(projectName) || {};
  }

  /**
   * 環境変数の検証
   */
  validateProject(projectName, requiredVars) {
    const projectEnv = this.getProjectEnv(projectName);
    const missing = [];
    
    requiredVars.forEach(varName => {
      if (!projectEnv[varName] && !process.env[varName]) {
        missing.push(varName);
      }
    });
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables for ${projectName}: ${missing.join(', ')}`);
    }
    
    return true;
  }
}

// シングルトンインスタンス
const envLoader = new ProjectEnvLoader();

export { envLoader, ProjectEnvLoader };
export default envLoader;