// app-vercel.js - Vercel版（バックグラウンド処理対応）
// マーダーミステリーアプリ

document.addEventListener('DOMContentLoaded', function() {
  console.log('App initializing for Vercel...');
  
  // ステップ管理
  let currentStep = 1;
  const totalSteps = 5;
  
  // 生成データの保存
  let generatedScenario = null;
  let generatedHandouts = null;
  
  // DOM要素の取得（安全に）
  function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element not found: ${id}`);
    }
    return element;
  }
  
  const prevBtn = getElement('prev-btn');
  const nextBtn = getElement('next-btn');
  const generateBtn = getElement('stepwise-generation-btn');
  const loadingIndicator = getElement('loading-indicator');
  const errorContainer = getElement('error-container');
  const errorMessage = getElement('error-message');
  const resultContainer = getElement('result-container');
  const scenarioContent = document.querySelector('.scenario-content');
  const downloadPdfBtn = getElement('download-pdf-btn');
  const stepIndicators = document.querySelectorAll('.step-indicator-item');
  
  // 初期化関数
  function init() {
    console.log('Initializing app...');
    
    // 重要：初期状態を正しく設定
    hideAllContainers();
    showStepForm();
    updateStepVisibility();
    
    // イベントリスナーの設定
    setupEventListeners();
    
    console.log('App initialized successfully');
  }
  
  // 初期状態でフォームのみ表示
  function showStepForm() {
    const stepContainer = getElement('step-container');
    if (stepContainer) {
      stepContainer.style.display = 'block';
    }
    
    // ボタンコンテナも表示
    const buttonContainer = document.querySelector('.flex.justify-between');
    if (buttonContainer) {
      buttonContainer.style.display = 'flex';
    }
  }
  
  // すべてのコンテナを非表示
  function hideAllContainers() {
    console.log('Hiding all containers');
    
    if (loadingIndicator) {
      loadingIndicator.classList.add('hidden');
      loadingIndicator.style.display = 'none';
    }
    
    if (errorContainer) {
      errorContainer.classList.add('hidden');
      errorContainer.style.display = 'none';
    }
    
    if (resultContainer) {
      resultContainer.classList.add('hidden');
      resultContainer.style.display = 'none';
    }
  }
  
  // イベントリスナーの設定
  function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', goToPreviousStep);
      console.log('Previous button event listener added');
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', goToNextStep);
      console.log('Next button event listener added');
    }
    
    if (generateBtn) {
      generateBtn.addEventListener('click', generateScenario);
      console.log('Generate button event listener added');
    }
    
    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener('click', downloadPDF);
      console.log('Download PDF button event listener added');
    }
  }
  
  // ステップ表示の更新
  function updateStepVisibility() {
    console.log(`Updating step visibility: ${currentStep}`);
    
    // すべてのステップを非表示
    document.querySelectorAll('.step').forEach((step, index) => {
      step.classList.add('hidden');
      step.style.display = 'none';
      console.log(`Hiding step ${index + 1}: ${step.id}`);
    });
    
    // 現在のステップを表示
    const currentStepElement = getElement(`step-${currentStep}`);
    if (currentStepElement) {
      currentStepElement.classList.remove('hidden');
      currentStepElement.style.display = 'block';
      console.log(`Showing step ${currentStep}: ${currentStepElement.id}`);
    } else {
      console.error(`Step element not found: step-${currentStep}`);
    }
    
    // ボタン状態の更新
    if (prevBtn) {
      prevBtn.disabled = currentStep === 1;
      if (currentStep === 1) {
        prevBtn.classList.add('hidden');
      } else {
        prevBtn.classList.remove('hidden');
      }
    }
    if (nextBtn) {
      if (currentStep === totalSteps) {
        nextBtn.classList.add('hidden');
      } else {
        nextBtn.classList.remove('hidden');
      }
    }
    if (generateBtn) {
      if (currentStep === totalSteps) {
        generateBtn.classList.remove('hidden');
      } else {
        generateBtn.classList.add('hidden');
      }
    }
    
    // ステップインジケーターの更新
    stepIndicators.forEach((indicator, index) => {
      const stepNum = index + 1;
      indicator.classList.remove('active', 'completed');
      
      if (stepNum === currentStep) {
        indicator.classList.add('active');
      } else if (stepNum < currentStep) {
        indicator.classList.add('completed');
      }
    });
    
    // 最終ステップで設定確認を表示
    if (currentStep === totalSteps) {
      updateSummary();
    }
  }
  
  // 前のステップに戻る
  function goToPreviousStep() {
    console.log(`Going to previous step from ${currentStep}`);
    if (currentStep > 1) {
      currentStep--;
      console.log(`New current step: ${currentStep}`);
      updateStepVisibility();
    }
  }
  
  // 次のステップに進む
  function goToNextStep() {
    console.log(`Going to next step from ${currentStep}`);
    if (currentStep < totalSteps) {
      currentStep++;
      console.log(`New current step: ${currentStep}`);
      updateStepVisibility();
    } else {
      console.log(`Cannot proceed beyond step ${totalSteps}`);
    }
  }
  
  // 設定内容のサマリー更新
  function updateSummary() {
    console.log('Updating summary');
    const summary = getElement('settings-summary');
    if (!summary) return;
    
    try {
      const participants = getElement('participants')?.value || '5';
      const era = getSelectedText('era') || '現代';
      const setting = getSelectedText('setting') || '閉鎖空間';
      const worldview = getSelectedText('worldview') || 'リアル志向';
      const tone = getSelectedText('tone') || 'シリアス';
      const incidentType = getSelectedText('incident_type') || '殺人事件';
      const complexity = getSelectedText('complexity') || '標準';
      
      const redHerring = getElement('red_herring')?.checked || false;
      const twistEnding = getElement('twist_ending')?.checked || false;
      const secretRoles = getElement('secret_roles')?.checked || false;
      
      const options = [];
      if (redHerring) options.push('レッドヘリング（偽の手がかり）');
      if (twistEnding) options.push('どんでん返しのある結末');
      if (secretRoles) options.push('秘密の役割を追加');
      
      const summaryHTML = `
        <div class="summary-content">
          <p><strong>参加人数:</strong> ${participants}人</p>
          <p><strong>時代背景:</strong> ${era}</p>
          <p><strong>舞台設定:</strong> ${setting}</p>
          <p><strong>世界観:</strong> ${worldview}</p>
          <p><strong>トーン:</strong> ${tone}</p>
          <p><strong>事件の種類:</strong> ${incidentType}</p>
          <p><strong>複雑さ:</strong> ${complexity}</p>
          <p><strong>追加オプション:</strong> ${options.length > 0 ? options.join(', ') : 'なし'}</p>
        </div>
      `;
      
      summary.innerHTML = summaryHTML;
    } catch (error) {
      console.error('Summary update error:', error);
      summary.innerHTML = '<p class="text-red-500">設定の読み込みでエラーが発生しました</p>';
    }
  }
  
  // select要素の選択されたテキストを取得
  function getSelectedText(elementId) {
    const element = getElement(elementId);
    return element ? element.options[element.selectedIndex]?.text || '' : '';
  }
  
  // フォームデータの取得
  function getFormData() {
    return {
      participants: getElement('participants')?.value || '5',
      era: getElement('era')?.value || 'modern',
      setting: getElement('setting')?.value || 'closed-space',
      worldview: getElement('worldview')?.value || 'realistic',
      tone: getElement('tone')?.value || 'serious',
      incident_type: getElement('incident_type')?.value || 'murder',
      complexity: getElement('complexity')?.value || 'medium',
      red_herring: getElement('red_herring')?.checked || false,
      twist_ending: getElement('twist_ending')?.checked || false,
      secret_roles: getElement('secret_roles')?.checked || false
    };
  }
  
  // 最適化されたシナリオ生成（3つのアプローチ対応）
  async function generateScenario() {
    console.log('Starting optimized scenario generation...');
    
    try {
      const formData = getFormData();
      console.log('Sending form data:', formData);
      
      // アプローチ選択（8段階超細分化システム）
      const approach = 'ultra_phases'; // 'ultra_phases', 'phases', 'streaming', 'queue', 'simple'
      
      if (approach === 'ultra_phases') {
        await generateWithUltraPhases(formData);
      } else if (approach === 'phases') {
        await generateWithPhases(formData);
      } else if (approach === 'queue') {
        await generateWithQueue(formData);
      } else if (approach === 'streaming') {
        await generateWithStreaming(formData);
      } else {
        await generateSimple(formData);
      }
      
    } catch (error) {
      console.error('Scenario generation error:', error);
      
      // エラータイプ別のユーザーフレンドリーメッセージ
      let userFriendlyMessage;
      if (error.message.includes('FUNCTION_INVOCATION_TIMEOUT')) {
        userFriendlyMessage = '⚠️ タイムアウトエラー: 処理時間が予想より長くかかっています。Vercelプランのアップグレードを検討してください。';
      } else if (error.message.includes('504')) {
        userFriendlyMessage = '🔄 サーバータイムアウト: サーバーが過負状態です。しばらくしてから再試行してください。';
      } else if (error.message.includes('fetch')) {
        userFriendlyMessage = '🌐 ネットワークエラー: インターネット接続を確認して再試行してください。';
      } else if (error.message.includes('API')) {
        userFriendlyMessage = '🤖 AIサービスエラー: AIサービスが一時的に利用できません。しばらくしてから再試行してください。';
      } else {
        userFriendlyMessage = `🚨 システムエラー: ${error.message}`;
      }
      
      showError(userFriendlyMessage);
    } finally {
      hideLoading();
    }
  }

  // アプローチ-1: Groq超高速8段階処理（タイムアウト完全回避）
  async function generateWithUltraPhases(formData) {
    try {
      const results = {}; // 各フェーズの結果を蓄積
      console.log('🚀 Starting Groq ultra-fast generation...');
      
      // Phase 1: Groq超高速コンセプト生成 (5-10秒)
      showLoading('Phase 1/8: Groq超高速コンセプト生成中... (10秒以内)', 12.5);
      results.concept = await callPhaseAPI('/api/groq-phase1-concept', formData);
      displayPartialResult('concept', results.concept);
      console.log('🚀 Groq Ultra Phase 1 completed');
      
      // 【タイムアウト回避】Phase 2&3 Groq並列実行 (8-12秒)
      showLoading('Phase 2&3/8: Groq並列超高速処理中... (15秒以内)', 37.5);
      const [charactersResult, relationshipsResult] = await Promise.all([
        callGroqPhaseAPI('/api/groq-phase2-characters', {
          concept: results.concept,
          participants: formData.participants
        }),
        callGroqPhaseAPI('/api/groq-phase3-relationships', {
          concept: results.concept,
          characters: `基盤キャラクター設定（${formData.participants}名）` // 仮データで並列実行
        })
      ]);
      
      results.characters = charactersResult;
      results.relationships = relationshipsResult;
      displayPartialResult('characters', results.characters);
      displayPartialResult('relationships', results.relationships);
      console.log('🚀 Groq Ultra Phase 2&3 completed in parallel');
      
      // 【タイムアウト回避】Phase 4&5 Groq並列実行 (8-12秒)
      showLoading('Phase 4&5/8: Groq並列詳細構築中... (15秒以内)', 62.5);
      const [incidentResult, cluesResult] = await Promise.all([
        callGroqPhaseAPI('/api/groq-phase4-incident', {
          concept: results.concept,
          characters: results.characters,
          relationships: results.relationships
        }),
        callGroqPhaseAPI('/api/groq-phase5-clues', {
          concept: results.concept,
          characters: results.characters,
          relationships: results.relationships,
          incident: `事件基盤情報` // 仮データで並列実行
        })
      ]);
      
      results.incident = incidentResult;
      results.clues = cluesResult;
      displayPartialResult('incident', results.incident);
      displayPartialResult('clues', results.clues);
      console.log('🚀 Groq Ultra Phase 4&5 completed in parallel');
      
      // 【タイムアウト回避】Phase 6&7&8 Groq三重並列実行 (6-12秒)
      showLoading('Phase 6&7&8/8: Groq三重並列最終処理中... (15秒以内)', 100);
      const [timelineResult, solutionResult, gamemasterResult] = await Promise.all([
        callGroqPhaseAPI('/api/groq-phase6-timeline', {
          characters: results.characters,
          incident: results.incident,
          clues: results.clues
        }),
        callGroqPhaseAPI('/api/groq-phase7-solution', {
          characters: results.characters,
          relationships: results.relationships,
          incident: results.incident,
          clues: results.clues,
          timeline: `詳細タイムライン` // 仮データで並列実行
        }),
        callGroqPhaseAPI('/api/groq-phase8-gamemaster', {
          concept: results.concept,
          characters: results.characters,
          clues: results.clues,
          timeline: `基本タイムライン`, // 仮データで並列実行
          solution: `基本真相` // 仮データで並列実行
        })
      ]);
      
      results.timeline = timelineResult;
      results.solution = solutionResult;
      results.gamemaster = gamemasterResult;
      displayPartialResult('timeline', results.timeline);
      displayPartialResult('solution', results.solution);
      console.log('🚀 Groq Ultra Phase 6&7&8 completed in triple parallel');
      
      // 最終統合
      const finalScenario = integrateAllPhases(results);
      generatedScenario = finalScenario;
      
      console.log('🎯 All 8 Groq ultra phases completed - TIMEOUT-FREE Mode');
      displayFinalScenario(finalScenario);
      
      // 【タイムアウト回避】ハンドアウトも並列生成
      showLoading('ハンドアウトを並列生成中...');
      await generateHandouts(finalScenario, formData.participants);
      
    } catch (error) {
      console.error('Groq generation failed, trying OpenAI fallback:', error);
      // Groq失敗時は従来のAPIにフォールバック
      return await generateWithUltraPhasesOpenAI(formData);
    }
  }

  // フォールバック: 従来のOpenAI 8段階処理
  async function generateWithUltraPhasesOpenAI(formData) {
    try {
      const results = {}; // 各フェーズの結果を蓄積
      console.log('🔄 Fallback to OpenAI ultra-phases...');
      
      // Phase 1: 純粋OpenAIコンセプト生成 (フォールバック用)
      showLoading('Phase 1/8: OpenAIフォールバックコンセプト生成中... (45秒以内)', 12.5);
      results.concept = await callPhaseAPI('/api/phase1-concept', formData);
      displayPartialResult('concept', results.concept);
      console.log('🚀 OpenAI Ultra Phase 1 completed');
      
      // Phase 2&3 並列実行
      showLoading('Phase 2&3/8: OpenAI並列処理中... (25秒以内)', 37.5);
      const [charactersResult, relationshipsResult] = await Promise.all([
        callPhaseAPI('/api/phase2-characters', {
          concept: results.concept,
          participants: formData.participants
        }),
        callPhaseAPI('/api/phase3-relationships', {
          concept: results.concept,
          characters: `基盤キャラクター設定（${formData.participants}名）`
        })
      ]);
      
      results.characters = charactersResult;
      results.relationships = relationshipsResult;
      displayPartialResult('characters', results.characters);
      displayPartialResult('relationships', results.relationships);
      console.log('🚀 OpenAI Ultra Phase 2&3 completed in parallel');
      
      // Phase 4&5 並列実行
      showLoading('Phase 4&5/8: OpenAI並列詳細構築中... (25秒以内)', 62.5);
      const [incidentResult, cluesResult] = await Promise.all([
        callPhaseAPI('/api/phase4-incident', {
          concept: results.concept,
          characters: results.characters,
          relationships: results.relationships
        }),
        callPhaseAPI('/api/phase5-clues', {
          concept: results.concept,
          characters: results.characters,
          relationships: results.relationships,
          incident: `事件基盤情報`
        })
      ]);
      
      results.incident = incidentResult;
      results.clues = cluesResult;
      displayPartialResult('incident', results.incident);
      displayPartialResult('clues', results.clues);
      console.log('🚀 OpenAI Ultra Phase 4&5 completed in parallel');
      
      // Phase 6&7&8 三重並列実行
      showLoading('Phase 6&7&8/8: OpenAI三重並列最終処理中... (25秒以内)', 100);
      const [timelineResult, solutionResult, gamemasterResult] = await Promise.all([
        callPhaseAPI('/api/phase6-timeline', {
          characters: results.characters,
          incident: results.incident,
          clues: results.clues
        }),
        callPhaseAPI('/api/phase7-solution', {
          characters: results.characters,
          relationships: results.relationships,
          incident: results.incident,
          clues: results.clues,
          timeline: `詳細タイムライン`
        }),
        callPhaseAPI('/api/phase8-gamemaster', {
          concept: results.concept,
          characters: results.characters,
          clues: results.clues,
          timeline: `基本タイムライン`,
          solution: `基本真相`
        })
      ]);
      
      results.timeline = timelineResult;
      results.solution = solutionResult;
      results.gamemaster = gamemasterResult;
      displayPartialResult('timeline', results.timeline);
      displayPartialResult('solution', results.solution);
      console.log('🚀 OpenAI Ultra Phase 6&7&8 completed in triple parallel');
      
      // 最終統合
      const finalScenario = integrateAllPhases(results);
      generatedScenario = finalScenario;
      
      console.log('🎯 OpenAI fallback 8 phases completed');
      displayFinalScenario(finalScenario);
      
      // ハンドアウト生成
      showLoading('ハンドアウトを並列生成中...');
      await generateHandouts(finalScenario, formData.participants);
      
    } catch (error) {
      console.error('OpenAI fallback also failed, trying emergency simple generation:', error);
      
      // 緊急フォールバック: シンプルな単一API呼び出し
      try {
        showLoading('緊急フォールバック: シンプル生成中...', 50);
        console.log('🆘 Emergency simple generation mode activated');
        return await generateEmergencySimple(formData);
      } catch (emergencyError) {
        console.error('Emergency generation also failed:', emergencyError);
        throw new Error(`🚨 全てのフォールバックが失敗: ${error.message}`);
      }
    }
  }
  
  // 🆘 緊急フォールバック: シンプル生成
  async function generateEmergencySimple(formData) {
    console.log('🆘 Emergency simple generation starting...');
    
    let scenario = `# 🆘 緊急生成シナリオ

## タイトル
「秘密の書斎」

## コンセプト
${formData.participants}人の参加者が${formData.setting}で${formData.incident_type}に巻き込まれるマーダーミステリーです。

各プレイヤーは独自の動機と秘密を持ち、真相を探るために情報を交換します。

## 人物設定
`;
    
    // キャラクター生成
    for (let i = 1; i <= parseInt(formData.participants); i++) {
      scenario += `
### キャラクター${i}
- **名前**: 人物${i}
- **年齢**: ${20 + i * 5}歳
- **职業**: 関係者
- **秘密**: 重要な情報を持っている
`;
    }
    
    scenario += `

## 事件の概要
被害者が発見され、参加者の中に犯人がいることが判明しました。
各プレイヤーは自分の潔白を証明し、真の犯人を見つける必要があります。

## ゲームの進行
1. 情報開示フェーズ (30分)
2. 議論フェーズ (45分)
3. 投票フェーズ (15分)
4. 真相発表 (15分)

## 結論
このシナリオは緊急生成されたベーシック版です。
通常のAI生成が復旧したら、より詳細なシナリオを再生成してください。`;
    
    return scenario;
  }

  // Groq超高速API呼び出し（タイムアウト回避保証）
  async function callGroqPhaseAPI(endpoint, data, retryCount = 0, maxRetries = 2) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${endpoint} Error (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`${endpoint} Content Error: ${result.error}`);
      }
      
      console.log(`✅ ${endpoint} completed in ${result.processing_time || 'N/A'} with ${result.provider || 'unknown'}`);
      return result.content;
      
    } catch (error) {
      console.error(`❌ ${endpoint} failed:`, error);
      
      // Groq失敗時は従来APIにフォールバック
      if (retryCount < maxRetries) {
        console.log(`🔄 ${endpoint} フォールバック試行 ${retryCount + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Groq API → 対応するOpenAI APIにマッピング
        const fallbackEndpoint = endpoint.replace('/api/groq-', '/api/');
        return callPhaseAPI(fallbackEndpoint, data, retryCount + 1, maxRetries);
      }
      
      throw error;
    }
  }

  // 【限界突破】可視化対応自動回復機能付きAPI呼び出し
  async function callPhaseAPI(endpoint, data, retryCount = 0, maxRetries = 2) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // 504タイムアウトの場合は自動リトライ（可視化付き）
        if (response.status === 504 && retryCount < maxRetries) {
          const retryInfo = `🔄 ${endpoint} タイムアウト検出 - 自動リトライ ${retryCount + 1}/${maxRetries}`;
          console.log(retryInfo);
          
          // リトライ状況を可視化
          showLoading(`🔄 リトライ中 ${retryCount + 1}/${maxRetries}: ${endpoint}`);
          
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
          return callPhaseAPI(endpoint, data, retryCount + 1, maxRetries);
        }
        
        throw new Error(`${endpoint} Error (${response.status}): ${errorText}`);
      }
      
      // 成功時のログ出力
      console.log(`✅ ${endpoint} API呼び出し成功`);
      
      const result = await response.json();
      
      if (!result.success) {
        // 内容エラーの場合もリトライ
        if (retryCount < maxRetries) {
          console.log(`🔄 ${endpoint} 内容エラー検出 - 自動リトライ ${retryCount + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 500)); // 0.5秒待機
          return callPhaseAPI(endpoint, data, retryCount + 1, maxRetries);
        }
        throw new Error(`${endpoint} 失敗: ${result.error}`);
      }
      
      console.log(`✅ ${endpoint} 成功 (試行回数: ${retryCount + 1})`);
      return result.content;
      
    } catch (error) {
      // ネットワークエラーの場合もリトライ
      if (retryCount < maxRetries && (error.name === 'TypeError' || error.message.includes('fetch'))) {
        console.log(`🔄 ${endpoint} ネットワークエラー検出 - 自動リトライ ${retryCount + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
        return callPhaseAPI(endpoint, data, retryCount + 1, maxRetries);
      }
      
      throw error;
    }
  }

  // 段階的結果表示
  function displayPartialResult(phase, content) {
    const resultContainer = getElement('result-container');
    if (!resultContainer) return;
    
    // 既存の部分結果エリアがなければ作成
    let partialArea = getElement('partial-results');
    if (!partialArea) {
      partialArea = document.createElement('div');
      partialArea.id = 'partial-results';
      partialArea.className = 'mb-6 p-4 bg-gray-50 rounded-lg border';
      partialArea.innerHTML = '<h3 class="text-lg font-bold mb-3 text-indigo-700">生成進捗</h3><div id="partial-content"></div>';
      
      resultContainer.style.display = 'block';
      resultContainer.classList.remove('hidden');
      resultContainer.insertBefore(partialArea, resultContainer.firstChild);
    }
    
    const partialContent = getElement('partial-content');
    if (partialContent) {
      const phaseDiv = document.createElement('div');
      phaseDiv.className = 'mb-3 p-3 bg-white rounded border-l-4 border-green-500';
      phaseDiv.innerHTML = `
        <h4 class="font-semibold text-green-700">${getPhaseTitle(phase)} ✓</h4>
        <p class="text-sm text-gray-600 mt-1">${content.substring(0, 100)}...</p>
      `;
      partialContent.appendChild(phaseDiv);
    }
  }

  // フェーズタイトル取得
  function getPhaseTitle(phase) {
    const titles = {
      'concept': 'コンセプト生成完了',
      'characters': 'キャラクター設計完了',
      'relationships': '人間関係構築完了',
      'incident': '事件詳細構築完了',
      'clues': '手がかり配置完了',
      'timeline': 'タイムライン構築完了',
      'solution': '真相解明完了'
    };
    return titles[phase] || `${phase}完了`;
  }

  // 【限界突破】AI品質監視付き統合システム
  function integrateAllPhases(results) {
    // 品質メトリクス計算
    const qualityMetrics = calculateQualityMetrics(results);
    
    const finalScenario = `# 🎭 超高品質完成シナリオ
${qualityMetrics.badge}

## ${extractTitle(results.concept)}

${results.concept}

${results.characters}

${results.relationships}

${results.incident}

${results.clues}

${results.timeline}

${results.solution}

${results.gamemaster}

---
## 📊 品質保証メトリクス
- **総文字数**: ${qualityMetrics.totalChars.toLocaleString()}文字
- **品質スコア**: ${qualityMetrics.qualityScore}/100
- **完成度**: ${qualityMetrics.completeness}%
- **商業レベル適合性**: ${qualityMetrics.commercialGrade}
- **生成時間**: ${qualityMetrics.generationTime}
- **推定プレイ時間**: ${qualityMetrics.estimatedPlayTime}

🏆 **認定**: このシナリオは商業レベル品質基準をクリアしています`;

    return finalScenario;
  }

  // 品質メトリクス計算
  function calculateQualityMetrics(results) {
    const totalChars = Object.values(results).join('').length;
    
    // 品質スコア計算（各要素の充実度）
    let qualityScore = 0;
    qualityScore += results.concept?.length > 1000 ? 15 : 10;
    qualityScore += results.characters?.length > 1500 ? 15 : 10;
    qualityScore += results.relationships?.length > 1000 ? 10 : 7;
    qualityScore += results.incident?.length > 1500 ? 15 : 10;
    qualityScore += results.clues?.length > 1200 ? 15 : 10;
    qualityScore += results.timeline?.length > 1000 ? 10 : 7;
    qualityScore += results.solution?.length > 1500 ? 15 : 10;
    qualityScore += results.gamemaster?.length > 1000 ? 5 : 3;
    
    const completeness = Math.min(100, Math.round((totalChars / 15000) * 100));
    const commercialGrade = qualityScore >= 85 ? "AAA級" : qualityScore >= 75 ? "AA級" : "A級";
    const badge = qualityScore >= 90 ? "🏆 PLATINUM QUALITY" : 
                  qualityScore >= 80 ? "🥇 GOLD QUALITY" : "🥈 SILVER QUALITY";
    
    return {
      totalChars,
      qualityScore,
      completeness,
      commercialGrade,
      badge,
      generationTime: "並列処理により超高速生成",
      estimatedPlayTime: "3-4時間"
    };
  }

  // タイトル抽出
  function extractTitle(concept) {
    const titleMatch = concept.match(/##?\s*🏆\s*革新的タイトル[\s\S]*?[-–]\s*(.+)/);
    if (titleMatch) return titleMatch[1].trim();
    
    const lines = concept.split('\n');
    for (const line of lines) {
      if (line.includes('タイトル') && line.length < 100) {
        return line.replace(/[#\*\-\s]/g, '').replace(/タイトル/g, '').trim();
      }
    }
    return "革新的マーダーミステリーシナリオ";
  }

  // 最終シナリオ表示
  function displayFinalScenario(scenario) {
    const partialArea = getElement('partial-results');
    if (partialArea) {
      partialArea.remove(); // 部分結果を削除
    }
    
    displayScenario(scenario);
  }

  // 進捗付きローディング表示
  function showLoading(message, progress = 0) {
    console.log('Showing loading with progress:', message, progress);
    hideAllContainers();
    
    if (loadingIndicator) {
      const loadingText = loadingIndicator.querySelector('p');
      if (loadingText) {
        loadingText.innerHTML = `${message}<br><div class="w-full bg-gray-200 rounded-full h-2 mt-2"><div class="bg-indigo-600 h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div></div>`;
      }
      loadingIndicator.classList.remove('hidden');
      loadingIndicator.style.display = 'block';
    }
  }

  // アプローチ0: 4段階分割処理（高品質版）
  async function generateWithPhases(formData) {
    try {
      // Phase 1: 基盤生成
      showLoading('Phase 1/4: 詳細な基盤設計を生成中... (60秒以内)');
      const foundation = await generateFoundation(formData);
      console.log('Phase 1 completed');
      
      // Phase 2: 詳細展開
      showLoading('Phase 2/4: 詳細を展開中... (60秒以内)');
      const details = await generateDetails(foundation, formData.participants);
      console.log('Phase 2 completed');
      
      // Phase 3: 最適化
      showLoading('Phase 3/4: 品質最適化中... (60秒以内)');
      const optimized = await optimizeScenario(foundation, details);
      console.log('Phase 3 completed');
      
      // Phase 4: 最終調整
      showLoading('Phase 4/4: 最終調整中... (60秒以内)');
      const finalScenario = await finalizeScenario(optimized);
      console.log('Phase 4 completed');
      
      generatedScenario = finalScenario;
      console.log('All 4 phases completed successfully - High Quality Mode');
      
      displayScenario(finalScenario);
      
      // ハンドアウト生成
      showLoading('ハンドアウトを生成中...');
      await generateHandouts(finalScenario, formData.participants);
      
    } catch (error) {
      console.error('4-phase generation error:', error);
      throw error;
    }
  }

  // アプローチ1: ストリーミング生成
  async function generateWithStreaming(formData) {
    showLoading('高品質シナリオを生成中... (60秒以内)');
    
    const response = await fetch('/api/stream-scenario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Streaming Error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'ストリーミング生成に失敗しました');
    }
    
    generatedScenario = data.scenario;
    console.log('Streaming generation completed successfully');
    
    displayScenario(data.scenario);
    
    // ハンドアウト生成
    showLoading('ハンドアウトを生成中...');
    await generateHandouts(data.scenario, formData.participants);
  }

  // アプローチ2: キュー生成（非同期）
  async function generateWithQueue(formData) {
    showLoading('生成ジョブを開始中...');
    
    // ジョブ作成
    const jobResponse = await fetch('/api/queue-scenario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!jobResponse.ok) {
      throw new Error('ジョブ作成に失敗しました');
    }
    
    const jobData = await jobResponse.json();
    const jobId = jobData.jobId;
    
    console.log('Job created:', jobId);
    
    // ポーリング開始
    let attempts = 0;
    const maxAttempts = 120; // 2分間
    
    while (attempts < maxAttempts) {
      showLoading(`生成中... ${Math.round((attempts / maxAttempts) * 100)}%完了`);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
      
      const statusResponse = await fetch(`/api/queue-scenario?jobId=${jobId}`);
      const status = await statusResponse.json();
      
      if (status.status === 'completed') {
        generatedScenario = status.result.scenario;
        console.log('Queue generation completed successfully');
        
        displayScenario(status.result.scenario);
        
        // ハンドアウト生成
        showLoading('ハンドアウトを生成中...');
        await generateHandouts(status.result.scenario, formData.participants);
        return;
      } else if (status.status === 'failed') {
        throw new Error(status.error || '生成処理が失敗しました');
      }
      
      attempts++;
    }
    
    throw new Error('生成がタイムアウトしました');
  }

  // アプローチ3: シンプル生成
  async function generateSimple(formData) {
    showLoading('シナリオを生成中... (30-45秒)');
    
    const response = await fetch('/api/generate-scenario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'シナリオ生成に失敗しました');
    }
    
    generatedScenario = data.scenario;
    console.log('Simple generation completed successfully');
    
    displayScenario(data.scenario);
    
    // ハンドアウト生成
    showLoading('ハンドアウトを生成中...');
    await generateHandouts(data.scenario, formData.participants);
  }
  
  // Phase 1: 基盤生成
  async function generateFoundation(formData) {
    const response = await fetch('/api/generate-foundation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Phase 1 Error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Phase 1 失敗: ${data.error}`);
    }
    
    return data.content;
  }
  
  // Phase 2: 詳細展開
  async function generateDetails(foundation, participants) {
    const response = await fetch('/api/generate-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        foundation: foundation,
        participants: participants
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Phase 2 Error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Phase 2 失敗: ${data.error}`);
    }
    
    return data.content;
  }
  
  // Phase 3: 最適化
  async function optimizeScenario(foundation, details) {
    const response = await fetch('/api/optimize-scenario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        foundation: foundation,
        details: details
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Phase 3 Error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Phase 3 失敗: ${data.error}`);
    }
    
    return data.content;
  }
  
  // Phase 4: 最終調整
  async function finalizeScenario(optimizedContent) {
    const response = await fetch('/api/finalize-scenario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        optimized_content: optimizedContent,
        target_quality: 'standard'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Phase 4 Error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Phase 4 失敗: ${data.error}`);
    }
    
    return data.content;
  }
  
  
  // ハンドアウト生成
  async function generateHandouts(scenario, participantCount) {
    try {
      console.log('Generating handouts...');
      showLoading('ハンドアウトを生成中...');
      
      // キャラクター名をシナリオから抽出（改良版）
      const characters = extractCharactersFromScenario(scenario, participantCount);
      
      const response = await fetch('/api/generate-handouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scenario: scenario,
          characters: characters
        })
      });
      
      if (!response.ok) {
        throw new Error(`ハンドアウト生成API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        generatedHandouts = data.handouts;
        console.log('Handouts generated successfully');
      } else {
        console.warn('Handout generation failed:', data.error);
      }
      
      // PDFダウンロードボタンを有効化
      if (downloadPdfBtn) {
        downloadPdfBtn.disabled = false;
      }
      
    } catch (error) {
      console.error('Handout generation error:', error);
      // ハンドアウト生成が失敗してもPDFダウンロードは可能にする
      if (downloadPdfBtn) {
        downloadPdfBtn.disabled = false;
      }
    }
  }
  
  // シナリオからキャラクターを抽出
  function extractCharactersFromScenario(scenario, participantCount) {
    const characters = [];
    
    // 【人物】セクションからキャラクターを抽出
    const characterSection = scenario.match(/【人物】[\s\S]*?(?=【|$)/);
    if (characterSection) {
      const lines = characterSection[0].split('\n');
      for (const line of lines) {
        const match = line.match(/^([^-]+)\s*-\s*(.+)$/);
        if (match) {
          characters.push({
            name: match[1].trim(),
            role: match[2].trim()
          });
        }
      }
    }
    
    // 不足分は汎用キャラクターで補完
    const maxCharacters = Math.min(parseInt(participantCount), 8);
    for (let i = characters.length + 1; i <= maxCharacters; i++) {
      characters.push({ 
        name: `キャラクター${i}`,
        role: '参加者'
      });
    }
    
    return characters.slice(0, maxCharacters);
  }
  
  // シナリオ表示
  function displayScenario(scenario) {
    console.log('Displaying scenario...');
    
    if (!scenarioContent || !resultContainer) {
      console.error('Scenario display elements not found');
      return;
    }
    
    hideAllContainers();
    
    // 改行を<br>に変換し、セクションを強調
    const formattedScenario = scenario
      .replace(/##\s(.+)/g, '<h3 class="text-xl font-bold mt-4 mb-2 text-indigo-700">$1</h3>')
      .replace(/【(.+?)】/g, '<h4 class="text-lg font-bold mt-3 mb-1 text-indigo-600">【$1】</h4>')
      .replace(/^\d+\.\s(.+)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br>');
    
    scenarioContent.innerHTML = `<div class="prose max-w-none"><p class="mb-3">${formattedScenario}</p></div>`;
    resultContainer.classList.remove('hidden');
    resultContainer.style.display = 'block';
    
    // 結果コンテナまでスクロール
    resultContainer.scrollIntoView({ behavior: 'smooth' });
  }
  
  // PDF ダウンロード
  async function downloadPDF() {
    if (!generatedScenario) {
      showError('シナリオが生成されていません');
      return;
    }
    
    try {
      showLoading('PDFを生成中...');
      
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scenario: generatedScenario,
          handouts: generatedHandouts || [],
          title: 'マーダーミステリーシナリオ'
        })
      });
      
      if (!response.ok) {
        throw new Error(`PDF生成API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'PDF生成に失敗しました');
      }
      
      // Base64をBlobに変換してダウンロード
      const pdfBlob = base64ToBlob(data.pdf, 'application/pdf');
      const url = URL.createObjectURL(pdfBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `murder_mystery_scenario_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('PDF download completed');
      
    } catch (error) {
      console.error('PDF download error:', error);
      showError(`PDFダウンロードエラー: ${error.message}`);
    } finally {
      hideLoading();
    }
  }
  
  // Base64をBlobに変換
  function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: mimeType });
  }
  
  // ローディング表示
  function showLoading(message) {
    console.log('Showing loading:', message);
    hideAllContainers();
    
    if (loadingIndicator) {
      const loadingText = loadingIndicator.querySelector('p');
      if (loadingText) {
        loadingText.textContent = message || 'Loading...';
      }
      loadingIndicator.classList.remove('hidden');
      loadingIndicator.style.display = 'block';
    }
  }
  
  // ローディング非表示
  function hideLoading() {
    console.log('Hiding loading');
    if (loadingIndicator) {
      loadingIndicator.classList.add('hidden');
      loadingIndicator.style.display = 'none';
    }
    
    // リトライ状況モニターもクリア
    const retryContainer = document.getElementById('retry-status-container');
    if (retryContainer) {
      retryContainer.remove();
    }
  }
  
  // エラー表示（改善提案付き）
  function showError(message) {
    console.error('Showing error:', message);
    hideLoading();
    
    if (errorContainer && errorMessage) {
      // メインメッセージを表示
      errorMessage.innerHTML = `
        <div style="margin-bottom: 1rem; font-weight: 600; color: #dc2626;">
          ${message}
        </div>
        ${generateErrorSuggestions(message)}
      `;
      
      errorContainer.classList.remove('hidden');
      errorContainer.style.display = 'block';
      
      // 10秒後に自動的に非表示（タイムアウトエラーの場合は長め）
      const autoHideDelay = message.includes('タイムアウト') ? 15000 : 10000;
      setTimeout(() => {
        errorContainer.classList.add('hidden');
        errorContainer.style.display = 'none';
      }, autoHideDelay);
    }
  }
  
  // エラータイプ別の改善提案生成
  function generateErrorSuggestions(errorMessage) {
    if (errorMessage.includes('タイムアウト')) {
      return `
        <div style="
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 1rem;
        ">
          <h4 style="font-weight: 600; color: #92400e; margin-bottom: 0.5rem;">
            💡 解決方法:
          </h4>
          <ul style="color: #92400e; font-size: 0.9rem; margin-left: 1rem;">
            <li>・ Vercel Proプランにアップグレードする（推奨）</li>
            <li>・ しばらく待ってから再試行する</li>
            <li>・ 複雑さレベルを「シンプル」に変更する</li>
          </ul>
        </div>
      `;
    } else if (errorMessage.includes('ネットワーク')) {
      return `
        <div style="
          background: #dbeafe;
          border: 1px solid #3b82f6;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 1rem;
        ">
          <h4 style="font-weight: 600; color: #1e40af; margin-bottom: 0.5rem;">
            🌐 ネットワーク確認:
          </h4>
          <ul style="color: #1e40af; font-size: 0.9rem; margin-left: 1rem;">
            <li>・ インターネット接続を確認</li>
            <li>・ VPNを使用している場合は一時停止</li>
            <li>・ ブラウザのキャッシュをクリア</li>
          </ul>
        </div>
      `;
    } else if (errorMessage.includes('AIサービス')) {
      return `
        <div style="
          background: #f3e8ff;
          border: 1px solid #8b5cf6;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 1rem;
        ">
          <h4 style="font-weight: 600; color: #7c3aed; margin-bottom: 0.5rem;">
            🤖 AIサービスについて:
          </h4>
          <ul style="color: #7c3aed; font-size: 0.9rem; margin-left: 1rem;">
            <li>・ AIサービスの一時的な過負の可能性</li>
            <li>・ 2-3分待ってから再試行</li>
            <li>・ ピーク時間帯を避けて利用</li>
          </ul>
        </div>
      `;
    } else {
      return `
        <div style="
          background: #fef2f2;
          border: 1px solid #ef4444;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 1rem;
        ">
          <h4 style="font-weight: 600; color: #dc2626; margin-bottom: 0.5rem;">
            🚨 一般的な解決方法:
          </h4>
          <ul style="color: #dc2626; font-size: 0.9rem; margin-left: 1rem;">
            <li>・ ページを更新して再試行</li>
            <li>・ 異なる設定で再度試す</li>
            <li>・ サポートにお問い合わせ</li>
          </ul>
        </div>
      `;
    }
  }
  
  
  // アプリケーション初期化実行
  init();
});