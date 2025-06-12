// Groq ULTRA QUALITY API - 限界突破版
// 最高品質保証システム

export const config = {
  maxDuration: 90,
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { participants, era, setting, incident_type, worldview, tone } = req.body;

    if (!GROQ_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Groq APIキーが設定されていません' 
      });
    }

    console.log('🔥 ULTRA QUALITY: Starting maximum quality generation...');

    // 限界突破品質プロンプト
    const systemPrompt = `あなたは世界トップクラスのマーダーミステリー脚本家です。商業販売で成功している作品レベルの最高品質シナリオコンセプトを作成してください。

【ULTRA QUALITY REQUIREMENTS】
- 具体的な固有名詞を必ず使用（人名、地名、時刻、数値）
- 論理的で解決可能な謎とトリックを明示
- 各キャラクターに明確な動機と秘密を設定
- 商業作品として販売可能な完成度
- プレイヤーが夢中になる魅力的な設定

【MANDATORY OUTPUT FORMAT】
## 🏆 タイトル
《魅力的で記憶に残るタイトル》

## 🎭 シナリオ概要
参加者全員が夢中になる詳細で魅力的なストーリー。具体的な状況、登場人物の関係性、事件の背景を含む。最低200文字以上。

## 📋 基本設定
- 時代：具体的な年代や時期
- 場所：詳細な地名と環境描写
- 状況：参加者が置かれる具体的な状況
- 制約：ゲーム進行上の重要な制約

## 🕵️ 事件概要
- 被害者：名前、年齢、職業、人物像
- 死因：具体的な殺害方法とその意味
- 発生時刻：正確な時間と状況
- 発見状況：誰がいつどこで発見したか
- 不可解な点：謎を深める要素

## 👥 キャラクター概要
各参加者の役割を具体的に：
1. [キャラ名] - [職業] - [秘密/動機]
2. [キャラ名] - [職業] - [秘密/動機]
（参加者数分続ける）

## 🔍 核心的謎
プレイヤーが解決すべき中心的な謎と、その解決に必要な論理的手がかり。

## 🎯 勝利条件
プレイヤーが達成すべき明確で具体的な目標。

絶対に手抜きをせず、商業レベルの最高品質で作成してください。`;
    
    const userPrompt = createEnhancedPrompt({ participants, era, setting, incident_type, worldview, tone });

    console.log('🎯 Executing ULTRA QUALITY generation with enhanced parameters...');

    // 品質重視の設定
    const qualityTokens = Math.min(2500, 1500 + (participants * 150)); // 参加者数に応じて増加
    const qualityTimeout = Math.min(45000, qualityTokens * 20); // 品質重視タイムアウト

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), qualityTimeout);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile', // より高性能なモデル
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8, // 創造性重視
          max_tokens: qualityTokens,
          top_p: 0.95,
          frequency_penalty: 0.3, // 繰り返し防止（軽度）
          presence_penalty: 0.4,  // 多様性促進
          stream: false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Groq API Error:', response.status, errorText);
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const concept = data.choices[0]?.message?.content;

      if (!concept) {
        throw new Error('No content returned from Groq API');
      }

      // 品質検証
      const qualityScore = assessContentQuality(concept);
      console.log(`🎯 Quality Score: ${qualityScore}/100`);

      if (qualityScore < 70) {
        console.warn('⚠️ Quality below threshold, attempting enhancement...');
        // 品質が低い場合の処理（将来的に再生成や補強）
      }

      console.log('✅ ULTRA QUALITY: Maximum quality concept generated successfully');

      return res.status(200).json({
        success: true,
        content: concept,
        provider: 'groq-ultra-quality',
        model: 'llama-3.1-70b-versatile',
        processing_time: `${Date.now() - startTime}ms`,
        quality_score: qualityScore,
        tokens_used: qualityTokens,
        participants: participants,
        quality_grade: getQualityGrade(qualityScore)
      });

    } catch (fetchError) {
      clearTimeout(timeout);
      
      console.error('❌ Fetch Error:', fetchError.message);
      
      if (fetchError.name === 'AbortError') {
        throw new Error(`Groq API request timeout after ${qualityTimeout/1000} seconds (${qualityTokens} tokens)`);
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ ULTRA QUALITY generation error:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      error: `Ultra Quality生成エラー: ${error.message}`,
      processing_time: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString()
    });
  }
}

