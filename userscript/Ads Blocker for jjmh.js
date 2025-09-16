// ==UserScript==
// @name         Ads Blocker for jjmh.top
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  攔截並記錄載入 v.huangmaolm.com 的 script/fetch/xhr/iframe/document.write 等...
// @match        *://jjmh.top/*
// @match        *://*.jjmh.top/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    "use strict";

    const BLOCK_DOMAIN = "v.huangmaolm.com";

    // 移除特定 script / iframe / div
    function removeAds(root=document) {
        const selector = `script[src*="${BLOCK_DOMAIN}"], iframe[src*="${BLOCK_DOMAIN}"], div[id*="huangmaolm"], div[class*="huangmaolm"]`;
        root.querySelectorAll(selector).forEach(el => {
            el.remove();
            console.log("[JJMH-AdCleaner] removed element:", el);
        });
    }

    // 初始掃描
    removeAds();

    // 動態監控後續 DOM 變化
    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            m.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // element node
                    removeAds(node);
                }
            });
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    // CSS 隱藏備援（防止快速閃爍）
    const style = document.createElement("style");
    style.innerHTML = `
        script[src*="${BLOCK_DOMAIN}"], 
        iframe[src*="${BLOCK_DOMAIN}"], 
        div[id*="huangmaolm"], 
        div[class*="huangmaolm"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            height: 0 !important;
            width: 0 !important;
        }
    `;
    document.head.appendChild(style);

})();


