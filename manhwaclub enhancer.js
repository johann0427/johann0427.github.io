// ==UserScript==
// @name         manhwaclub enhancer
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  prevent pemsrv redirect issues
// @author       You
// @match        *://manhwaclub.net/*
// @icon         https://icons.duckduckgo.com/ip2/manhwaclub.net.ico
// @grant        none
// ==/UserScript==


const style = document.createElement('style');
style.type = 'text/css';
style.textContent = `
  .post-title a {
    word-break: break-all;
  }
  .c-new-tag a {
    padding: 0 3px 0 3px;
    background: #ba231f;
    font-family: inherit;
  }
  .chapter.font-meta {
    float: right;
  }
  span.post-on.font-meta {
    float: right;
    position: relative;
    right: 5px;
  }
`;
document.body.appendChild(style);

function shortenTime(text) {
    return text.replace(/(\d+) (days?|hours?) ago/, (match, num, unit) => {
        return unit.startsWith("d") ? `${num} hrs` : `${num} hrs`;
    });
}

//
document.querySelectorAll('.c-new-tag').forEach(newtag => {
    const ahref = newtag.querySelector('a')
    const time = ahref.getAttribute('title');
    ahref.innerHTML = shortenTime(time);
});


// 獲取 .wp-pagenavi 元素並進行處理
const pageNaviElement = document.querySelector('.wp-pagenavi');

if (pageNaviElement) {
  // 複製 .wp-pagenavi 元素
  const clonedElement = pageNaviElement.cloneNode(true);

  // 設置複製元素的樣式
  clonedElement.style.cssText = 'margin = 0 0 24px 0; float: none;';

  // 找到 .wp-pagenavi 的前三個父元素，並將複製的元素插入到它們的前面
  let parent = pageNaviElement.parentNode;
  for (let i = 0; i < 3 && parent; i++) {
    parent.insertBefore(clonedElement, parent.firstChild);
    parent = parent.parentNode; // 移動到上一層父元素
  }
}

