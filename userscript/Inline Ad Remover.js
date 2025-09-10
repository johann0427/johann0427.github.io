// ==UserScript==
// @name         Kill Inline Ad Scripts
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  阻止內嵌廣告 script
// @author       You
// @match        *://*/*
// @run-at       document-start
// ==/UserScript==

(function() {
  "use strict";

  const blockedHosts = [
    "m.xiaomaolm.com",
    "xdmi4s.com"
  ];

  //-----------------------------------------
  // 1) 攔截 script 動態建立
  //-----------------------------------------
  const origCreateElement = Document.prototype.createElement;
  Document.prototype.createElement = function(tag) {
    const el = origCreateElement.call(this, tag);
    if (tag.toLowerCase() === "script") {
      Object.defineProperty(el, "src", {
        set(url) {
          if (blockedHosts.some(h => url.includes(h))) {
            console.warn("[AdBlock] 阻止 script 載入:", url);
            return ""; // 阻止設定
          }
          this.setAttribute("src", url);
        },
        get() {
          return this.getAttribute("src");
        }
      });
    }
    return el;
  };

  //-----------------------------------------
  // 2) 攔截 XHR
  //-----------------------------------------
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (blockedHosts.some(h => url.includes(h))) {
      console.warn("[AdBlock] 阻止 XHR:", url);
      return; // 不發送
    }
    return origOpen.call(this, method, url, ...rest);
  };

  //-----------------------------------------
  // 3) 攔截 fetch
  //-----------------------------------------
  const origFetch = window.fetch;
  window.fetch = function(url, ...args) {
    if (typeof url === "string" && blockedHosts.some(h => url.includes(h))) {
      console.warn("[AdBlock] 阻止 fetch:", url);
      return Promise.reject(new Error("Blocked by Safari Kill Ad.js"));
    }
    return origFetch(url, ...args);
  };

})();
