/**
 * フロントエンドUIテスト
 * Jest + jsdom を使用
 */

// Mock DOM環境
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// HTMLファイルを読み込み
const html = fs.readFileSync(
  path.resolve(__dirname, '../../public/index.html'),
  'utf8'
);

let dom;

beforeEach(() => {
  dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
});

afterEach(() => {
  dom.window.close();
});

describe('UI Component Tests', () => {
  test('should have proper semantic HTML structure', () => {
    // メインコンテンツのセマンティック構造をテスト
    const main = document.querySelector('main');
    expect(main).toBeTruthy();
    expect(main.getAttribute('role')).toBe('main');
    
    const skipLink = document.querySelector('.skip-link');
    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
  });

  test('should have accessible form labels', () => {
    // フォームのアクセシビリティをテスト
    const participantsInput = document.getElementById('participants');
    const participantsLabel = document.querySelector('label[for="participants"]');
    
    expect(participantsInput).toBeTruthy();
    expect(participantsLabel).toBeTruthy();
    expect(participantsInput.getAttribute('aria-describedby')).toBe('participants-hint');
  });

  test('should have proper ARIA attributes', () => {
    // ARIA属性のテスト
    const progressBar = document.querySelector('.progress-container');
    expect(progressBar.getAttribute('role')).toBe('progressbar');
    expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
  });

  test('should handle form validation', () => {
    // フォームバリデーションのテスト
    const form = document.getElementById('scenario-form');
    const requiredFields = form.querySelectorAll('[required]');
    
    expect(requiredFields.length).toBeGreaterThan(0);
    
    requiredFields.forEach(field => {
      expect(field.hasAttribute('required')).toBe(true);
    });
  });
});

describe('Accessibility Tests', () => {
  test('should support keyboard navigation', () => {
    // キーボードナビゲーションのテスト
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    focusableElements.forEach(element => {
      // フォーカス可能な要素は適切なタブインデックスを持つべき
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex !== null) {
        expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(-1);
      }
    });
  });

  test('should have proper heading hierarchy', () => {
    // 見出し階層のテスト
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings.length).toBeGreaterThan(0);
    
    // H1が1つだけあることを確認
    const h1Elements = document.querySelectorAll('h1');
    expect(h1Elements.length).toBe(1);
  });

  test('should have alt text for images', () => {
    // 画像のalt属性テスト
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      expect(img.hasAttribute('alt')).toBe(true);
    });
  });
});

describe('Performance Tests', () => {
  test('should load critical CSS inline', () => {
    // クリティカルCSSのインライン化をテスト
    const inlineStyles = document.querySelectorAll('style');
    expect(inlineStyles.length).toBeGreaterThan(0);
  });

  test('should use preload for non-critical resources', () => {
    // リソースのプリロードをテスト
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    expect(preloadLinks.length).toBeGreaterThan(0);
  });

  test('should defer non-critical JavaScript', () => {
    // JavaScriptの遅延読み込みをテスト
    const deferredScripts = document.querySelectorAll('script[defer]');

    expect(deferredScripts.length).toBeGreaterThan(0);
  });
});

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};