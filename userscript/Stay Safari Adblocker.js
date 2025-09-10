// ==UserScript==
// @name         Network-level Ad Blocker
// @namespace    http://tampermonkey.net/
// @version      1.04
// @description  在網路請求階段阻擋廣告
// @match        *://*/*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const blockedDomains = [
        'xdmi4s.com',
        'm.xiaomaolm.com',   // 可以加上更多廣告域
    ];

    // --- 攔截 fetch ---
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : input.url;
        if(blockedDomains.some(d => url.includes(d))) {
            console.log(`Blocked fetch request: ${url}`);
            return new Promise(() => {}); // 永不 resolve
        }
        return originalFetch.apply(this, arguments);
    };

    // --- 攔截 XMLHttpRequest ---
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if(blockedDomains.some(d => url.includes(d))) {
            console.log(`Blocked XHR request: ${url}`);
            this.abort(); // 直接中斷
            return;
        }
        return originalOpen.apply(this, arguments);
    };
})();
