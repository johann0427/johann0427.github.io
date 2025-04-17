// ==UserScript==
// @name         YouTube Mobile LiveChat (SAP)
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  在 YouTube Mobile 直播串流找回聊天室框架
// @author       You
// @match        https://m.youtube.com/*
// @grant        none
// @icon         https://icons.duckduckgo.com/ip2/youtube.com.ico
// ==/UserScript==

(function() {
  'use strict';

  const LOG_PREFIX = '[LiveChat]';
  const CHAT_IFRAME_ID = 'mobile-live-chat';
  const TOGGLE_BTN_ID = 'chat-toggle-btn';
  let lastVideoId = null;

  function log(...args) { console.log(LOG_PREFIX, ...args); }

  // 清除聊天室 UI
  function clearChatUI() {
    if (document.getElementById(CHAT_IFRAME_ID) || document.getElementById(TOGGLE_BTN_ID)) {
      log('Clearing chat UI');
      document.getElementById(CHAT_IFRAME_ID)?.remove();
      document.getElementById(TOGGLE_BTN_ID)?.remove();
    }
  }

  // 建立聊天室 iframe 與切換按鈕
  function createChatUI(videoId) {
    log('Creating chat UI for videoId=', videoId);
    clearChatUI();
    const iframe = document.createElement('iframe');
    iframe.id = CHAT_IFRAME_ID;
    Object.assign(iframe.style, {
      position: 'fixed', bottom: '0', right: '0',
      width: '100%', height: '40%',
      zIndex: '9999', border: 'none', background: '#fff', transition: 'all 0.3s ease'
    });
    iframe.src = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${location.hostname}`;
    document.body.appendChild(iframe);

    const btn = document.createElement('button');
    btn.id = TOGGLE_BTN_ID;
    btn.textContent = '縮小聊天室';
    Object.assign(btn.style, {
      position: 'fixed', bottom: '41%', right: '10px',
      zIndex: '10000', padding: '6px 10px', fontSize: '14px',
      border: 'none', borderRadius: '6px', background: '#000',
      color: '#fff', opacity: '0.7', cursor: 'pointer', transition: 'all 0.3s ease'
    });
    let isMin = false;
    btn.addEventListener('click', () => {
      log('Toggling chat size, isMin=', isMin);
      if (isMin) {
        Object.assign(iframe.style, { width: '100%', height: '40%', bottom: '0', right: '0' });
        btn.textContent = '縮小聊天室'; btn.style.bottom = '41%';
      } else {
        Object.assign(iframe.style, { width: '200px', height: '200px', bottom: '10px', right: '10px' });
        btn.textContent = '還原聊天室'; btn.style.bottom = '220px';
      }
      isMin = !isMin;
    });
    document.body.appendChild(btn);
  }

  function getUrlVideoId() {
    try {
      return new URLSearchParams(location.search).get('v');
    } catch (e) {
      return null;
    }
  }

  // 更新聊天室 UI
  function updateChat() {
    const vid = getUrlVideoId();
    if (!vid) {
      clearChatUI();
      lastVideoId = null;
      return;
    }
    if (vid === lastVideoId) {
      return;
    }
    lastVideoId = vid;
    createChatUI(vid);
  }

  // 方法1：觀察播放器下方容器的 DOM 變動
  function observeContainer() {
    const container = document.querySelector('ytm-app#app .page-container .ytm-watch.ambient-topbar .watch-below-the-player');
    if (!container) {
      log('Container not found, will retry observeContainer later');
      return;
    }
    log('Observing container for SAP changes');
    new MutationObserver((mutations) => {
      log('Container mutation detected');
      updateChat();
    }).observe(container, { childList: true, subtree: true });
  }

  // 方法2：攔截 History API
  (function() {
    const _push = history.pushState;
    history.pushState = function() {
      _push.apply(this, arguments);
      log('pushState detected'); updateChat();
    };
    const _replace = history.replaceState;
    history.replaceState = function() {
      _replace.apply(this, arguments);
      log('replaceState detected'); updateChat();
    };
    window.addEventListener('popstate', () => { log('popstate detected'); updateChat(); });
  })();

  // 啟動偵測
  log('Initialization');
  updateChat();
  observeContainer();
})();
