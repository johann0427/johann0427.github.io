// ==UserScript==
// @name         Safari Ad Blocker for Dynamic Ads
// @namespace    http://tampermonkey.net/
// @version      1.02
// @description  阻擋動態生成廣告，防止跳轉/彈窗 (iPhone Safari / Stay for Safari)
// @match        *://*/*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- 防止 document.write 和 eval 注入 ---
    const originalWrite = document.write;
    document.write = function(){ console.log('document.write blocked'); };
    const originalEval = window.eval;
    window.eval = function(){ console.log('eval blocked'); };

    // --- 阻止 window.location 跳轉 ---
    ['assign','replace','reload'].forEach(fn=>{
        window.location[fn] = function(){ console.log(`window.location.${fn} blocked`); };
    });

    // --- 阻止廣告點擊事件 ---
    document.addEventListener('click', e => {
        if(e.target.closest('.pbodapef_b, .ad-container, [id^="ad"]')) {
            e.stopImmediatePropagation();
            e.preventDefault();
            console.log('Ad click blocked');
        }
    }, true);

    // --- MutationObserver 自動移除廣告元素 ---
    const removeAds = () => {
        const ads = document.querySelectorAll(
            '.pbodapef_b, .ad-container, script[src*="xdmi4s.com"], iframe[src*="xdmi4s.com"]'
        );
        if(ads.length) {
            ads.forEach(el=>el.remove());
            console.log(`Removed ${ads.length} ad elements`);
        }
    };

    const observer = new MutationObserver(removeAds);
    observer.observe(document.documentElement || document.body, {childList: true, subtree: true});

    // --- 初始清理一次 ---
    window.addEventListener('DOMContentLoaded', removeAds);
})();
