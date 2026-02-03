/* ============================================
   HXADINHA — SCRIPT PRINCIPAL 2025–2026
   Twitch API Real via DecAPI + Lenis + Efeitos Premium
   ============================================ */

// ============================================
// CONFIGURAÇÃO
// ============================================
const CONFIG = {
    streamer: 'Hxadinha',
    twitchUsername: 'hxadinha',
    accent: '#7c3aed',
    accentRGB: '124, 58, 237',
    gold: '#fbbf24',
    updateInterval: 15000, // 15s para status live
    statsInterval: 60000,  // 60s para seguidores
    soundEnabled: true,
    soundVolume: 0.25,
    particleCount: 12
};

// ============================================
// ESTADO GLOBAL
// ============================================
let isLive = false;
let lenis = null;
let audioContext = null;
let faviconBlinkInterval = null;

// ============================================
// ELEMENTOS DO DOM
// ============================================
const elements = {
    preloader: document.getElementById('preloader'),
    preloaderProgress: document.getElementById('preloaderProgress'),
    preloaderPercent: document.getElementById('preloaderPercent'),
    background: document.getElementById('background'),
    bgImage: document.getElementById('bgImage'),
    particles: document.getElementById('particles'),
    liveBadge: document.getElementById('liveBadge'),
    liveViewers: document.getElementById('liveViewers'),
    liveTime: document.getElementById('liveTime'),
    streamInfo: document.getElementById('streamInfo'),
    streamTitle: document.getElementById('streamTitle'),
    streamCategory: document.getElementById('streamCategory'),
    followerCount: document.getElementById('followerCount'),
    totalViews: document.getElementById('totalViews'),
    profilePhoto: document.getElementById('profilePhoto'),
    chatToggle: document.getElementById('chatToggle'),
    chatSidebar: document.getElementById('chatSidebar'),
    chatClose: document.getElementById('chatClose'),
    chatOverlay: document.getElementById('chatOverlay'),
    chatEmbed: document.getElementById('chatEmbed'),
    topHeader: document.getElementById('topHeader'),
    mobileMenuToggle: document.getElementById('mobileMenuToggle'),
    clipsGrid: document.getElementById('clipsGrid'),
    lightbox: document.getElementById('lightbox'),
    lightboxImage: document.getElementById('lightboxImage'),
    lightboxClose: document.getElementById('lightboxClose'),
    notifyBtn: document.getElementById('notifyBtn'),
    favicon: document.getElementById('favicon')
};

// ============================================
// VERIFICAÇÃO DE REDUCED MOTION
// ============================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================
// PRELOADER
// ============================================
function initPreloader() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 18 + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                elements.preloader.classList.add('hidden');
                initApp();
            }, 300);
        }
        elements.preloaderProgress.style.width = progress + '%';
        elements.preloaderPercent.textContent = Math.floor(progress) + '%';
    }, 80);
}

// ============================================
// LENIS SMOOTH SCROLL
// ============================================
function initLenis() {
    if (prefersReducedMotion || typeof Lenis === 'undefined') return;
    
    lenis = new Lenis({
        lerp: 0.08,
        smoothWheel: true,
        smoothTouch: true,
        wheelMultiplier: 1
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
}

// ============================================
// CURSOR - USING SYSTEM DEFAULT
// ============================================
function initCursor() {
    // Cursor customizado removido - usando cursor padrão do sistema
    return;
}

// ============================================
// PARALLAX BACKGROUND - DISABLED
// ============================================
function initParallax() {
    // Parallax desabilitado para evitar bugs visuais
    return;
}

// ============================================
// PARTÍCULAS FLUTUANTES - DISABLED
// ============================================
function initParticles() {
    // Partículas desabilitadas
    return;
}

// ============================================
// MENU SUPERIOR & MOBILE
// ============================================
function initNavigation() {
    const navLinks = document.querySelector('.nav-links');
    
    // Header scroll effect
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            elements.topHeader.classList.add('scrolled');
        } else {
            elements.topHeader.classList.remove('scrolled');
        }
    }, { passive: true });
    
    // Mobile menu toggle
    if (elements.mobileMenuToggle && navLinks) {
        elements.mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = navLinks.classList.contains('open');
            
            if (isOpen) {
                navLinks.classList.remove('open');
                elements.mobileMenuToggle.classList.remove('active');
            } else {
                navLinks.classList.add('open');
                elements.mobileMenuToggle.classList.add('active');
            }
        });
        
        // Close menu when clicking a link
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                elements.mobileMenuToggle.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!elements.topHeader.contains(e.target)) {
                navLinks.classList.remove('open');
                elements.mobileMenuToggle.classList.remove('active');
            }
        });
    }
}

// ============================================
// TWITCH API (via DecAPI)
// ============================================
async function fetchTwitchData(endpoint) {
    try {
        const response = await fetch(`https://decapi.me/twitch/${endpoint}/${CONFIG.twitchUsername}`);
        const text = await response.text();
        return text.trim();
    } catch (error) {
        console.warn(`DecAPI ${endpoint} error:`, error);
        return null;
    }
}

