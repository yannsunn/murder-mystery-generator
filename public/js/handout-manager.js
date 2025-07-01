/**
 * 🎭 Player Handout Management System
 * プレイヤー別ハンドアウト管理システム
 */

// グローバル変数
let currentPlayerHandout = 0;
let playerHandoutsData = [];

/**
 * プレイヤーハンドアウト表示切り替え
 */
function showPlayerHandout(playerIndex) {
  // 全てのハンドアウトを非表示
  document.querySelectorAll('.player-handout').forEach(handout => {
    handout.style.display = 'none';
  });
  
  // 全てのタブを非アクティブ
  document.querySelectorAll('.player-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // 指定されたハンドアウトを表示
  const targetHandout = document.getElementById(`handout-${playerIndex}`);
  const targetTab = document.getElementById(`player-tab-${playerIndex}`);
  
  if (targetHandout) {
    targetHandout.style.display = 'block';
    currentPlayerHandout = playerIndex;
  }
  
  if (targetTab) {
    targetTab.classList.add('active');
  }
  
  // アクセシビリティ対応
  if (typeof announceToScreenReader === 'function') {
    const playerName = targetTab ? targetTab.textContent.trim() : `プレイヤー${playerIndex + 1}`;
    announceToScreenReader(`${playerName}のハンドアウトを表示しました`);
  }
}

/**
 * 全ハンドアウト表示
 */
function showAllHandouts() {
  // 全てのハンドアウトを非表示
  document.querySelectorAll('.player-handout').forEach(handout => {
    handout.style.display = 'none';
  });
  
  // 全てのタブを非アクティブ
  document.querySelectorAll('.player-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // 全ハンドアウト表示
  const allHandoutsDiv = document.getElementById('handout-all');
  if (allHandoutsDiv) {
    allHandoutsDiv.style.display = 'block';
  }
  
  // 「全ハンドアウト」タブをアクティブ
  const allTab = document.querySelector('.player-tab:last-child');
  if (allTab) {
    allTab.classList.add('active');
  }
  
  // アクセシビリティ対応
  if (typeof announceToScreenReader === 'function') {
    announceToScreenReader('全プレイヤーのハンドアウトを表示しました');
  }
}

/**
 * 特定プレイヤーのハンドアウトをコピー
 */
function copyPlayerHandout(playerIndex) {
  const handoutDiv = document.getElementById(`handout-${playerIndex}`);
  if (!handoutDiv) {
    console.error('ハンドアウトが見つかりません:', playerIndex);
    return;
  }
  
  const handoutBody = handoutDiv.querySelector('.handout-body');
  if (!handoutBody) {
    console.error('ハンドアウト本文が見つかりません');
    return;
  }
  
  const textContent = handoutBody.innerText || handoutBody.textContent;
  
  copyToClipboard(textContent).then(() => {
    const playerName = document.getElementById(`player-tab-${playerIndex}`)?.textContent || `プレイヤー${playerIndex + 1}`;
    
    if (typeof showToast === 'function') {
      showToast(`📋 ${playerName}のハンドアウトをコピーしました`, 'success', 3000);
    } else {
      alert(`${playerName}のハンドアウトをコピーしました`);
    }
    
    // アクセシビリティ対応
    if (typeof announceToScreenReader === 'function') {
      announceToScreenReader(`${playerName}のハンドアウトをクリップボードにコピーしました`);
    }
  }).catch(error => {
    console.error('コピーに失敗しました:', error);
    if (typeof showToast === 'function') {
      showToast('❌ コピーに失敗しました', 'error', 3000);
    } else {
      alert('コピーに失敗しました');
    }
  });
}

/**
 * 全ハンドアウトをコピー
 */
function copyAllHandouts() {
  const allHandoutsDiv = document.getElementById('handout-all');
  if (!allHandoutsDiv) {
    console.error('全ハンドアウトDivが見つかりません');
    return;
  }
  
  const handoutBody = allHandoutsDiv.querySelector('.handout-body');
  if (!handoutBody) {
    console.error('ハンドアウト本文が見つかりません');
    return;
  }
  
  const textContent = handoutBody.innerText || handoutBody.textContent;
  
  copyToClipboard(textContent).then(() => {
    if (typeof showToast === 'function') {
      showToast('📋 全プレイヤーのハンドアウトをコピーしました', 'success', 3000);
    } else {
      alert('全プレイヤーのハンドアウトをコピーしました');
    }
    
    // アクセシビリティ対応
    if (typeof announceToScreenReader === 'function') {
      announceToScreenReader('全プレイヤーのハンドアウトをクリップボードにコピーしました');
    }
  }).catch(error => {
    console.error('コピーに失敗しました:', error);
    if (typeof showToast === 'function') {
      showToast('❌ コピーに失敗しました', 'error', 3000);
    } else {
      alert('コピーに失敗しました');
    }
  });
}

/**
 * 特定プレイヤーのハンドアウトを印刷
 */
function printPlayerHandout(playerIndex) {
  const handoutDiv = document.getElementById(`handout-${playerIndex}`);
  if (!handoutDiv) {
    console.error('ハンドアウトが見つかりません:', playerIndex);
    return;
  }
  
  const playerName = document.getElementById(`player-tab-${playerIndex}`)?.textContent || `プレイヤー${playerIndex + 1}`;
  
  // 印刷用ウィンドウを開く
  const printWindow = window.open('', '_blank');
  const handoutContent = handoutDiv.innerHTML;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${playerName} - ハンドアウト</title>
      <style>
        body {
          font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
          line-height: 1.6;
          margin: 20px;
          color: #333;
        }
        .handout-header h4 {
          color: #2563eb;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .handout-actions {
          display: none;
        }
        h4, h5 {
          color: #1f2937;
          margin-top: 20px;
        }
        strong {
          color: #374151;
        }
        @media print {
          body { margin: 0; }
          .handout-header { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      ${handoutContent}
    </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  
  // 少し待ってから印刷ダイアログを表示
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
  
  // アクセシビリティ対応
  if (typeof announceToScreenReader === 'function') {
    announceToScreenReader(`${playerName}のハンドアウトの印刷を開始しました`);
  }
}

/**
 * 全ハンドアウトを印刷
 */
function printAllHandouts() {
  const allHandoutsDiv = document.getElementById('handout-all');
  if (!allHandoutsDiv) {
    console.error('全ハンドアウトDivが見つかりません');
    return;
  }
  
  // 印刷用ウィンドウを開く
  const printWindow = window.open('', '_blank');
  const handoutContent = allHandoutsDiv.innerHTML;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>全プレイヤーハンドアウト</title>
      <style>
        body {
          font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
          line-height: 1.6;
          margin: 20px;
          color: #333;
        }
        .handout-header h4 {
          color: #2563eb;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .handout-actions {
          display: none;
        }
        h4, h5 {
          color: #1f2937;
          margin-top: 20px;
          page-break-before: auto;
        }
        strong {
          color: #374151;
        }
        @media print {
          body { margin: 0; }
          .handout-header { page-break-inside: avoid; }
          h4 { page-break-before: always; }
          h4:first-child { page-break-before: auto; }
        }
      </style>
    </head>
    <body>
      ${handoutContent}
    </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  
  // 少し待ってから印刷ダイアログを表示
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
  
  // アクセシビリティ対応
  if (typeof announceToScreenReader === 'function') {
    announceToScreenReader('全プレイヤーのハンドアウトの印刷を開始しました');
  }
}

/**
 * クリップボードにコピーするヘルパー関数
 */
async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    // 新しいAPI使用
    return navigator.clipboard.writeText(text);
  } else {
    // フォールバック: 古いAPIまたは非セキュア環境
    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          resolve();
        } else {
          reject(new Error('Copy command failed'));
        }
      } catch (err) {
        document.body.removeChild(textArea);
        reject(err);
      }
    });
  }
}

