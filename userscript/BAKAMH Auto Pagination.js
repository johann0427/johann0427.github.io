// ==UserScript==
// @name         BAKAMH Auto Pagination
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Infinite Scroll And Auto Pagination with History Restore
// @match        https://bakamh.com/manhwa/*
// @match        https://bakamh.com/manga/*
// @grant        none
// ==/UserScript==

(function() {

  let currentPage = 1;

  // 嘗試從網址抓出當前頁碼
  const match = window.location.pathname.match(/\/page\/(\d+)\//);
  if (match) {
    currentPage = parseInt(match[1], 10);
  }

  let loading = false;
  const threshold = 400;

  // ----------- 狀態儲存 & 還原 ------------
  function saveState() {
    const container = document.querySelector("#loop-content");
    if (container) {
      history.replaceState({
        page: currentPage,
        html: container.innerHTML,
        scrollY: window.scrollY
      }, "", window.location.href);
    }
  }

  function restoreState(state) {
    if (!state) return;
    const container = document.querySelector("#loop-content");
    if (container && state.html) {
      container.innerHTML = state.html;
      currentPage = state.page || 1;
      setTimeout(() => window.scrollTo(0, state.scrollY || 0), 0);
      console.log(`♻️ 已還原到第 ${currentPage} 頁`);
    }
  }

  window.addEventListener("popstate", (e) => {
    restoreState(e.state);
  });
  // ---------------------------------------

  async function loadNextPage() {
    if (loading) return;
    loading = true;
    currentPage++;

    const nextUrl = `https://bakamh.com/manhwa/page/${currentPage}/`;
    console.log("🔄 載入:", nextUrl);

    try {
      const res = await fetch(nextUrl);
      if (!res.ok) throw new Error(res.statusText);
      const html = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // 取出後續的分頁物件
      const items = doc.querySelectorAll(".page-listing-item");
      if (items.length === 0) {
        console.log("❌ 已經到底了！");
        window.removeEventListener("scroll", scrollHandler);
        return;
      }

      // 物件依附在現有的內容框架
      const container = document.querySelector("#loop-content");
      items.forEach(el => container.appendChild(el));

      console.log(`✅ 第 ${currentPage} 頁已載入 (${items.length} 個項目)`);

      // 每次載入完成就存狀態
      saveState();
    } catch (err) {
      console.error("❌ 載入失敗:", err);
    } finally {
      loading = false;
    }
  }

  function scrollHandler() {
    if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - threshold)) {
      loadNextPage();
    }
  }

  // avatar 修改
  const avatarImg = document.querySelector(".c-user_avatar-image img");
  if (avatarImg) {
    avatarImg.srcset = "https://discord.do/wp-content/uploads/2024/06/Akane.jpg 2x";
  }

  // main page auto pagination
  if (window.location.pathname.startsWith("/manhwa/")) {
    // 嘗試還原快取狀態（如果有）
    restoreState(history.state);
    window.addEventListener("scroll", scrollHandler);
  }

  // manga page load more chapters
  if (window.location.pathname.startsWith("/manga/")) {
    const el = document.querySelector(".listing-chapters_main.show-more");
    const ch = document.querySelectorAll(".chapter-loveYou a");

    ch.forEach(a => {
      const textWidth = a.scrollWidth;
      const containerWidth = 180;

      if (textWidth > containerWidth) {
        a.classList.add("marquee");
        if (!a.querySelector("span")) {
          a.innerHTML = `<span>${a.textContent.trim()}</span>`;
        }
      }
    });

    if (el) {
      el.classList.remove("show-more");
    }
    const style = document.createElement("style");
    style.textContent = `
      #manga-header {
        display: none;
      }
      span.chapter-release-date {
        float: right;
        margin-top: 1rem;
      }
      .marquee {
        width: 180px;
        overflow: hidden;
        white-space: nowrap;
        position: relative;
      }
      .marquee span {
        display: inline-block;
        padding-left: 10px;
        animation: marquee 2s linear infinite;
      }
      @keyframes marquee {
        from { transform: translateX(0); }
        to   { transform: translateX(-25%); }
      }
    `;
    document.head.appendChild(style);
  }

})();
