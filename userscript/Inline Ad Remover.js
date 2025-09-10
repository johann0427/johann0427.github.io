// ==UserScript==
// @name         Kill Inline Ad Scripts
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  阻止三種內嵌廣告 script
// @author       You
// @match        *://*/*
// @include      http://*/*
// @include      https://*/*
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';

  //------------------------------------------------
  // 1) 攔截 document.write (避免透明黑塊 redirect)
  //------------------------------------------------
  const origWrite = document.write;
  document.write = function(...args) {
    if (args[0] && args[0].includes("pbodapef_b")) {
      // Safari: 用 alert 測試是否真的執行
      console.log("[AdBlock] 阻止 pbodapef_b 廣告");
      return;
    }
    return origWrite.apply(document, args);
  };

  //------------------------------------------------
  // 2) 監控新加入的 script/iframe，判斷是否廣告
  //------------------------------------------------
  function scanNode(node) {
    if (node.tagName === "SCRIPT") {
      const code = node.innerHTML || "";
      if (code.includes("pbodapef_b") ||
          (code.includes("new Function") && code.includes("EujtLXsu"))) {
        console.log("[AdBlock] 移除惡意 inline script");
        node.remove();
      }
    }
    if (node.tagName === "IFRAME") {
      const src = node.src || "";
      if (/xdmi4s\.com|doubleclick|ads/.test(src)) {
        console.log("[AdBlock] 移除廣告 iframe:", src);
        node.remove();
      }
    }
    if (node.classList && node.classList.contains("pbodapef_b")) {
      console.log("[AdBlock] 移除透明廣告區塊");
      node.remove();
    }
  }

  // 初始清理
  document.querySelectorAll("script,iframe,.pbodapef_b").forEach(scanNode);

  // 動態監控
  const observer = new MutationObserver(muts => {
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) scanNode(node);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

})();
