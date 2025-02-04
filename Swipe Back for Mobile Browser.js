// ==UserScript==
// @name         返回上一頁按鈕 (Safari Mobile)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  在 Safari 移動版瀏覽器右側中間添加一個小白圓點，點擊返回上一頁
// @author       ChatGPT
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 創建按鈕
    let backButton = document.createElement('div');
    backButton.textContent = '←';  // 箭頭圖示
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
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: bold;
        color: #555;
        user-select: none;
    `;

    // 點擊事件 - 返回上一頁
    backButton.onclick = () => window.history.back();

    // 添加到頁面
    document.body.appendChild(backButton);
})();
