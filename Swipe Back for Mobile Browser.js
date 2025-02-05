// ==UserScript==
// @name         手勢觸發返回 (Safari Mobile)
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  透過滑動觸發返回按鈕，滑動到底後震動並返回上一頁
// @author       ChatGPT
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 避免在 iframe 內運行
    if (window.top !== window) return;

    // 定義 CSS 震動動畫
    let style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);

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

    // 創建返回按鈕
    let backButton = document.createElement('div');
    backButton.textContent = '←';
    backButton.style.cssText = `
        position: fixed;
        right: 30px; /* 按鈕距離螢幕右側 30px */
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

    document.body.appendChild(trackIndicator);
    document.body.appendChild(backButton);

    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;
    let triggerDistance = 100; // 需要滑動超過 100px 才會開始倒數計時
    let returnTimer = null; // 記錄倒數計時器

    // 監聽手指觸摸開始
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        isSwiping = touchStartX > window.innerWidth - 60;  // 右側 60px 內才啟動

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
            let progress = Math.min(distance / triggerDistance, 1); // 限制最大變化
            trackIndicator.style.width = `${10 + progress * 40}px`; // 最大寬度 50px
            trackIndicator.style.background = `rgba(0, 0, 0, ${0.2 + progress * 0.5})`;
        }

        // 若滑動超過 40px，顯示按鈕
        if (distance > 40) {
            backButton.style.display = 'flex';
            backButton.style.opacity = '1';
        }

        // 若滑動超過 `triggerDistance`，開始倒數計時 1 秒
        if (distance > triggerDistance && !returnTimer) {
            returnTimer = setTimeout(() => {
                // 觸發全畫面震動
                document.body.style.animation = 'shake 0.1s linear 2';

                // 0.2 秒後清除震動動畫
                setTimeout(() => {
                    document.body.style.animation = '';
                }, 200);

                // 1 秒後返回上一頁
                setTimeout(() => {
                    window.history.back();
                }, 100);
                
                returnTimer = null; // 重置計時器
            }, 1000);
        }
    });

    // 監聽手指離開
    document.addEventListener('touchend', () => {
        trackIndicator.style.display = 'none'; // 隱藏滑動指示條

        // 如果滑動未達到 `triggerDistance`，取消計時器
        if (returnTimer) {
            clearTimeout(returnTimer);
            returnTimer = null;
        }

        // 自動隱藏按鈕
        setTimeout(() => {
            backButton.style.opacity = '0';
            setTimeout(() => backButton.style.display = 'none', 300);
        }, 3000);
    });

    // 點擊按鈕返回上一頁（仍然保留）
    backButton.onclick = () => {
        // 觸發全畫面震動
        document.body.style.animation = 'shake 0.1s linear 2';

        // 0.2 秒後清除震動動畫
        setTimeout(() => {
            document.body.style.animation = '';
        }, 200);

        setTimeout(() => {
            window.history.back();
        }, 100);
    };

})();
