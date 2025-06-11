/**
 * TestFramework - 軽量テストフレームワーク
 * ユニットテスト、統合テスト、E2Eテスト対応
 */
class TestFramework {
  constructor(options = {}) {
    this.suites = new Map();
    this.currentSuite = null;
    this.globalSetup = null;
    this.globalTeardown = null;
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      startTime: null,
      endTime: null,
      errors: []
    };
    
    this.config = {
      timeout: options.timeout || 5000,
      verbose: options.verbose !== false,
      bail: options.bail || false,
      parallel: options.parallel || false,
      showStackTrace: options.showStackTrace !== false
    };
    
    this.reporters = [];
    this.hooks = {
      beforeAll: [],
      afterAll: [],
      beforeEach: [],
      afterEach: []
    };
  }

  /**
   * テストスイート定義
   */
  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      hooks: {
        beforeAll: [],
        afterAll: [],
        beforeEach: [],
        afterEach: []
      },
      only: false,
      skip: false
    };
    
    this.suites.set(name, suite);
    this.currentSuite = suite;
    
    try {
      fn();
    } catch (error) {
      console.error(`Suite definition error in "${name}":`, error);
    }
    
    this.currentSuite = null;
    return this;
  }

  /**
   * 単一テスト定義
   */
  it(name, fn, options = {}) {
    if (!this.currentSuite) {
      throw new Error('Test must be defined within a describe block');
    }
    
    const test = {
      name,
      fn,
      timeout: options.timeout || this.config.timeout,
      only: false,
      skip: false,
      tags: options.tags || [],
      result: null,
      error: null,
      duration: 0
    };
    
    this.currentSuite.tests.push(test);
    return this;
  }

  /**
   * フォーカステスト
   */
  only(name, fn, options = {}) {
    const test = this.it(name, fn, options);
    test.only = true;
    return this;
  }

  /**
   * スキップテスト
   */
  skip(name, fn, options = {}) {
    const test = this.it(name, fn, options);
    test.skip = true;
    return this;
  }

  /**
   * フック設定
   */
  beforeAll(fn) {
    if (this.currentSuite) {
      this.currentSuite.hooks.beforeAll.push(fn);
    } else {
      this.hooks.beforeAll.push(fn);
    }
    return this;
  }

  afterAll(fn) {
    if (this.currentSuite) {
      this.currentSuite.hooks.afterAll.push(fn);
    } else {
      this.hooks.afterAll.push(fn);
    }
    return this;
  }

  beforeEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.hooks.beforeEach.push(fn);
    } else {
      this.hooks.beforeEach.push(fn);
    }
    return this;
  }

  afterEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.hooks.afterEach.push(fn);
    } else {
      this.hooks.afterEach.push(fn);
    }
    return this;
  }

  /**
   * アサーション
   */
  expect(actual) {
    return new Assertion(actual);
  }

  /**
   * テスト実行
   */
  async run(filter = null) {
    this.results.startTime = Date.now();
    this.results.passed = 0;
    this.results.failed = 0;
    this.results.skipped = 0;
    this.results.total = 0;
    this.results.errors = [];
    
    try {
      // グローバルセットアップ
      await this.runHooks(this.hooks.beforeAll);
      
      // スイート実行
      for (const [suiteName, suite] of this.suites) {
        if (filter && !this.matchesFilter(suiteName, filter)) {
          continue;
        }
        
        await this.runSuite(suite);
      }
      
      // グローバルティアダウン
      await this.runHooks(this.hooks.afterAll);
      
    } catch (error) {
      this.results.errors.push({
        type: 'global',
        error: error.message,
        stack: error.stack
      });
    }
    
    this.results.endTime = Date.now();
    this.generateReport();
    
    return this.results;
  }

  /**
   * スイート実行
   */
  async runSuite(suite) {
    if (suite.skip) {
      this.log(`⏭️  Skipping suite: ${suite.name}`);
      return;
    }
    
    this.log(`📁 Running suite: ${suite.name}`);
    
    try {
      // スイートセットアップ
      await this.runHooks(suite.hooks.beforeAll);
      
      // テスト実行
      const testsToRun = this.filterTests(suite.tests);
      
      if (this.config.parallel) {
        await this.runTestsParallel(suite, testsToRun);
      } else {
        await this.runTestsSequential(suite, testsToRun);
      }
      
      // スイートティアダウン
      await this.runHooks(suite.hooks.afterAll);
      
    } catch (error) {
      this.results.errors.push({
        type: 'suite',
        suite: suite.name,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * 順次テスト実行
   */
  async runTestsSequential(suite, tests) {
    for (const test of tests) {
      await this.runSingleTest(suite, test);
      
      if (this.config.bail && test.result === 'failed') {
        this.log('🛑 Bailing out due to test failure');
        break;
      }
    }
  }

  /**
   * 並列テスト実行
   */
  async runTestsParallel(suite, tests) {
    const promises = tests.map(test => this.runSingleTest(suite, test));
    await Promise.allSettled(promises);
  }

  /**
   * 単一テスト実行
   */
  async runSingleTest(suite, test) {
    this.results.total++;
    
    if (test.skip) {
      test.result = 'skipped';
      this.results.skipped++;
      this.log(`⏭️  ${test.name}`);
      return;
    }
    
    const startTime = Date.now();
    
    try {
      // beforeEach フック実行
      await this.runHooks([...this.hooks.beforeEach, ...suite.hooks.beforeEach]);
      
      // テスト実行（タイムアウト付き）
      await this.runWithTimeout(test.fn, test.timeout);
      
      // afterEach フック実行
      await this.runHooks([...this.hooks.afterEach, ...suite.hooks.afterEach]);
      
      test.result = 'passed';
      test.duration = Date.now() - startTime;
      this.results.passed++;
      this.log(`✅ ${test.name} (${test.duration}ms)`);
      
    } catch (error) {
      test.result = 'failed';
      test.error = error;
      test.duration = Date.now() - startTime;
      this.results.failed++;
      this.results.errors.push({
        type: 'test',
        suite: suite.name,
        test: test.name,
        error: error.message,
        stack: this.config.showStackTrace ? error.stack : null
      });
      this.log(`❌ ${test.name} - ${error.message}`);
      
      // afterEach を失敗時も実行
      try {
        await this.runHooks([...this.hooks.afterEach, ...suite.hooks.afterEach]);
      } catch (hookError) {
        this.log(`⚠️  afterEach hook failed: ${hookError.message}`);
      }
    }
  }

  /**
   * タイムアウト付き関数実行
   */
  async runWithTimeout(fn, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timeout after ${timeout}ms`));
      }, timeout);
      
      try {
        const result = fn();
        
        if (result && typeof result.then === 'function') {
          // Promise の場合
          result
            .then(resolve)
            .catch(reject)
            .finally(() => clearTimeout(timer));
        } else {
          // 同期関数の場合
          clearTimeout(timer);
          resolve(result);
        }
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * フック実行
   */
  async runHooks(hooks) {
    for (const hook of hooks) {
      await hook();
    }
  }

  /**
   * テストフィルタリング
   */
  filterTests(tests) {
    const onlyTests = tests.filter(test => test.only);
    return onlyTests.length > 0 ? onlyTests : tests;
  }

  /**
   * フィルタマッチング
   */
  matchesFilter(name, filter) {
    if (typeof filter === 'string') {
      return name.includes(filter);
    }
    if (filter instanceof RegExp) {
      return filter.test(name);
    }
    if (typeof filter === 'function') {
      return filter(name);
    }
    return true;
  }

  /**
   * ログ出力
   */
  log(message) {
    if (this.config.verbose) {
      console.log(message);
    }
  }

  /**
   * レポート生成
   */
  generateReport() {
    const duration = this.results.endTime - this.results.startTime;
    const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`Total: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏭️  Skipped: ${this.results.skipped}`);
    console.log(`📈 Pass Rate: ${passRate}%`);
    console.log(`⏱️  Duration: ${duration}ms`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 Errors:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.suite || 'Global'} - ${error.test || ''}`);
        console.log(`   ${error.error}`);
        if (error.stack && this.config.showStackTrace) {
          console.log(`   ${error.stack}`);
        }
      });
    }
    
    // レポーター実行
    this.reporters.forEach(reporter => {
      try {
        reporter(this.results);
      } catch (error) {
        console.error('Reporter error:', error);
      }
    });
  }

  /**
   * レポーター追加
   */
  addReporter(reporter) {
    this.reporters.push(reporter);
    return this;
  }

  /**
   * 設定更新
   */
  configure(options) {
    this.config = { ...this.config, ...options };
    return this;
  }

  /**
   * テスト統計
   */
  getStats() {
    const totalTests = Array.from(this.suites.values())
      .reduce((total, suite) => total + suite.tests.length, 0);
    
    return {
      suites: this.suites.size,
      tests: totalTests,
      hooks: Object.values(this.hooks).flat().length
    };
  }

  /**
   * クリーンアップ
   */
  reset() {
    this.suites.clear();
    this.currentSuite = null;
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      startTime: null,
      endTime: null,
      errors: []
    };
  }
}

