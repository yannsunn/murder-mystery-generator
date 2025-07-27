/**
 * 🧪 Simple Demo Mode Test - 実際の使用ケースでのテスト
 */

const http = require('http');

async function testDemoMode() {
  console.log('🧪 Starting Simple Demo Mode Test...\n');
  
  try {
    // Test the actual API endpoint without API key
    console.log('📝 Testing API endpoint without API key...');
    
    const postData = JSON.stringify({
      formData: {
        participants: '5',
        complexity: 'standard',
        tone: 'balanced',
        era: '現代',
        setting: '洋館',
        worldview: 'リアル',
        incident_type: '殺人'
        // No apiKey field - simulating no API key scenario
      },
      sessionId: 'demo_test_' + Date.now()
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const result = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    
    console.log('\n✅ API Response:');
    console.log(`- Status: ${result.status}`);
    console.log(`- Success: ${result.data?.success}`);
    console.log(`- Has scenario data: ${!!result.data?.data}`);
    console.log(`- Demo mode: ${result.data?.data?.mockGenerated || result.data?.data?.demoMode}`);
    
    if (result.status === 200 && result.data?.success) {
      console.log('\n🎉 Demo mode works perfectly without environment variables!');
      console.log('\nScenario details:');
      console.log(`- Title: ${result.data.data.title || 'Generated'}`);
      console.log(`- Description: ${result.data.data.description || 'Demo scenario'}`);
      console.log(`- Mock generated: ${result.data.data.mockGenerated}`);
    } else {
      console.log('\n❌ Demo mode test failed');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\n💡 Make sure the server is running with:');
    console.log('   npm run dev');
  }
}

// Run test
testDemoMode().catch(console.error);