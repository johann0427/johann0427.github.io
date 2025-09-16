// ==UserScript==
// @name         Ads Blocker for jjmh.top
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  攔截並記錄載入 v.huangmaolm.com 的 script/fetch/xhr/iframe/document.write 等...
// @match        *://jjmh.top/*
// @match        *://*.jjmh.top/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
  "use strict";

  const BLOCK_DOMAIN = 'v.huangmaolm.com';
  const PREFIX = '%c[AdBlocker]';
  const PREFIX_STYLE = 'background:#b02;color:#fff;padding:2px 5px;border-radius:3px';
  const debugStack = true; // 是否在每次阻擋時印出 stack trace

  const counts = { scripts:0, fetch:0, xhr:0, iframe:0, docwrite:0, worker:0, setAttr:0 };

  function log(...args){
    try { console.log(PREFIX, PREFIX_STYLE, ...args); } catch(e){}
  }
  function traceIf(msg){
    log(msg);
    if(debugStack) console.trace();
  }

  function shouldBlockUrl(u){
    try { return !!u && u.indexOf(BLOCK_DOMAIN) !== -1; } catch(e){ return false; }
  }

  // expose a quick reporter
  window.__adblocker_report = {
    counts,
    blockedDomain: BLOCK_DOMAIN,
    show(){ console.table(counts); }
  };

  // ---- override Element.setAttribute generically for script/iframe/link ----
  const origSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) {
    try {
      const tag = (this.tagName||'').toLowerCase();
      if ((tag === 'script' || tag === 'iframe' || tag === 'link') &&
          (name === 'src' || name === 'href' || name === 'data-src') &&
          shouldBlockUrl(String(value || ''))) {
        counts.setAttr++;
        traceIf(`Blocked Element.setAttribute on <${tag}> ${name}="${value}"`);
        // safer: mark as blocked and remove the URL so it won't load
        this.setAttribute('data-ad-blocked', '1');
        // do not call origSetAttribute for the blocked url
        return;
      }
    } catch(e){
      console.error('setAttribute wrapper error', e);
    }
    return origSetAttribute.apply(this, arguments);
  };

  // ---- intercept createElement so script nodes get special handlers ----
  const origCreateElem = Document.prototype.createElement;
  Document.prototype.createElement = function(tagName, options) {
    const el = origCreateElem.call(this, tagName, options);
    try {
      if ((tagName||'').toLowerCase() === 'script') {
        // override setAttribute for this element specifically (extra safety)
        const orig = el.setAttribute;
        el.setAttribute = function(name, value){
          if ((name === 'src' || name === 'data-src') && shouldBlockUrl(String(value||''))) {
            counts.scripts++;
            traceIf('Blocked script.setAttribute(src) -> ' + value);
            this.setAttribute('data-ad-blocked','1');
            return;
          }
          return orig.apply(this, arguments);
        };
        // override src property setter if possible
        try {
          const protoDesc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
          if (protoDesc && protoDesc.set) {
            Object.defineProperty(el, 'src', {
              configurable: true,
              enumerable: true,
              get(){ return protoDesc.get.call(this); },
              set(v){
                if (shouldBlockUrl(String(v||''))) {
                  counts.scripts++;
                  traceIf('Blocked script.src assignment -> ' + v);
                  this.setAttribute('data-ad-blocked','1');
                  return;
                }
                return protoDesc.set.call(this, v);
              }
            });
          }
        } catch(e){}
      }
    } catch(e){}
    return el;
  };

  // ---- mutate / append interceptors ----
  function blockIfScriptOrIframe(node){
    try {
      if (!node || !node.tagName) return false;
      const tag = node.tagName.toLowerCase();
      if (tag === 'script') {
        const src = node.src || node.getAttribute && node.getAttribute('src') || node.getAttribute && node.getAttribute('data-src');
        if (shouldBlockUrl(src)) {
          counts.scripts++;
          node.setAttribute && node.setAttribute('data-ad-blocked','1');
          // neutralize: remove src/href and make type non-js
          try { node.removeAttribute && node.removeAttribute('src'); } catch(e){}
          try { node.type = 'javascript/blocked'; } catch(e){}
          traceIf('Blocked appended script -> ' + src);
          return true;
        }
      } else if (tag === 'iframe') {
        const src = node.src || node.getAttribute && node.getAttribute('src');
        if (shouldBlockUrl(src)) {
          counts.iframe++;
          node.setAttribute && node.setAttribute('data-ad-blocked','1');
          try { node.removeAttribute && node.removeAttribute('src'); } catch(e){}
          traceIf('Blocked appended iframe -> ' + src);
          return true;
        }
      } else if (tag === 'link') {
        const href = node.href || node.getAttribute && node.getAttribute('href');
        if (shouldBlockUrl(href)) {
          counts.scripts++;
          node.setAttribute && node.setAttribute('data-ad-blocked','1');
          try { node.removeAttribute && node.removeAttribute('href'); } catch(e){}
          traceIf('Blocked appended link -> ' + href);
          return true;
        }
      }
    } catch(e){ console.error('blockIfScriptOrIframe error', e); }
    return false;
  }

  const origAppend = Node.prototype.appendChild;
  Node.prototype.appendChild = function(node) {
    if (blockIfScriptOrIframe(node)) {
      // still return node to avoid throwing for caller, but do NOT append the blocked URL
      return node;
    }
    return origAppend.call(this, node);
  };

  const origInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, refNode) {
    if (blockIfScriptOrIframe(newNode)) {
      return newNode;
    }
    return origInsertBefore.call(this, newNode, refNode);
  };

  const origReplace = Node.prototype.replaceChild;
  Node.prototype.replaceChild = function(newNode, oldNode) {
    if (blockIfScriptOrIframe(newNode)) {
      return oldNode;
    }
    return origReplace.call(this, newNode, oldNode);
  };

  // ---- intercept insertAdjacentHTML and document.write ----
  const origInsertAdjacentHTML = Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML = function(position, text) {
    try {
      if (String(text||'').indexOf(BLOCK_DOMAIN) !== -1) {
        counts.docwrite++;
        traceIf('Blocked insertAdjacentHTML that contains ' + BLOCK_DOMAIN);
        // strip <script ...src=...BLOCK_DOMAIN...>...</script>
        const safe = String(text).replace(new RegExp(`<script[\\s\\S]*?${BLOCK_DOMAIN}[\\s\\S]*?</script>`, 'gi'), '');
        return origInsertAdjacentHTML.call(this, position, safe);
      }
    } catch(e){ console.error('insertAdjacentHTML wrapper error', e); }
    return origInsertAdjacentHTML.call(this, position, text);
  };

  const origDocWrite = Document.prototype.write;
  Document.prototype.write = function(...args) {
    try {
      const joined = args.join('');
      if (joined.indexOf(BLOCK_DOMAIN) !== -1) {
        counts.docwrite++;
        traceIf('Blocked document.write that contains ' + BLOCK_DOMAIN);
        const safe = String(joined).replace(new RegExp(`<script[\\s\\S]*?${BLOCK_DOMAIN}[\\s\\S]*?</script>`, 'gi'), '');
        return origDocWrite.call(this, safe);
      }
    } catch(e){ console.error('document.write wrapper error', e); }
    return origDocWrite.apply(this, args);
  };

  // ---- intercept fetch ----
  const origFetch = window.fetch;
  window.fetch = function(input, init) {
    try {
      const url = (typeof input === 'string') ? input : (input && input.url);
      if (shouldBlockUrl(url)) {
        counts.fetch++;
        traceIf('Blocked fetch to ' + url);
        return Promise.reject(new Error('Blocked fetch to ' + BLOCK_DOMAIN));
      }
    } catch(e){ console.error('fetch wrapper error', e); }
    return origFetch.apply(this, arguments);
  };

  // ---- intercept XHR ----
  const origXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    try { this.__ab_block_url = url; } catch(e){}
    return origXHROpen.apply(this, arguments);
  };
  const origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(body) {
    try {
      if (this.__ab_block_url && shouldBlockUrl(this.__ab_block_url)) {
        counts.xhr++;
        traceIf('Blocked XHR to ' + this.__ab_block_url);
        // abort before sending
        try { this.abort(); } catch(e){}
        return;
      }
    } catch(e){ console.error('XHR send wrapper error', e); }
    return origXHRSend.apply(this, arguments);
  };

  // ---- intercept Worker construction (importScripts inside worker would otherwise load) ----
  try {
    const OrigWorker = window.Worker;
    window.Worker = function(scriptURL, options) {
      try {
        if (typeof scriptURL === 'string' && shouldBlockUrl(scriptURL)) {
          counts.worker++;
          traceIf('Blocked Worker creation for ' + scriptURL);
          // create an inert worker to avoid script crash
          const blob = new Blob(["self.onmessage = function(){}"], { type: 'application/javascript' });
          return new OrigWorker(URL.createObjectURL(blob), options);
        }
      } catch(e){}
      return new OrigWorker(scriptURL, options);
    };
    window.Worker.prototype = OrigWorker.prototype;
  } catch(e){ /* skip if not allowed */ }

  // ---- MutationObserver to catch anything we missed and remove nodes referencing domain ----
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes && m.addedNodes.forEach(node => {
        try {
          if (node && node.nodeType === 1) {
            // check script/iframe/link quickly
            const tag = node.tagName && node.tagName.toLowerCase();
            if ((tag === 'script' || tag === 'iframe' || tag === 'link') && (shouldBlockUrl(node.src || node.href || node.getAttribute && node.getAttribute('src') || node.getAttribute && node.getAttribute('href')))) {
              blockIfScriptOrIframe(node);
              node.remove();
            }
            // also check descendants
            node.querySelectorAll && node.querySelectorAll('script,iframe,link').forEach(el=>{
              if (shouldBlockUrl(el.src || el.href || el.getAttribute && el.getAttribute('src') || el.getAttribute && el.getAttribute('href'))) {
                blockIfScriptOrIframe(el);
                el.remove();
              }
            });
          }
        } catch(e){ console.error('MO handler error', e); }
      });
    });
  });
  try { mo.observe(document.documentElement || document, { childList: true, subtree: true }); } catch(e){}

  log('Installed blocking hooks for domain:', BLOCK_DOMAIN);
  // small periodic reporter to console (optional)
  setInterval(()=>{ /* prints a quiet summary to console every 12s so you can see counts increment while testing */
    // uncomment next line if you want periodic summary:
    // log('summary', JSON.stringify(counts));
  }, 12000);

})();
