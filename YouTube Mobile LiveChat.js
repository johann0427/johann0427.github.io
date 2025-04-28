// ==UserScript==
// @name         YouTube Mobile LiveChat
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  在 YouTube Mobile 直播串流找回聊天室框架
// @author       You
// @match        https://m.youtube.com/*
// @grant        none
// @icon         https://icons.duckduckgo.com/ip2/youtube.com.ico
// ==/UserScript==

(function() {
    'use strict';

    const LOG_PREFIX = '[LiveChat]';
    const CHAT_IFRAME_ID = 'mobile-live-chat';
    const TOGGLE_BTN_ID = 'chat-toggle-btn';
    let lastVideoId = null;
    let isLiveStream = false;
    let pendingVideoId = null;

    function log(...args) {
        console.log(LOG_PREFIX, ...args);
    }

    function clearChatUI() {
        document.getElementById(CHAT_IFRAME_ID)?.remove();
        document.getElementById(TOGGLE_BTN_ID)?.remove();
    }

    function createChatUI(videoId) {
        log('Creating chat UI for videoId =', videoId);
        clearChatUI();

        const iframe = document.createElement('iframe');
        iframe.id = CHAT_IFRAME_ID;
        Object.assign(iframe.style, {
            position: 'fixed', bottom: '0', right: '0',
            width: '100%', height: '40%',
            zIndex: '9999', border: 'none', background: '#fff', transition: 'all 0.3s ease'
        });
        iframe.src = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${location.hostname}`;
        document.body.appendChild(iframe);

        const btn = document.createElement('button');
        btn.id = TOGGLE_BTN_ID;
        btn.textContent = '縮小聊天室';
        Object.assign(btn.style, {
            position: 'fixed', bottom: '41%', right: '10px',
            zIndex: '10000', padding: '6px 10px', fontSize: '14px',
            border: 'none', borderRadius: '6px', background: '#000',
            color: '#fff', opacity: '0.7', cursor: 'pointer', transition: 'all 0.3s ease'
        });

        let isMin = false;
        btn.addEventListener('click', () => {
            log('Toggling chat size, isMin =', isMin);
            if (isMin) {
                Object.assign(iframe.style, { width: '100%', height: '40%', bottom: '0', right: '0' });
                btn.textContent = '縮小聊天室';
                btn.style.bottom = '41%';
            } else {
                Object.assign(iframe.style, { width: '0', height: '0', bottom: '10px', right: '10px' });
                btn.textContent = '還原聊天室';
                btn.style.bottom = '10px';
            }
            isMin = !isMin;
        });

        document.body.appendChild(btn);
    }

    function getUrlVideoId() {
        try {
            return new URLSearchParams(location.search).get('v');
        } catch {
            return null;
        }
    }

    function updateChat() {
        const vid = getUrlVideoId();
        if (!vid) {
            clearChatUI();
            lastVideoId = null;
            return;
        }

        // 判斷是否正在直播（從 window.ytInitialPlayerResponse 取得）
        if (window.ytInitialPlayerResponse?.videoDetails?.videoId) {
            if (window.location.href.includes(window.ytInitialPlayerResponse.videoDetails.videoId)) {
                isLiveStream = window.ytInitialPlayerResponse.videoDetails.isLive;
            }
        }

        if (!isLiveStream) {
            log('Not a live stream, clearing chat UI');
            clearChatUI();
            lastVideoId = null;
            return;
        }

        if (vid === lastVideoId) {
            return;
        }

        lastVideoId = vid;
        createChatUI(vid);
    }

    // 攔截 fetch 判斷 isLive
    const _fetch = window.fetch;
    window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input
        : input instanceof Request ? input.url
        : '';

        if (url.includes('/youtubei/v1/player')) {
            return _fetch.apply(this, arguments).then(res => {
                if (res.url.includes('/youtubei/v1/player')) {
                    res.clone().json().then(json => {
                        try {
                            const live = json?.videoDetails?.isLive;
                            const videoId = json?.videoDetails?.videoId;
                            if (typeof live === 'boolean' && videoId) {
                                if (pendingVideoId && videoId === pendingVideoId) {
                                    isLiveStream = live;
                                    log('Fetch video matched pending, isLiveStream =', isLiveStream);
                                    updateChat();
                                    pendingVideoId = null;
                                } else {
                                    log('Fetch videoId', videoId, 'does not match pendingVideoId', pendingVideoId);
                                }
                            } else {
                                // 找不到 isLive，直接清除
                                if (pendingVideoId && videoId === pendingVideoId) {
                                    log('Fetch missing isLive info, clearing chat UI');
                                    isLiveStream = false;
                                    updateChat();
                                    pendingVideoId = null;
                                }
                            }
                        } catch (e) {
                            console.warn('[LiveChat] Failed to parse player JSON', e);
                        }
                    }).catch(() => {
                        console.warn('[LiveChat] Failed to parse player JSON (catch)');
                    });
                }
                return res;
            });
        }

        return _fetch.apply(this, arguments);
    };

    // 攔截 History API
    (function() {
        const _push = history.pushState;
        history.pushState = function() {
            _push.apply(this, arguments);
            log('pushState detected');
            pendingVideoId = getUrlVideoId();
        };

        const _replace = history.replaceState;
        history.replaceState = function() {
            _replace.apply(this, arguments);
            log('replaceState detected');
            pendingVideoId = getUrlVideoId();
        };

        window.addEventListener('popstate', () => {
            log('popstate detected');
            pendingVideoId = getUrlVideoId();
        });
    })();

    // 初始
    log('Initialization');
    updateChat();
    pendingVideoId = getUrlVideoId();

})();
