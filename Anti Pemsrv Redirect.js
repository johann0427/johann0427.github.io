// ==UserScript==
// @name         Anti Pemsrv Redirect (Enhanced Blocking)
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  防止 pemsrv.com 劫持 a href，並完全阻止所有 pemsrv.com 請求
// @author       You
// @match        *://manhwaclub.net/*
// @match        *://manhwabuddy.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log("Anti-Pemsrv Script Loaded.");

    const blockedDomains = ["pemsrv.com", "a.pemsrv.com", "s.pemsrv.com"];

    // **1️⃣ 阻止 HTTP 請求 (xhr, fetch, script 加載)**
    // 攔截原始的 XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        xhr.open = function(method, url, async, user, password) {
            // 檢查請求的 URL 是否包含被攔截的域名
            if (blockedDomains.some(domain => url.includes(domain))) {
                console.log("Blocked XHR request:", url);
                return; // 阻止該請求
            }
            originalOpen.apply(this, arguments);
        };
        return xhr;
    };

    // 攔截 fetch 請求
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        const url = typeof input === "string" ? input : input.url;
        if (blockedDomains.some(domain => url.includes(domain))) {
            console.log("Blocked fetch request:", url);
            return Promise.reject("Blocked request to pemsrv.com");
        }
        return originalFetch.apply(this, arguments);
    };

    // 攔截 script 標籤的載入請求
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.tagName === "SCRIPT") {
                    const src = node.src || "";
                    if (blockedDomains.some(domain => src.includes(domain))) {
                        console.log("Blocked Script:", src);
                        node.remove(); // 阻止腳本載入
                    }
                }
            });
        });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // **2️⃣ 攔截 window.open，阻止新窗口彈出**
    const originalWindowOpen = window.open;
    window.open = function(url, target, features) {
        if (url.includes("pemsrv.com")) {
            console.log("Blocked window.open:", url);
            return null; // 阻止新視窗彈出
        }
        return originalWindowOpen.apply(this, arguments);
    };

    // **3️⃣ 攔截 document.write，防止動態寫入有害腳本**
    const originalWrite = document.write;
    document.write = function(content) {
        if (content.includes("pemsrv.com") || content.includes("a.pemsrv.com")) {
            console.log("Blocked document.write content:", content);
            return; // 阻止寫入
        }
        originalWrite.apply(this, arguments);
    };

    // **4️⃣ 監聽並修復 <a> 標籤，避免 href 被劫持**
    function restoreLinks() {
        document.querySelectorAll("a").forEach(a => {
            if (a.hasAttribute("data-original-href")) {
                a.href = a.getAttribute("data-original-href");
            } else {
                a.setAttribute("data-original-href", a.href);
            }

            // 移除不必要的 target="_blank"
            a.removeAttribute("target");
        });
    }

    // 監聽 DOM 變化，只影響 <a> 標籤
    const linkObserver = new MutationObserver(() => restoreLinks());
    linkObserver.observe(document.body, { childList: true, subtree: true });

})();
