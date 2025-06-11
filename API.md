# Murder Mystery Generator - API Documentation

## 📚 API Reference

### Core Classes

## EventEmitter

軽量なイベント管理システム

### Constructor
```javascript
new EventEmitter(options = {})
```

**Parameters:**
- `options.maxListeners` (number): 最大リスナー数 (デフォルト: 100)
- `options.enableWarnings` (boolean): 警告の有効化 (デフォルト: true)

### Methods

#### `on(event, listener, options = {})`
イベントリスナーを登録

**Parameters:**
- `event` (string): イベント名
- `listener` (function): コールバック関数
- `options.once` (boolean): 一度限りの実行
- `options.priority` (number): 優先度

**Returns:** EventEmitter (チェーン可能)

```javascript
emitter.on('data', (data) => {
  console.log('Received:', data);
});
```

#### `once(event, listener)`
一度限りのイベントリスナーを登録

#### `off(event, listener)`
イベントリスナーを削除

#### `emit(event, ...args)`
イベントを発火

**Returns:** boolean (リスナーが存在したかどうか)

#### `removeAllListeners(event)`
全てのリスナーを削除

#### `listenerCount(event)`
イベントのリスナー数を取得

**Returns:** number

---

## StateManager

Redux風の状態管理システム

### Constructor
```javascript
new StateManager(initialState = {})
```

### Methods

#### `getState(path)`
状態を取得

**Parameters:**
- `path` (string): ドット記法のパス（例: 'user.profile.name'）

**Returns:** any

```javascript
const name = state.getState('user.profile.name');
```

#### `dispatch(action)`
アクションをディスパッチ

**Parameters:**
- `action` (object): アクションオブジェクト
  - `type` (string): アクションタイプ
  - その他のプロパティ

```javascript
state.dispatch({
  type: 'UPDATE_USER',
  payload: { name: 'John' }
});
```

#### `addReducer(key, reducer)`
リデューサーを追加

**Parameters:**
- `key` (string): 状態のキー
- `reducer` (function): リデューサー関数

```javascript
state.addReducer('counter', (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    default:
      return state;
  }
});
```

#### `subscribe(path, callback)`
状態変更を監視

**Parameters:**
- `path` (string): 監視するパス
- `callback` (function): 変更時のコールバック

**Returns:** function (購読解除関数)

#### `use(middleware)`
ミドルウェアを追加

---

## Logger

構造化ログシステム

### Constructor
```javascript
new Logger(options = {})
```

**Parameters:**
- `options.namespace` (string): ログの名前空間
- `options.level` (string): ログレベル ('DEBUG', 'INFO', 'WARN', 'ERROR')
- `options.enableColors` (boolean): カラー表示
- `options.enableTimestamp` (boolean): タイムスタンプ表示

### Methods

#### `debug(message, ...data)`
デバッグログを出力

#### `info(message, ...data)`
情報ログを出力

#### `warn(message, ...data)`
警告ログを出力

#### `error(message, ...data)`
エラーログを出力

```javascript
logger.info('User logged in', { userId: 123, timestamp: Date.now() });
```

#### `configure(options)`
設定を更新

---

## ApiClient

HTTP通信クライアント

### Constructor
```javascript
new ApiClient(options = {})
```

**Parameters:**
- `options.baseURL` (string): ベースURL
- `options.timeout` (number): タイムアウト（ミリ秒）
- `options.maxRetries` (number): 最大リトライ回数
- `options.rateLimitDelay` (number): レート制限遅延

### Methods

#### `get(endpoint, options = {})`
GETリクエストを送信

**Parameters:**
- `endpoint` (string): エンドポイント
- `options.params` (object): クエリパラメータ
- `options.headers` (object): ヘッダー

**Returns:** Promise<any>

```javascript
const data = await client.get('/users', {
  params: { page: 1, limit: 10 }
});
```

#### `post(endpoint, data, options = {})`
POSTリクエストを送信

#### `put(endpoint, data, options = {})`
PUTリクエストを送信

