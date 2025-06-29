/**
 * 🎭 Phase-by-Phase Murder Mystery Generator
 * フェーズごとに手動実行する完全分離型システム
 */

class PhaseByPhaseApp {
  constructor() {
    this.currentPhase = 0;
    this.totalPhases = 8;
    this.sessionId = null;
    this.formData = {};
    this.phaseResults = {};
    this.isProcessing = false;
    
    console.log('🎭 Phase-by-Phase Generator - 初期化開始');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateUI();
    console.log('✅ Phase-by-Phase Generator - 初期化完了');
  }

  setupEventListeners() {
    // フェーズ実行ボタン
    const executeBtn = document.getElementById('execute-phase-btn');
    if (executeBtn) {
      executeBtn.addEventListener('click', () => this.executeCurrentPhase());
    }

    // リセットボタン
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetProgress());
    }

    // PDF生成ボタン
    const pdfBtn = document.getElementById('generate-pdf-btn');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => this.generatePDF());
    }
  }

  async createSession() {
    try {
      this.updateStatus('セッション作成中...', 'info');
      
      const response = await fetch('/api/scenario-storage?action=create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metadata: this.formData
        })
      });

      if (!response.ok) {
        throw new Error('セッション作成に失敗しました');
      }

      const result = await response.json();
      this.sessionId = result.sessionId;
      
      console.log('✅ セッション作成:', this.sessionId);
      this.updateStatus(`セッション作成完了: ${this.sessionId}`, 'success');
      
      return this.sessionId;
    } catch (error) {
      console.error('セッション作成エラー:', error);
      this.updateStatus(`セッション作成エラー: ${error.message}`, 'error');
      throw error;
    }
  }

  async executeCurrentPhase() {
    if (this.isProcessing) {
      this.updateStatus('処理中です。しばらくお待ちください。', 'warning');
      return;
    }

    try {
      this.isProcessing = true;
      
      // 最初のフェーズの場合、セッション作成
      if (!this.sessionId) {
        this.collectFormData();
        await this.createSession();
      }

      const nextPhaseId = this.currentPhase + 1;
      
      if (nextPhaseId > this.totalPhases) {
        this.updateStatus('全てのフェーズが完了しています', 'success');
        this.isProcessing = false;
        return;
      }

      this.updateStatus(`Phase ${nextPhaseId} 実行中...`, 'info');
      this.updateProgress(((nextPhaseId - 1) / this.totalPhases) * 100);

      const response = await fetch('/api/phase-executor?action=execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phaseId: nextPhaseId,
          sessionId: this.sessionId,
          formData: this.formData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Phase ${nextPhaseId} failed`);
      }

      const result = await response.json();
      
      // 結果を保存
      this.phaseResults[`phase${nextPhaseId}`] = result.result;
      this.currentPhase = nextPhaseId;
      
      // UI更新
      this.displayPhaseResult(nextPhaseId, result);
      this.updateProgress((nextPhaseId / this.totalPhases) * 100);
      
      if (result.isComplete) {
        this.updateStatus('🎉 全フェーズ完了！PDF生成が可能です', 'success');
      } else {
        this.updateStatus(`✅ Phase ${nextPhaseId} 完了 - 次: ${result.nextPhase.name}`, 'success');
      }

    } catch (error) {
      console.error('Phase execution error:', error);
      this.updateStatus(`❌ Phase ${this.currentPhase + 1} エラー: ${error.message}`, 'error');
    } finally {
      this.isProcessing = false;
      this.updateUI();
    }
  }

  displayPhaseResult(phaseId, result) {
    const resultsContainer = document.getElementById('phase-results');
    if (!resultsContainer) return;

    const phaseDiv = document.createElement('div');
    phaseDiv.className = 'phase-result mb-4 p-4 border rounded';
    phaseDiv.innerHTML = `
      <h3 class="phase-title">Phase ${phaseId}: ${result.phaseName}</h3>
      <div class="phase-content">
        <pre class="content-text">${JSON.stringify(result.result, null, 2)}</pre>
      </div>
      <div class="phase-meta text-sm text-gray-500">
        処理時間: ${result.processingTime} | 進捗: ${result.progress}%
      </div>
    `;

    resultsContainer.appendChild(phaseDiv);
    phaseDiv.scrollIntoView({ behavior: 'smooth' });
  }

  collectFormData() {
    // フォームデータを収集
    this.formData = {
      participants: document.getElementById('participants')?.value || '5',
      era: document.getElementById('era')?.value || 'modern',
      setting: document.getElementById('setting')?.value || 'mansion',
      incident_type: document.getElementById('incident_type')?.value || 'murder',
      worldview: document.getElementById('worldview')?.value || 'realistic',
      tone: document.getElementById('tone')?.value || 'serious'
    };
  }

  async generatePDF() {
    if (!this.sessionId || this.currentPhase < this.totalPhases) {
      this.updateStatus('全フェーズを完了してからPDF生成してください', 'warning');
      return;
    }

    try {
      this.updateStatus('PDF生成中...', 'info');
      
      const response = await fetch('/api/enhanced-pdf-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error('PDF生成に失敗しました');
      }

      // PDFダウンロード処理
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `murder_mystery_${this.sessionId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.updateStatus('✅ PDF生成完了！ダウンロードを開始します', 'success');

    } catch (error) {
      console.error('PDF generation error:', error);
      this.updateStatus(`❌ PDF生成エラー: ${error.message}`, 'error');
    }
  }

  resetProgress() {
    if (confirm('進捗をリセットしますか？すべてのデータが失われます。')) {
      this.currentPhase = 0;
      this.sessionId = null;
      this.phaseResults = {};
      this.isProcessing = false;
      
      // UI リセット
      const resultsContainer = document.getElementById('phase-results');
      if (resultsContainer) {
        resultsContainer.innerHTML = '';
      }
      
      this.updateProgress(0);
      this.updateStatus('リセット完了。新しい生成を開始できます', 'info');
      this.updateUI();
    }
  }

  updateUI() {
    const executeBtn = document.getElementById('execute-phase-btn');
    const pdfBtn = document.getElementById('generate-pdf-btn');
    const resetBtn = document.getElementById('reset-btn');

    if (executeBtn) {
      const nextPhase = this.currentPhase + 1;
      if (nextPhase <= this.totalPhases) {
        executeBtn.textContent = `Phase ${nextPhase} を実行`;
        executeBtn.disabled = this.isProcessing;
      } else {
        executeBtn.textContent = '全フェーズ完了';
        executeBtn.disabled = true;
      }
    }

    if (pdfBtn) {
      pdfBtn.disabled = this.currentPhase < this.totalPhases || this.isProcessing;
    }

    if (resetBtn) {
      resetBtn.disabled = this.isProcessing;
    }
  }

  updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `status-message ${type}`;
    }
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  updateProgress(percentage) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${Math.round(percentage)}% (Phase ${this.currentPhase}/${this.totalPhases})`;
    }
  }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
  window.phaseApp = new PhaseByPhaseApp();
});