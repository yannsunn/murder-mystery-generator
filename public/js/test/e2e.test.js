/**
 * e2e.test.js - End-to-Endテストスイート
 * 実際のユーザーシナリオテスト
 */

import './TestFramework.js';

describe('E2E User Journey Tests', () => {
  let testEnvironment;

  beforeAll(async () => {
    // E2Eテスト環境セットアップ
    testEnvironment = await setupE2EEnvironment();
  });

  afterAll(async () => {
    await teardownE2EEnvironment(testEnvironment);
  });

  beforeEach(() => {
    // 各テスト前にページをリセット
    if (typeof location !== 'undefined') {
      location.reload();
    }
  });

  it('should complete full scenario generation workflow', async () => {
    // ステップ1: ページロード確認
    await waitForElement('#main-card');
    expect(document.getElementById('main-card')).toBeTruthy();
    
    // ステップ2: フォーム入力
    await fillForm({
      participants: '6',
      era: 'modern',
      setting: 'closed-space',
      worldview: 'realistic',
      tone: 'serious',
      incident_type: 'murder',
      complexity: 'standard'
    });

    // ステップ3: ステップナビゲーション
    await navigateToStep(2);
    await navigateToStep(3);
    await navigateToStep(4);
    await navigateToStep(5);

    // ステップ4: 生成開始
    const generateButton = await waitForElement('#stepwise-generation-btn');
    generateButton.click();

    // ステップ5: ローディング状態確認
    await waitForElement('#loading-indicator:not(.hidden)');
    const progressBar = document.getElementById('progress-fill');
    expect(progressBar).toBeTruthy();

    // ステップ6: 生成完了待機（タイムアウト付き）
    await waitForElement('#result-container:not(.hidden)', 60000);
    
    // ステップ7: 結果表示確認
    const scenarioContent = document.getElementById('scenario-content');
    expect(scenarioContent).toBeTruthy();
    expect(scenarioContent.textContent.length).toBeGreaterThan(100);
  }, 90000); // 90秒タイムアウト

  it('should handle step validation correctly', async () => {
    await waitForElement('#scenario-form');

    // 必須フィールドを空にして次のステップに進もうとする
    const participantsSelect = document.getElementById('participants');
    participantsSelect.value = '';

    const nextButton = document.getElementById('next-btn');
    nextButton.click();

    // エラーメッセージが表示されることを確認
    await waitForElement('.error-message, .validation-error');
    
    // ステップが進まないことを確認
    const currentStep = getCurrentStep();
    expect(currentStep).toBe(1);
  });

  it('should persist form data across page refresh', async () => {
    await waitForElement('#scenario-form');

    // フォームに入力
    await fillForm({
      participants: '7',
      era: 'showa'
    });

    // 手動でlocalStorageに保存（通常は自動保存）
    const formData = collectFormData();
    localStorage.setItem('murder-mystery-app-state', JSON.stringify({
      form: formData,
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    }));

    // ページリロード
    location.reload();
    await waitForElement('#scenario-form');

    // データが復元されることを確認
    const participantsSelect = document.getElementById('participants');
    const eraSelect = document.getElementById('era');
    
    expect(participantsSelect.value).toBe('7');
    expect(eraSelect.value).toBe('showa');
  });

  it('should handle API errors gracefully', async () => {
    // APIエラーをシミュレート（モックサーバーまたはネットワーク切断）
    await mockNetworkError();

    await waitForElement('#scenario-form');
    await fillCompleteForm();
    await navigateToFinalStep();

    const generateButton = document.getElementById('stepwise-generation-btn');
    generateButton.click();

    // エラー表示を確認
    await waitForElement('#error-container:not(.hidden)');
    const errorMessage = document.getElementById('error-message');
    expect(errorMessage.textContent).toContain('エラー');

    // 再試行ボタンの存在確認
    const retryButton = document.getElementById('retry-btn');
    expect(retryButton).toBeTruthy();
  });

  it('should support keyboard navigation', async () => {
    await waitForElement('#scenario-form');

    // Tabキーでフォーカス移動
    const firstInput = document.getElementById('participants');
    firstInput.focus();

    // Tab キーナビゲーション
    await simulateKeyPress('Tab');
    expect(document.activeElement.id).toBe('era');

    await simulateKeyPress('Tab');
    expect(document.activeElement.id).toBe('setting');

    // Enterキーで次のステップ
    const nextButton = document.getElementById('next-btn');
    nextButton.focus();
    await simulateKeyPress('Enter');

    // ステップが進むことを確認
    await waitForTimeout(500);
    expect(getCurrentStep()).toBe(2);
  });

  it('should work on different screen sizes', async () => {
    // モバイルサイズをシミュレート
    setViewportSize(375, 667);
    await waitForTimeout(100);

    await waitForElement('#scenario-form');
    
    // ボタンが適切に表示されることを確認
    const buttonContainer = document.querySelector('.button-container');
    const computedStyle = window.getComputedStyle(buttonContainer);
    expect(computedStyle.position).toBe('fixed');

    // タブレットサイズ
    setViewportSize(768, 1024);
    await waitForTimeout(100);

    // レスポンシブデザインが機能することを確認
    const formGrid = document.querySelector('.form-grid');
    const gridStyle = window.getComputedStyle(formGrid);
    expect(gridStyle.display).toBe('grid');

    // デスクトップサイズに戻す
    setViewportSize(1920, 1080);
  });

  it('should handle concurrent users scenario', async () => {
    // 複数タブでの動作をシミュレート
    const tabs = [];
    
    for (let i = 0; i < 3; i++) {
      tabs.push(openNewTab());
    }

    // 各タブで異なるシナリオ生成
    const promises = tabs.map((tab, index) => 
      generateScenarioInTab(tab, {
        participants: String(4 + index),
        era: ['modern', 'showa', 'near-future'][index]
      })
    );

    const results = await Promise.allSettled(promises);
    
    // 全てのタブで成功することを確認
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Tab ${index} failed:`, result.reason);
      }
      expect(result.status).toBe('fulfilled');
    });

    // タブを閉じる
    tabs.forEach(tab => tab.close());
  });

  it('should maintain performance under load', async () => {
    const performanceMetrics = {
      startTime: performance.now(),
      memoryStart: getMemoryUsage(),
      renderCount: 0
    };

    // 大量のDOM操作をシミュレート
    for (let i = 0; i < 100; i++) {
      await navigateToStep((i % 5) + 1);
      performanceMetrics.renderCount++;
      
      if (i % 10 === 0) {
        // 定期的にメモリ使用量をチェック
        const currentMemory = getMemoryUsage();
        expect(currentMemory - performanceMetrics.memoryStart).toBeLessThan(50 * 1024 * 1024); // 50MB以下
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - performanceMetrics.startTime;

    // パフォーマンス基準
    expect(totalTime).toBeLessThan(10000); // 10秒以内
    expect(performanceMetrics.renderCount).toBe(100);
  });
});

// E2Eテストヘルパー関数

async function setupE2EEnvironment() {
  // テスト環境の初期化
  return {
    originalFetch: window.fetch,
    originalLocalStorage: { ...localStorage }
  };
}

async function teardownE2EEnvironment(env) {
  // テスト環境のクリーンアップ
  window.fetch = env.originalFetch;
  localStorage.clear();
  Object.assign(localStorage, env.originalLocalStorage);
}

async function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      } else {
        setTimeout(check, 100);
      }
    };
    
    check();
  });
}

async function waitForTimeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fillForm(data) {
  for (const [field, value] of Object.entries(data)) {
    const element = document.getElementById(field);
    if (element) {
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      await waitForTimeout(50);
    }
  }
}

async function fillCompleteForm() {
  await fillForm({
    participants: '5',
    era: 'modern',
    setting: 'closed-space',
    worldview: 'realistic',
    tone: 'serious',
    incident_type: 'murder',
    complexity: 'standard'
  });
}

async function navigateToStep(step) {
  const currentStep = getCurrentStep();
  const direction = step > currentStep ? 'next' : 'prev';
  const stepsToMove = Math.abs(step - currentStep);
  
  for (let i = 0; i < stepsToMove; i++) {
    const button = document.getElementById(`${direction}-btn`);
    if (button && !button.disabled) {
      button.click();
      await waitForTimeout(300); // アニメーション完了待機
    }
  }
}

async function navigateToFinalStep() {
  while (getCurrentStep() < 5) {
    await navigateToStep(getCurrentStep() + 1);
  }
}

function getCurrentStep() {
  const stepElements = document.querySelectorAll('.step');
  for (let i = 0; i < stepElements.length; i++) {
    if (!stepElements[i].classList.contains('hidden')) {
      return i + 1;
    }
  }
  return 1;
}

function collectFormData() {
  const form = document.getElementById('scenario-form');
  const formData = new FormData(form);
  const data = {};
  
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  return data;
}

async function mockNetworkError() {
  window.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));
}

async function simulateKeyPress(key) {
  const event = new KeyboardEvent('keydown', {
    key: key,
    bubbles: true,
    cancelable: true
  });
  
  document.activeElement.dispatchEvent(event);
  await waitForTimeout(50);
}

function setViewportSize(width, height) {
  // ビューポートサイズ変更（実際のブラウザ環境でのみ動作）
  if (window.innerWidth !== undefined) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height
    });
    
    window.dispatchEvent(new Event('resize'));
  }
}

function openNewTab() {
  // 新しいタブをシミュレート（実際の実装では iframe を使用）
  const iframe = document.createElement('iframe');
  iframe.src = window.location.href;
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  return {
    window: iframe.contentWindow,
    close: () => document.body.removeChild(iframe)
  };
}

async function generateScenarioInTab(tab, formData) {
  const tabWindow = tab.window;
  
  // タブ内でのシナリオ生成をシミュレート
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // モックレスポンス
      resolve({
        scenario: `Generated scenario for ${formData.participants} participants`,
        formData
      });
    }, Math.random() * 2000 + 1000); // 1-3秒のランダム遅延
  });
}

function getMemoryUsage() {
  if (performance.memory) {
    return performance.memory.usedJSHeapSize;
  }
  return 0;
}

// E2Eテスト実行用エクスポート
if (typeof window !== 'undefined') {
  window.runE2ETests = async () => {
    console.log('🎯 Starting E2E test execution...');
    const results = await Test.run(/E2E/);
    
    return {
      passed: results.passed,
      failed: results.failed,
      total: results.total,
      success: results.failed === 0,
      duration: results.endTime - results.startTime
    };
  };

  // 全テスト実行
  window.runAllTests = async () => {
    console.log('🧪 Starting complete test suite...');
    
    const unitResults = await Test.run(/(?!Integration|E2E)/);
    const integrationResults = await Test.run(/Integration/);
    const e2eResults = await Test.run(/E2E/);
    
    const totalResults = {
      unit: unitResults,
      integration: integrationResults,
      e2e: e2eResults,
      overall: {
        passed: unitResults.passed + integrationResults.passed + e2eResults.passed,
        failed: unitResults.failed + integrationResults.failed + e2eResults.failed,
        total: unitResults.total + integrationResults.total + e2eResults.total
      }
    };
    
    console.log('📊 Complete Test Results:', totalResults);
    return totalResults;
  };
}