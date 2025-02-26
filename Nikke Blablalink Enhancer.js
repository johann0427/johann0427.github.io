// ==UserScript==
// @name         Nikke Blablalink Enhancer
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  for better PC browsing experiences!
// @author       Johann
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
    font-family: '芫荽體', 'Source Han Sans CN';
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



const observeApp = () => {
    const targetNode = document.querySelector("div#app[data-v-app]");
    if (!targetNode) return setTimeout(observeApp, 500); // 若未找到，500ms 後重試

    // 只創建一個 MutationObserver 來監聽變化
    const observer = new MutationObserver(() => {
        requestAnimationFrame(() => {
            // 三次元推文隱藏
            handleCosplayPosts();
            // 兌換碼一鍵跳轉功能
            handleCDKeyRedirection();
            // 佈局調整
            handleCDKDivs();
        });
    });

    // 監聽 #app 的所有變化
    observer.observe(targetNode, { childList: true, subtree: true });

    // **三次元推文隱藏**
    const handleCosplayPosts = () => {
        document.querySelectorAll("div[class^='mb-[12px]']").forEach(el => {
            if (/#cosplay/i.test(el.textContent) && !el.dataset.processed) {
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
        });
    };

    // **兌換碼一鍵跳轉功能**
    const handleCDKeyRedirection = () => {
        document.querySelectorAll("div[class^='p-[15px]']").forEach(el => {
            const target = el.querySelector("div[class^='font-bold']");
            const inline = el.querySelector("div[class^='inline mr-[8px]']");

            // 確保 cdkeyDiv 存在，再去讀取 textContent
            if (inline && target) {
                const cdkeyText = inline.textContent.trim();

                const regex = /CDK|CD|key|兌換碼|兑换码/i;

                if (regex.test(target.textContent) && !el.dataset.created) {
                    // 標記為已處理，避免重複操作
                    el.dataset.created = "true";

                    // 提取 CDKey（假設 CDKey 的格式是 A-Z0-9 組合）
                    const match = cdkeyText.match(/\b[A-Z0-9]{7,}\b/g);
                    const finalCDkey = match ? match[0] : "no cdkey found!";

                    const redir = document.createElement("a");
                    redir.id = "redirect-cdk";
                    redir.href = "/cdk";
                    redir.title = finalCDkey;
                    redir.textContent = "CDK";
                    redir.style.cssText = "float: right; border: 1px dotted; border-radius: 4px; padding: 3px 2px 1px 2px; color: #e9967a";

                    // 監聽按鈕點擊事件，複製 CDKey 並顯示成功及跳轉
                    redir.addEventListener('click', function (event) {

                        const textarea = document.createElement('textarea');
                        textarea.value = finalCDkey;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);

                        // 儲存到 sessionStorage
                        sessionStorage.setItem("cdkey", finalCDkey);

                        redir.textContent = "複製成功！";
                    });

                    target.appendChild(redir);
                }
            } else {
                //console.log(target);
            }
        });
    };

    // **處理選取 CDK 相關的 DIV**
    const handleCDKDivs = () => {
        document.querySelectorAll("div[class='mx-[15px]'] div.flex-shrink-0").forEach(el => {
            const target = el.querySelector("div:last-child").textContent;
            if (target.includes("CDK") && !el.dataset.moved) {
                el.dataset.moved = "true";
                el.parentNode.appendChild(el);
            }
        });
    };

    // **CDK 頁面中自動填入並處理 sessionStorage**
    if (window.location.pathname === "/cdk") {
        const cdkey = sessionStorage.getItem("cdkey");
        if (cdkey) {
            console.log("CDKey Found! Try:", cdkey);
            const observer = new MutationObserver(() => {
                const textarea = document.querySelector("#app textarea");
                console.log(textarea);
                if (textarea) {
                    textarea.value = cdkey;
                    textarea.focus();
                    textarea.dispatchEvent(new Event('input'));
                    sessionStorage.removeItem("cdkey");
                    observer.disconnect();
                }
            });

            const appElement = document.querySelector("#app");
            if (appElement) {
                observer.observe(appElement, { childList: true, subtree: true });
            }

            setTimeout(() => {
                const textarea = document.querySelector("#app textarea");
                if (textarea) {
                    console.log("textarea found! try:", cdkey);
                    textarea.value = cdkey;
                    textarea.focus();
                    textarea.dispatchEvent(new Event('input'));
                    sessionStorage.removeItem("cdkey");
                    observer.disconnect();
                }
            }, 500);

        } else {
            console.log("CDKey not found!");
        }
    }
};

observeApp();


//降低視窗音量
const OriginalAudio = window.Audio;
window.Audio = function (...args) {
    const audio = new OriginalAudio(...args);
    audio.volume = 0.4;
    return audio;
};


