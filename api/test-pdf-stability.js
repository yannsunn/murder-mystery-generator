/**
 * PDF生成安定性テストエンドポイント
 */

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 PDF生成安定性テスト開始');
    
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // テスト用シナリオデータ
    const testScenarios = [
      {
        name: '小さなシナリオ',
        data: {
          content: 'テスト用の小さなシナリオです。',
          metadata: { participants: 3 }
        }
      },
      {
        name: '中程度のシナリオ',
        data: {
          content: 'A'.repeat(1000) + '\n' + 'B'.repeat(1000),
          phases: {
            phase1: { content: 'Phase 1 content' },
            phase2: { content: 'Phase 2 content' }
          },
          metadata: { participants: 5 }
        }
      },
      {
        name: '大きなシナリオ',
        data: {
          content: 'X'.repeat(5000) + '\n' + 'Y'.repeat(5000),
          phases: {
            phase1: { content: 'A'.repeat(2000) },
            phase2: { content: 'B'.repeat(2000) },
            phase3: { content: 'C'.repeat(2000) },
            phase4: { content: 'D'.repeat(2000) }
          },
          metadata: { participants: 8 }
        }
      }
    ];

    const results = [];

    // 各テストケースを実行
    for (const testCase of testScenarios) {
      const startTime = Date.now();
      
      try {
        console.log(`📝 テスト実行: ${testCase.name}`);
        
        const response = await fetch(`${baseUrl}/api/enhanced-pdf-generator`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            scenario: testCase.data,
            title: `テスト_${testCase.name}`
          })
        });

        const processingTime = Date.now() - startTime;
        
        if (response.ok) {
          const pdfBuffer = await response.arrayBuffer();
          
          results.push({
            test: testCase.name,
            status: '✅ 成功',
            processingTime: `${processingTime}ms`,
            pdfSize: `${pdfBuffer.byteLength} bytes`,
            success: true
          });
          
          console.log(`✅ ${testCase.name}: 成功 (${processingTime}ms, ${pdfBuffer.byteLength} bytes)`);
        } else {
          const errorData = await response.json();
          
          results.push({
            test: testCase.name,
            status: '❌ 失敗',
            processingTime: `${processingTime}ms`,
            error: errorData.error || 'Unknown error',
            success: false
          });
          
          console.log(`❌ ${testCase.name}: 失敗 - ${errorData.error}`);
        }
        
      } catch (error) {
        const processingTime = Date.now() - startTime;
        
        results.push({
          test: testCase.name,
          status: '💥 例外',
          processingTime: `${processingTime}ms`,
          error: error.message,
          success: false
        });
        
        console.error(`💥 ${testCase.name}: 例外 - ${error.message}`);
      }
    }

    // メモリ最適化テスト
    console.log('💾 メモリ最適化テスト');
    
    let memoryOptimizationResult = '不明';
    try {
      const memoryResponse = await fetch(`${baseUrl}/api/pdf-memory-optimizer`, {
        method: 'GET'
      });
      
      if (memoryResponse.ok) {
        memoryOptimizationResult = '✅ 利用可能';
      } else {
        memoryOptimizationResult = '⚠️ エラー';
      }
    } catch (error) {
      memoryOptimizationResult = '❌ 利用不可';
    }

    // 結果サマリー
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const successRate = Math.round((successCount / totalCount) * 100);
    
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: totalCount,
        successfulTests: successCount,
        failedTests: totalCount - successCount,
        successRate: `${successRate}%`,
        memoryOptimization: memoryOptimizationResult
      },
      detailedResults: results,
      recommendations: generateRecommendations(results)
    };

    console.log('🎉 PDF安定性テスト完了');
    console.log(`📊 成功率: ${successRate}% (${successCount}/${totalCount})`);

    return res.status(200).json(summary);

  } catch (error) {
    console.error('❌ テストエラー:', error);
    return res.status(500).json({
      success: false,
      error: `テスト実行エラー: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * テスト結果に基づく推奨事項を生成
 */
function generateRecommendations(results) {
  const recommendations = [];
  
  const failedTests = results.filter(r => !r.success);
  
  if (failedTests.length === 0) {
    recommendations.push('✅ 全てのテストが成功しました。PDF生成は安定しています。');
  } else {
    recommendations.push(`⚠️ ${failedTests.length}個のテストが失敗しました。`);
    
    // 大きなファイルでのエラー
    const largeFileFailed = failedTests.some(t => t.test.includes('大きな'));
    if (largeFileFailed) {
      recommendations.push('💾 大きなファイルの処理でエラーが発生しています。メモリ最適化を確認してください。');
    }
    
    // 処理時間の問題
    const slowTests = results.filter(r => {
      const time = parseInt(r.processingTime);
      return time > 30000; // 30秒以上
    });
    
    if (slowTests.length > 0) {
      recommendations.push('⏱️ 処理時間が長すぎるテストがあります。最適化を検討してください。');
    }
  }
  
  return recommendations;
}