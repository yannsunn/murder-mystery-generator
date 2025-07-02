// 🚀 LIMIT BREAKTHROUGH: Enhanced Tab and Search Functions

// 表示中タブをコピー
async function copyTabContent() {
  const activeTab = document.querySelector('.tab-content[style*="display: block"]');
  if (!activeTab) {
    showToast('表示中のタブが見つかりません', 'error');
    return;
  }
  
  let content = '';
  const elements = activeTab.querySelectorAll('h4, h5, h6, p, li, strong, em');
  
  elements.forEach(element => {
    const text = element.textContent.trim();
    if (text) {
      if (element.tagName.match(/H[456]/)) {
        content += `\n\n${text}\n${'-'.repeat(text.length)}\n`;
      } else if (element.tagName === 'LI') {
        content += `• ${text}\n`;
      } else {
        content += `${text}\n`;
      }
    }
  });
  
  if (!content.trim()) {
    showToast('コピーするコンテンツがありません', 'warning');
    return;
  }
  
  try {
    await navigator.clipboard.writeText(content);
    showToast('表示中のタブをクリップボードにコピーしました！', 'success');
  } catch (error) {
    console.error('Copy failed:', error);
    showToast('コピーに失敗しました', 'error');
  }
}

// テキストファイルとして保存
function saveAsText() {
  const sessionData = window.currentSessionData;
  if (!sessionData) {
    showToast('保存するデータがありません', 'error');
    return;
  }
  
  let content = '';
  const phases = sessionData.phases || {};
  
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
  content += `生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
  
  const sections = [
    { key: 'step1', name: '作品概要' },
    { key: 'step4', name: 'キャラクター・ハンドアウト' },
    { key: 'step3', name: 'タイムライン・進行管理' },
    { key: 'step6', name: 'GMマニュアル' }
  ];
  
  sections.forEach(section => {
    const data = phases[section.key];
    if (data && data.content) {
      content += `\n\n=== ${section.name} ===\n\n`;
      
      Object.values(data.content).forEach(text => {
        if (typeof text === 'string') {
          const cleanText = text
            .replace(/##+ /g, '')
            .replace(/\\*\\*(.*?)\\*\\*/g, '$1')
            .replace(/<[^>]*>/g, '')
            .trim();
          content += cleanText + '\n\n';
        }
      });
    }
  });
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9\\u3040-\\u309F\\u30A0-\\u30FF\\u4E00-\\u9FAF]/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('テキストファイルとして保存しました！', 'success');
}

// コンテンツ検索機能
function searchContent() {
  const searchTerm = document.getElementById('content-search')?.value.trim();
  if (!searchTerm) {
    showToast('検索キーワードを入力してください', 'warning');
    return;
  }
  
  clearSearch();
  
  const contentElements = document.querySelectorAll('.tab-content');
  let matchCount = 0;
  
  contentElements.forEach(tabContent => {
    const textNodes = getTextNodes(tabContent);
    
    textNodes.forEach(node => {
      const text = node.textContent;
      const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
      
      if (regex.test(text)) {
        const highlightedText = text.replace(regex, '<mark class="search-highlight">$1</mark>');
        const wrapper = document.createElement('span');
        wrapper.innerHTML = highlightedText;
        
        node.parentNode.replaceChild(wrapper, node);
        matchCount++;
      }
    });
  });
  
  if (matchCount > 0) {
    showToast(`「${searchTerm}」が ${matchCount} 件見つかりました`, 'success');
  } else {
    showToast(`「${searchTerm}」は見つかりませんでした`, 'info');
  }
}

// 検索結果をクリア
function clearSearch() {
  const highlights = document.querySelectorAll('.search-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    const textNode = document.createTextNode(highlight.textContent);
    parent.replaceChild(textNode, highlight);
    parent.normalize();
  });
  
  const searchInput = document.getElementById('content-search');
  if (searchInput) {
    searchInput.value = '';
  }
  
  showToast('検索結果をクリアしました', 'info');
}

// フィルター適用
function applyFilter() {
  const filterValue = document.getElementById('content-filter')?.value;
  if (!filterValue || filterValue === 'all') {
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.style.display = '';
    });
    showToast('フィルターを解除しました', 'info');
    return;
  }
  
  const filterMap = {
    'handouts': 'characters',
    'gm-info': 'gm-guide',
    'characters': 'characters',
    'timeline': 'timeline'
  };
  
  const targetTab = filterMap[filterValue];
  if (targetTab) {
    showTab(targetTab);
    showToast(`${filterValue} にフィルターしました`, 'success');
  }
}

// ユーティリティ関数
function getTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (node.parentElement.tagName === 'SCRIPT' || 
            node.parentElement.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.textContent.trim() === '') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  return textNodes;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
}

// トーストメッセージ表示（result-helpersと重複を避けるため）
function showToast(message, type = 'success') {
  if (typeof window.showToast === 'function') {
    return window.showToast(message, type);
  }
  
  // フォールバック実装
  const existingToasts = document.querySelectorAll('.toast-message');
  existingToasts.forEach(toast => toast.remove());
  
  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

console.log('🚀 Enhanced helpers loaded successfully');