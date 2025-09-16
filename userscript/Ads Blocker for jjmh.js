// ==UserScript==
// @name         Ads Blocker for jjmh.top
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  攔截並記錄載入 v.huangmaolm.com 的 script/fetch/xhr/iframe/document.write 等...
// @match        *://jjmh.top/*
// @match        *://*.jjmh.top/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
  const BLOCK_DOMAIN = "v.huangmaolm.com";

  function removeAds(root=document) {
    root.querySelectorAll('script[src*="'+BLOCK_DOMAIN+'"],iframe[src*="'+BLOCK_DOMAIN+'"]').forEach(el=>{
      el.remove();
      console.log("[SafariAdBlocker] removed", el);
    });
  }

  // 先跑一次
  removeAds();

  // 監聽後續 DOM
  new MutationObserver(muts=>{
    for(const m of muts){
      m.addedNodes.forEach(node=>{
        if(node.nodeType===1){
          removeAds(node);
        }
      });
    }
  }).observe(document.documentElement,{childList:true,subtree:true});
})();