/**
 * Assertion クラス
 */
class Assertion {
  constructor(actual) {
    this.actual = actual;
  }

  toBe(expected) {
    if (this.actual !== expected) {
      throw new Error(`Expected ${this.actual} to be ${expected}`);
    }
    return this;
  }

  toEqual(expected) {
    if (!this.deepEqual(this.actual, expected)) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`);
    }
    return this;
  }

  toBeTruthy() {
    if (!this.actual) {
      throw new Error(`Expected ${this.actual} to be truthy`);
    }
    return this;
  }

  toBeFalsy() {
    if (this.actual) {
      throw new Error(`Expected ${this.actual} to be falsy`);
    }
    return this;
  }

  toBeNull() {
    if (this.actual !== null) {
      throw new Error(`Expected ${this.actual} to be null`);
    }
    return this;
  }

  toBeUndefined() {
    if (this.actual !== undefined) {
      throw new Error(`Expected ${this.actual} to be undefined`);
    }
    return this;
  }

  toBeInstanceOf(constructor) {
    if (!(this.actual instanceof constructor)) {
      throw new Error(`Expected ${this.actual} to be instance of ${constructor.name}`);
    }
    return this;
  }

  toContain(item) {
    if (Array.isArray(this.actual)) {
      if (!this.actual.includes(item)) {
        throw new Error(`Expected array to contain ${item}`);
      }
    } else if (typeof this.actual === 'string') {
      if (!this.actual.includes(item)) {
        throw new Error(`Expected string to contain "${item}"`);
      }
    } else {
      throw new Error('toContain can only be used with arrays or strings');
    }
    return this;
  }

  toThrow(expectedError) {
    if (typeof this.actual !== 'function') {
      throw new Error('toThrow can only be used with functions');
    }
    
    let thrownError = null;
    try {
      this.actual();
    } catch (error) {
      thrownError = error;
    }
    
    if (!thrownError) {
      throw new Error('Expected function to throw an error');
    }
    
    if (expectedError && !thrownError.message.includes(expectedError)) {
      throw new Error(`Expected error to contain "${expectedError}", got "${thrownError.message}"`);
    }
    
    return this;
  }

  async toResolve() {
    if (!this.actual || typeof this.actual.then !== 'function') {
      throw new Error('toResolve can only be used with Promises');
    }
    
    try {
      await this.actual;
    } catch (error) {
      throw new Error(`Expected promise to resolve, but it rejected with: ${error.message}`);
    }
    
    return this;
  }

  async toReject(expectedError) {
    if (!this.actual || typeof this.actual.then !== 'function') {
      throw new Error('toReject can only be used with Promises');
    }
    
    let rejectionError = null;
    try {
      await this.actual;
    } catch (error) {
      rejectionError = error;
    }
    
    if (!rejectionError) {
      throw new Error('Expected promise to reject');
    }
    
    if (expectedError && !rejectionError.message.includes(expectedError)) {
      throw new Error(`Expected rejection to contain "${expectedError}", got "${rejectionError.message}"`);
    }
    
    return this;
  }

  deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEqual(a[key], b[key])) return false;
      }
      return true;
    }
    
    return false;
  }
}

// グローバルテストインスタンス
const Test = new TestFramework();

// グローバル関数エクスポート
window.describe = (name, fn) => Test.describe(name, fn);
window.it = (name, fn, options) => Test.it(name, fn, options);
window.test = window.it; // Jest風エイリアス
window.expect = (actual) => Test.expect(actual);
window.beforeAll = (fn) => Test.beforeAll(fn);
window.afterAll = (fn) => Test.afterAll(fn);
window.beforeEach = (fn) => Test.beforeEach(fn);
window.afterEach = (fn) => Test.afterEach(fn);

export { TestFramework, Test };