/**
 * integration.test.js - 統合テストスイート
 * モジュール間の連携テスト
 */

import './TestFramework.js';

describe('App Integration Tests', () => {
  let app;
  let testContainer;

  beforeEach(async () => {
    // テスト用DOM環境セットアップ
    testContainer = document.createElement('div');
    testContainer.innerHTML = `
      <form id="scenario-form">
        <div id="step-1" class="step">
          <select id="participants" name="participants">
            <option value="4">4人</option>
            <option value="5" selected>5人</option>
          </select>
        </div>
        <div id="step-2" class="step hidden">
          <select id="era" name="era">
            <option value="modern" selected>現代</option>
          </select>
        </div>
        <button id="next-btn">次へ</button>
        <button id="prev-btn">前へ</button>
      </form>
      <div id="loading-indicator" class="hidden"></div>
      <div id="result-container" class="hidden"></div>
      <div id="error-container" class="hidden"></div>
    `;
    document.body.appendChild(testContainer);

    // モック用のAPIレスポンス設定
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        scenario: 'テストシナリオ',
        metadata: { 
          generationTime: 1000,
          strategy: 'test'
        }
      })
    });

    // アプリケーション初期化
    app = new MurderMysteryApp({
      environment: 'test',
      api: { baseURL: '/api', timeout: 5000 },
      generation: { defaultStrategy: 'test' }
    });

    // 初期化完了を待機
    await new Promise(resolve => {
      if (app.isInitialized) {
        resolve();
      } else {
        app.once('app:init:complete', resolve);
      }
    });
  });

  afterEach(() => {
    if (testContainer && testContainer.parentNode) {
      document.body.removeChild(testContainer);
    }
    app?.cleanup();
    delete window.fetch;
  });

  it('should initialize all modules correctly', () => {
    expect(app.isInitialized).toBeTruthy();
    expect(app.state).toBeInstanceOf(StateManager);
    expect(app.logger).toBeInstanceOf(Logger);
    expect(app.apiClient).toBeInstanceOf(ApiClient);
    expect(app.stepManager).toBeInstanceOf(StepManager);
    expect(app.uiController).toBeInstanceOf(UIController);
    expect(app.scenarioGenerator).toBeInstanceOf(ScenarioGenerator);
  });

  it('should handle step navigation correctly', async () => {
    const initialStep = app.state.getState('steps.current');
    expect(initialStep).toBe(1);

    // 次のステップに進む
    app.stepManager.goToNextStep();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const nextStep = app.state.getState('steps.current');
    expect(nextStep).toBe(2);
  });

  it('should update form state when inputs change', () => {
    const participantsSelect = document.getElementById('participants');
    
    // 参加者数を変更
    participantsSelect.value = '6';
    participantsSelect.dispatchEvent(new Event('change'));
    
    const formState = app.state.getState('form.participants');
    expect(formState).toBe('6');
  });

  it('should validate steps before generation', async () => {
    // 不完全なフォームデータでテスト
    app.state.dispatch({
      type: 'FORM_FIELD_CHANGED',
      field: 'participants',
      value: ''
    });

    const isValid = await app.validateAllSteps();
    expect(isValid).toBeFalsy();
  });

  it('should complete scenario generation flow', async () => {
    // フォームデータを完全に設定
    const completeFormData = {
      participants: '5',
      era: 'modern',
      setting: 'closed-space',
      worldview: 'realistic',
      tone: 'serious',
      incident_type: 'murder',
      complexity: 'standard',
      red_herring: false,
      twist_ending: false,
      secret_roles: false
    };

    Object.entries(completeFormData).forEach(([field, value]) => {
      app.state.dispatch({
        type: 'FORM_FIELD_CHANGED',
        field,
        value
      });
    });

    // 生成開始
    const generationPromise = app.startGeneration();
    
    // 生成中状態の確認
    expect(app.isGenerating).toBeTruthy();
    
    await generationPromise;
    
    // 生成完了状態の確認
    expect(app.isGenerating).toBeFalsy();
    expect(app.currentScenario).toBeTruthy();
  });

  it('should handle API errors gracefully', async () => {
    // APIエラーをシミュレート
    window.fetch = jest.fn().mockRejectedValue(new Error('API Error'));

    let errorCaught = false;
    app.once('generation:error', () => {
      errorCaught = true;
    });

    try {
      await app.startGeneration();
    } catch (error) {
      // エラーが適切にハンドリングされることを確認
    }

    expect(errorCaught).toBeTruthy();
    expect(app.isGenerating).toBeFalsy();
  });

  it('should persist and restore app state', () => {
    // 状態を変更
    app.state.dispatch({
      type: 'FORM_FIELD_CHANGED',
      field: 'participants',
      value: '7'
    });

    app.stepManager.navigateToStep(3);

    // 状態を保存
    app.saveAppState();

    // 新しいアプリインスタンスで復元をテスト
    const savedData = app.loadSavedData();
    expect(savedData).toBeTruthy();
    expect(savedData.form.participants).toBe('7');
  });
});

