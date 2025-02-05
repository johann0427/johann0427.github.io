// ==UserScript==
// @name         手勢觸發返回按鈕 (Safari Mobile) + 軌跡指示
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  從最右側滑出時，顯示滑動指示條，成功後顯示小白圓點，點擊返回上一頁
// @author       ChatGPT
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 避免在 iframe 內運行
    if (window.top !== window) return;

    // 創建返回按鈕
    let backButton = document.createElement('div');
    backButton.textContent = '←';
    backButton.style.cssText = `
        position: fixed;
        right: 20px; /* 按鈕距離螢幕右側 20px */
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

    // 創建滑動指示條
    let trackIndicator = document.createElement('div');
    trackIndicator.style.cssText = `
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 10px;
        height: 40px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 5px;
        z-index: 9998;
        display: none;  /* 預設隱藏 */
        transition: background 0.2s, width 0.2s;
    `;

    document.body.appendChild(backButton);
    document.body.appendChild(trackIndicator);

    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;

    // 監聽手指觸摸開始
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        isSwiping = touchStartX > window.innerWidth - 40;  // 右側 40px 內才啟動

        if (isSwiping) {
            trackIndicator.style.display = 'block';
            trackIndicator.style.background = 'rgba(0, 0, 0, 0.2)';
            trackIndicator.style.width = '10px';
        }
    });

    // 監聽手指滑動
    document.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        touchEndX = e.touches[0].clientX;
        let distance = touchStartX - touchEndX;

        // 更新滑動指示條的寬度與顏色（視覺化滑動進度）
        if (distance > 0) {
            let progress = Math.min(distance / 50, 1); // 限制最大變化
            trackIndicator.style.width = `${10 + progress * 30}px`;
            trackIndicator.style.background = `rgba(0, 0, 0, ${0.2 + progress * 0.5})`;
        }
        
        // 若滑動超過 20px，顯示按鈕
        if (distance > 20) {
            backButton.style.display = 'flex';
            backButton.style.opacity = '1';

            // 自動隱藏按鈕
            setTimeout(() => {
                backButton.style.opacity = '0';
                setTimeout(() => backButton.style.display = 'none', 300);
            }, 3000);
        }
    });

    // 監聽手指離開
    document.addEventListener('touchend', () => {
        trackIndicator.style.display = 'none'; // 隱藏滑動指示條
    });

    // 點擊按鈕返回上一頁
    backButton.onclick = () => {
        window.history.back();
    };

})();
