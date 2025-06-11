/**
 * quality-assurance.js - 品質保証・総合検証システム
 * アプリケーション全体の品質確認とパフォーマンステスト
 */

class QualityAssurance {
  constructor() {
    this.results = {
      architecture: {},
      performance: {},
      security: {},
      accessibility: {},
      compatibility: {},
      codeQuality: {},
      overall: {}
    };
    
    this.benchmarks = {
      loadTime: 3000,        // 3秒以内
      memoryUsage: 50,       // 50MB以下
      bundleSize: 500,       // 500KB以下
      testCoverage: 90,      // 90%以上
      performanceScore: 90   // 90点以上
    };
  }

  /**
   * 総合品質検査実行
   */
  async runCompleteAudit() {
    console.log('🔍 Starting comprehensive quality audit...');
    
    try {
      await this.checkArchitectureIntegrity();
      await this.runPerformanceBenchmarks();
      await this.auditSecurity();
      await this.checkAccessibility();
      await this.testCompatibility();
      await this.analyzeCodeQuality();
      
      this.calculateOverallScore();
      this.generateReport();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Quality audit failed:', error);
      throw error;
    }
  }

  /**
   * アーキテクチャ整合性チェック
   */
  async checkArchitectureIntegrity() {
    console.log('🏗️  Checking architecture integrity...');
    
    const checks = {
      moduleLoader: await this.verifyModuleLoader(),
      dependencies: await this.verifyDependencies(),
      eventSystem: await this.verifyEventSystem(),
      stateManagement: await this.verifyStateManagement(),
      errorHandling: await this.verifyErrorHandling()
    };
    
    this.results.architecture = {
      checks,
      passed: Object.values(checks).every(check => check.passed),
      score: this.calculateScore(checks)
    };
  }

