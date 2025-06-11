/**
 * unit.test.js - ユニットテストスイート
 * 各モジュールの単体テスト
 */

// テストフレームワーク読み込み
import './TestFramework.js';

describe('EventEmitter Tests', () => {
  let emitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  afterEach(() => {
    emitter.removeAllListeners();
  });

  it('should emit and listen to events', () => {
    let callCount = 0;
    const data = { test: 'data' };

    emitter.on('test', (receivedData) => {
      callCount++;
      expect(receivedData).toEqual(data);
    });

    emitter.emit('test', data);
    expect(callCount).toBe(1);
  });

  it('should support multiple listeners', () => {
    let count1 = 0, count2 = 0;

    emitter.on('test', () => count1++);
    emitter.on('test', () => count2++);

    emitter.emit('test');
    expect(count1).toBe(1);
    expect(count2).toBe(1);
  });

  it('should support once listeners', () => {
    let callCount = 0;

    emitter.once('test', () => callCount++);

    emitter.emit('test');
    emitter.emit('test');
    expect(callCount).toBe(1);
  });

  it('should remove listeners correctly', () => {
    let callCount = 0;
    const listener = () => callCount++;

    emitter.on('test', listener);
    emitter.emit('test');
    expect(callCount).toBe(1);

    emitter.off('test', listener);
    emitter.emit('test');
    expect(callCount).toBe(1);
  });

  it('should handle listener errors gracefully', () => {
    const errorListener = () => {
      throw new Error('Test error');
    };

    emitter.on('test', errorListener);
    
    // エラーが発生してもアプリが停止しないことを確認
    expect(() => emitter.emit('test')).not.toThrow();
  });
});

describe('StateManager Tests', () => {
  let stateManager;

  beforeEach(() => {
    const initialState = {
      counter: 0,
      user: {
        name: 'test',
        email: 'test@example.com'
      }
    };
    stateManager = new StateManager(initialState);
  });

  afterEach(() => {
    stateManager.removeAllListeners();
  });

  it('should get initial state correctly', () => {
    expect(stateManager.getState('counter')).toBe(0);
    expect(stateManager.getState('user.name')).toBe('test');
  });

  it('should dispatch actions and update state', () => {
    stateManager.addReducer('counter', (state = 0, action) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1;
        case 'DECREMENT':
          return state - 1;
        default:
          return state;
      }
    });

    stateManager.dispatch({ type: 'INCREMENT' });
    expect(stateManager.getState('counter')).toBe(1);

    stateManager.dispatch({ type: 'DECREMENT' });
    expect(stateManager.getState('counter')).toBe(0);
  });

  it('should notify subscribers on state changes', () => {
    let notificationCount = 0;
    let lastValue = null;

    stateManager.subscribe('counter', (value) => {
      notificationCount++;
      lastValue = value;
    });

    stateManager.addReducer('counter', (state = 0, action) => {
      return action.type === 'SET' ? action.value : state;
    });

    stateManager.dispatch({ type: 'SET', value: 42 });
    
    expect(notificationCount).toBe(1);
    expect(lastValue).toBe(42);
  });

  it('should support middleware', () => {
    const actions = [];
    
    const loggerMiddleware = (store) => (next) => (action) => {
      actions.push(action);
      return next(action);
    };

    stateManager.use(loggerMiddleware);
    stateManager.dispatch({ type: 'TEST_ACTION' });

    expect(actions).toContain({ type: 'TEST_ACTION' });
  });
});

describe('Logger Tests', () => {
  let logger;
  let consoleSpy;

  beforeEach(() => {
    logger = new Logger({
      namespace: 'Test',
      level: 'DEBUG'
    });
    
    // console.log をスパイ
    consoleSpy = {
      logs: [],
      originalLog: console.log
    };
    console.log = (...args) => consoleSpy.logs.push(args);
  });

  afterEach(() => {
    console.log = consoleSpy.originalLog;
  });

  it('should log messages with correct format', () => {
    logger.info('Test message');
    
    expect(consoleSpy.logs.length).toBe(1);
    expect(consoleSpy.logs[0][0]).toContain('[Test]');
    expect(consoleSpy.logs[0][0]).toContain('Test message');
  });

  it('should respect log levels', () => {
    logger.configure({ level: 'WARN' });
    
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    
    // DEBUG と INFO は出力されず、WARN のみ出力
    expect(consoleSpy.logs.length).toBe(1);
    expect(consoleSpy.logs[0][0]).toContain('Warning message');
  });

  it('should format structured data correctly', () => {
    const data = { key: 'value', number: 42 };
    logger.info('Test with data', data);
    
    const logEntry = consoleSpy.logs[0];
    expect(logEntry.length).toBe(2);
    expect(logEntry[1]).toEqual(data);
  });
});

