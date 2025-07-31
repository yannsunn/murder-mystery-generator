"use strict";
/**
 * 🚀 統一AI クライアント - TypeScript版
 * すべてのAI API呼び出しを一元管理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedAIClient = exports.AI_CONFIG = exports.aiClient = void 0;
const env_manager_1 = require("../config/env-manager");
// Logger import with fallback
let logger;
try {
    logger = require('./logger').logger;
}
catch (e) {
    // Fallback logger for development
    logger = {
        debug: console.log,
        info: console.log,
        warn: console.warn,
        error: console.error,
        success: console.log
    };
}
const AI_CONFIG = {
    maxDuration: 30,
    timeout: 25000,
    retries: 2
};
exports.AI_CONFIG = AI_CONFIG;
// サロゲートペア不正除去ユーティリティ
function removeInvalidSurrogates(str) {
    return typeof str === 'string'
        ? str.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
        : str;
}
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return removeInvalidSurrogates(obj);
    }
    else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    else if (typeof obj === 'object' && obj !== null) {
        const newObj = {};
        for (const key in obj) {
            newObj[key] = sanitizeObject(obj[key]);
        }
        return newObj;
    }
    return obj;
}
/**
 * 統一AIクライアント
 */
class UnifiedAIClient {
    groqKey = null;
    openaiKey = null;
    timeout;
    constructor() {
        // プロダクション環境での確実な初期化
        this.initializeEnvironment();
        // 設定値もenvManagerから取得
        this.timeout = this.groqKey || this.openaiKey ?
            (env_manager_1.envManager.get('MAX_GENERATION_TIME') || AI_CONFIG.timeout) :
            AI_CONFIG.timeout;
    }
    /**
     * 動的にAPIキーを設定してクライアントを作成
     */
    createClient(apiKey) {
        if (!apiKey) {
            throw new Error('API key is required');
        }
        // Groq APIキーかどうかを判定
        if (apiKey.startsWith('gsk_')) {
            try {
                const Groq = require('groq-sdk');
                return new Groq({
                    apiKey: apiKey,
                    timeout: this.timeout
                });
            }
            catch (error) {
                logger.error('Failed to create Groq client:', error);
                throw new Error('Failed to initialize Groq client. Please check your API key.');
            }
        }
        else {
            throw new Error('Unsupported API key format. Only GROQ keys (gsk_) are supported.');
        }
    }
    /**
     * 環境変数の確実な初期化
     */
    initializeEnvironment() {
        // 直接process.envから取得（最も確実）
        this.groqKey = process.env.GROQ_API_KEY || null;
        this.openaiKey = process.env.OPENAI_API_KEY || null;
        // envManagerを試してみる（フォールバック）
        if (!this.groqKey) {
            try {
                if (!env_manager_1.envManager.initialized) {
                    env_manager_1.envManager.initialize();
                }
                this.groqKey = env_manager_1.envManager.get('GROQ_API_KEY') || null;
                this.openaiKey = env_manager_1.envManager.get('OPENAI_API_KEY') || null;
            }
            catch (error) {
                logger.warn('EnvManager fallback failed:', error.message);
            }
        }
        // 最終確認とログ
        console.log('[AI-CLIENT] Environment Check:');
        console.log(`  GROQ: ${this.groqKey ? '✅ Length:' + this.groqKey.length : '❌ Missing'}`);
        console.log(`  OpenAI: ${this.openaiKey ? '✅ Configured' : '❌ Missing'}`);
        if (!this.groqKey && !this.openaiKey) {
            console.error('[AI-CLIENT] ❌ CRITICAL: No AI providers configured!');
            console.error('[AI-CLIENT] Please set GROQ_API_KEY in Vercel Environment Variables');
        }
        else {
            console.log('[AI-CLIENT] ✅ AI Client initialized successfully');
        }
    }
    /**
     * 統一API呼び出しメソッド（重複排除）
     */
    async makeAPICall(provider, systemPrompt, userPrompt, model) {
        const config = this.getProviderConfig(provider, model);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeout);
        try {
            const response = await fetch(config.url, {
                method: 'POST',
                headers: config.headers,
                body: JSON.stringify(sanitizeObject(config.payload(systemPrompt, userPrompt))),
                signal: controller.signal
            });
            if (!response.ok) {
                const errorText = await response.text();
                // エラーレスポンスをパースしてみる
                try {
                    const errorData = JSON.parse(errorText);
                    // GROQ特有のエラー処理
                    if (errorData.type === 'SYSTEM_FAILURE') {
                        const errorObj = {
                            id: errorData.id || 'SYSTEM_FAILURE',
                            type: 'SYSTEM_FAILURE',
                            message: errorData.message || 'システムに一時的な問題が発生しています。',
                            priority: 'CRITICAL',
                            retryable: errorData.retryable !== false,
                            retryAfter: errorData.retryAfter || null,
                            solution: 'GROQ APIキーがVercel環境変数に正しく設定されているか確認してください。',
                            timestamp: new Date().toISOString()
                        };
                        throw new Error(JSON.stringify(errorObj));
                    }
                    // その他の構造化エラー
                    if (errorData.error || errorData.message) {
                        throw new Error(`${provider} API エラー: ${errorData.error || errorData.message}`);
                    }
                }
                catch (parseError) {
                    // JSONパースに失敗した場合は元のエラーテキストを使用
                    if (parseError.message.includes('JSON')) {
                        // パースエラーの場合はスキップ
                    }
                    else {
                        // 意図的に投げたエラーは再スロー
                        throw parseError;
                    }
                }
                throw new Error(`${provider} API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            return this.extractContent(data, provider, model);
        }
        catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`${provider} API timeout after ${this.timeout}ms`);
            }
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    /**
     * プロバイダー設定取得
     */
    getProviderConfig(provider, model) {
        const configs = {
            groq: {
                url: 'https://api.groq.com/openai/v1/chat/completions',
                headers: {
                    'Authorization': `Bearer ${this.groqKey || ''}`,
                    'Content-Type': 'application/json',
                },
                payload: (systemPrompt, userPrompt) => ({
                    model: model || 'llama-3.1-8b-instant',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.8,
                    max_tokens: 1800,
                    top_p: 0.9,
                    frequency_penalty: 0.3,
                    presence_penalty: 0.4,
                    stream: false
                })
            },
            openai: {
                url: 'https://api.openai.com/v1/chat/completions',
                headers: {
                    'Authorization': `Bearer ${this.openaiKey || ''}`,
                    'Content-Type': 'application/json',
                },
                payload: (systemPrompt, userPrompt) => ({
                    model: model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.8,
                    max_tokens: 1800
                })
            }
        };
        if (!configs[provider]) {
            throw new Error(`Unsupported provider: ${provider}`);
        }
        if (provider === 'groq' && !this.groqKey) {
            throw new Error('GROQ_API_KEY is not configured');
        }
        if (provider === 'openai' && !this.openaiKey) {
            throw new Error('OPENAI_API_KEY is not configured');
        }
        return configs[provider];
    }
    /**
     * レスポンスからコンテンツ抽出
     */
    extractContent(data, provider, model) {
        const content = data.choices[0]?.message?.content;
        if (!content) {
            throw new Error(`No content returned from ${provider} API`);
        }
        return {
            success: true,
            content,
            provider,
            model,
            usage: data.usage
        };
    }
    /**
     * Groq API呼び出し（レガシー互換性のため）
     */
    async callGroq(systemPrompt, userPrompt, model = 'llama-3.1-8b-instant') {
        return this.makeAPICall('groq', systemPrompt, userPrompt, model);
    }
    /**
     * OpenAI API呼び出し（レガシー互換性のため）
     */
    async callOpenAI(systemPrompt, userPrompt, model = 'gpt-3.5-turbo') {
        return this.makeAPICall('openai', systemPrompt, userPrompt, model);
    }
    /**
     * フォールバック付きAI呼び出し - 環境変数チェック改善
     */
    async generateContent(systemPrompt, userPrompt, preferredProvider = 'groq') {
        // 利用可能なプロバイダーのみ使用
        const availableProviders = [];
        if (this.groqKey) {
            availableProviders.push('groq');
        }
        if (this.openaiKey) {
            availableProviders.push('openai');
        }
        if (availableProviders.length === 0) {
            throw new Error('AIプロバイダーが設定されていません。APIキーを確認してください。');
        }
        // 優先順位を設定
        const providers = preferredProvider === 'groq' && availableProviders.includes('groq')
            ? availableProviders
            : availableProviders.reverse();
        let lastError = null;
        for (const provider of providers) {
            try {
                logger.debug(`🤖 Trying ${provider.toUpperCase()} provider...`);
                return await this.makeAPICall(provider, systemPrompt, userPrompt);
            }
            catch (error) {
                logger.warn(`❌ ${provider.toUpperCase()} failed:`, error.message);
                lastError = error;
                continue;
            }
        }
        throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
    }
    /**
     * リトライ機能付きAI呼び出し
     */
    async generateWithRetry(systemPrompt, userPrompt, options = {}) {
        const { preferredProvider = 'groq', maxRetries = AI_CONFIG.retries, retryDelay = 1000, apiKey = null } = options;
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (apiKey) {
                    // 動的APIキーを使用
                    return await this.generateContentWithKey(systemPrompt, userPrompt, apiKey);
                }
                else {
                    // 従来の方式
                    return await this.generateContent(systemPrompt, userPrompt, preferredProvider);
                }
            }
            catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    logger.warn(`Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms:`, error.message);
                    await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
                }
            }
        }
        throw new Error(`Failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message}`);
    }
    /**
     * 動的APIキーを使用してコンテンツ生成
     */
    async generateContentWithKey(systemPrompt, userPrompt, apiKey) {
        const client = this.createClient(apiKey);
        const response = await client.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: 'llama3-8b-8192',
            max_tokens: 4000,
            temperature: 0.7
        });
        if (!response?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response from AI service');
        }
        return sanitizeObject({
            success: true,
            content: response.choices[0].message.content,
            usage: response.usage
        });
    }
    /**
     * プロンプトからフォームデータを抽出
     */
    extractFormDataFromPrompt(prompt) {
        const formData = {
            participants: '5',
            complexity: 'standard',
            tone: 'balanced',
            era: '現代',
            setting: '洋館',
            worldview: 'リアル',
            incident_type: '殺人'
        };
        // 参加人数を抽出
        const participantsMatch = prompt.match(/参加人数:\s*(\d+)人/);
        if (participantsMatch && participantsMatch[1]) {
            formData.participants = participantsMatch[1];
        }
        // 複雑さを抽出
        if (prompt.includes('simple') || prompt.includes('シンプル')) {
            formData.complexity = 'simple';
        }
        else if (prompt.includes('complex') || prompt.includes('複雑')) {
            formData.complexity = 'complex';
        }
        // トーンを抽出
        if (prompt.includes('serious') || prompt.includes('シリアス')) {
            formData.tone = 'serious';
        }
        else if (prompt.includes('comedic') || prompt.includes('コメディ')) {
            formData.tone = 'comedic';
        }
        return formData;
    }
}
exports.UnifiedAIClient = UnifiedAIClient;
// シングルトンインスタンス
exports.aiClient = new UnifiedAIClient();
// 後方互換性のためのCommonJS形式エクスポート
module.exports = {
    AI_CONFIG,
    aiClient: exports.aiClient,
    UnifiedAIClient
};
//# sourceMappingURL=ai-client.js.map