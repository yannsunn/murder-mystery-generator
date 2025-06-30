/**
 * 🔬 Micro Generation System - 超細分化生成システム
 * 各要素を最小単位まで分解して段階的に生成
 */

import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 30, // 30秒の短時間実行
};

/**
 * マイクロタスク定義 - 各生成単位を最小化
 */
export const MICRO_TASKS = {
  // フェーズ1を5つのマイクロタスクに分解
  'phase1_title': {
    name: '作品タイトル生成',
    estimatedTime: 5,
    dependencies: [],
    handler: async (formData, context) => {
      const prompt = `
設定: ${formData.participants}人用、${formData.era}時代、${formData.setting}舞台、${formData.incident_type}
魅力的なマーダーミステリーのタイトルを1つ生成してください（20文字以内）。
`;
      const result = await aiClient.generateWithRetry(
        'プロのミステリー作家として',
        prompt,
        { maxRetries: 1 }
      );
      return { title: result.content.trim() };
    }
  },
  
  'phase1_concept': {
    name: '基本コンセプト生成',
    estimatedTime: 8,
    dependencies: ['phase1_title'],
    handler: async (formData, context) => {
      const title = context.phase1_title?.title || '';
      const prompt = `
タイトル「${title}」のマーダーミステリーの基本コンセプトを100文字程度で生成してください。
設定: ${formData.worldview}世界観、${formData.tone}トーン
`;
      const result = await aiClient.generateWithRetry(
        '創造的なコンセプトデザイナーとして',
        prompt,
        { maxRetries: 1 }
      );
      return { concept: result.content };
    }
  },
  
  'phase1_worldview': {
    name: '世界観詳細生成',
    estimatedTime: 10,
    dependencies: ['phase1_concept'],
    handler: async (formData, context) => {
      const concept = context.phase1_concept?.concept || '';
      const prompt = `
コンセプト: ${concept}
このコンセプトに基づく詳細な世界観を150文字程度で描写してください。
時代: ${formData.era}、舞台: ${formData.setting}
`;
      const result = await aiClient.generateWithRetry(
        '世界観設定のスペシャリストとして',
        prompt,
        { maxRetries: 1 }
      );
      return { worldview: result.content };
    }
  },
  
  'phase1_setting': {
    name: '舞台詳細生成',
    estimatedTime: 8,
    dependencies: ['phase1_worldview'],
    handler: async (formData, context) => {
      const worldview = context.phase1_worldview?.worldview || '';
      const prompt = `
世界観: ${worldview}
具体的な舞台設定（建物、場所、雰囲気）を100文字程度で描写してください。
`;
      const result = await aiClient.generateWithRetry(
        '舞台設定デザイナーとして',
        prompt,
        { maxRetries: 1 }
      );
      return { setting: result.content };
    }
  },
  
  'phase1_plot': {
    name: '基本プロット生成',
    estimatedTime: 10,
    dependencies: ['phase1_setting'],
    handler: async (formData, context) => {
      const setting = context.phase1_setting?.setting || '';
      const prompt = `
舞台: ${setting}
事件種類: ${formData.incident_type}
基本的なストーリーの流れを150文字程度で生成してください。
`;
      const result = await aiClient.generateWithRetry(
        'プロットライターとして',
        prompt,
        { maxRetries: 1 }
      );
      return { plot: result.content };
    }
  },
  
  // フェーズ2: 各キャラクターを個別に生成
  ...generateCharacterTasks(8), // 最大8人分のタスクを動的生成
  
  // フェーズ3: 関係性を細分化
  'phase3_matrix': {
    name: '関係性マトリクス基礎',
    estimatedTime: 8,
    dependencies: ['phase2_complete'],
    handler: async (formData, context) => {
      const characters = collectCharacters(context);
      const prompt = `
キャラクター: ${characters.map(c => c.name).join(', ')}
基本的な関係性マトリクスを生成してください（各関係を1行で）。
`;
      const result = await aiClient.generateWithRetry(
        '人間関係の専門家として',
        prompt,
        { maxRetries: 1 }
      );
      return { matrix: result.content };
    }
  },
  
  // さらに続く...
};

/**
 * キャラクタータスクの動的生成
 */
