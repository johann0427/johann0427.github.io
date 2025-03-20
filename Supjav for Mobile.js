// ==UserScript==
// @name         Supjav for Mobile
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  replace download column by referer sites
// @author       You
// @match        https://supjav.com/*/*
// @icon         https://icons.duckduckgo.com/ip2/supjav.com.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 嘗試取得影片識別碼 (bangou)
    let archiveTitle = document.querySelector('.archive-title');
    if (!archiveTitle) {
        console.error("找不到 title，無法提取番號。");
        return;
    }

    let bangouMatch = archiveTitle.innerText.match(/(\d+)*[1-9A-z]*( |-)\d+/);
    if (!bangouMatch) {
        console.error("無法從 title 提取番號。");
        return;
    }

    let bangou = bangouMatch[0].split(']').pop().trim();
    let encodedBangou = bangou.replace(/-/g, '--');
    let maUrl = "https://missav123.com/" + bangou;
    let tkUrl = "https://tktube.com/search/?q=" + encodeURIComponent(encodedBangou);

    let style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
        .btn-site {
            display: inline-block;
            border-radius: 3px;
            color: #fff;
            background: #464646;
            padding: 1px 8px;
            margin-right: 5px;
            margin-bottom: 5px;
        }
    `;
    document.head.appendChild(style);

    // 創建新的 Referer Sites 區塊
    let refererDiv = document.createElement('div');
    refererDiv.className = 'referer';

    refererDiv.innerHTML = `
        <div class="referer-site">
            <span class="btn-title">SITES : </span>
            <a href="${maUrl}" class="btn-site" target="_blank">MISSAV</a>
            <a href="${tkUrl}" class="btn-site" target="_blank">TKTUBE</a>
        </div>
    `;

    // 替換 .downs 區塊
    let downsDiv = document.querySelector('.downs');
    if (downsDiv) {
        downsDiv.replaceWith(refererDiv);
    } else {
        console.warn("找不到 .downs，無法替換！");
    }
})();
