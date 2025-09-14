// ==UserScript==
// @name         BAKAMH Auto Pagination
// @namespace    http://tampermonkey.net/
// @version      1.21
// @description  Infinite Scroll And Auto Pagination
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

      console.log(`✅ 第 ${page} 頁已載入 (${items.length} 個項目)`);
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

  // main page auto pagination
  if (window.location.pathname.startsWith("/manhwa/")) {
    window.addEventListener("scroll", scrollHandler);
  }

  // manga page load more chapters
  if (window.location.pathname.startsWith("/manga/")) {
    const el = document.querySelector(".listing-chapters_main.show-more");
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
    `;
    document.head.appendChild(style);
  }

})();
