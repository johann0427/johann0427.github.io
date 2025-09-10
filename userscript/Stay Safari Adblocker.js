// ==UserScript==
// @name         Stay Safari AdBlocker
// @namespace    http://tampermonkey.net/
// @version      1.01
// @description  阻擋特定廣告 script，支援 Stay for Safari
// @match        *://*/*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // -------------------------------
    // 1️⃣ 攔截 document.write
    // -------------------------------
    const originalWrite = document.write;
    document.write = function(...args) {
        const content = args.join('');
        // 判斷是否為已知廣告特徵
        if (/xiaomaolm|pbodapef_b|EujtLXsukpl7/.test(content)) {
            console.log('Blocked inline ad via document.write:', content.slice(0, 50));
            return; // 阻擋廣告
        }
        return originalWrite.apply(this, args);
    };

    // -------------------------------
    // 2️⃣ 移除已知廣告元素
    // -------------------------------
    function removeAds(node) {
        if (!node) return;
        // script src 或內部廣告特徵
        if (
            (node.tagName === 'SCRIPT' && /xiaomaolm|pbodapef_b|EujtLXsukpl7/.test(node.src + node.textContent)) ||
            (node.tagName === 'IFRAME' && /xiaomaolm|pbodapef_b/.test(node.src)) ||
            (node.tagName === 'DIV' && /pbodapef_b/.test(node.className))
        ) {
            node.remove();
            console.log('Removed ad element:', node);
        }
    }

    // -------------------------------
    // 3️⃣ 監控 DOM 變化
    // -------------------------------
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                removeAds(node);
                // 如果是容器，檢查子元素
                if (node.querySelectorAll) {
                    node.querySelectorAll('script,iframe,div').forEach(removeAds);
                }
            }
        }
    });

    observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
    });

    // -------------------------------
    // 4️⃣ 定時清理（補漏）
    // -------------------------------
    setInterval(() => {
        document.querySelectorAll('script,iframe,div').forEach(removeAds);
    }, 2000);

})();

