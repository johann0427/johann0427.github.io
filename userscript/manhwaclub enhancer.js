// ==UserScript==
// @name         manhwaclub enhancer
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  Enhanced UI for easier reading manhwa
// @match        *://manhwaclub.net/*
// @grant        none
// ==/UserScript==

(function() {
  const STORAGE_KEY = 'favoriteManga';
  const favorites = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  const style = document.createElement('style');
  style.textContent = `
    /* 收藏按鈕 */
    .add-favorite {
      border: 1px solid red;
      padding: 0 4px;
      position: absolute;
      top: 0;
      right: 0;
      color: wheat;
      background: brown;
      cursor: pointer;
    }
    .manga.favorited {
      border: 2px solid gold;
      border-radius: 6px;
      box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
    }
    .open-favorite-list {
      position: fixed;
      bottom: 20px;
      right: 20px;
      font-size: 16px;
      color: black;
      background: gold;
      border: none;
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      z-index: 10000;
    }
    .favorite-panel {
      position: fixed;
      bottom: 70px;
      right: 20px;
      width: 360px;
      max-height: 420px;
      background: #fff;
      border: 2px solid gold;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
      overflow-y: auto;
      z-index: 10001;
      display: none;
      font-size: 14px;
    }
    .favorite-panel.show { display: block; }
    .fav-header {
        position: fixed;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 10px;
        background: gold;
        color: black;
        font-weight: bold;
        gap: 8px;
        width: inherit;
        margin-top: -34px;
        margin-left: -1.5px;
        border-radius: 8px 8px 0 0;
    }
    .fav-list { padding: 8px; }
    .fav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: space-between;
      margin-bottom: 6px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4px;
    }
    .fav-left {
      display:flex;
      align-items:center;
      gap:8px;
      min-width: 0;
    }
    .fav-item .fav-title {
      text-decoration: none;
      white-space: nowrap;
      width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-block;
    }
    .fav-item .fav-latest-link {
      text-decoration: none;
      white-space: nowrap;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
    }
    .fav-item a:hover { text-decoration: underline; }
    .fav-remove {
      background: none;
      border: none;
      color: #c00;
      font-size: 14px;
      cursor: pointer;
    }
    .fav-latest {
      font-size: 12px;
      color: #555;
      margin-left: 6px;
      overflow: clip;
      white-space: nowrap;
    }
    .fav-refresh {
      margin-right: 8px;
    }
    .fav-new {
      background: #e63946;
      color: white;
      border-radius: 3px;
      padding: 1px 4px;
      font-size: 11px;
      margin-left: 15px;
    }
    .fav-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
    }
    .rd-first {
      position: relative;
      display: flex;
      justify-content: center;
      background: brown;
      color: #cccccc;
      z-index: 1;
    }
    .post-title a {
      display: flex;
      word-break: break-all;
      justify-content: center;
    }
    .post-on .c-new-tag a {
      padding: 0 3px 0 3px;
      color: #fff;
      background: #ba231f;
      font-family: inherit;
    }
    .manga-title-badges.new {
      position: absolute;
      left: 10%;
    }
    .page-listing-item .chapter.font-meta {
      float: right;
      margin: 0 0 5px 0;
    }
    span.post-on.font-meta {
      float: right;
      position: relative;
      right: 5px;
    }
    .meta-item.rating {
      text-align: end;
    }
  `;
  document.head.appendChild(style);

  function shortenTime(text) {
    return text.replace(/(\d+) (days?|hours?) ago/, (m, num, unit) =>
      unit.startsWith("d") ? `${num} d` : `${num} h`
    );
  }

  /** 🎯 取得最新章節（模擬 madara AJAX）
   *  回傳 { title, url } 或 null
   */
  async function fetchLatestChapter(mangaUrl) {
    try {
      // 先請求漫畫主頁，抓取 data-id
      const res = await fetch(mangaUrl);
      const html = await res.text();
      const temp = document.createElement('div');
      temp.innerHTML = html;

      const holder = temp.querySelector('#manga-chapters-holder');
      const mangaId = holder?.dataset.id;
      if (!mangaId) return null;

      const form = new FormData();
      form.append('action', 'manga_get_chapters');
      form.append('manga', mangaId);

      const ajax = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        body: form
      });
      const data = await ajax.text();
      const wrap = document.createElement('div');
      wrap.innerHTML = data;

      const latest = wrap.querySelector('.wp-manga-chapter a');
      if (latest) {
        return {
          title: latest.textContent.replace(/chapter/i,'').trim(),
          url: latest.href
        };
      }
      return null;
    } catch (e) {
      console.warn('fetchLatestChapter error:', e);
      return null;
    }
  }

  // 收藏面板 UI
  const panel = document.createElement('div');
  panel.className = 'favorite-panel';
  panel.innerHTML = `
    <div class="fav-header">
      <span>★ 收藏清單</span>
      <div style="margin-left:auto; display:flex; align-items:center;">
        <button class="fav-refresh">Refresh</button>
        <button class="fav-close">×</button>
      </div>
    </div>
    <div class="fav-list"></div>
  `;
  document.body.appendChild(panel);

  const openBtn = document.createElement('button');
  openBtn.textContent = '★ 收藏';
  openBtn.className = 'open-favorite-list';
  document.body.appendChild(openBtn);

  // 刷新按鈕
  panel.querySelector('.fav-refresh').addEventListener('click', async () => {
    const listEl = panel.querySelector('.fav-list');
    const btn = panel.querySelector('.fav-refresh');
    btn.disabled = true;
    btn.textContent = 'Refreshing...';

    try {
      let favoritesLocal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(favoritesLocal) || favoritesLocal.length === 0) {
        listEl.innerHTML = `<div class="empty">目前沒有收藏項目</div>`;
        btn.disabled = false;
        btn.textContent = 'Refresh';
        return;
      }

      // 逐一更新
      for (const [i, fav] of favoritesLocal.entries()) {
        // 更新 UI 顯示「更新中」
        const itemEl = listEl.querySelectorAll('.fav-item')[i];
        if (itemEl) {
          const latestEl = itemEl.querySelector('.fav-latest') || itemEl.querySelector('.fav-latest-link');
          if (latestEl) latestEl.textContent = '更新中...';
        }

        const latest = await fetchLatestChapter(fav.url);
        if (latest) {
          // 如果有變化，標記為 new
          const isNew = fav.latest !== latest.title; // 比對是否不同

          fav.latest = latest.title;
          fav.latestUrl = latest.url;
          // 更新 item DOM（如果已存在就更新）
          if (itemEl) {
            // 移除舊有的 newBadge
            const oldNew = itemEl.querySelector('.fav-new');
            if (oldNew) oldNew.remove();
            // 更新或建立最新章節連結
            let latestLink = itemEl.querySelector('.fav-latest-link');
            if (!latestLink) {
              // 若之前只是 span，替換成 a
              const span = itemEl.querySelector('.fav-latest');
              if (span) {
                const a = document.createElement('a');
                a.className = 'fav-latest-link';
                a.href = fav.latestUrl;
                a.target = '_blank';
                a.textContent = fav.latest;
                span.replaceWith(a);
                latestLink = a;
              } else {
                // fallback: append a
                const a = document.createElement('a');
                a.className = 'fav-latest-link';
                a.href = fav.latestUrl;
                a.target = '_blank';
                a.textContent = fav.latest;
                itemEl.querySelector('.fav-left').appendChild(a);
                latestLink = a;
              }
            } else {
              latestLink.href = fav.latestUrl;
              latestLink.textContent = fav.latest;
            }
            // ✅ 追加 newBadge
            if (isNew) {
              const newBadge = document.createElement('span');
              newBadge.className = 'fav-new';
              newBadge.textContent = 'NEW';
              itemEl.querySelector('.fav-left').appendChild(newBadge);
            }
          }
        } else {
          if (itemEl) {
            const latestEl = itemEl.querySelector('.fav-latest') || itemEl.querySelector('.fav-latest-link');
            if (latestEl) latestEl.textContent = '無法取得';
          }
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritesLocal));
      // 是否重新 render 清單以確保一致
     /* await updateFavoriteList(); */
    } catch (err) {
      console.error('Refresh error:', err);
      alert('更新時發生錯誤，請稍後再試');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Refresh';
    }
  });

  async function updateFavoriteList() {
    const listEl = panel.querySelector('.fav-list');
    listEl.innerHTML = '';
    const favoritesLocal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(favoritesLocal) || favoritesLocal.length === 0) {
      listEl.innerHTML = `<div class="empty">目前沒有收藏項目</div>`;
      return;
    }

    for (const fav of favoritesLocal) {
      const item = document.createElement('div');
      item.className = 'fav-item';

      // left section 包含 title + latest link/label + new badge
      const left = document.createElement('div');
      left.className = 'fav-left';

      const titleA = document.createElement('a');
      titleA.className = 'fav-title';
      titleA.href = fav.url;
      titleA.target = '_blank';
      titleA.textContent = fav.title;

      left.appendChild(titleA);

      // 如果已經有 latestUrl，就用 a；否則顯示文字（讀取中）
      if (fav.latestUrl) {
        const latestA = document.createElement('a');
        latestA.className = 'fav-latest-link';
        latestA.href = fav.latestUrl;
        latestA.target = '_blank';
        latestA.textContent = fav.latest || '未知';
        left.appendChild(latestA);
      } else {
        const span = document.createElement('span');
        span.className = 'fav-latest';
        span.textContent = fav.latest || '讀取中...';
        left.appendChild(span);
      }

      const removeBtn = document.createElement('button');
      removeBtn.className = 'fav-remove';
      removeBtn.textContent = '✕';

      item.appendChild(left);
      item.appendChild(removeBtn);
      listEl.appendChild(item);

      // 移除按鈕事件
      removeBtn.addEventListener('click', () => {
        const updated = favoritesLocal.filter(i => i.title !== fav.title);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        updateFavoriteList();
        // 同步更新主頁 manga 樣式
        document.querySelectorAll('.manga').forEach(m => {
          const t = m.querySelector('.post-title a')?.textContent?.trim();
          if (t === fav.title) {
            m.classList.remove('favorited');
            const bt = m.querySelector('.add-favorite');
            if (bt) bt.textContent = '☆';
          }
        });
      });
    }
  }

  openBtn.addEventListener('click', () => {
    panel.classList.toggle('show');
    updateFavoriteList();
  });
  panel.querySelector('.fav-close').addEventListener('click', () => {
    panel.classList.remove('show');
  });

  // 主頁漫畫掃描（保留你原本邏輯，並在加入收藏時確保存最新章節與連結欄位）
  document.querySelectorAll('.manga').forEach(manga => {
    manga.querySelectorAll('.c-new-tag').forEach(newtag => {
      const link = newtag.querySelector('a');
      const time = link?.getAttribute('title');
      if (link && time) link.innerHTML = shortenTime(time);
    });

    const title = manga.querySelector('.post-title a')?.textContent?.trim();
    if (!title) return;
    const fa = manga.querySelector('.item-thumb a')?.href;

    const newTag = manga.querySelector('.c-new-tag a');
    const latest = manga.querySelector('.btn-link').textContent?.replace(/chapter/i,'').trim() || '';
    const latestUrl = manga.querySelector('.btn-link')?.href || '';

    const favoritesLocal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const isFavorited = favoritesLocal.some(f => f.title === title);

    manga.querySelectorAll('.item-thumb').forEach(img => {
      const bt = document.createElement('div');
      const ft = document.createElement('a');

      bt.className = 'add-favorite';
      bt.textContent = isFavorited ? '★' : '☆';
      ft.className = 'rd-first';
      ft.textContent = 'Read First';
      ft.href = (fa || '') + 'chapter-1/';

      img.appendChild(bt);
      img.appendChild(ft);

      if (isFavorited) manga.classList.add('favorited');

      bt.addEventListener('click', () => {
        let favoritesNow = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const index = favoritesNow.findIndex(f => f.title === title);

        if (index === -1) {
          // 新增收藏時把目前頁面上能取得的 latest/title/url 一起存
          favoritesNow.push({ title, url: fa, latest: latest || '', latestUrl: latestUrl || '' });
          bt.textContent = '★';
          manga.classList.add('favorited');
        } else {
          favoritesNow.splice(index, 1);
          bt.textContent = '☆';
          manga.classList.remove('favorited');
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritesNow));
        updateFavoriteList();
      });
    });
  });

  // 複製頁碼導覽
  const pageNavi = document.querySelector('.wp-pagenavi');
  if (pageNavi) {
    const clone = pageNavi.cloneNode(true);
    clone.style.cssText = 'margin = 0 0 24px 0; float: none;';
    let parent = pageNavi.parentNode;
    for (let i = 0; i < 3 && parent; i++) {
      parent.insertBefore(clone, parent.firstChild);
      parent = parent.parentNode;
    }
  }
})();
