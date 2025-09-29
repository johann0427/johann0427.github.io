// ==UserScript==
// @name         Koharu.to - Restore Old Layout
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  get back to old design
// @author       Johann
// @match        https://niyaniya.moe/*
// @icon         https://icons.duckduckgo.com/ip2/niyaniya.moe.ico
// @grant        none
// ==/UserScript==


function updatePagination() {
    const paginationElements = document.querySelectorAll(".uppercase");
    const totalPage = document.querySelector("select option:last-child")?.textContent;

    if (paginationElements && totalPage) {
        paginationElements.forEach((pagination) => {
            if (!pagination.textContent.includes("/")) {
                pagination.append("/" + totalPage);
            }
        });
    }
}

// 初次執行
updatePagination();

// 使用 MutationObserver 監控 DOM 變化
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        // 如果有新增節點，可能是 SPA 動態更新
        if (mutation.addedNodes.length > 0) {
            updatePagination();
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});
