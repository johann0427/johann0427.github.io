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


// 獲取 .wp-pagenavi 元素並進行處理
const pageNaviElement = document.querySelector('.wp-pagenavi');

if (pageNaviElement) {
  // 複製 .wp-pagenavi 元素
  const clonedElement = pageNaviElement.cloneNode(true);

  // 設置複製元素的樣式
  clonedElement.style.cssText = 'margin = 0 0 24px 0; float: none;';

  // 找到 .wp-pagenavi 的前三個父元素，並將複製的元素插入到它們的前面
  let parent = pageNaviElement.parentNode;
  for (let i = 0; i < 3 && parent; i++) {
    parent.insertBefore(clonedElement, parent.firstChild);
    parent = parent.parentNode; // 移動到上一層父元素
  }
}