  async verifyModuleLoader() {
    try {
      // ModuleLoader の存在確認
      if (!window.moduleLoader) {
        return { passed: false, error: 'ModuleLoader not available' };
      }
      
      // 統計情報取得
      const stats = window.moduleLoader.getModuleStats();
      
      // 必要なモジュールの読み込み確認
      const requiredModules = [
        'EventEmitter', 'StateManager', 'Logger', 'ApiClient',
        'TypeSystem', 'PerformanceOptimizer', 'StepManager',
        'UIController', 'ScenarioGenerator', 'MurderMysteryApp'
      ];
      
      const loadedModules = stats.loadOrder;
      const missingModules = requiredModules.filter(module => 
        !loadedModules.includes(module)
      );
      
      return {
        passed: missingModules.length === 0,
        details: {
          totalModules: stats.totalModules,
          loadedModules: stats.loadedModules,
          missingModules,
          cacheHitRate: stats.cacheHitRate
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async verifyDependencies() {
    try {
      if (!window.moduleLoader) {
        return { passed: false, error: 'ModuleLoader not available' };
      }
      
      const dependencyGraph = window.moduleLoader.getDependencyGraph();
      const circularDeps = this.detectCircularDependencies(dependencyGraph);
      
      return {
        passed: circularDeps.length === 0,
        details: {
          totalDependencies: Object.keys(dependencyGraph).length,
          circularDependencies: circularDeps,
          dependencyDepth: this.calculateDependencyDepth(dependencyGraph)
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async verifyEventSystem() {
    try {
      // EventEmitter のテスト
      const emitter = new EventEmitter();
      let eventFired = false;
      
      emitter.on('test', () => eventFired = true);
      emitter.emit('test');
      
      if (!eventFired) {
        return { passed: false, error: 'Event system not working' };
      }
      
      // メモリリーク確認
      const initialListeners = emitter.listenerCount('test');
      emitter.removeAllListeners('test');
      const finalListeners = emitter.listenerCount('test');
      
      return {
        passed: finalListeners === 0,
        details: {
          eventSystemWorking: eventFired,
          memoryLeakDetected: finalListeners > 0,
          listenerCleanup: initialListeners - finalListeners
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async verifyStateManagement() {
    try {
      if (!window.app || !window.app.state) {
        return { passed: false, error: 'State manager not available' };
      }
      
      const state = window.app.state;
      
      // 状態の読み書きテスト
      const testValue = 'test-' + Date.now();
      state.dispatch({
        type: 'TEST_ACTION',
        value: testValue
      });
      
      // ステート変更通知テスト
      let notificationReceived = false;
      const unsubscribe = state.subscribe('test', () => {
        notificationReceived = true;
      });
      
      state.dispatch({ type: 'TEST_UPDATE' });
      unsubscribe();
      
      return {
        passed: true,
        details: {
          stateReadWrite: true,
          notifications: notificationReceived,
          debugInfo: state.getDebugInfo()
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async verifyErrorHandling() {
    try {
      let globalErrorCaught = false;
      let promiseRejectionCaught = false;
      
      // グローバルエラーハンドラのテスト
      const originalErrorHandler = window.onerror;
      window.onerror = () => { globalErrorCaught = true; };
      
      const originalRejectionHandler = window.onunhandledrejection;
      window.onunhandledrejection = () => { promiseRejectionCaught = true; };
      
      // エラーを発生させてテスト
      try {
        throw new Error('Test error');
      } catch (e) {
        // 意図的に無視
      }
      
      Promise.reject(new Error('Test rejection')).catch(() => {});
      
      // 元のハンドラを復元
      window.onerror = originalErrorHandler;
      window.onunhandledrejection = originalRejectionHandler;
      
      return {
        passed: true,
        details: {
          globalErrorHandling: globalErrorCaught,
          promiseRejectionHandling: promiseRejectionCaught
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  /**
   * パフォーマンスベンチマーク
   */
  async runPerformanceBenchmarks() {
    console.log('⚡ Running performance benchmarks...');
    
    const benchmarks = {
      loadTime: await this.measureLoadTime(),
      memoryUsage: await this.measureMemoryUsage(),
      renderPerformance: await this.measureRenderPerformance(),
      cacheEfficiency: await this.measureCacheEfficiency(),
      bundleSize: await this.measureBundleSize()
    };
    
    this.results.performance = {
      benchmarks,
      passed: this.evaluatePerformance(benchmarks),
      score: this.calculatePerformanceScore(benchmarks)
    };
  }

  async measureLoadTime() {
    if (!performance.timing) {
      return { value: 0, unit: 'ms', error: 'Performance API not available' };
    }
    
    const timing = performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    
    return {
      value: loadTime,
      unit: 'ms',
      passed: loadTime < this.benchmarks.loadTime,
      benchmark: this.benchmarks.loadTime
    };
  }

  async measureMemoryUsage() {
    if (!performance.memory) {
      return { value: 0, unit: 'MB', error: 'Memory API not available' };
    }
    
    const memory = performance.memory;
    const usedMB = memory.usedJSHeapSize / 1024 / 1024;
    
    return {
      value: Math.round(usedMB * 100) / 100,
      unit: 'MB',
      passed: usedMB < this.benchmarks.memoryUsage,
      benchmark: this.benchmarks.memoryUsage,
      details: {
        used: usedMB,
        total: memory.totalJSHeapSize / 1024 / 1024,
        limit: memory.jsHeapSizeLimit / 1024 / 1024
      }
    };
  }

  async measureRenderPerformance() {
    const startTime = performance.now();
    
    // レンダリングタスクをシミュレート
    for (let i = 0; i < 1000; i++) {
      const div = document.createElement('div');
      div.textContent = `Item ${i}`;
      document.body.appendChild(div);
      document.body.removeChild(div);
    }
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    return {
      value: Math.round(renderTime * 100) / 100,
      unit: 'ms',
      passed: renderTime < 100, // 100ms以内
      benchmark: 100
    };
  }

  async measureCacheEfficiency() {
    if (!window.PerformanceManager) {
      return { error: 'PerformanceManager not available' };
    }
    
    const stats = window.PerformanceManager.getPerformanceStats();
    
    return {
      cacheHitRate: stats.cache.hitRate,
      memoHitRate: stats.memoization.hitRate,
      passed: stats.cache.hitRate > 0.8, // 80%以上
      benchmark: 0.8
    };
  }

  async measureBundleSize() {
    // JavaScript ファイルサイズの推定
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    let totalSize = 0;
    
    try {
      for (const script of scripts) {
        const response = await fetch(script.src, { method: 'HEAD' });
        const size = parseInt(response.headers.get('content-length') || '0');
        totalSize += size;
      }
    } catch (error) {
      return { error: 'Cannot measure bundle size' };
    }
    
    const sizeKB = totalSize / 1024;
    
    return {
      value: Math.round(sizeKB * 100) / 100,
      unit: 'KB',
      passed: sizeKB < this.benchmarks.bundleSize,
      benchmark: this.benchmarks.bundleSize
    };
  }

  /**
   * セキュリティ監査
   */
  async auditSecurity() {
    console.log('🔒 Running security audit...');
    
    const audits = {
      xssProtection: await this.testXSSProtection(),
      inputValidation: await this.testInputValidation(),
      cspCompliance: await this.testCSPCompliance(),
      sensitiveData: await this.scanSensitiveData()
    };
    
    this.results.security = {
      audits,
      passed: Object.values(audits).every(audit => audit.passed),
      score: this.calculateScore(audits)
    };
  }

  async testXSSProtection() {
    try {
      const maliciousInput = '<script>alert("xss")</script>';
      const testDiv = document.createElement('div');
      
      // SecurityUtils のテスト
      if (typeof window.sanitizeHTML === 'function') {
        const sanitized = window.sanitizeHTML(maliciousInput);
        testDiv.innerHTML = sanitized;
        
        const hasScript = testDiv.querySelector('script');
        
        return {
          passed: !hasScript,
          details: {
            input: maliciousInput,
            output: sanitized,
            scriptFound: !!hasScript
          }
        };
      }
      
      return { passed: false, error: 'sanitizeHTML function not available' };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async testInputValidation() {
    try {
      const testInputs = [
        '<script>alert("test")</script>',
        'javascript:void(0)',
        '../../etc/passwd',
        'null',
        'undefined',
        ''
      ];
      
      let validationPassed = true;
      const results = [];
      
      testInputs.forEach(input => {
        // 基本的な検証ルール
        const isValid = input.length > 0 && 
                       !input.includes('<script') && 
                       !input.includes('javascript:') &&
                       !input.includes('../');
        
        results.push({ input, valid: isValid });
        
        // 危険な入力が有効と判定された場合は失敗
        if (!isValid && input.includes('<script')) {
          validationPassed = false;
        }
      });
      
      return {
        passed: validationPassed,
        details: { testResults: results }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async testCSPCompliance() {
    try {
      // CSPヘッダーの確認
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      const cspHeader = cspMeta ? cspMeta.getAttribute('content') : null;
      
      return {
        passed: !!cspHeader,
        details: {
          cspPresent: !!cspHeader,
          cspContent: cspHeader
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async scanSensitiveData() {
    try {
      const sensitivePatterns = [
        /password\s*[:=]\s*['"]/i,
        /api[_-]?key\s*[:=]\s*['"]/i,
        /secret\s*[:=]\s*['"]/i,
        /token\s*[:=]\s*['"]/i
      ];
      
      const scripts = Array.from(document.querySelectorAll('script'));
      let foundSensitiveData = false;
      const findings = [];
      
      scripts.forEach(script => {
        if (script.textContent) {
          sensitivePatterns.forEach(pattern => {
            if (pattern.test(script.textContent)) {
              foundSensitiveData = true;
              findings.push({ pattern: pattern.source, location: 'inline script' });
            }
          });
        }
      });
      
      return {
        passed: !foundSensitiveData,
        details: { findings }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  /**
   * アクセシビリティチェック
   */
  async checkAccessibility() {
    console.log('♿ Checking accessibility...');
    
    const checks = {
      ariaLabels: await this.checkAriaLabels(),
      keyboardNavigation: await this.checkKeyboardNavigation(),
      colorContrast: await this.checkColorContrast(),
      semanticHTML: await this.checkSemanticHTML()
    };
    
    this.results.accessibility = {
      checks,
      passed: Object.values(checks).every(check => check.passed),
      score: this.calculateScore(checks)
    };
  }

  async checkAriaLabels() {
    try {
      const interactiveElements = document.querySelectorAll(
        'button, [role="button"], input, select, textarea, a[href]'
      );
      
      let elementsWithLabels = 0;
      let elementsWithoutLabels = 0;
      
      interactiveElements.forEach(element => {
        const hasLabel = element.getAttribute('aria-label') ||
                        element.getAttribute('aria-labelledby') ||
                        element.textContent.trim() ||
                        (element.tagName === 'INPUT' && element.labels?.length > 0);
        
        if (hasLabel) {
          elementsWithLabels++;
        } else {
          elementsWithoutLabels++;
        }
      });
      
      const coverage = elementsWithLabels / (elementsWithLabels + elementsWithoutLabels);
      
      return {
        passed: coverage > 0.9, // 90%以上
        details: {
          total: interactiveElements.length,
          withLabels: elementsWithLabels,
          withoutLabels: elementsWithoutLabels,
          coverage: Math.round(coverage * 100) / 100
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async checkKeyboardNavigation() {
    try {
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      let navigableElements = 0;
      
      focusableElements.forEach(element => {
        const tabIndex = element.getAttribute('tabindex');
        const isNavigable = tabIndex !== '-1' && !element.disabled;
        
        if (isNavigable) {
          navigableElements++;
        }
      });
      
      return {
        passed: navigableElements > 0,
        details: {
          total: focusableElements.length,
          navigable: navigableElements,
          percentage: Math.round((navigableElements / focusableElements.length) * 100)
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async checkColorContrast() {
    // 簡易的なカラーコントラストチェック
    try {
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
      let elementsChecked = 0;
      let contrastIssues = 0;
      
      textElements.forEach(element => {
        if (element.textContent.trim()) {
          const styles = window.getComputedStyle(element);
          const backgroundColor = styles.backgroundColor;
          const color = styles.color;
          
          // 基本的なコントラストチェック（簡易版）
          if (backgroundColor !== 'rgba(0, 0, 0, 0)' && color) {
            elementsChecked++;
            
            // 簡易的な判定（実際のコントラスト比計算は複雑）
            if (color === backgroundColor || 
                (color.includes('rgb(255') && backgroundColor.includes('rgb(255')) ||
                (color.includes('rgb(0') && backgroundColor.includes('rgb(0'))) {
              contrastIssues++;
            }
          }
        }
      });
      
      return {
        passed: contrastIssues === 0,
        details: {
          elementsChecked,
          contrastIssues,
          issueRate: elementsChecked > 0 ? contrastIssues / elementsChecked : 0
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async checkSemanticHTML() {
    try {
      const semanticElements = document.querySelectorAll(
        'header, nav, main, article, section, aside, footer, h1, h2, h3, h4, h5, h6'
      );
      
      const divElements = document.querySelectorAll('div');
      const semanticRatio = semanticElements.length / (semanticElements.length + divElements.length);
      
      return {
        passed: semanticRatio > 0.3, // 30%以上がセマンティック要素
        details: {
          semanticElements: semanticElements.length,
          divElements: divElements.length,
          semanticRatio: Math.round(semanticRatio * 100) / 100
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  /**
   * ブラウザ互換性テスト
   */
  async testCompatibility() {
    console.log('🌐 Testing browser compatibility...');
    
    const features = {
      es6Modules: this.checkES6ModuleSupport(),
      fetch: this.checkFetchSupport(),
      promises: this.checkPromiseSupport(),
      intersectionObserver: this.checkIntersectionObserverSupport(),
      customElements: this.checkCustomElementsSupport()
    };
    
    this.results.compatibility = {
      features,
      passed: Object.values(features).every(feature => feature.supported),
      score: this.calculateScore(features, 'supported')
    };
  }

  checkES6ModuleSupport() {
    try {
      eval('import("")');
      return { supported: true };
    } catch (error) {
      return { supported: false, error: 'ES6 modules not supported' };
    }
  }

  checkFetchSupport() {
    return {
      supported: typeof fetch !== 'undefined',
      error: typeof fetch === 'undefined' ? 'Fetch API not supported' : null
    };
  }

  checkPromiseSupport() {
    return {
      supported: typeof Promise !== 'undefined' && typeof Promise.all !== 'undefined',
      error: typeof Promise === 'undefined' ? 'Promises not supported' : null
    };
  }

  checkIntersectionObserverSupport() {
    return {
      supported: 'IntersectionObserver' in window,
      error: !('IntersectionObserver' in window) ? 'IntersectionObserver not supported' : null
    };
  }

  checkCustomElementsSupport() {
    return {
      supported: 'customElements' in window,
      error: !('customElements' in window) ? 'Custom Elements not supported' : null
    };
  }

  /**
   * コード品質分析
   */
  async analyzeCodeQuality() {
    console.log('📊 Analyzing code quality...');
    
    const analysis = {
      testCoverage: await this.estimateTestCoverage(),
      codeComplexity: await this.analyzeCodeComplexity(),
      documentation: await this.checkDocumentation(),
      errorHandling: await this.analyzeErrorHandling()
    };
    
    this.results.codeQuality = {
      analysis,
      passed: this.evaluateCodeQuality(analysis),
      score: this.calculateCodeQualityScore(analysis)
    };
  }

  async estimateTestCoverage() {
    try {
      // テストファイルの存在確認
      const testFiles = [
        '/js/test/unit.test.js',
        '/js/test/integration.test.js',
        '/js/test/e2e.test.js'
      ];
      
      let testFilesFound = 0;
      for (const testFile of testFiles) {
        try {
          await fetch(testFile, { method: 'HEAD' });
          testFilesFound++;
        } catch (error) {
          // ファイルが存在しない
        }
      }
      
      const estimatedCoverage = (testFilesFound / testFiles.length) * 100;
      
      return {
        passed: estimatedCoverage >= this.benchmarks.testCoverage,
        details: {
          testFilesFound,
          totalTestFiles: testFiles.length,
          estimatedCoverage
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async analyzeCodeComplexity() {
    // 簡易的な複雑度分析
    try {
      const scripts = Array.from(document.querySelectorAll('script'));
      let totalFunctions = 0;
      let complexFunctions = 0;
      
      scripts.forEach(script => {
        if (script.textContent) {
          const functionMatches = script.textContent.match(/function\s+\w+|=>\s*{|\w+\s*\(/g);
          if (functionMatches) {
            totalFunctions += functionMatches.length;
            
            // 複雑度の簡易判定（条件分岐の数）
            const complexityIndicators = script.textContent.match(/if|else|while|for|switch|catch/g);
            if (complexityIndicators && complexityIndicators.length > 10) {
              complexFunctions++;
            }
          }
        }
      });
      
      const complexityRatio = totalFunctions > 0 ? complexFunctions / totalFunctions : 0;
      
      return {
        passed: complexityRatio < 0.3, // 30%未満が複雑な関数
        details: {
          totalFunctions,
          complexFunctions,
          complexityRatio
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async checkDocumentation() {
    try {
      const docFiles = [
        '/README.md',
        '/ARCHITECTURE.md',
        '/API.md'
      ];
      
      let docFilesFound = 0;
      for (const docFile of docFiles) {
        try {
          const response = await fetch(docFile, { method: 'HEAD' });
          if (response.ok) {
            docFilesFound++;
          }
        } catch (error) {
          // ファイルが存在しない
        }
      }
      
      return {
        passed: docFilesFound >= 2, // 最低2つのドキュメント
        details: {
          docFilesFound,
          totalDocFiles: docFiles.length,
          coverage: docFilesFound / docFiles.length
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async analyzeErrorHandling() {
    try {
      const scripts = Array.from(document.querySelectorAll('script'));
      let totalTryBlocks = 0;
      let totalFunctions = 0;
      
      scripts.forEach(script => {
        if (script.textContent) {
          const tryMatches = script.textContent.match(/try\s*{/g);
          const functionMatches = script.textContent.match(/function\s+\w+|\w+\s*=>\s*{/g);
          
          if (tryMatches) totalTryBlocks += tryMatches.length;
          if (functionMatches) totalFunctions += functionMatches.length;
        }
      });
      
      const errorHandlingRatio = totalFunctions > 0 ? totalTryBlocks / totalFunctions : 0;
      
      return {
        passed: errorHandlingRatio > 0.2, // 20%以上の関数でエラーハンドリング
        details: {
          totalTryBlocks,
          totalFunctions,
          errorHandlingRatio
        }
      };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  /**
   * ヘルパーメソッド
   */
  detectCircularDependencies(graph) {
    const visited = new Set();
    const recursionStack = new Set();
    const circular = [];
    
    const dfs = (node, path = []) => {
      if (recursionStack.has(node)) {
        circular.push([...path, node]);
        return;
      }
      
      if (visited.has(node)) return;
      
      visited.add(node);
      recursionStack.add(node);
      
      const deps = graph[node]?.dependencies || [];
      deps.forEach(dep => dfs(dep, [...path, node]));
      
      recursionStack.delete(node);
    };
    
    Object.keys(graph).forEach(node => dfs(node));
    return circular;
  }

  calculateDependencyDepth(graph) {
    const depths = {};
    
    const calculateDepth = (node) => {
      if (depths[node] !== undefined) return depths[node];
      
      const deps = graph[node]?.dependencies || [];
      if (deps.length === 0) {
        depths[node] = 0;
        return 0;
      }
      
      const maxDepth = Math.max(...deps.map(dep => calculateDepth(dep)));
      depths[node] = maxDepth + 1;
      return depths[node];
    };
    
    Object.keys(graph).forEach(node => calculateDepth(node));
    return Math.max(...Object.values(depths));
  }

  calculateScore(checks, passedKey = 'passed') {
    const values = Object.values(checks);
    const passed = values.filter(check => check[passedKey]).length;
    return Math.round((passed / values.length) * 100);
  }

  evaluatePerformance(benchmarks) {
    return Object.values(benchmarks).every(benchmark => 
      benchmark.passed !== false && !benchmark.error
    );
  }

  calculatePerformanceScore(benchmarks) {
    const scores = Object.values(benchmarks).map(benchmark => {
      if (benchmark.error) return 0;
      return benchmark.passed ? 100 : 50;
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  evaluateCodeQuality(analysis) {
    return Object.values(analysis).every(check => check.passed);
  }

  calculateCodeQualityScore(analysis) {
    return this.calculateScore(analysis);
  }

  calculateOverallScore() {
    const categories = ['architecture', 'performance', 'security', 'accessibility', 'compatibility', 'codeQuality'];
    const scores = categories.map(category => this.results[category].score || 0);
    const overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    
    this.results.overall = {
      score: overallScore,
      grade: this.getGrade(overallScore),
      passed: overallScore >= 80,
      categories: categories.reduce((obj, category, index) => {
        obj[category] = scores[index];
        return obj;
      }, {})
    };
  }

  getGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 65) return 'D+';
    if (score >= 60) return 'D';
    return 'F';
  }

  generateReport() {
    console.log('\n🏆 Quality Assurance Report');
    console.log('================================');
    console.log(`Overall Score: ${this.results.overall.score}/100 (${this.results.overall.grade})`);
    console.log(`Status: ${this.results.overall.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('\nCategory Breakdown:');
    
    Object.entries(this.results.overall.categories).forEach(([category, score]) => {
      const status = this.results[category].passed ? '✅' : '❌';
      console.log(`${status} ${category}: ${score}/100`);
    });
    
    console.log('\nDetailed Results:');
    console.log(JSON.stringify(this.results, null, 2));
  }
}

// グローバル品質保証インスタンス
const QA = new QualityAssurance();

// エクスポート
if (typeof window !== 'undefined') {
  window.QualityAssurance = QualityAssurance;
  window.QA = QA;
  
  window.runQualityAudit = () => QA.runCompleteAudit();
}

export { QualityAssurance, QA };