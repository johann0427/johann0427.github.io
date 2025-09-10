// ==UserScript==
// @name         Kill Inline Ad Scripts
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  阻止三種內嵌廣告 script
// @author       You
// @match        *://*/*
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  //------------------------------------------------
  // 攔截 document.write => 阻止 "pbodapef_b"
  //------------------------------------------------
  document.write = new Proxy(document.write, {
    apply(target, thisArg, args) {
      if (args && args[0] && args[0].includes("pbodapef_b")) {
        console.warn("[AdBlock] 阻止 pbodapef_b 廣告");
        return;
      }
      return Reflect.apply(target, thisArg, args);
    }
  });

  //------------------------------------------------
  // 攔截 appendChild script (針對 iframe 廣告)
  //------------------------------------------------
  const origAppendChild = Element.prototype.appendChild;
  Element.prototype.appendChild = function(el) {
    if (el.tagName === "IFRAME") {
      if (el.src && /xdmi4s\.com|ads|doubleclick/.test(el.src)) {
        console.warn("[AdBlock] 移除廣告 iframe:", el.src);
        return el; // 阻止掛載
      }
    }
    if (el.tagName === "SCRIPT") {
      const code = el.innerHTML || "";
      if (/new Function\(|EujtLXsu/.test(code)) {
        console.warn("[AdBlock] 阻止惡意 new Function script");
        return el;
      }
    }
    return origAppendChild.call(this, el);
  };

  //------------------------------------------------
  // 監控動態新增的 script (處理直接 inline 注入)
  //------------------------------------------------
  const observer = new MutationObserver(muts => {
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1 && node.tagName === "SCRIPT") {
          const code = node.innerHTML || "";
          if (code.includes("pbodapef_b") ||
              code.includes("new Function") && code.includes("EujtLXsu")) {
            console.warn("[AdBlock] 移除 inline 惡意 script");
            node.remove();
          }
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

})();
