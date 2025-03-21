// ==UserScript==
// @name         Koharu.to - Restore Old Layout
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  get back to old design
// @author       Johann
// @match        https://niyaniya.moe/*
// @icon         https://icons.duckduckgo.com/ip2/niyaniya.moe.ico
// @grant        none
// ==/UserScript==


function findElement(selector) {
    return new Promise((resolve) => {
        const element = document.querySelector(selector);
        if (element) return resolve(element);

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                observer.disconnect();
            }
        });

        observer.observe(document, { childList: true, subtree: true });
    });
}

function updatePagination() {
    const paginationElements = document.querySelectorAll(".uppercase");
    const totalPage = document.querySelector("select option:last-child")?.textContent;

    if (paginationElements && totalPage) {
        paginationElements.forEach((pagination) => {
            // 確保只會追加一次分頁總目
            if (!pagination.textContent.includes("/")) {
                pagination.append("/" + totalPage);
            }
        });
    }
}

function fixedNav() {
    // 檢查是否已經插入過樣式
    if (document.querySelector("#fixednav")) return;

    const style = document.createElement("style");
    style.id = "fixednav";
    style.textContent = `
        nav:first-of-type {
            position: fixed;
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);
}

function watchForChanges() {
    findElement("#reader").then((reader) => {
        // 頁面載入後第一次更新
        updatePagination();
        fixedNav();

        // 監聽頁面元素變動
        const observer = new MutationObserver(() => {
            updatePagination();
        });

        observer.observe(reader, { childList: true, subtree: true });
    });
}

// 初次啟動監聽
watchForChanges();

// 監聽瀏覽器的歷史紀錄變化來處理頁面跳轉
window.addEventListener("popstate", () => {
    watchForChanges(); // 當頁面跳轉時重新初始化監聽器
});

// 如果使用的是 hash 改變的單頁應用，可以監聽 hashchange 事件
window.addEventListener("hashchange", () => {
    watchForChanges(); // 當 hash 改變時重新初始化監聽器
});

