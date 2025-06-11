# 🚀 Murder Mystery Generator v2.0 - デプロイメント手順

## 🔧 重要な変更点

### ✅ 完了した改修
1. **モジュラーアーキテクチャ**: 従来の単一ファイルから14個のモジュールに分割
2. **直接初期化システム**: 複雑な依存関係を排除し、シンプルな初期化
3. **キャッシュバスター**: タイムスタンプによる強制キャッシュ更新
4. **古いファイル無効化**: app.js と ultra-enhanced-interactions.js をバックアップに移動

### 🔄 キャッシュクリア (重要)

**デプロイ後は必ずキャッシュをクリアしてください：**

#### ブラウザでのキャッシュクリア
1. **Chrome/Edge**: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. **Firefox**: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)
3. **Safari**: Cmd+Option+E → ページを再読み込み

#### 開発者ツールでの完全クリア
1. F12を押して開発者ツールを開く
2. Networkタブを選択
3. "Disable cache"にチェック
4. ページを再読み込み

#### Vercelでのキャッシュクリア
```bash
# Vercel CLIでの強制再デプロイ
vercel --prod --force

# 環境変数も再設定（キャッシュ更新のため）
vercel env rm GROQ_API_KEY
vercel env add GROQ_API_KEY
```

## 📝 動作確認手順

### 1. 初期化確認
- ページロード時に「Murder Mystery Generator v2.0」の初期化画面が表示される
- プログレスバーが0%→100%まで進行する
- 「初期化完了！」メッセージの後、メイン画面が表示される

### 2. ナビゲーション確認
- 「次へ」ボタンでステップ1→5まで進行できる
- 「前へ」ボタンでステップを戻れる
- ステップ5で「生成開始」ボタンが表示される

### 3. 生成機能確認
- 「生成開始」をクリック
- ローディング画面が表示される
- プログレス: "🚀 Groq超高速コンセプト生成中..."
- API呼び出しが正常に実行される

### 4. エラー確認
- コンソールに "Murder Mystery Generator v2.0 [timestamp] - Direct Init" が表示される
- app.js や ultra-enhanced-interactions.js のログが**表示されない**
- エラーがある場合は具体的なエラーメッセージが表示される

## 🐛 トラブルシューティング

### よくある問題と解決法

#### 1. 古いシステムのログが表示される
```
app.js:5 App initializing for Vercel...
ultra-enhanced-interactions.js:18 🚀 Ultra UI System initializing...
```

**解決法**: 
- ハードリフレッシュ (Ctrl+Shift+R)
- ブラウザキャッシュを完全クリア
- 新しいプライベート/シークレットウィンドウで確認

#### 2. モジュールロードエラー
```
Failed to load module: ./js/core/EventEmitter.js
```

**解決法**:
- ファイルパスを確認: `public/js/core/EventEmitter.js` が存在するか
- サーバーが正常に起動しているか確認
- 404エラーの場合はVercelの設定を確認

#### 3. API呼び出しエラー
```
シナリオ生成に失敗しました: Network Error
```

**解決法**:
- 環境変数 `GROQ_API_KEY` が設定されているか確認
- `/api/groq-phase1-concept` エンドポイントにアクセスできるか確認
- Vercel Function の実行時間制限を確認

#### 4. 初期化が停止する
```
モジュラーシステム初期化中... (プログレスが進まない)
```

**解決法**:
- ブラウザのコンソールでエラーメッセージを確認
- ES6モジュール対応ブラウザか確認 (Chrome 90+, Firefox 88+, Safari 14+)
- ネットワーク接続を確認

## 🚀 デプロイメント手順

### Vercel (推奨)
```bash
# 1. 現在のディレクトリで
vercel --prod

# 2. 環境変数設定
vercel env add GROQ_API_KEY
vercel env add OPENAI_API_KEY

# 3. 強制キャッシュクリア
vercel --prod --force
```

### Netlify
```bash
# 1. ビルド設定
Build command: echo "No build needed"
Publish directory: public

# 2. 環境変数設定 (Netlifyダッシュボード)
GROQ_API_KEY = your_key_here
OPENAI_API_KEY = your_key_here

# 3. 手動デプロイ
netlify deploy --prod --dir=public
```

## 📊 システム状態確認

### ブラウザコンソールでの確認
```javascript
// モジュール読み込み状況
console.log(window.modules);

// UI状態確認
console.log(window.ui);

// キャッシュタイムスタンプ確認
console.log('Current timestamp:', Date.now());
```

### 正常な起動ログ例
```
🚀 Murder Mystery Generator v2.0 [1749577407145] - Direct Init
✅ Murder Mystery Generator v2.0 initialized successfully!
```

### 異常な起動ログ例 (これが表示されたら問題)
```
App initializing for Vercel...
Ultra UI System initializing...
```

## 🎯 成功基準

### ✅ 正常動作の確認ポイント
1. 新しい初期化ログが表示される
2. モジュラーローディング画面が表示される
3. ステップナビゲーションが正常に動作する
4. 「生成開始」でAPI呼び出しが実行される
5. 古いシステムのログが**表示されない**

### ❌ 問題がある場合の症状
1. 古いapp.jsのログが表示される
2. 初期化画面が表示されない
3. モジュールロードエラーが発生する
4. APIコールが失敗する

## 📞 サポート

問題が解決しない場合：

1. **コンソールログ**: ブラウザのコンソールログ全体をキャプチャ
2. **ネットワークタブ**: 失敗しているリクエストを確認
3. **環境情報**: ブラウザ、OS、デプロイ先の情報
4. **再現手順**: 問題が発生する具体的な手順

**重要**: 古いapp.jsのログが表示される場合は、必ずキャッシュクリアを最初に試してください。

---

**🎉 成功すれば、クリーンなモジュラーシステムでシナリオ生成が動作します！**