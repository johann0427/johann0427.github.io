// ==UserScript==
// @name         Anti Popunder Guard (pemsrv & friends)
// @namespace    https://local.userscripts/anti-popunder
// @version      1.0.0
// @description  擋掉點擊劫持 / 彈出式廣告跳轉（例如 s.pemsrv.com）。適用 iOS Safari 的 Userscripts App。
// @match        *://manga18.club/*
// @match        *://*.manga18.club/*
// @match        *://manga18.us/*
// @match        *://*.manga18.us/*
// @match        *://manhwas.me/*
// @match        *://*.manhwas.me/*
// @match        *://hanman18.com/*
// @match        *://*.hanman18.com/*
// @match        *://18porncomic.com/*
// @match        *://*.18porncomic.com/*
// @run-at       document-start
// @inject-into  page
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  /* ================= 設定區 ================= */

  // 要擋的廣告網域（含所有子網域）。想擋更多就加在這裡。
  const BLOCKED_HOSTS = [
    'pemsrv.com',
    // 'realsrv.com',
  ];

  // 擋掉「開到其他網站」的 window.open（彈出式 / 背景開啟廣告）
  const BLOCK_CROSS_SITE_WINDOW_OPEN = true;

  // 擋掉「不是你點的」跨網站導頁（location.href = 廣告）。需要 Safari 支援 Navigation API，不支援會自動略過。
  const BLOCK_SCRIPTED_CROSS_SITE_NAV = true;

  // 點站內連結時，由腳本直接導頁，讓網頁上的全域點擊監聽器（廣告腳本）收不到這次點擊。
  // 如果發現網站上某些按鈕失靈，把這個改成 false。
  const SWALLOW_LINK_CLICKS = true;

  // 移除「全螢幕、透明、蓋在最上面」的點擊劫持圖層
  const REMOVE_OVERLAYS = true;

  // 攔截時在畫面下方顯示小提示（方便在 iPhone 上確認腳本有作用）
  const SHOW_TOAST = true;

  /* ================= 共用工具 ================= */

  if (window.__antiPopunderGuard) return;
  try { Object.defineProperty(window, '__antiPopunderGuard', { value: true }); } catch (_) {}

  const noop = () => {};
  const toURL = (u) => { try { return new URL(String(u), location.href); } catch (_) { return null; } };
  const hostBlocked = (h) => BLOCKED_HOSTS.some((d) => h === d || h.endsWith('.' + d));
  const isBlockedUrl = (u) => { const x = toURL(u); return !!x && hostBlocked(x.hostname); };
  const baseDomain = (h) => h.split('.').slice(-2).join('.');
  const isWeb = (x) => x && (x.protocol === 'http:' || x.protocol === 'https:');
  const isCrossSite = (u) => {
    const x = toURL(u);
    return !!x && isWeb(x) && baseDomain(x.hostname) !== baseDomain(location.hostname);
  };

  let blockedCount = 0;
  let toastEl = null;
  let toastTimer = 0;
  function report(what) {
    blockedCount++;
    try { console.log('[AntiPopunder] blocked:', what); } catch (_) {}
    if (!SHOW_TOAST || !document.documentElement) return;
    try {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.style.cssText =
          'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483647;' +
          'background:rgba(0,0,0,.82);color:#fff;font:12px/1.4 -apple-system,sans-serif;' +
          'padding:6px 12px;border-radius:14px;pointer-events:none;opacity:0;transition:opacity .3s;';
      }
      if (!toastEl.isConnected) document.documentElement.appendChild(toastEl);
      toastEl.textContent = '🛡️ 已攔截 ' + blockedCount + ' 次（' + what + '）';
      toastEl.style.opacity = '1';
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toastEl.style.opacity = '0'; }, 2000);
    } catch (_) {}
  }

  const lock = (obj, prop, value) => {
    try {
      Object.defineProperty(obj, prop, { value, writable: false, configurable: false });
    } catch (_) {
      try { obj[prop] = value; } catch (__) {}
    }
  };

  /* ================= 1. window.open ================= */

  // 回傳假的 window 物件，避免廣告腳本因為 open() 回傳 null 而改用 location 直接導頁
  const fakeWindow = () => ({
    closed: false,
    opener: null,
    focus: noop, blur: noop, close: noop, postMessage: noop,
    addEventListener: noop, removeEventListener: noop,
    location: { href: 'about:blank', assign: noop, replace: noop, reload: noop },
    document: { write: noop, writeln: noop, open: noop, close: noop },
  });

  const origOpen = window.open;
  lock(window, 'open', function (url, target) {
    try {
      const t = String(target || '_blank').toLowerCase();
      const selfLike = t === '_self' || t === '_top' || t === '_parent';
      const u = (url === undefined || url === null || url === '') ? null : toURL(url);
      const blank = !u || u.href === 'about:blank';
      const block =
        (u && hostBlocked(u.hostname)) ||
        (BLOCK_CROSS_SITE_WINDOW_OPEN && u && isCrossSite(u.href) && !selfLike) ||
        (blank && !selfLike);
      if (block) { report('window.open'); return fakeWindow(); }
    } catch (_) {}
    return origOpen.apply(this, arguments);
  });

  /* ================= 2. 程式觸發的假點擊 ================= */

  // 廣告常動態建立 <a target=_blank> 然後 .click()
  const origAnchorClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    try {
      if (isBlockedUrl(this.href) || (this.target === '_blank' && isCrossSite(this.href))) {
        report('a.click()');
        return;
      }
    } catch (_) {}
    return origAnchorClick.apply(this, arguments);
  };

  const origDispatch = EventTarget.prototype.dispatchEvent;
  EventTarget.prototype.dispatchEvent = function (ev) {
    try {
      if (ev && ev.type === 'click' && this instanceof HTMLAnchorElement &&
          (isBlockedUrl(this.href) || (!ev.isTrusted && isCrossSite(this.href)))) {
        report('dispatch click');
        return false;
      }
    } catch (_) {}
    return origDispatch.apply(this, arguments);
  };

  // 不讓廣告網域的 <script> / <iframe> 被動態插入
  const guardInsert = (name) => {
    const orig = Node.prototype[name];
    Node.prototype[name] = function (node) {
      try {
        if (node && node.nodeType === 1 && (node.tagName === 'SCRIPT' || node.tagName === 'IFRAME') &&
            node.src && isBlockedUrl(node.src)) {
          report(node.tagName.toLowerCase());
          return node;
        }
      } catch (_) {}
      return orig.apply(this, arguments);
    };
  };
  guardInsert('appendChild');
  guardInsert('insertBefore');

  /* ================= 3. 點擊攔截（capture 階段，比網頁自己的監聽器早） ================= */

  const onClick = (e) => {
    try {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;

      // 連結已被換成廣告網址
      if (isBlockedUrl(a.href)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        report('ad link');
        return;
      }

      if (!SWALLOW_LINK_CLICKS || !e.isTrusted) return;

      const x = toURL(a.href);
      if (!x || !isWeb(x) || x.origin !== location.origin) return;
      if (a.hasAttribute('download')) return;
      const t = (a.getAttribute('target') || '_self').toLowerCase();
      if (t !== '_self') return;
      if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // 同頁錨點不處理
      if (x.hash && x.pathname === location.pathname && x.search === location.search) return;

      e.preventDefault();
      e.stopImmediatePropagation();
      location.assign(x.href);
    } catch (_) {}
  };
  window.addEventListener('click', onClick, true);
  window.addEventListener('auxclick', onClick, true);

  /* ================= 4. Navigation API：擋掉腳本強制導頁 ================= */

  try {
    const nav = window.navigation;
    if (nav && typeof nav.addEventListener === 'function') {
      nav.addEventListener('navigate', (e) => {
        try {
          if (!e.cancelable || e.hashChange || (e.destination && e.destination.sameDocument)) return;
          if (e.navigationType !== 'push' && e.navigationType !== 'replace') return;
          const url = e.destination.url;
          const scriptedCrossSite = BLOCK_SCRIPTED_CROSS_SITE_NAV && !e.userInitiated && isCrossSite(url);
          if (isBlockedUrl(url) || scriptedCrossSite) {
            e.preventDefault();
            report('redirect');
          }
        } catch (_) {}
      });
    }
  } catch (_) {}

  /* ================= 5. 清除透明覆蓋層 / 廣告 iframe ================= */

  function looksLikeOverlay(el) {
    if (!(el instanceof HTMLElement) || el === document.body || el === document.documentElement) return false;
    if (el === toastEl) return false;
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'absolute') return false;
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const z = parseInt(cs.zIndex, 10);
    if (!(z >= 1000)) return false;
    const r = el.getBoundingClientRect();
    if (r.width < innerWidth * 0.7 || r.height < innerHeight * 0.7) return false;
    if (el.textContent.trim() !== '') return false;                       // 有文字：可能是正常彈窗（例如年齡確認）
    if (el.querySelector('img,video,canvas,input,button,select,textarea')) return false;
    const bg = cs.backgroundColor;
    const clear = parseFloat(cs.opacity) < 0.1 || bg === 'transparent' ||
      /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0(\.0+)?\s*\)/.test(bg);
    return clear && cs.backgroundImage === 'none';
  }

  function process(n) {
    if (!n || !n.isConnected) return;
    const frames = n.tagName === 'IFRAME' ? [n] : Array.from(n.querySelectorAll ? n.querySelectorAll('iframe[src]') : []);
    for (const f of frames) {
      if (isBlockedUrl(f.src)) { f.remove(); report('iframe'); }
    }
    if (REMOVE_OVERLAYS && n.isConnected && looksLikeOverlay(n)) {
      n.remove();
      report('overlay');
    }
  }

  const pending = new Set();
  let timer = 0;
  const flush = () => {
    timer = 0;
    const items = Array.from(pending);
    pending.clear();
    for (const n of items) { try { process(n); } catch (_) {} }
  };
  const queue = (n) => { pending.add(n); if (!timer) timer = setTimeout(flush, 150); };

  const observer = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'childList') {
        m.addedNodes.forEach((n) => { if (n.nodeType === 1) queue(n); });
      } else if (m.type === 'attributes' && m.target.nodeType === 1) {
        queue(m.target);
      }
    }
  });
  const startObserver = () => {
    if (!document.documentElement) return;
    observer.observe(document.documentElement, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'],
    });
  };
  if (document.documentElement) startObserver();
  else document.addEventListener('DOMContentLoaded', startObserver, { once: true });

  try { console.log('[AntiPopunder] active on', location.hostname); } catch (_) {}
})();