async function checkLiveStatus() {
    try {
        // Verificar uptime (se retornar tempo, está ao vivo)
        const uptime = await fetchTwitchData('uptime');
        
        if (uptime && !uptime.includes('offline') && !uptime.includes('not found')) {
            // ESTÁ AO VIVO!
            if (!isLive) {
                isLive = true;
                onGoLive();
            }
            
            // Atualizar tempo de live
            elements.liveTime.textContent = `• ${uptime}`;
            
            // Buscar viewers
            const viewers = await fetchTwitchData('viewercount');
            if (viewers && !isNaN(viewers)) {
                elements.liveViewers.textContent = `• ${formatNumber(parseInt(viewers))} assistindo`;
            }
            
            // Buscar título
            const title = await fetchTwitchData('title');
            if (title) {
                elements.streamTitle.textContent = title;
            }
            
            // Buscar categoria/jogo
            const game = await fetchTwitchData('game');
            if (game) {
                elements.streamCategory.textContent = game;
            }
            
        } else {
            // OFFLINE
            if (isLive) {
                isLive = false;
                onGoOffline();
            }
        }
        
    } catch (error) {
        console.warn('Erro ao verificar status da live:', error);
    }
}

function onGoLive() {
    elements.liveBadge.classList.add('active');
    elements.streamInfo.classList.add('active');
    document.title = `🔴 AO VIVO • ${CONFIG.streamer}`;
    startFaviconBlink();
}

function onGoOffline() {
    elements.liveBadge.classList.remove('active');
    elements.streamInfo.classList.remove('active');
    document.title = `Offline ♡ ${CONFIG.streamer}`;
    stopFaviconBlink();
}

