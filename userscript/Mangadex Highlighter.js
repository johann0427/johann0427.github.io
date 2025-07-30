// ==UserScript==
// @name         MangaDex 高亮最新上傳章節
// @namespace    Violentmonkey Scripts
// @version      1.0
// @description  高亮顯示每部漫畫中最近上傳的章節
// @match        https://mangadex.org/title*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let currentMangaId = null;
    let currentChapterId = null;

    const observeDOM = new MutationObserver(() => {
        if (!currentChapterId) return;

        // 使用 :has() 符合你的要求（需要瀏覽器支援）
        const chapterElement = document.querySelector(`.chapter.relative:has(a[href*="/chapter/${currentChapterId}"])`);
        if (chapterElement) {
            chapterElement.style.border = '2px solid red';
            chapterElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            chapterElement.style.padding = '4px';
        }
    });

    observeDOM.observe(document.body, {
        childList: true,
        subtree: true
    });

    async function fetchLatestChapter(mangaId) {
        const API = `https://api.mangadex.org/manga/${mangaId}/feed?limit=96&includes[]=scanlation_group&includes[]=user&order[volume]=desc&order[chapter]=desc&offset=0&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic&includeUnavailable=0`;

        try {
            const res = await fetch(API);
            const json = await res.json();

            const now = new Date();
            let closestChapter = null;
            let closestTimeDiff = Infinity;

            for (const chapter of json.data) {
                const attrs = chapter.attributes;
                const times = ['createdAt', 'publishAt', 'updatedAt'];
                for (const key of times) {
                    const time = new Date(attrs[key]);
                    const diff = Math.abs(now - time);
                    if (diff < closestTimeDiff) {
                        closestTimeDiff = diff;
                        closestChapter = chapter;
                    }
                }
            }

            if (closestChapter) {
                currentChapterId = closestChapter.id;
                highlightIfExists();
            }
        } catch (err) {
            console.error('❌ 無法取得章節資料:', err);
        }
    }

    function highlightIfExists() {
        const chapterElement = document.querySelector(`.chapter.relative:has(a[href*="/chapter/${currentChapterId}"])`);
        if (chapterElement) {
            chapterElement.style.border = '2px solid red';
            chapterElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            chapterElement.style.padding = '4px';
        }
    }

    function getMangaIdFromURL() {
        const match = location.pathname.match(/^\/title\/([0-9a-f-]+)/);
        return match ? match[1] : null;
    }

    // 檢查 URL 是否更換（SPA 支援）
    let prevPath = location.pathname;
    setInterval(() => {
        const newPath = location.pathname;
        if (newPath !== prevPath) {
            prevPath = newPath;
            const newMangaId = getMangaIdFromURL();
            if (newMangaId && newMangaId !== currentMangaId) {
                currentMangaId = newMangaId;
                currentChapterId = null;
                fetchLatestChapter(currentMangaId);
            }
        }
    }, 1000);

    // 初次載入執行
    currentMangaId = getMangaIdFromURL();
    if (currentMangaId) {
        fetchLatestChapter(currentMangaId);
    }
})();
