// ==UserScript==
// @name         manhwaclub bypasser
// @namespace    http://tampermonkey.net/
// @version      2025-02-03
// @description  prevent pemsrv redirect issues
// @author       You
// @match        *://manhwaclub.net/*
// @icon         https://icons.duckduckgo.com/ip2/manhwaclub.net.ico
// @grant        none
// ==/UserScript==

// 攔截頁面中的所有 'a' 元素點擊
document.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault(); // 阻止默認行為，避免強制跳轉

    const targetUrl = link.href;

    // 如果鏈接指向 pemsrv.com，則跳過處理，否則直接跳轉到原本鏈接
    if (targetUrl.includes('pemsrv.com')) {
      console.log('防止轉址，正在處理原始鏈接');
      // 這裡可以進行處理，根據需要跳轉到目標網址，避免被強制跳轉
      window.location.href = targetUrl; // 使用原始鏈接進行跳轉
    } else {
      // 如果是正常的鏈接，直接跳轉
      window.location.href = targetUrl;
    }
  });
});

// 攔截可能的強制跳轉腳本（例如 setTimeout 或 setInterval 中的跳轉）
(function() {
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;

  window.setTimeout = function(callback, delay) {
    // 攔截跳轉函數
    if (callback.toString().includes('window.location.href')) {
      console.log('阻止強制跳轉');
      return;
    }
    return originalSetTimeout(callback, delay);
  };

  window.setInterval = function(callback, delay) {
    // 攔截跳轉函數
    if (callback.toString().includes('window.location.href')) {
      console.log('阻止強制跳轉');
      return;
    }
    return originalSetInterval(callback, delay);
  };
})();