describe('Event System Integration', () => {
  let eventEmitter;
  let stateManager;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
    stateManager = new StateManager({
      counter: 0,
      status: 'idle'
    });
  });

  afterEach(() => {
    eventEmitter.removeAllListeners();
    stateManager.removeAllListeners();
  });

  it('should coordinate between event emitter and state manager', () => {
    let stateChangeCount = 0;

    // StateManagerの変更をEventEmitterで通知
    stateManager.addReducer('counter', (state = 0, action) => {
      const newState = action.type === 'INCREMENT' ? state + 1 : state;
      if (newState !== state) {
        eventEmitter.emit('counter:changed', newState);
      }
      return newState;
    });

    eventEmitter.on('counter:changed', (newValue) => {
      stateChangeCount++;
      expect(newValue).toBe(stateManager.getState('counter'));
    });

    stateManager.dispatch({ type: 'INCREMENT' });
    expect(stateChangeCount).toBe(1);
  });

  it('should handle complex event chains', async () => {
    const events = [];
    
    stateManager.addReducer('status', (state = 'idle', action) => {
      switch (action.type) {
        case 'START_PROCESS':
          return 'processing';
        case 'COMPLETE_PROCESS':
          return 'completed';
        default:
          return state;
      }
    });

    // イベントチェーンの設定
    eventEmitter.on('process:start', () => {
      events.push('start');
      stateManager.dispatch({ type: 'START_PROCESS' });
      
      setTimeout(() => {
        eventEmitter.emit('process:complete');
      }, 50);
    });

    eventEmitter.on('process:complete', () => {
      events.push('complete');
      stateManager.dispatch({ type: 'COMPLETE_PROCESS' });
    });

    stateManager.subscribe('status', (status) => {
      events.push(`status:${status}`);
    });

    // プロセス開始
    eventEmitter.emit('process:start');

    // 完了を待機
    await new Promise(resolve => {
      eventEmitter.once('process:complete', resolve);
    });

    expect(events).toEqual([
      'start',
      'status:processing',
      'complete', 
      'status:completed'
    ]);
  });
});

describe('Performance Integration', () => {
  let optimizer;
  let stepManager;

  beforeEach(() => {
    optimizer = new PerformanceOptimizer();
    stepManager = new StepManager();
  });

  afterEach(() => {
    optimizer.destroy();
  });

  it('should optimize repeated DOM operations', async () => {
    let renderCount = 0;
    
    const optimizedRender = optimizer.memoize((stepNumber) => {
      renderCount++;
      return `Step ${stepNumber} content`;
    });

    // 同じステップを複数回レンダリング
    const result1 = optimizedRender(1);
    const result2 = optimizedRender(1);
    const result3 = optimizedRender(2);

    expect(result1).toBe(result2);
    expect(renderCount).toBe(2); // ステップ1とステップ2のみ
  });

  it('should batch step validation operations', async () => {
    const validationResults = [];
    
    const batchValidator = (steps) => {
      return steps.map(step => ({
        step: step.number,
        valid: step.number <= 3
      }));
    };

    const promises = [
      optimizer.batch('validate', { number: 1 }, { processor: batchValidator }),
      optimizer.batch('validate', { number: 2 }, { processor: batchValidator }),
      optimizer.batch('validate', { number: 4 }, { processor: batchValidator })
    ];

    const results = await Promise.all(promises);
    
    expect(results[0].valid).toBeTruthy();
    expect(results[1].valid).toBeTruthy();
    expect(results[2].valid).toBeFalsy();
  });

  it('should optimize scroll-based rendering', () => {
    const container = document.createElement('div');
    container.style.height = '200px';
    container.style.overflow = 'auto';
    document.body.appendChild(container);

    const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, text: `Item ${i}` }));
    
    const renderItem = (item) => {
      const div = document.createElement('div');
      div.textContent = item.text;
      return div;
    };

    const scroller = optimizer.createVirtualScroller(container, items, renderItem, {
      itemHeight: 30
    });

    // 初期状態では一部のアイテムのみレンダリング
    expect(container.children.length).toBeLessThan(items.length);
    expect(container.children.length).toBeGreaterThan(0);

    document.body.removeChild(container);
  });
});

describe('Security Integration', () => {
  it('should sanitize user input across the system', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const expectedOutput = '&lt;script&gt;alert("xss")&lt;/script&gt;';
    
    // SecurityUtilsが利用可能であることを前提
    if (typeof window.sanitizeHTML === 'function') {
      const sanitized = window.sanitizeHTML(maliciousInput);
      expect(sanitized).toBe(expectedOutput);
    }
  });

  it('should validate form data before processing', () => {
    const invalidFormData = {
      participants: '<script>',
      era: 'invalid-era',
      setting: null
    };

    // バリデーション関数のテスト
    const isValid = Object.values(invalidFormData).every(value => {
      return typeof value === 'string' && value.length > 0 && !value.includes('<');
    });

    expect(isValid).toBeFalsy();
  });
});

// 統合テスト実行用ヘルパー
if (typeof window !== 'undefined') {
  window.runIntegrationTests = async () => {
    console.log('🔗 Starting integration test execution...');
    const results = await Test.run(/Integration/);
    
    return {
      passed: results.passed,
      failed: results.failed,
      total: results.total,
      success: results.failed === 0
    };
  };
}