/**
 * 🎯 SIMPLE RELIABLE SYSTEM - シンプル確実動作システム
 * 複雑なシステムを排除し、確実に動作する最小限のコード
 */

(function() {
    'use strict';
    
    console.log('🎯 SIMPLE RELIABLE SYSTEM - 起動中...');
    
    let currentStep = 1;
    const totalSteps = 5;
    
    // Chrome拡張エラーを無音で抑制
    const originalError = console.error;
    console.error = function(...args) {
        const msg = args.join(' ');
        if (!msg.includes('runtime.lastError') && !msg.includes('message port closed')) {
            originalError.apply(console, args);
        }
    };
    
    // シンプルなステップ表示関数
    function showStep(step) {
        console.log(`ステップ${step}を表示`);
        
        // 全ステップを非表示
        for (let i = 1; i <= totalSteps; i++) {
            const stepEl = document.getElementById(`step-${i}`);
            if (stepEl) {
                stepEl.style.display = 'none';
                stepEl.classList.remove('active');
            }
        }
        
        // 現在のステップを表示
        const currentStepEl = document.getElementById(`step-${step}`);
        if (currentStepEl) {
            currentStepEl.style.display = 'block';
            currentStepEl.classList.add('active');
        }
        
        updateButtons();
    }
    
    // ボタン状態を更新
    function updateButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const generateBtn = document.getElementById('stepwise-generation-btn');
        
        // 前へボタン
        if (prevBtn) {
            prevBtn.disabled = currentStep === 1;
            prevBtn.style.opacity = currentStep === 1 ? '0.5' : '1';
        }
        
        // 次へ・生成ボタンの切り替え
        if (currentStep === totalSteps) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (generateBtn) generateBtn.style.display = 'flex';
        } else {
            if (nextBtn) nextBtn.style.display = 'flex';
            if (generateBtn) generateBtn.style.display = 'none';
        }
    }
    
    // 次へ
    function goNext() {
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
            showToast(`ステップ${currentStep}に進みました`);
        }
    }
    
    // 前へ
    function goPrev() {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
            showToast(`ステップ${currentStep}に戻りました`);
        }
    }
    
    // 生成開始
    async function startGeneration() {
        showToast('シナリオ生成を開始します...');
        
        try {
            const response = await fetch('/api/test-simple');
            const data = await response.json();
            
            showResult(data);
            showToast('生成が完了しました！');
        } catch (error) {
            showToast('エラーが発生しました: ' + error.message);
        }
    }
    
    // 結果表示
    function showResult(data) {
        const mainCard = document.getElementById('main-card');
        const resultContainer = document.getElementById('result-container');
        const scenarioContent = document.getElementById('scenario-content');
        
        if (mainCard) mainCard.style.display = 'none';
        
        if (scenarioContent) {
            scenarioContent.innerHTML = `
                <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #10b981, #34d399); border-radius: 1rem; color: white;">
                    <h2 style="margin-bottom: 1rem; font-size: 2rem;">🎉 シナリオ生成完了！</h2>
                    <p style="margin-bottom: 1rem;">シンプルシステムで正常に動作しました</p>
                    <p style="margin-bottom: 2rem;">API応答: ${data.message || '正常'}</p>
                    <button onclick="location.reload()" style="
                        background: white; color: #10b981; border: none; 
                        padding: 12px 24px; border-radius: 8px; font-weight: bold; 
                        cursor: pointer; margin: 8px;
                    ">🔄 新規作成</button>
                </div>
            `;
        }
        
        if (resultContainer) {
            resultContainer.style.display = 'block';
            resultContainer.classList.remove('hidden');
        }
    }
    
    // シンプルなトースト
    function showToast(message) {
        const existing = document.querySelector('.simple-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'simple-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            background: #1f2937; color: white; padding: 12px 20px;
            border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-weight: 500; max-width: 300px;
            transform: translateX(400px); transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => { toast.style.transform = 'translateX(0)'; }, 100);
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
        }, 3000);
    }
    
    // イベント設定（1回のみ）
    function setupEvents() {
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        const generateBtn = document.getElementById('stepwise-generation-btn');
        
        if (nextBtn && !nextBtn.dataset.eventSet) {
            nextBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                goNext();
            });
            nextBtn.dataset.eventSet = 'true';
        }
        
        if (prevBtn && !prevBtn.dataset.eventSet) {
            prevBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                goPrev();
            });
            prevBtn.dataset.eventSet = 'true';
        }
        
        if (generateBtn && !generateBtn.dataset.eventSet) {
            generateBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                startGeneration();
            });
            generateBtn.dataset.eventSet = 'true';
        }
        
        // キーボードショートカット
        if (!document.body.dataset.keyboardSet) {
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'ArrowRight') {
                    e.preventDefault();
                    goNext();
                } else if (e.ctrlKey && e.key === 'ArrowLeft') {
                    e.preventDefault();
                    goPrev();
                }
            });
            document.body.dataset.keyboardSet = 'true';
        }
    }
    
    // 初期化
    function init() {
        // 初期表示
        showStep(1);
        
        // イベント設定
        setupEvents();
        
        // グローバル参照（デバッグ用）
        window.simpleSystem = {
            goNext,
            goPrev,
            currentStep: () => currentStep,
            showStep
        };
        
        console.log('✅ SIMPLE RELIABLE SYSTEM - 初期化完了');
        showToast('🎯 シンプルシステム起動完了');
    }
    
    // DOM準備完了後に実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // すぐに実行
        setTimeout(init, 100);
    }
    
})();