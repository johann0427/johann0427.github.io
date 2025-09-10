// ==UserScript==
// @name         Stay Safari AdBlocker
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  阻擋特定廣告 script，支援 Stay for Safari
// @match        *://*/*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 廣告特徵
    const blockedDomains = [
        "m.xiaomaolm.com",
        "adsbygoogle"
    ];

    const blockedInlinePatterns = [
        /pbodapef_b/,            // 第一段 script 的 class 名稱
        /EujtLXsukpl/,           // 第二段 script 的混淆特徵
        /var:{\"8.5.0\"/,        // 第三段 ad.js 特徵
    ];

    // 監控新增 script
    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node.tagName === "SCRIPT") {
                    // 外部 script
                    if (node.src && blockedDomains.some(d => node.src.includes(d))) {
                        node.remove();
                        console.log("[AdBlock] 移除外部廣告:", node.src);
                        return;
                    }
                    // inline script
                    if (!node.src && node.textContent && blockedInlinePatterns.some(p => p.test(node.textContent))) {
                        node.remove();
                        console.log("[AdBlock] 移除 inline 廣告 script");
                        return;
                    }
                }
            });
        });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    // 防止第一段 inline script document.write 生成的廣告
    const originalWrite = document.write;
    document.write = function(str) {
        if (/pbodapef_b/.test(str)) {
            console.log("[AdBlock] 攔截 document.write 廣告");
            return;
        }
        return originalWrite.apply(document, arguments);
    };

})();