describe('ApiClient Tests', () => {
  let apiClient;
  let originalFetch;

  beforeEach(() => {
    apiClient = new ApiClient({
      baseURL: '/api',
      timeout: 5000
    });

    // fetch をモック
    originalFetch = window.fetch;
    window.fetch = jest.fn();
  });

  afterEach(() => {
    window.fetch = originalFetch;
  });

  it('should make GET requests correctly', async () => {
    const mockResponse = { data: 'test' };
    window.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await apiClient.get('/test');
    
    expect(window.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      method: 'GET'
    }));
    expect(result).toEqual(mockResponse);
  });

  it('should handle request errors', async () => {
    window.fetch.mockRejectedValue(new Error('Network error'));

    await expect(apiClient.get('/test')).toReject('Network error');
  });

  it('should retry failed requests', async () => {
    window.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'success' })
      });

    const result = await apiClient.get('/test');
    
    expect(window.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: 'success' });
  });

  it('should apply rate limiting', async () => {
    window.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });

    const startTime = Date.now();
    
    // 複数の同時リクエスト
    await Promise.all([
      apiClient.get('/test1'),
      apiClient.get('/test2'),
      apiClient.get('/test3')
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // レート制限により遅延が発生することを確認
    expect(duration).toBeGreaterThan(100);
  });
});

describe('PerformanceOptimizer Tests', () => {
  let optimizer;

  beforeEach(() => {
    optimizer = new PerformanceOptimizer({
      maxCacheSize: 10,
      cacheTTL: 1000
    });
  });

  afterEach(() => {
    optimizer.clearAllCaches();
  });

  it('should memoize function results', () => {
    let callCount = 0;
    const expensiveFunction = (x) => {
      callCount++;
      return x * 2;
    };

    const memoized = optimizer.memoize(expensiveFunction);
    
    expect(memoized(5)).toBe(10);
    expect(memoized(5)).toBe(10);
    expect(callCount).toBe(1); // 2回目はキャッシュから取得
  });

  it('should cache async operations', async () => {
    let callCount = 0;
    const asyncFunction = () => {
      callCount++;
      return Promise.resolve('result');
    };

    const result1 = await optimizer.cacheAsync('test', asyncFunction);
    const result2 = await optimizer.cacheAsync('test', asyncFunction);
    
    expect(result1).toBe('result');
    expect(result2).toBe('result');
    expect(callCount).toBe(1);
  });

  it('should batch operations correctly', async () => {
    const processor = (items) => {
      return items.map(item => item.value * 2);
    };

    const promises = [
      optimizer.batch('multiply', { value: 1 }, { processor }),
      optimizer.batch('multiply', { value: 2 }, { processor }),
      optimizer.batch('multiply', { value: 3 }, { processor })
    ];

    const results = await Promise.all(promises);
    
    expect(results).toEqual([2, 4, 6]);
  });

  it('should respect cache TTL', async () => {
    let callCount = 0;
    const computeFn = () => {
      callCount++;
      return 'result';
    };

    optimizer.cache('test', computeFn, { ttl: 100 });
    
    // 最初の呼び出し
    expect(callCount).toBe(1);
    
    // TTL内での呼び出し
    optimizer.cache('test', computeFn, { ttl: 100 });
    expect(callCount).toBe(1);
    
    // TTL経過後
    await new Promise(resolve => setTimeout(resolve, 150));
    optimizer.cache('test', computeFn, { ttl: 100 });
    expect(callCount).toBe(2);
  });
});

describe('TypeSystem Tests', () => {
  let typeSystem;

  beforeEach(() => {
    typeSystem = new TypeSystem();
  });

  it('should validate primitive types correctly', () => {
    expect(typeSystem.is('hello', 'string')).toBeTruthy();
    expect(typeSystem.is(42, 'number')).toBeTruthy();
    expect(typeSystem.is(true, 'boolean')).toBeTruthy();
    expect(typeSystem.is(null, 'null')).toBeTruthy();
    expect(typeSystem.is(undefined, 'undefined')).toBeTruthy();
  });

  it('should validate array types', () => {
    expect(typeSystem.is([1, 2, 3], 'array')).toBeTruthy();
    expect(typeSystem.is([1, 2, 3], 'Array<number>')).toBeTruthy();
    expect(typeSystem.is(['a', 'b'], 'Array<string>')).toBeTruthy();
  });

  it('should validate object interfaces', () => {
    const user = {
      name: 'John',
      age: 30,
      email: 'john@example.com'
    };

    const userSchema = {
      name: 'string',
      age: 'number',
      email: 'string'
    };

    expect(typeSystem.validateInterface(user, userSchema)).toBeTruthy();
  });

  it('should validate union types', () => {
    expect(typeSystem.is('hello', ['string', 'number'])).toBeTruthy();
    expect(typeSystem.is(42, ['string', 'number'])).toBeTruthy();
    expect(typeSystem.is(true, ['string', 'number'])).toBeFalsy();
  });

  it('should assert types correctly', () => {
    expect(() => typeSystem.assert('hello', 'string')).not.toThrow();
    expect(() => typeSystem.assert(42, 'string')).toThrow();
  });

  it('should create type guards', () => {
    const isString = typeSystem.createGuard('string');
    
    expect(isString('hello')).toBeTruthy();
    expect(isString(42)).toBeFalsy();
  });
});

// テスト実行用ヘルパー
if (typeof window !== 'undefined') {
  window.runTests = async (filter) => {
    console.log('🧪 Starting test execution...');
    const results = await Test.run(filter);
    
    if (results.failed > 0) {
      console.error('❌ Some tests failed');
      return false;
    } else {
      console.log('✅ All tests passed!');
      return true;
    }
  };
}