/**
 * 🔧 Advanced User Operations - 出力後の操作性強化
 * ユーザビリティ向上のための高度な操作機能
 */

// グローバル変数
let currentActiveTab = 'overview';
let searchHighlights = [];
let currentSearchIndex = 0;

/**
 * 📊 タブ切り替え機能（改善版）
 */
function showTab(tabName) {
  // 全てのタブボタンと内容を非アクティブに
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = 'none';
    content.classList.remove('active');
  });

  // 選択されたタブをアクティブに
  const activeButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
  const activeContent = document.getElementById(`tab-${tabName}`);
  
  if (activeButton && activeContent) {
    activeButton.classList.add('active');
    activeContent.style.display = 'block';
    activeContent.classList.add('active');
    currentActiveTab = tabName;
    
    // スムーズスクロール
    activeContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // 成功通知
    showToast(`📖 ${getTabDisplayName(tabName)}を表示中`, 'info', 2000);
  }
}

/**
 * 🔍 コンテンツ検索機能
 */
function searchContent() {
  const searchTerm = document.getElementById('content-search').value.trim();
  if (!searchTerm) {
    showToast('❗ 検索語句を入力してください', 'warning', 3000);
    return;
  }

  clearSearch();
  
  const activeTabContent = document.getElementById(`tab-${currentActiveTab}`);
  if (!activeTabContent) return;

  // 検索実行
  const results = findInContent(activeTabContent, searchTerm);
  
  if (results.length > 0) {
    highlightSearchResults(results);
    showToast(`🔍 ${results.length}件の結果が見つかりました`, 'success', 3000);
    
    // 最初の結果にスクロール
    if (results[0]) {
      results[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } else {
    showToast('❌ 検索結果が見つかりませんでした', 'warning', 3000);
  }
}

/**
 * 🎯 コンテンツ内検索
 */
function findInContent(container, searchTerm) {
  const results = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent;
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    
    if (index !== -1) {
      results.push({
        node: node,
        index: index,
        term: searchTerm
      });
    }
  }
  
  return results;
}

/**
 * ✨ 検索結果ハイライト
 */
function highlightSearchResults(results) {
  searchHighlights = [];
  
  results.forEach((result, index) => {
    const { node, index: textIndex, term } = result;
    const text = node.textContent;
    
    // ハイライト用のspan要素を作成
    const beforeText = text.substring(0, textIndex);
    const highlightText = text.substring(textIndex, textIndex + term.length);
    const afterText = text.substring(textIndex + term.length);
    
    // 新しいHTML構造を作成
    const span = document.createElement('span');
    span.innerHTML = `${beforeText}<mark class="search-highlight" data-index="${index}">${highlightText}</mark>${afterText}`;
    
    // 元のテキストノードを置換
    node.parentNode.replaceChild(span, node);
    searchHighlights.push(span.querySelector('.search-highlight'));
  });
}

/**
 * 🧹 検索結果クリア
 */
function clearSearch() {
  // ハイライトを削除
  document.querySelectorAll('.search-highlight').forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceWith(...parent.childNodes);
  });
  
  // 検索入力をクリア
  const searchInput = document.getElementById('content-search');
  if (searchInput) {
    searchInput.value = '';
  }
  
  searchHighlights = [];
  currentSearchIndex = 0;
}

/**
 * 🎛️ フィルター適用
 */
function applyFilter() {
  const filterValue = document.getElementById('content-filter').value;
  const activeTabContent = document.getElementById(`tab-${currentActiveTab}`);
  
  if (!activeTabContent) return;
  
  // 全要素を表示
  activeTabContent.querySelectorAll('[data-content-type]').forEach(el => {
    el.style.display = 'block';
  });
  
  // フィルターに応じて非表示
  if (filterValue !== 'all') {
    activeTabContent.querySelectorAll(`[data-content-type]:not([data-content-type="${filterValue}"])`).forEach(el => {
      el.style.display = 'none';
    });
  }
  
  showToast(`🎯 フィルター「${getFilterDisplayName(filterValue)}」を適用しました`, 'info', 3000);
}

/**
 * 📋 表示中タブをコピー
 */
function copyTabContent() {
  const activeTabContent = document.getElementById(`tab-${currentActiveTab}`);
  if (!activeTabContent) {
    showToast('❌ コピーするコンテンツが見つかりません', 'error', 3000);
    return;
  }

  const textContent = activeTabContent.innerText;
  
  navigator.clipboard.writeText(textContent).then(() => {
    showToast(`📋 ${getTabDisplayName(currentActiveTab)}をコピーしました`, 'success', 3000);
  }).catch(err => {
    console.error('Copy failed:', err);
    showToast('❌ コピーに失敗しました', 'error', 3000);
  });
}

/**
 * 📋 全シナリオテキストをコピー
 */
