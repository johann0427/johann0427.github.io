// ==UserScript==
// @name         Nikke Blablalink Enhancer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  better PC browsing adjustment
// @author       You
// @match        https://www.blablalink.com/*
// @icon         https://icons.duckduckgo.com/ip2/blablalink.com.ico
// @grant        none
// ==/UserScript==


//全局 CSS 調整
const style = document.createElement("style");
style.type = "text/css";
style.innerHTML = `
  @font-face {
    font-family: '芫荽體';
    src: url(https://cdn.jsdelivr.net/gh/leadra/webfont/Iansui2m.woff2) format("woff2");
  }
  span, p, .inline {
    font-family: '芫荽體';
  }
  .footer {
    display: none;
  }
  div[class="mx-[15px]"] div[data-cname=index] {
    flex-wrap: wrap;
  }
  div[class="mx-[15px]"] div.flex-shrink-0 {
    margin-bottom: 12px;
  }
  .marquee .marquee-inner {
    animation-name: none;
  }
  .text-white {
    font-family: 'Source Han Sans CN';
  }
`;

document.body.appendChild(style);



// 元素位置修正及變動
const observeApp = () => {
    const targetNode = document.querySelector("div#app[data-v-app]");
    if (!targetNode) return setTimeout(observeApp, 1000); // 若未找到，1000ms 後重試

    const observer = new MutationObserver(() => {
        // 使用 requestAnimationFrame 減少頻繁觸發
        requestAnimationFrame(() => {
            let isCDKeyFound = false;
            let isCosPostFound = false;

            // Creator Hub 三次元推文退散
            document.querySelectorAll("div[class^='mb-[12px]']").forEach(el => {
                if (/#cosplay/i.test(el.textContent)) {
                    isCosPostFound = true;
                    if (!el.dataset.processed) { // 避免重複處理
                        el.dataset.processed = "true";

                        const mainDiv = el.querySelector("div:first-child");
                        mainDiv.style.cssText = 'height: 5vh; background: rgba(0, 0, 0, 0.1);';

                        const targetDiv = el.querySelector("div[class^='px-[4px]']");
                        targetDiv.style.visibility = 'hidden'; // 隱藏內容

                        // 創建 hiddenDiv
                        const hiddenDiv = document.createElement("div");
                        hiddenDiv.textContent = '隱藏中（點擊顯示）';
                        hiddenDiv.style.cssText = `
                          display: flex;
                          background: #4174ddb3;
                          font-weight: 600;
                          justify-content: center;
                          visibility: visible;
                          height: -webkit-fill-available;
                          flex-wrap: wrap;
                          cursor: pointer;
                        `;

                        // 監聽 hiddenDiv 點擊事件，恢復 style 變化
                        hiddenDiv.addEventListener("click", () => {
                            targetDiv.style.visibility = 'visible';
                            mainDiv.style.cssText = '';
                            hiddenDiv.remove();
                        });

                        targetDiv.parentNode.insertBefore(hiddenDiv, targetDiv);
                    }
                }
            });

            // 選取 CDK 相關的 div
            document.querySelectorAll("div[class='mx-[15px]'] div.flex-shrink-0").forEach(el => {
                const target = el.querySelector("div:last-child").textContent;
                if (target.includes("CDK")) {
                    isCDKeyFound = true;
                    if (!el.dataset.moved) { // 避免重複處理
                        el.dataset.moved = "true";
                        el.parentNode.appendChild(el);
                    }
                }
            });
        });
    });

    observer.observe(targetNode, { childList: true, attributes: false, subtree: true });
};

observeApp();



//降低網頁音量
const OriginalAudio = window.Audio;
window.Audio = function (...args) {
    const audio = new OriginalAudio(...args);
    audio.volume = 0.4;
    return audio;
};