#### `delete(endpoint, options = {})`
DELETEリクエストを送信

#### `getHealthStatus()`
API健康状態を取得

**Returns:** Promise<object>

---

## ModuleLoader

ES6モジュール動的読み込みシステム

### Constructor
```javascript
new ModuleLoader(options = {})
```

**Parameters:**
- `options.baseUrl` (string): モジュールベースURL
- `options.timeout` (number): 読み込みタイムアウト
- `options.retryCount` (number): リトライ回数

### Methods

#### `loadModule(moduleName, options = {})`
モジュールを動的読み込み

**Parameters:**
- `moduleName` (string): モジュール名
- `options.forceReload` (boolean): 強制再読み込み

**Returns:** Promise<Module>

```javascript
const EventEmitter = await loader.loadModule('EventEmitter');
```

#### `loadModules(moduleNames, options = {})`
複数モジュールを並列読み込み

#### `initializeApp(config = {})`
アプリケーション全体を初期化

#### `getModuleStats()`
モジュール統計を取得

#### `clearCache(moduleName)`
キャッシュをクリア

---

## TypeSystem

TypeScript風型システム

### Constructor
```javascript
new TypeSystem(options = {})
```

### Methods

#### `is(value, type)`
型チェックを実行

**Parameters:**
- `value` (any): チェック対象の値
- `type` (string|array|object): 型指定

**Returns:** boolean

```javascript
// プリミティブ型
typeSystem.is('hello', 'string'); // true
typeSystem.is(42, 'number'); // true

// 配列型
typeSystem.is([1, 2, 3], 'Array<number>'); // true

// ユニオン型
typeSystem.is('test', ['string', 'number']); // true

// インターフェース型
typeSystem.is(user, {
  name: 'string',
  age: 'number'
}); // true/false
```

#### `assert(value, type, message = '')`
型アサーション

**Throws:** TypeError (型が一致しない場合)

#### `memoize(fn, options = {})`
メモ化デコレータ

#### `addType(name, validator)`
カスタム型を追加

#### `validateInterface(value, schema)`
インターフェース検証

---

## PerformanceOptimizer

パフォーマンス最適化システム

### Constructor
```javascript
new PerformanceOptimizer(options = {})
```

### Methods

#### `memoize(fn, options = {})`
関数をメモ化

**Parameters:**
- `fn` (function): メモ化対象関数
- `options.keyGenerator` (function): キー生成関数
- `options.ttl` (number): キャッシュ有効期限
- `options.maxSize` (number): 最大キャッシュサイズ

**Returns:** function (メモ化された関数)

```javascript
const memoizedExpensive = optimizer.memoize((x, y) => {
  // 重い計算
  return x * y * Math.random();
}, {
  ttl: 60000, // 1分
  maxSize: 100
});
```

#### `cache(key, computeFn, options = {})`
計算結果をキャッシュ

#### `cacheAsync(key, asyncComputeFn, options = {})`
非同期計算結果をキャッシュ

#### `batch(operation, data, options = {})`
バッチ処理

#### `scheduleRender(callback, priority = 'normal')`
レンダー処理をスケジュール

#### `createVirtualScroller(container, items, renderItem, options = {})`
仮想スクロールを作成

#### `throttle(func, delay)`
スロットリング

#### `debounce(func, delay)`
デバウンシング

---

## StepManager

マルチステップフォーム管理

### Constructor
```javascript
new StepManager(options = {})
```

### Methods

#### `navigateToStep(targetStep)`
指定ステップに移動

#### `goToNextStep()`
次のステップに進む

#### `goToPreviousStep()`
前のステップに戻る

#### `isStepCompleted(step)`
ステップ完了状態を確認

#### `setStepData(step, data)`
ステップデータを設定

#### `getCurrentStepData()`
現在のステップデータを取得

#### `addStepStrategy(stepNumber, strategy)`
ステップ戦略を追加

---

## UIController

UI統合制御システム

### Methods