function copyScenarioText() {
  if (!window.currentSessionData) {
    showToast('❌ シナリオデータが見つかりません', 'error', 3000);
    return;
  }

  const sessionData = window.currentSessionData;
  const phases = sessionData.phases || {};
  
  let fullText = '='.repeat(60) + '\n';
  fullText += '   🎭 プロフェッショナル マーダーミステリー シナリオ\n';
  fullText += '='.repeat(60) + '\n\n';
  
  // 各フェーズの内容を追加
  Object.keys(phases).forEach(stepKey => {
    const phase = phases[stepKey];
    if (phase && phase.content) {
      fullText += `\n${'='.repeat(40)}\n`;
      fullText += `📝 ${phase.name}\n`;
      fullText += `${'='.repeat(40)}\n\n`;
      
      Object.values(phase.content).forEach(content => {
        if (typeof content === 'string') {
          fullText += content + '\n\n';
        }
      });
    }
  });
  
  fullText += '\n' + '='.repeat(60) + '\n';
  fullText += '🎉 シナリオ生成完了 - Powered by AI\n';
  fullText += '='.repeat(60);
  
  navigator.clipboard.writeText(fullText).then(() => {
    showToast('📋 完全シナリオをコピーしました！', 'success', 4000);
  }).catch(err => {
    console.error('Copy failed:', err);
    showToast('❌ コピーに失敗しました', 'error', 3000);
  });
}

/**
 * 💾 テキストファイルとして保存
 */
