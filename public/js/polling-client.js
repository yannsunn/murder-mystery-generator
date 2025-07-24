/**
 * Polling方式のクライアント実装
 * VercelのEventSource制限を回避
 */

class PollingClient {
  constructor() {
    this.pollInterval = 1000; // 1秒ごとにポーリング
    this.maxRetries = 3;
    this.currentPollTimer = null;
    this.sessionId = null;
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
  }

  /**
   * 生成開始
   */
  async start(formData) {
    // 既存のポーリングを停止
    this.stop();

    // セッションID生成
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await fetch('/api/polling-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'start',
          sessionId: this.sessionId,
          formData: formData
        })
      });

      if (!response.ok) {
        throw new Error(`Start failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to start generation');
      }

      // ポーリング開始
      this.startPolling();
      
      return this.sessionId;

    } catch (error) {
      console.error('Failed to start generation:', error);
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }

  /**
   * ポーリング開始
   */
  startPolling() {
    if (this.currentPollTimer) {
      return; // 既にポーリング中
    }

    const poll = async () => {
      try {
        const response = await fetch('/api/polling-generator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'poll',
            sessionId: this.sessionId
          })
        });

        if (!response.ok) {
          throw new Error(`Poll failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Poll failed');
        }

        // 進捗更新
        if (this.onProgress) {
          this.onProgress({
            status: result.status,
            progress: result.progress,
            currentStep: result.currentStep,
            totalSteps: result.totalSteps,
            messages: result.messages,
            elapsedTime: result.elapsedTime
          });
        }

        // 完了チェック
        if (result.status === 'completed') {
          this.stop();
          if (this.onComplete) {
            this.onComplete(result.result);
          }
          return;
        }

        // エラーチェック
        if (result.status === 'error') {
          this.stop();
          const error = new Error(result.error || 'Generation failed');
          if (this.onError) {
            this.onError(error);
          }
          return;
        }

        // 次のポーリング
        this.currentPollTimer = setTimeout(poll, this.pollInterval);

      } catch (error) {
        console.error('Polling error:', error);
        this.retryCount = (this.retryCount || 0) + 1;
        
        if (this.retryCount >= this.maxRetries) {
          this.stop();
          if (this.onError) {
            this.onError(error);
          }
        } else {
          // リトライ
          this.currentPollTimer = setTimeout(poll, this.pollInterval * 2);
        }
      }
    };

    // 初回ポーリング
    poll();
  }

  /**
   * ポーリング停止
   */
  stop() {
    if (this.currentPollTimer) {
      clearTimeout(this.currentPollTimer);
      this.currentPollTimer = null;
    }
    this.retryCount = 0;
  }

  /**
   * キャンセル
   */
  async cancel() {
    this.stop();

    if (!this.sessionId) {
      return;
    }

    try {
      await fetch('/api/polling-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'cancel',
          sessionId: this.sessionId
        })
      });
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  }
}

// グローバルに公開
window.PollingClient = PollingClient;