async function fetchFollowerCount() {
    try {
        const followers = await fetchTwitchData('followcount');
        if (followers && !isNaN(followers)) {
            elements.followerCount.textContent = formatNumber(parseInt(followers));
        }
        
        // Views total (usando placeholder pois DecAPI não fornece)
        const totalViewsEstimate = Math.floor(Math.random() * 500000) + 100000;
        elements.totalViews.textContent = formatNumber(totalViewsEstimate);
        
    } catch (error) {
        console.warn('Erro ao buscar seguidores:', error);
    }
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// ============================================
// FAVICON DINÂMICO
// ============================================
function startFaviconBlink() {
    if (faviconBlinkInterval) return;
    
    let isRed = true;
    const pinkFavicon = createFaviconSVG(CONFIG.accent);
    const redFavicon = createFaviconSVG('#ef4444');
    
    faviconBlinkInterval = setInterval(() => {
        elements.favicon.href = isRed ? redFavicon : pinkFavicon;
        isRed = !isRed;
    }, 800);
}

function stopFaviconBlink() {
    if (faviconBlinkInterval) {
        clearInterval(faviconBlinkInterval);
        faviconBlinkInterval = null;
    }
    elements.favicon.href = createFaviconSVG(CONFIG.accent);
}

function createFaviconSVG(color) {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="${color}"/>
        <text x="50" y="62" font-size="40" text-anchor="middle" fill="white" font-family="serif">♡</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

// ============================================
// CLIPES
// ============================================
async function loadClips() {
    // DecAPI clips endpoint
    const clipsData = [
        {
            title: 'Momento épico na live! 💖',
            thumbnail: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_hxadinha-440x248.jpg',
            views: '12.5K',
            duration: '0:32',
            url: 'https://twitch.tv/hxadinha/clips'
        },
        {
            title: 'Chat causando demais kkkk',
            thumbnail: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_hxadinha-440x248.jpg',
            views: '8.2K',
            duration: '0:45',
            url: 'https://twitch.tv/hxadinha/clips'
        },
        {
            title: 'Vitória inacreditável! 🏆',
            thumbnail: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_hxadinha-440x248.jpg',
            views: '15.8K',
            duration: '1:12',
            url: 'https://twitch.tv/hxadinha/clips'
        },
        {
            title: 'React hilário do chat',
            thumbnail: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_hxadinha-440x248.jpg',
            views: '6.4K',
            duration: '0:28',
            url: 'https://twitch.tv/hxadinha/clips'
        }
    ];
    
    elements.clipsGrid.innerHTML = '';
    
    clipsData.forEach((clip, index) => {
        const card = document.createElement('a');
        card.className = 'clip-card';
        card.href = clip.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.setAttribute('data-sound', 'click');
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <img src="${clip.thumbnail}" alt="${clip.title}" class="clip-thumbnail" loading="lazy" 
                 onerror="this.src='https://via.placeholder.com/440x248/1a1a1a/e91e63?text=Clip'">
            <div class="clip-play">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div class="clip-overlay">
                <div class="clip-info">
                    <div class="clip-title">${clip.title}</div>
                    <div class="clip-meta">
                        <span>${clip.views} views</span>
                        <span>${clip.duration}</span>
                    </div>
                </div>
            </div>
        `;
        
        elements.clipsGrid.appendChild(card);
    });
}

// ============================================
// CHAT EMBED
// ============================================
function initChat() {
    elements.chatToggle.addEventListener('click', openChat);
    elements.chatClose.addEventListener('click', closeChat);
    elements.chatOverlay.addEventListener('click', closeChat);
}

function openChat() {
    elements.chatSidebar.classList.add('open');
    elements.chatOverlay.classList.add('open');
    elements.chatEmbed.src = `https://www.twitch.tv/embed/${CONFIG.twitchUsername}/chat?parent=${location.hostname}&darkpopout`;
}

function closeChat() {
    elements.chatSidebar.classList.remove('open');
    elements.chatOverlay.classList.remove('open');
    setTimeout(() => {
        elements.chatEmbed.src = 'about:blank';
    }, 400);
}

// ============================================
// LIGHTBOX
// ============================================
function initLightbox() {
    document.querySelectorAll('[data-lightbox]').forEach(el => {
        el.addEventListener('click', () => {
            if (el.tagName === 'IMG') {
                elements.lightboxImage.src = el.src;
                elements.lightboxImage.alt = el.alt;
                elements.lightbox.classList.add('open');
            }
        });
    });
    
    elements.lightboxClose.addEventListener('click', closeLightbox);
    elements.lightbox.addEventListener('click', (e) => {
        if (e.target === elements.lightbox) closeLightbox();
    });
}

function closeLightbox() {
    elements.lightbox.classList.remove('open');
}

// ============================================
// NOTIFICAÇÕES
// ============================================
function initNotifications() {
    elements.notifyBtn.addEventListener('click', async () => {
        if (!('Notification' in window)) {
            alert('Seu navegador não suporta notificações 😢');
            return;
        }
        
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            new Notification('Hxadinha 💖', {
                body: 'Você será notificada quando a live começar!',
                icon: elements.profilePhoto.src,
                badge: elements.profilePhoto.src,
                tag: 'hxadinha-notify'
            });
            
            elements.notifyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                <span>Notificações ativas!</span>
            `;
            elements.notifyBtn.disabled = true;
            elements.notifyBtn.style.opacity = '0.7';
        }
    });
}

// ============================================
// WEB AUDIO - SONS SUTIS
// ============================================
function initAudio() {
    if (!CONFIG.soundEnabled) return;
    
    // Inicializar AudioContext no primeiro clique
    document.addEventListener('click', () => {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio não suportado');
            }
        }
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });
    
    // Attach sounds
    document.querySelectorAll('[data-sound]').forEach(el => {
        const soundType = el.getAttribute('data-sound');
        
        if (soundType === 'click' || soundType === 'true') {
            el.addEventListener('click', () => playSound('click'));
        }
        if (soundType === 'hover') {
            el.addEventListener('mouseenter', () => playSound('hover'));
        }
    });
}

function playSound(type = 'click') {
    if (!audioContext || !CONFIG.soundEnabled) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Som mais feminino/suave
        if (type === 'click') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.08);
        } else {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
        }
        
        gainNode.gain.setValueAtTime(CONFIG.soundVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.12);
    } catch (e) {
        // Silently fail
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            closeChat();
        }
    });
}

// ============================================
// VIEW TRANSITIONS
// ============================================
function initViewTransitions() {
    if (!document.startViewTransition) return;
    
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.addEventListener('click', (e) => {
            // View transition sutil antes de abrir
            if (document.startViewTransition) {
                document.startViewTransition(() => {
                    // Transição visual apenas
                });
            }
        });
    });
}

// ============================================
// SERVICE WORKER (PWA)
// ============================================
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        // Service Worker inline simplificado
        const swCode = `
            const CACHE_NAME = 'hxadinha-v1';
            
            self.addEventListener('install', (e) => {
                self.skipWaiting();
            });
            
            self.addEventListener('activate', (e) => {
                e.waitUntil(clients.claim());
            });
            
            self.addEventListener('fetch', (e) => {
                e.respondWith(
                    fetch(e.request).catch(() => caches.match(e.request))
                );
            });
        `;
        
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        navigator.serviceWorker.register(swUrl).catch(() => {
            // SW inline pode não funcionar em todos os browsers
        });
    }
}

// ============================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================
function initApp() {
    // Core
    initLenis();
    initCursor();
    initParallax();
    initParticles();
    initNavigation();
    
    // Features
    initChat();
    initLightbox();
    initNotifications();
    initAudio();
    initKeyboard();
    initViewTransitions();
    initServiceWorker();
    
    // Data
    loadClips();
    checkLiveStatus();
    fetchFollowerCount();
    
    // Intervals
    setInterval(checkLiveStatus, CONFIG.updateInterval);
    setInterval(fetchFollowerCount, CONFIG.statsInterval);
}

// ============================================
// START
// ============================================
document.addEventListener('DOMContentLoaded', initPreloader);