/**
 * キーボードショートカット対応
 */
document.addEventListener('keydown', (event) => {
  // ハンドアウトタブがアクティブな場合のみ
  const charactersTab = document.getElementById('tab-characters');
  if (!charactersTab || charactersTab.style.display === 'none') {
    return;
  }
  
  // 数字キー（1-9）でプレイヤー切り替え
  if (event.key >= '1' && event.key <= '9' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
    const playerIndex = parseInt(event.key) - 1;
    const targetTab = document.getElementById(`player-tab-${playerIndex}`);
    
    if (targetTab) {
      event.preventDefault();
      showPlayerHandout(playerIndex);
    }
  }
  
  // A キーで全ハンドアウト表示
  if (event.key.toLowerCase() === 'a' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
    const allTab = document.querySelector('.player-tab:last-child');
    if (allTab) {
      event.preventDefault();
      showAllHandouts();
    }
  }
});

// モジュールとしてエクスポート（環境対応）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showPlayerHandout,
    showAllHandouts,
    copyPlayerHandout,
    copyAllHandouts,
    printPlayerHandout,
    printAllHandouts
  };
}

// グローバルスコープに関数を追加（ブラウザ環境）
if (typeof window !== 'undefined') {
  window.showPlayerHandout = showPlayerHandout;
  window.showAllHandouts = showAllHandouts;
  window.copyPlayerHandout = copyPlayerHandout;
  window.copyAllHandouts = copyAllHandouts;
  window.printPlayerHandout = printPlayerHandout;
  window.printAllHandouts = printAllHandouts;
}

console.log('🎭 Handout Management System loaded');