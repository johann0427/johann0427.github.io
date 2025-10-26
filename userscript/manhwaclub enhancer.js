// ==UserScript==
// @name         manhwaclub enhancer
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  An enhanced website UI for easier reading
// @author       You
// @match        *://manhwaclub.net/*
// @icon         https://icons.duckduckgo.com/ip2/manhwaclub.net.ico
// @grant        none
// ==/UserScript==


const style = document.createElement('style');
style.type = 'text/css';
style.textContent = `
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
`;
document.body.appendChild(style);


function shortenTime(text) {
    return text.replace(/(\d+) (days?|hours?) ago/, (match, num, unit) => {
        return unit.startsWith("d") ? `${num} d` : `${num} h`;
    });
}

document.querySelectorAll('.manga').forEach(manga => {
    // 優化最新章節時間
    manga.querySelectorAll('.c-new-tag').forEach(newtag => {
        const link = newtag.querySelector('a');
        const time = link?.getAttribute('title');
        if (link && time) {
            link.innerHTML = shortenTime(time);
        }
    });

    // 取得標題
    const title = manga.querySelector('.post-title a')?.textContent?.trim();
    if (!title) return;

    // 取出現有收藏
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFavorited = favorites.includes(title);

    // 加入收藏按鈕
    manga.querySelectorAll('.item-thumb').forEach(img => {
        const bt = document.createElement('div');
        bt.className = 'add-favorite';
        bt.textContent = isFavorited ? '★' : '☆';
        img.appendChild(bt);

        // 根據收藏狀態設定外觀
        if (isFavorited) manga.classList.add('favorited');

        // 點擊事件：切換收藏狀態
        bt.addEventListener('click', () => {
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            const index = favorites.indexOf(title);

            if (index === -1) {
                favorites.push(title);
                bt.textContent = '★';
                manga.classList.add('favorited');
                console.log(`已加入收藏：${title}`);
            } else {
                favorites.splice(index, 1);
                bt.textContent = '☆';
                manga.classList.remove('favorited'); // ✅ 取消時移除 class
                console.log(`已取消收藏：${title}`);
            }

            localStorage.setItem('favorites', JSON.stringify(favorites));
        });
    });
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
