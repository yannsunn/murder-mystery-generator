// 🎨 Result Display Helper Functions - Web表示完全対応

// タブ切り替え関数（パフォーマンス最適化版）
function showTab(tabName) {
  try {
    console.log(`Switching to tab: ${tabName}`);
    
    // DocumentFragment使用でDOM操作を最適化
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-button');
    
    // バッチでDOMを更新（リフロー最小化）
    requestAnimationFrame(() => {
      // 全てのタブを非表示
      tabs.forEach(tab => tab.style.display = 'none');
      
      // 全てのボタンのアクティブを解除
      buttons.forEach(btn => btn.classList.remove('active'));
      
      // 選択されたタブを表示
      const selectedTab = document.getElementById(`tab-${tabName}`);
      if (selectedTab) {
        selectedTab.style.display = 'block';
        console.log(`Tab ${tabName} displayed successfully`);
      } else {
        console.error(`Tab ${tabName} not found`);
      }
      
      // クリックされたボタンをアクティブに
      if (window.event && window.event.target) {
        window.event.target.classList.add('active');
      }
    });
  } catch (error) {
    console.error('Error in showTab:', error);
  }
}

// シナリオテキストをクリップボードにコピー
async function copyScenarioText() {
  const sessionData = window.currentSessionData;
  if (!sessionData) {
    showToast('コピーするデータがありません', 'error');
    return;
  }
  
  let content = '';
  const phases = sessionData.phases || {};
  
  // タイトル抽出
  const step1 = phases.step1;
  let title = 'マーダーミステリーシナリオ';
  if (step1 && step1.content && step1.content.concept) {
    const titleMatch = step1.content.concept.match(/## 作品タイトル[\\s\\S]*?\\n([^\\n]+)/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
  }
  
  content += `${title}\n`;
  content += `${'='.repeat(title.length)}\n\n`;
  
  // 各ステップの内容を追加
  Object.entries(phases).forEach(([key, data]) => {
    if (data.content && data.name) {
      content += `\\n\\n=== ${data.name} ===\\n\\n`;
      Object.values(data.content).forEach(text => {
        if (typeof text === 'string') {
          // マークダウンのシンプル化
          const cleanText = text
            .replace(/## /g, '')
            .replace(/### /g, '')
            .replace(/\\*\\*(.*?)\\*\\*/g, '$1');
          content += cleanText + '\\n\\n';
        }
      });
    }
  });
  
  try {
    await navigator.clipboard.writeText(content);
    showToast('シナリオをクリップボードにコピーしました！', 'success');
  } catch (error) {
    console.error('Copy failed:', error);
    showToast('コピーに失敗しました', 'error');
  }
}

// 画像モーダル表示
function openImageModal(url, description) {
  // 既存のモーダルを削除
  const existingModal = document.getElementById('image-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // モーダルHTML作成
  const modal = document.createElement('div');
  modal.id = 'image-modal';
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="modal-backdrop" onclick="closeImageModal()"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3>${description}</h3>
        <button class="modal-close" onclick="closeImageModal()">×</button>
      </div>
      <div class="modal-body">
        <img src="${url}" alt="${description}" loading="lazy">
        <div class="modal-actions">
          <a href="${url}" download="${description}.png" class="btn btn-primary">
            💾 ダウンロード
          </a>
          <button onclick="copyImageUrl('${url}')" class="btn btn-secondary">
            📋 URLをコピー
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // アニメーション
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

// 画像モーダル閉じる
function closeImageModal() {
  const modal = document.getElementById('image-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// 画像URLをコピー
async function copyImageUrl(url) {
  try {
    await navigator.clipboard.writeText(url);
    showToast('画像URLをコピーしました！', 'success');
  } catch (error) {
    showToast('URLのコピーに失敗しました', 'error');
  }
}

// トーストメッセージ表示
function showToast(message, type = 'success') {
  // 既存のトーストを削除
  const existingToasts = document.querySelectorAll('.toast-message');
  existingToasts.forEach(toast => toast.remove());
  
  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // 自動削除
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ESCキーでモーダルを閉じる
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeImageModal();
  }
});

// デバッグ用：ページ読み込み時にログ出力
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎨 result-helpers.js loaded successfully');
  console.log('🔧 Available functions:', {
    showTab: typeof showTab,
    copyScenarioText: typeof copyScenarioText,
    openImageModal: typeof openImageModal,
    closeImageModal: typeof closeImageModal
  });
});

// モーダル用CSS追加
const modalStyles = `
<style>
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-modal.show {
  opacity: 1;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  cursor: pointer;
}

.modal-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--primary-800);
  border-radius: var(--radius-lg);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: var(--shadow-2xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--primary-900);
  border-bottom: 1px solid var(--primary-600);
}

.modal-header h3 {
  margin: 0;
  color: var(--primary-100);
  font-size: 1.2rem;
}

.modal-close {
  background: none;
  border: none;
  color: var(--primary-400);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all var(--animation-normal);
}

.modal-close:hover {
  background: var(--primary-700);
  color: var(--primary-100);
}

.modal-body {
  padding: 1.5rem;
  text-align: center;
}

.modal-body img {
  max-width: 100%;
  max-height: 60vh;
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 95vw;
    max-height: 95vh;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-actions .btn {
    width: 100%;
  }
}
</style>
`;

// スタイルを追加
if (!document.getElementById('modal-styles')) {
  const styleEl = document.createElement('div');
  styleEl.id = 'modal-styles';
  styleEl.innerHTML = modalStyles;
  document.head.appendChild(styleEl);
}