// ==UserScript==
// @name         手勢觸發返回按鈕 (Safari Mobile)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  只有從最右側滑出時才會顯示小白圓點，點擊返回上一頁
// @author       ChatGPT
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 避免在 iframe 內運行
    if (window.top !== window) return;

    let backButton = document.createElement('div');
    backButton.textContent = '←';
    backButton.style.cssText = `
        position: fixed;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        background: white;
        border: 2px solid #ccc;
        border-radius: 50%;
        box-shadow: 0px 2px 5px rgba(0,0,0,0.3);
        cursor: pointer;
        z-index: 9999;
        display: none;  /* 預設隱藏 */
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: bold;
        color: #555;
        user-select: none;
        transition: opacity 0.3s ease-in-out;
    `;

    // 點擊按鈕返回上一頁
    backButton.onclick = () => {
        window.history.back();
    };

    document.body.appendChild(backButton);

    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;

    // 監聽手指觸摸開始
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        isSwiping = touchStartX > window.innerWidth - 20;  // 右側 20px 內才啟動
    });

    // 監聽手指滑動
    document.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        touchEndX = e.touches[0].clientX;

        // 如果是從右向左滑動，顯示按鈕
        if (touchStartX - touchEndX > 20) {  
            backButton.style.display = 'flex';
            backButton.style.opacity = '1';

            // 自動隱藏按鈕
            setTimeout(() => {
                backButton.style.opacity = '0';
                setTimeout(() => backButton.style.display = 'none', 300);
            }, 3000);
        }
    });

})();
