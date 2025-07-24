/**
 * APIキー検証エンドポイント
 * フロントエンドからのAPIキー検証リクエストを処理
 */

const { aiClient } = require('./utils/ai-client.js');
const { logger } = require('./utils/logger.js');
const { withSecurity } = require('./security-utils.js');

/**
 * APIキーの検証を行う
 */
async function validateApiKey(req, res) {
  try {
    const { apiKey } = req.body;

    // APIキーの基本形式チェック
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'APIキーが提供されていません'
      });
    }

    // GROQキーの形式チェック
    if (!apiKey.startsWith('gsk_')) {
      return res.status(400).json({
        success: false,
        error: 'GROQ APIキーの形式が正しくありません（gsk_で始まる必要があります）'
      });
    }

    // 実際のAPI呼び出しテスト
    const testClient = aiClient.createClient(apiKey);
    
    try {
      // 簡単なテストリクエストを送信
      const testResponse = await testClient.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: 'テスト'
          }
        ],
        model: 'llama3-8b-8192',
        max_tokens: 10,
        temperature: 0.5
      });

      if (testResponse && testResponse.choices && testResponse.choices.length > 0) {
        // 検証成功
        logger.info('API key validation successful');
        return res.status(200).json({
          success: true,
          message: 'APIキーの検証に成功しました',
          data: {
            model: 'llama3-8b-8192',
            status: 'active'
          }
        });
      } else {
        throw new Error('Invalid response from API');
      }

    } catch (apiError) {
      logger.warn('API key validation failed:', apiError.message);
      
      // APIエラーの種類に応じてメッセージを変更
      let errorMessage = 'APIキーの検証に失敗しました';
      
      if (apiError.message.includes('401') || apiError.message.includes('Unauthorized')) {
        errorMessage = 'APIキーが無効です。正しいキーを入力してください';
      } else if (apiError.message.includes('429') || apiError.message.includes('rate limit')) {
        errorMessage = 'API利用制限に達しています。しばらく待ってから再試行してください';
      } else if (apiError.message.includes('network') || apiError.message.includes('ENOTFOUND')) {
        errorMessage = 'ネットワークエラーが発生しました。接続を確認してください';
      }

      return res.status(400).json({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? apiError.message : undefined
      });
    }

  } catch (error) {
    logger.error('API key validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました。しばらく待ってから再試行してください'
    });
  }
}

/**
 * セキュリティ付きハンドラー
 */
const handler = withSecurity(validateApiKey, 'api-validation');

module.exports = handler;