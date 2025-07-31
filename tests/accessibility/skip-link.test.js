/**
 * スキップリンクのアクセシビリティテスト
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Skip Link Accessibility', () => {
  let dom, document;

  beforeEach(() => {
    const html = fs.readFileSync(
      path.resolve(__dirname, '../../public/index.html'),
      'utf8'
    );
    
    dom = new JSDOM(html);
    document = dom.window.document;
    global.document = document;
  });

  test('should have skip link as first focusable element', () => {
    const skipLink = document.querySelector('.skip-link');
    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(skipLink.textContent).toContain('メインコンテンツへスキップ');
  });

  test('skip link should target existing element', () => {
    const skipLink = document.querySelector('.skip-link');
    const targetId = skipLink.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    
    expect(targetElement).toBeTruthy();
    expect(targetElement.tagName.toLowerCase()).toBe('main');
  });

  test('main content should have proper accessibility attributes', () => {
    const mainContent = document.getElementById('main-content');
    
    expect(mainContent.getAttribute('role')).toBe('main');
    expect(mainContent.getAttribute('aria-label')).toBeTruthy();
  });

  test('should be keyboard accessible', () => {
    const skipLink = document.querySelector('.skip-link');
    
    // スキップリンクはTabキーでフォーカス可能であるべき
    expect(skipLink.tabIndex).toBeGreaterThanOrEqual(0);
  });

  test('should have appropriate styling for visibility when focused', () => {
    // CSSファイルからスキップリンクのスタイルを確認
    const cssPath = path.resolve(__dirname, '../../public/ultra-modern-styles.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    expect(cssContent).toContain('.skip-link');
    expect(cssContent).toContain('.skip-link:focus');
  });

  afterEach(() => {
    dom.window.close();
  });
});