function generateCharacterTasks(maxCharacters) {
  const tasks = {};
  for (let i = 1; i <= maxCharacters; i++) {
    tasks[`phase2_char${i}`] = {
      name: `キャラクター${i}生成`,
      estimatedTime: 5,
      dependencies: i === 1 ? ['phase1_plot'] : [`phase2_char${i-1}`],
      handler: async (formData, context) => {
        if (i > formData.participants) {
          return { skip: true };
        }
        
        const previousChars = collectCharacters(context, i-1);
        const prompt = `
既存キャラ: ${previousChars.map(c => c.name).join(', ')}
キャラクター${i}の詳細を生成:
- 名前（日本人名）
- 年齢・職業
- 特徴（50文字）
`;
        const result = await aiClient.generateWithRetry(
          'キャラクターデザイナーとして',
          prompt,
          { maxRetries: 1 }
        );
        return { character: parseCharacter(result.content) };
      }
    };
  }
  return tasks;
}

/**
 * マイクロタスク実行エンジン
 */
export async function executeMicroTask(taskId, formData, context) {
  const task = MICRO_TASKS[taskId];
  if (!task) {
    throw new AppError(`Unknown task: ${taskId}`, ErrorTypes.VALIDATION_ERROR);
  }
  
  // 依存関係チェック
  for (const dep of task.dependencies) {
    if (!context[dep] || context[dep].skip) {
      throw new AppError(`Missing dependency: ${dep}`, ErrorTypes.VALIDATION_ERROR);
    }
  }
  
  console.log(`🔬 Executing micro task: ${task.name}`);
  const startTime = Date.now();
  
  try {
    const result = await task.handler(formData, context);
    const executionTime = Date.now() - startTime;
    
    return {
      taskId,
      name: task.name,
      result,
      executionTime,
      status: 'completed'
    };
  } catch (error) {
    console.error(`❌ Micro task failed: ${taskId}`, error);
    throw error;
  }
}

/**
 * タスク依存関係の解決
 */
export function getNextTasks(completedTasks) {
  const completed = new Set(completedTasks);
  const available = [];
  
  for (const [taskId, task] of Object.entries(MICRO_TASKS)) {
    if (completed.has(taskId)) continue;
    
    const dependenciesMet = task.dependencies.every(dep => completed.has(dep));
    if (dependenciesMet) {
      available.push(taskId);
    }
  }
  
  return available;
}

/**
 * ヘルパー関数
 */
function collectCharacters(context, limit = Infinity) {
  const characters = [];
  for (let i = 1; i <= limit; i++) {
    const char = context[`phase2_char${i}`]?.character;
    if (char && !char.skip) {
      characters.push(char);
    }
  }
  return characters;
}

function parseCharacter(text) {
  // シンプルなパーサー実装
  const lines = text.split('\n');
  return {
    name: lines[0]?.replace(/^.*名前[:：]\s*/, '') || `キャラクター${Date.now()}`,
    age: lines[1]?.match(/\d+/)?.[0] || '30',
    occupation: lines[1]?.replace(/.*職業[:：]\s*/, '') || '会社員',
    feature: lines[2] || '謎めいた人物'
  };
}

/**
 * メインハンドラー
 */
export default withErrorHandler(async function handler(req, res) {
  console.log('🔬 Micro Generation System called');
  
  setSecurityHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    throw new AppError('Method not allowed', ErrorTypes.VALIDATION_ERROR);
  }
  
  const { action, taskId, formData, context = {}, sessionId } = req.body;
  
  switch (action) {
    case 'execute_task':
      // 単一タスクの実行
      const result = await executeMicroTask(taskId, formData, context);
      return res.status(200).json({
        success: true,
        result,
        nextTasks: getNextTasks([...Object.keys(context), taskId])
      });
      
    case 'get_next_tasks':
      // 次の実行可能タスクを取得
      const completedTasks = Object.keys(context);
      return res.status(200).json({
        success: true,
        nextTasks: getNextTasks(completedTasks),
        progress: {
          completed: completedTasks.length,
          total: Object.keys(MICRO_TASKS).length,
          percentage: Math.round((completedTasks.length / Object.keys(MICRO_TASKS).length) * 100)
        }
      });
      
    default:
      throw new AppError('Invalid action', ErrorTypes.VALIDATION_ERROR);
  }
}, 'micro-generation');