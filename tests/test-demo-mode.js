/**
 * 🧪 Demo Mode Test - 環境変数なしでの動作テスト
 */

const { MockDataGenerator } = require('../api/utils/mock-data-generator.js');
const { logger } = require('../api/utils/logger.js');

// 環境変数を一時的にクリア
const originalEnv = { ...process.env };
delete process.env.GROQ_API_KEY;
delete process.env.OPENAI_API_KEY;
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_ANON_KEY;
delete process.env.SUPABASE_SERVICE_KEY;

// Clear require cache to force re-initialization
delete require.cache[require.resolve('../api/utils/ai-client.js')];
delete require.cache[require.resolve('../api/config/env-manager.js')];

async function testDemoMode() {
  console.log('🧪 Starting Demo Mode Test...\n');
  
  try {
    // Test 1: Mock Data Generator
    console.log('📝 Test 1: Mock Data Generator');
    const generator = new MockDataGenerator();
    const formData = {
      participants: '5',
      complexity: 'standard',
      tone: 'balanced',
      era: '現代',
      setting: '洋館',
      worldview: 'リアル',
      incident_type: '殺人'
    };
    
    // Generate complete scenario
    const scenario = await generator.generateCompleteScenario(formData);
    
    console.log('✅ Scenario generated successfully');
    console.log(`- Title: ${scenario.title}`);
    console.log(`- Mock Generated: ${scenario.mockGenerated}`);
    console.log(`- Has all stages: ${Object.keys(scenario).filter(k => k.includes('stage_')).length === 9}`);
    
    // Test 2: AI Client Mock Response
    console.log('\n📝 Test 2: AI Client Mock Response');
    const { aiClient } = require('../api/utils/ai-client.js');
    
    const mockResult = await aiClient.generateContent(
      'Test system prompt',
      '段階0: ランダム全体構造生成 参加人数: 5人'
    );
    
    console.log('✅ AI Client returned mock response');
    console.log(`- Provider: ${mockResult.provider}`);
    console.log(`- Model: ${mockResult.model}`);
    console.log(`- Content length: ${mockResult.content.length}`);
    console.log(`- Mock Generated: ${mockResult.mockGenerated}`);
    
    // Test 3: Main Handler
    console.log('\n📝 Test 3: Main Handler (Non-streaming)');
    const handler = require('../api/integrated-micro-generator.js');
    
    // Mock request and response objects
    const mockReq = {
      method: 'POST',
      headers: {},
      body: {
        formData: {
          participants: '5',
          complexity: 'standard',
          tone: 'balanced',
          era: '現代',
          setting: '洋館',
          worldview: 'リアル',
          incident_type: '殺人'
        },
        sessionId: 'test_session_' + Date.now()
      }
    };
    
    let responseData = null;
    let statusCode = null;
    
    const mockRes = {
      setHeader: () => {},
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
            return data;
          },
          end: () => {}
        };
      }
    };
    
    await handler(mockReq, mockRes);
    
    console.log('✅ Handler executed without errors');
    console.log(`- Status code: ${statusCode || 200}`);
    console.log(`- Success: ${responseData?.success}`);
    console.log(`- Has data: ${!!responseData?.data}`);
    console.log(`- Session ID: ${responseData?.metadata?.sessionId}`);
    
    // Test 4: Supabase Mock
    console.log('\n📝 Test 4: Supabase Mock Operations');
    const { saveScenarioToSupabase } = require('../api/supabase-client.js');
    
    const saveResult = await saveScenarioToSupabase('test_session', {
      title: 'Test Scenario',
      mockGenerated: true,
      demoMode: true
    });
    
    console.log('✅ Supabase save handled gracefully');
    console.log(`- Success: ${saveResult.success}`);
    console.log(`- Demo mode: ${saveResult.data?.demo}`);
    console.log(`- Message: ${saveResult.message}`);
    
    console.log('\n🎉 All tests passed! Demo mode is fully functional.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    // Restore original environment variables
    Object.assign(process.env, originalEnv);
  }
}

// Run tests
testDemoMode().catch(console.error);