function saveAsText() {
  if (!window.currentSessionData) {
    showToast('❌ シナリオデータが見つかりません', 'error', 3000);
    return;
  }

  const sessionData = window.currentSessionData;
  const phases = sessionData.phases || {};
  
  // タイトル抽出
  let title = 'マーダーミステリーシナリオ';
  const step1 = phases.step1;
  if (step1 && step1.content && step1.content.concept) {
    const titleMatch = step1.content.concept.match(/## 作品タイトル[\s\S]*?\n([^\n]+)/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
  }
  
  let fullText = '='.repeat(60) + '\n';
  fullText += `   🎭 ${title}\n`;
  fullText += '   プロフェッショナル マーダーミステリー シナリオ\n';
  fullText += '='.repeat(60) + '\n\n';
  
  // 基本情報
  const formData = sessionData.formData || {};
  fullText += '📊 基本情報\n';
  fullText += '-'.repeat(30) + '\n';
  fullText += `参加人数: ${formData.participants || 5}人\n`;
  fullText += `プレイ時間: ${formData.complexity === 'simple' ? '30分' : formData.complexity === 'complex' ? '60分' : '45分'}\n`;
  fullText += `時代背景: ${formData.era || '現代'}\n`;
  fullText += `舞台設定: ${formData.setting || '閉鎖空間'}\n`;
  fullText += `トーン: ${formData.tone || 'シリアス'}\n\n`;
  
  // 各フェーズの内容を追加
  Object.keys(phases).forEach(stepKey => {
    const phase = phases[stepKey];
    if (phase && phase.content) {
      fullText += `\n${'='.repeat(50)}\n`;
      fullText += `📝 ${phase.name}\n`;
      fullText += `${'='.repeat(50)}\n\n`;
      
      Object.values(phase.content).forEach(content => {
        if (typeof content === 'string') {
          // マークダウン記法をテキストに変換
          const cleanContent = content
            .replace(/## /g, '【】')
            .replace(/### /g, '■ ')
            .replace(/\*\*(.*?)\*\*/g, '★$1★')
            .replace(/<[^>]+>/g, ''); // HTMLタグ除去
          
          fullText += cleanContent + '\n\n';
        }
      });
    }
  });
  
  // 画像情報
  const images = sessionData.images || [];
  if (images.length > 0) {
    fullText += `\n${'='.repeat(50)}\n`;
    fullText += `🎨 生成画像一覧\n`;
    fullText += `${'='.repeat(50)}\n\n`;
    
    images.forEach((img, index) => {
      if (img.status === 'success') {
        fullText += `${index + 1}. ${img.description}\n`;
        fullText += `   URL: ${img.url}\n\n`;
      }
    });
  }
  
  fullText += '\n' + '='.repeat(60) + '\n';
  fullText += `🎉 シナリオ生成完了 - ${new Date().toLocaleString()}\n`;
  fullText += '🤖 Powered by AI Murder Mystery Generator\n';
  fullText += '='.repeat(60);
  
  // ファイルダウンロード
  const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  // ファイル名生成（安全な文字のみ）
  const safeTitle = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
  const timestamp = new Date().toISOString().slice(0, 10);
  
  a.href = url;
  a.download = `${safeTitle}_${timestamp}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('💾 テキストファイルをダウンロードしました', 'success', 4000);
}

/**
 * 🖼️ 画像モーダル表示
 */
function openImageModal(imageUrl, description) {
  // モーダル要素の作成
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="modal-backdrop" onclick="closeImageModal()"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h4>${description}</h4>
        <button class="modal-close" onclick="closeImageModal()">✕</button>
      </div>
      <div class="modal-body">
        <img src="${imageUrl}" alt="${description}" class="modal-image" loading="lazy">
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="downloadImage('${imageUrl}', '${description}')">
          💾 ダウンロード
        </button>
        <button class="btn btn-secondary" onclick="copyImageUrl('${imageUrl}')">
          📋 URL をコピー
        </button>
        <button class="btn btn-secondary" onclick="closeImageModal()">
          閉じる
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // ESCキーで閉じる
  document.addEventListener('keydown', handleEscapeKey);
}

/**
 * 🚫 画像モーダル閉じる
 */
function closeImageModal() {
  const modal = document.querySelector('.image-modal');
  if (modal) {
    modal.remove();
  }
  document.removeEventListener('keydown', handleEscapeKey);
}

/**
 * ⌨️ ESCキーハンドリング
 */
function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    closeImageModal();
  }
}

/**
 * 💾 画像ダウンロード
 */
async function downloadImage(imageUrl, description) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${description.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('💾 画像をダウンロードしました', 'success', 3000);
  } catch (error) {
    console.error('Download failed:', error);
    showToast('❌ ダウンロードに失敗しました', 'error', 3000);
  }
}

/**
 * 📋 画像URLをコピー
 */
function copyImageUrl(imageUrl) {
  navigator.clipboard.writeText(imageUrl).then(() => {
    showToast('📋 画像URLをコピーしました', 'success', 3000);
  }).catch(err => {
    console.error('Copy failed:', err);
    showToast('❌ コピーに失敗しました', 'error', 3000);
  });
}

/**
 * 🍞 トースト通知表示
 */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // 自動削除
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, duration);
}

/**
 * 📝 キーボードショートカット
 */
document.addEventListener('keydown', (event) => {
  // Ctrl+F で検索フォーカス
  if (event.ctrlKey && event.key === 'f') {
    event.preventDefault();
    const searchInput = document.getElementById('content-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
  
  // Ctrl+C で現在のタブをコピー
  if (event.ctrlKey && event.key === 'c' && !event.target.matches('input, textarea')) {
    event.preventDefault();
    copyTabContent();
  }
  
  // タブ切り替え (Ctrl + 数字)
  if (event.ctrlKey && /^[1-6]$/.test(event.key)) {
    event.preventDefault();
    const tabs = ['overview', 'scenario', 'characters', 'timeline', 'gm-guide', 'images'];
    const tabIndex = parseInt(event.key) - 1;
    if (tabs[tabIndex]) {
      showTab(tabs[tabIndex]);
    }
  }
});

/**
 * 🏷️ ヘルパー関数
 */
function getTabDisplayName(tabName) {
  const names = {
    'overview': '作品概要',
    'scenario': '完全シナリオ',
    'characters': 'ハンドアウト集',
    'timeline': '進行管理',
    'gm-guide': 'GMマニュアル',
    'images': 'アートワーク'
  };
  return names[tabName] || tabName;
}

function getFilterDisplayName(filterValue) {
  const names = {
    'all': 'すべて',
    'handouts': 'ハンドアウトのみ',
    'gm-info': 'GM専用情報',
    'characters': 'キャラクター情報',
    'timeline': 'タイムライン'
  };
  return names[filterValue] || filterValue;
}

/**
 * 🎮 ゲームパッド・タッチ操作対応
 */
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (event) => {
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
});

document.addEventListener('touchend', (event) => {
  if (!touchStartX || !touchStartY) return;
  
  const touchEndX = event.changedTouches[0].clientX;
  const touchEndY = event.changedTouches[0].clientY;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  
  // 水平スワイプの判定
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
    const tabs = ['overview', 'scenario', 'characters', 'timeline', 'gm-guide', 'images'];
    const currentIndex = tabs.indexOf(currentActiveTab);
    
    if (deltaX > 0 && currentIndex > 0) {
      // 右スワイプ - 前のタブ
      showTab(tabs[currentIndex - 1]);
    } else if (deltaX < 0 && currentIndex < tabs.length - 1) {
      // 左スワイプ - 次のタブ
      showTab(tabs[currentIndex + 1]);
    }
  }
  
  touchStartX = 0;
  touchStartY = 0;
});

/**
 * 🎨 初期化
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 Advanced User Operations initialized');
  
  // 検索フィールドにEnterキー対応
  const searchInput = document.getElementById('content-search');
  if (searchInput) {
    searchInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        searchContent();
      }
    });
  }
  
  // ツールチップ表示
  showToast('🎮 高度な操作機能が有効になりました', 'info', 3000);
});