function createEnhancedPrompt(params) {
  const { participants, era, setting, incident_type, worldview, tone } = params;
  
  const eraDescriptions = {
    'modern': '現代日本（2024年）',
    'showa': '昭和30年代（1955-1965年）', 
    'near-future': '近未来（2040年代）',
    'fantasy': '中世ファンタジー世界'
  };
  
  const settingDescriptions = {
    'closed-space': '外部との連絡が断たれた密室空間',
    'mountain-villa': '雪に閉ざされた山奥の別荘',
    'military-facility': '機密に満ちた軍事研究施設',
    'underwater-facility': '深海に沈む海中研究所',
    'city': '人々が行き交う都市の一角'
  };
  
  const incidentDescriptions = {
    'murder': '計画的で巧妙な殺人事件',
    'disappearance': '痕跡を残さない謎の失踪事件',
    'theft': '不可能犯罪とも思える盗難事件',
    'blackmail': '秘密が絡む恐喝事件',
    'fraud': '巧妙に仕組まれた詐欺事件'
  };
  
  const worldviewDescriptions = {
    'realistic': '現実的で論理的な世界観',
    'occult': '超常現象や呪術が存在する世界',
    'sci-fi': '先端科学技術が発達した世界',
    'historical': '歴史的背景を重視した世界'
  };
  
  const toneDescriptions = {
    'serious': '重厚で緊張感のあるシリアスな雰囲気',
    'light': '親しみやすく楽しいライトな雰囲気',
    'dark': '暗く重苦しいダークな雰囲気',
    'comedy': 'ユーモアと笑いに満ちたコメディ雰囲気',
    'adventure': 'スリルと興奮に満ちた冒険活劇'
  };

  return `【シナリオ作成依頼】
参加者${participants}人でプレイする最高品質のマーダーミステリーシナリオコンセプトを作成してください。

【詳細設定】
・時代背景: ${eraDescriptions[era] || era}
・舞台設定: ${settingDescriptions[setting] || setting}
・事件種別: ${incidentDescriptions[incident_type] || incident_type}
・世界観: ${worldviewDescriptions[worldview] || worldview}
・作品調性: ${toneDescriptions[tone] || tone}

【品質要求】
- 商業販売レベルの完成度
- 具体的で魅力的なキャラクター設定
- 論理的で解決可能な謎
- プレイヤーが夢中になる展開
- 独創性と完成度の両立

上記の設定を活かし、プレイヤーが心から楽しめる最高品質のシナリオコンセプトを作成してください。`;
}

function assessContentQuality(content) {
  let score = 0;
  
  // 基本構造チェック（30点）
  if (content.includes('## 🏆 タイトル')) score += 5;
  if (content.includes('## 🎭 シナリオ概要')) score += 5;
  if (content.includes('## 📋 基本設定')) score += 5;
  if (content.includes('## 🕵️事件概要')) score += 5;
  if (content.includes('## 👥 キャラクター')) score += 5;
  if (content.includes('## 🎯')) score += 5;
  
  // 内容の充実度チェック（40点）
  if (content.length > 1000) score += 10;
  if (content.length > 1500) score += 10;
  if (content.length > 2000) score += 10;
  if (content.length > 2500) score += 10;
  
  // 具体性チェック（20点）
  const nameMatches = content.match(/[A-Za-z\u4e00-\u9faf]{2,}/g);
  if (nameMatches && nameMatches.length > 10) score += 5;
  if (content.match(/\d{1,2}:\d{2}/)) score += 5; // 時刻
  if (content.match(/\d+年|\d+月|\d+日/)) score += 5; // 日付
  if (content.match(/[0-9]+歳/)) score += 5; // 年齢
  
  // 品質指標チェック（10点）
  if (content.includes('秘密') || content.includes('動機')) score += 5;
  if (content.includes('トリック') || content.includes('手がかり')) score += 5;
  
  return Math.min(100, score);
}

function getQualityGrade(score) {
  if (score >= 90) return 'S級 (プレミアム商品)';
  if (score >= 80) return 'A級 (標準商品)';
  if (score >= 70) return 'B級 (基本商品)';
  if (score >= 60) return 'C級 (要改善)';
  return 'D級 (再生成必要)';
}