#### `updateStepVisibility(currentStep, totalSteps)`
ステップ表示を更新

#### `showLoading(phase, progress)`
ローディング表示

#### `hideLoading()`
ローディング非表示

#### `showError(message)`
エラー表示

#### `updateProgress(percentage, phase, details, estimatedTime)`
進捗更新

#### `hideAllContainers()`
全コンテナを非表示

---

## ScenarioGenerator

シナリオ生成ビジネスロジック

### Methods

#### `generateScenario(formData, options = {})`
シナリオを生成

**Parameters:**
- `formData` (object): フォームデータ
- `options.preferredStrategy` (string): 優先戦略

**Returns:** Promise<object>

#### `getStrategyStats()`
戦略統計を取得

---

## MurderMysteryApp

メインアプリケーションクラス

### Constructor
```javascript
new MurderMysteryApp(options = {})
```

### Methods

#### `initializeApp()`
アプリケーション初期化

#### `startGeneration()`
シナリオ生成開始

#### `saveAppState()`
アプリケーション状態保存

#### `loadSavedData()`
保存データ読み込み

#### `reset()`
アプリケーションリセット

#### `getDiagnosticInfo()`
診断情報取得

---

## テストフレームワーク

### TestFramework

#### `describe(name, fn)`
テストスイート定義

#### `it(name, fn, options = {})`
テストケース定義

#### `beforeAll(fn)` / `afterAll(fn)`
セットアップ/ティアダウン

#### `beforeEach(fn)` / `afterEach(fn)`
各テスト前後の処理

#### `expect(actual)`
アサーション開始

### Assertion Methods

#### `toBe(expected)`
厳密等価比較

#### `toEqual(expected)`
深い等価比較

#### `toBeTruthy()` / `toBeFalsy()`
真偽値テスト

#### `toContain(item)`
包含テスト

#### `toThrow(expectedError)`
例外テスト

#### `toResolve()` / `toReject(expectedError)`
Promise テスト

---

## イベント一覧

### アプリケーションレベル
- `app:init:start` - アプリ初期化開始
- `app:init:complete` - アプリ初期化完了
- `app:init:error` - アプリ初期化エラー
- `app:ready` - アプリ準備完了
- `app:error` - アプリエラー
- `app:reset` - アプリリセット

### 状態管理
- `state:change` - 状態変更
- `state:error` - 状態エラー

### ステップ管理
- `step:changed` - ステップ変更
- `step:validation:failed` - ステップ検証失敗

### シナリオ生成
- `generation:start` - 生成開始
- `generation:progress` - 生成進捗
- `generation:complete` - 生成完了
- `generation:error` - 生成エラー

### UI制御
- `form:change` - フォーム変更
- `ui:button:click` - ボタンクリック
- `ui:step:navigate` - ステップナビゲーション
- `navigation:next` - 次へナビゲーション
- `navigation:previous` - 前へナビゲーション
- `navigation:generate` - 生成ナビゲーション

### API通信
- `api:request:start` - APIリクエスト開始
- `api:request:complete` - APIリクエスト完了
- `api:request:error` - APIリクエストエラー
- `health:degraded` - API健康状態悪化
- `health:recovered` - API健康状態回復

---

## エラーハンドリング

### エラータイプ
- `ValidationError` - 入力検証エラー
- `NetworkError` - ネットワークエラー
- `TimeoutError` - タイムアウトエラー
- `ModuleLoadError` - モジュール読み込みエラー
- `TypeError` - 型エラー

### エラー処理パターン
```javascript
try {
  await app.startGeneration();
} catch (error) {
  if (error instanceof ValidationError) {
    // 入力エラー処理
  } else if (error instanceof NetworkError) {
    // ネットワークエラー処理
  } else {
    // 一般エラー処理
  }
}
```

このAPIドキュメントは、開発者がシステムを理解し、効率的に使用できるよう設計されています。各メソッドの詳細な動作、パラメータ、戻り値について包括的に説明しています。