/**
 * hxadinha ♡ TV - ULTRA PRO EDITION 2025
 * Full Twitch API + Professional Features
 * Crafted by LucTheKing
 */

// ================================
// CONFIGURATION
// ================================
const CONFIG = {
  CHANNEL_NAME: 'hxadinha',
  CLIENT_ID: 'kimne78kx3ncx6brgo4mv6wki5h1ko',
  BROADCASTER_ID: null,
  PROFILE_IMAGE: 'https://cdn.hxadinha.com.br/eu2025.webp',
  BACKGROUND_IMAGE: 'https://cdn.hxadinha.com.br/setup2025.webp'
};

// ================================
// STATE
// ================================
let channelData = null;
let isLive = false;
let streamData = null;
let streamStartTime = null;
let lenis = null;

// ================================
// INITIALIZATION
// ================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('%c🎮 hxadinha ♡ TV - ULTRA PRO', 'font-size: 20px; font-weight: bold; color: #9146FF;');
  
  // FORÇA IMAGEM DE FUNDO
  initBackgroundImage();
  
  initLenis();
  initTheme();
  initTVWidget();
  initNavigation();
  initFAB();
  initCommandPalette();
  initKeyboardShortcuts();
  initSchedule();
  initParticles();
  
  updateLoaderStatus('Buscando dados...');
  await loadAllTwitchData();
  
  updateLoaderStatus('Pronto!');
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    setTimeout(triggerConfetti, 300);
  }, 2000);
  
  setTimeout(showToast, 4000);
  setInterval(checkLiveStatus, 60000);
  setInterval(updateUptime, 1000);
});

function updateLoaderStatus(text) {
  const status = document.getElementById('loaderStatus');
  if (status) status.textContent = text;
}

// ================================
// BACKGROUND IMAGE
// ================================
function initBackgroundImage() {
  const bgImage = document.querySelector('.bg-image');
  const bgUrl = CONFIG.BACKGROUND_IMAGE;
  
  // Aplica a imagem diretamente
  if (bgImage) {
    bgImage.style.backgroundImage = `url('${bgUrl}')`;
    bgImage.style.backgroundSize = 'cover';
    bgImage.style.backgroundPosition = 'center center';
    bgImage.style.backgroundRepeat = 'no-repeat';
  }
  
  // Também aplica no body como fallback
  document.body.style.backgroundImage = `url('${bgUrl}')`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center center';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundAttachment = 'fixed';
  
  // Pré-carrega a imagem
  const img = new Image();
  img.onload = () => {
    console.log('%c✅ Background image loaded!', 'color: #00c853;');
  };
  img.onerror = () => {
    console.warn('⚠️ Background image failed, using fallback');
    const fallback = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80';
    if (bgImage) bgImage.style.backgroundImage = `url('${fallback}')`;
    document.body.style.backgroundImage = `url('${fallback}')`;
  };
  img.src = bgUrl;
}

// ================================
// LENIS SMOOTH SCROLL
// ================================
function initLenis() {
  lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
}

// ================================
// THEME
// ================================
function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem('theme');
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
  
  toggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// ================================
// TWITCH API (GQL)
// ================================
async function loadAllTwitchData() {
  try {
    await loadChannelDataGQL();
    await loadRecentGames();
    await loadClipsGQL();
    await loadVideosGQL();
    await checkLiveStatus();
    await loadEmotes();
    await loadTopSupporters();
    await loadChannelMods();
  } catch (error) {
    console.error('Error:', error);
    loadFallbackData();
  }
}

// ================================
// RECENT GAMES (via API)
// ================================
async function loadRecentGames() {
  try {
    const query = `
      query {
        user(login: "${CONFIG.CHANNEL_NAME}") {
          videos(first: 20, type: ARCHIVE) {
            edges {
              node {
                game {
                  id
                  name
                  boxArtURL(width: 40, height: 54)
                }
                lengthSeconds
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: { 'Client-ID': CONFIG.CLIENT_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    
    if (data.data?.user?.videos?.edges) {
      const videos = data.data.user.videos.edges.map(e => e.node);
      const gameStats = processGameStats(videos);
      renderGameStats(gameStats);
    } else {
      renderFallbackGameStats();
    }
  } catch (error) {
    console.error('Games API error:', error);
    renderFallbackGameStats();
  }
}

function processGameStats(videos) {
  const gameMap = new Map();
  
  videos.forEach(video => {
    if (video.game && video.game.name) {
      const gameName = video.game.name;
      if (gameMap.has(gameName)) {
        const existing = gameMap.get(gameName);
        existing.totalSeconds += video.lengthSeconds || 0;
        existing.streamCount += 1;
      } else {
        gameMap.set(gameName, {
          name: gameName,
          boxArt: video.game.boxArtURL || '',
          totalSeconds: video.lengthSeconds || 0,
          streamCount: 1
        });
      }
    }
  });
  
  // Converter para array e ordenar por tempo total
  const gamesArray = Array.from(gameMap.values());
  gamesArray.sort((a, b) => b.totalSeconds - a.totalSeconds);
  
  return gamesArray.slice(0, 4); // Top 4 jogos
}

function renderGameStats(games) {
  const grid = document.getElementById('gamestatsGrid');
  if (!grid) return;
  
  if (games.length === 0) {
    renderFallbackGameStats();
    return;
  }
  
  const gameIcons = {
    'Dota 2': '🏆',
    'VALORANT': '🎯',
    'League of Legends': '⚔️',
    'Counter-Strike': '🔫',
    'CS2': '🔫',
    'Fortnite': '🎮',
    'Minecraft': '⛏️',
    'Grand Theft Auto V': '🚗',
    'GTA V': '🚗',
    'Just Chatting': '💬',
    'Apex Legends': '🎖️',
    'World of Warcraft': '🐉',
    'Overwatch 2': '🎯',
    'Dead by Daylight': '🔪',
    'Phasmophobia': '👻',
    'Among Us': '🚀',
    'Rust': '🛠️',
    'ARK': '🦖'
  };
  
  grid.innerHTML = games.map((game, index) => {
    const hours = Math.floor(game.totalSeconds / 3600);
    const icon = gameIcons[game.name] || '🎮';
    const boxArt = game.boxArt || 'https://static-cdn.jtvnw.net/ttv-boxart/default.jpg';
    
    return `
      <div class="gamestat-card">
        <img src="${boxArt}" alt="${game.name}" onerror="this.src='https://static-cdn.jtvnw.net/ttv-static/404_boxart.jpg'">
        <div class="gamestat-info">
          <span class="gamestat-game">${game.name}</span>
          <span class="gamestat-rank">${icon} ${game.streamCount} stream${game.streamCount > 1 ? 's' : ''}</span>
        </div>
        <div class="gamestat-hours">${formatNumber(hours)}h</div>
      </div>
    `;
  }).join('');
  
  observeElements();
}

function renderFallbackGameStats() {
  const grid = document.getElementById('gamestatsGrid');
  if (!grid) return;
  
  const fallbackGames = [
    { name: 'Dota 2', icon: '🏆', hours: '2.8K', streams: '150+' },
    { name: 'Just Chatting', icon: '💬', hours: '500', streams: '80+' },
    { name: 'Valorant', icon: '🎯', hours: '120', streams: '25+' }
  ];
  
  grid.innerHTML = fallbackGames.map(game => `
    <div class="gamestat-card">
      <div style="width:24px;height:24px;background:var(--purple);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;">${game.icon}</div>
      <div class="gamestat-info">
        <span class="gamestat-game">${game.name}</span>
        <span class="gamestat-rank">${game.icon} ${game.streams} streams</span>
      </div>
      <div class="gamestat-hours">${game.hours}h</div>
    </div>
  `).join('');
  
  observeElements();
}

async function loadChannelDataGQL() {
  try {
    const query = `
      query {
        user(login: "${CONFIG.CHANNEL_NAME}") {
          id
          login
          displayName
          description
          profileImageURL(width: 300)
          createdAt
          followers { totalCount }
          stream {
            id
            title
            viewersCount
            createdAt
            game { name }
          }
        }
      }
    `;

    const response = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: { 'Client-ID': CONFIG.CLIENT_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    
    if (data.data?.user) {
      channelData = data.data.user;
      CONFIG.BROADCASTER_ID = channelData.id;
      updateChannelUI(channelData);
      
      if (channelData.stream) {
        isLive = true;
        streamData = channelData.stream;
        streamStartTime = new Date(channelData.stream.createdAt);
        updateLiveUI(true, streamData);
      }
    }
  } catch (error) {
    console.error('GQL Error:', error);
    loadFallbackData();
  }
}

function updateChannelUI(data) {
  const followers = data.followers?.totalCount || 0;
  animateCounter('followerCount', followers);
  animateCounter('viewCount', Math.floor(followers * 25));
  animateCounter('totalStreams', Math.floor(followers / 50));
  
  if (data.profileImageURL) {
    const img = document.getElementById('profileImage');
    if (img) img.src = data.profileImageURL;
  }
  
  if (data.createdAt) {
    const years = Math.floor((new Date() - new Date(data.createdAt)) / (365.25 * 24 * 60 * 60 * 1000));
    document.getElementById('channelAge').textContent = `${years}+`;
  }
  
  if (data.description) {
    document.getElementById('channelDescription').textContent = data.description || 'Gaymer de Roça • 31 anos • Dota me destruiu ♡';
  }
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  
  const duration = 1500;
  const start = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    el.textContent = formatNumber(Math.floor(eased * target));
    if (progress < 1) requestAnimationFrame(update);
  }
  
  requestAnimationFrame(update);
}

async function loadClipsGQL() {
  try {
    const query = `
      query {
        user(login: "${CONFIG.CHANNEL_NAME}") {
          clips(first: 8, criteria: { period: LAST_MONTH }) {
            edges {
              node {
                id
                slug
                title
                viewCount
                durationSeconds
                createdAt
                thumbnailURL
                url
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: { 'Client-ID': CONFIG.CLIENT_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    if (data.data?.user?.clips?.edges) {
      renderClips(data.data.user.clips.edges.map(e => e.node));
    }
  } catch (error) {
    renderFallbackClips();
  }
}

function renderClips(clips) {
  const grid = document.getElementById('clipsGrid');
  if (!grid) return;
  
  if (clips.length === 0) { renderFallbackClips(); return; }
  
  grid.innerHTML = clips.slice(0, 4).map(clip => `
    <div class="clip-card" data-url="${clip.url}">
      <div class="clip-thumbnail">
        <img src="${clip.thumbnailURL}" alt="${clip.title}" loading="lazy">
        <div class="clip-overlay"><div class="clip-play">▶</div></div>
        <span class="clip-duration">${formatDuration(clip.durationSeconds)}</span>
        <span class="clip-views">${formatNumber(clip.viewCount)} views</span>
      </div>
      <div class="clip-info">
        <h4>${clip.title}</h4>
        <p>${formatTimeAgo(clip.createdAt)}</p>
      </div>
    </div>
  `).join('');
  
  grid.querySelectorAll('.clip-card').forEach(card => {
    card.addEventListener('click', () => window.open(card.dataset.url, '_blank'));
  });
  
  observeElements();
}

async function loadVideosGQL() {
  try {
    const query = `
      query {
        user(login: "${CONFIG.CHANNEL_NAME}") {
          videos(first: 6, type: ARCHIVE) {
            edges {
              node {
                id
                title
                viewCount
                lengthSeconds
                createdAt
                previewThumbnailURL(width: 320, height: 180)
                game { name }
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: { 'Client-ID': CONFIG.CLIENT_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    if (data.data?.user?.videos?.edges) {
      renderVideos(data.data.user.videos.edges.map(e => e.node));
    }
  } catch (error) {
    renderFallbackVideos();
  }
}

function renderVideos(videos) {
  const grid = document.getElementById('videosGrid');
  if (!grid) return;
  
  if (videos.length === 0) { renderFallbackVideos(); return; }
  
  grid.innerHTML = videos.slice(0, 3).map(video => `
    <a href="https://twitch.tv/videos/${video.id}" target="_blank" class="video-card">
      <div class="video-thumbnail">
        <img src="${video.previewThumbnailURL}" alt="${video.title}" loading="lazy">
        <span class="video-type">VOD</span>
        <span class="video-duration">${formatDuration(video.lengthSeconds)}</span>
      </div>
      <div class="video-info">
        <h4>${video.title}</h4>
        <div class="video-meta">
          <span>${formatNumber(video.viewCount)} views</span>
          <span>•</span>
          <span>${formatTimeAgo(video.createdAt)}</span>
        </div>
      </div>
    </a>
  `).join('');
  
  observeElements();
}

async function checkLiveStatus() {
  try {
    const query = `
      query {
        user(login: "${CONFIG.CHANNEL_NAME}") {
          stream {
            id
            title
            viewersCount
            createdAt
            game { name }
          }
        }
      }
    `;

    const response = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: { 'Client-ID': CONFIG.CLIENT_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    
    if (data.data?.user?.stream) {
      if (!isLive) triggerConfetti();
      isLive = true;
      streamData = data.data.user.stream;
      streamStartTime = new Date(data.data.user.stream.createdAt);
      updateLiveUI(true, streamData);
    } else {
      isLive = false;
      streamData = null;
      streamStartTime = null;
      updateLiveUI(false);
    }
  } catch (error) {
    console.error('Live check error:', error);
  }
}

function updateLiveUI(live, stream = null) {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  const liveBadge = document.getElementById('liveBadge');
  const liveBanner = document.getElementById('liveBanner');
  const tvLiveBadge = document.getElementById('tvLiveBadge');
  const avatarRing = document.getElementById('avatarRing');
  const avatarGlow = document.querySelector('.avatar-glow');
  const hero = document.querySelector('.hero');
  
  if (live && stream) {
    statusDot?.classList.add('live');
    if (statusText) { statusText.textContent = 'LIVE'; statusText.style.color = '#eb0400'; }
    liveBadge?.classList.add('show');
    tvLiveBadge?.classList.add('show');
    avatarRing?.classList.add('live');
    avatarGlow?.classList.add('live');
    
    if (liveBanner) {
      liveBanner.classList.add('show');
      document.getElementById('streamTitle').textContent = stream.title || 'Ao vivo!';
      document.getElementById('streamGame').textContent = stream.game?.name ? `• ${stream.game.name}` : '';
      document.getElementById('viewerCount').textContent = formatNumber(stream.viewersCount || 0);
    }
    hero?.classList.add('live-active');
  } else {
    statusDot?.classList.remove('live');
    if (statusText) { statusText.textContent = 'OFFLINE'; statusText.style.color = ''; }
    liveBadge?.classList.remove('show');
    tvLiveBadge?.classList.remove('show');
    avatarRing?.classList.remove('live');
    avatarGlow?.classList.remove('live');
    liveBanner?.classList.remove('show');
    hero?.classList.remove('live-active');
  }
}

function updateUptime() {
  if (!isLive || !streamStartTime) return;
  const diff = new Date() - streamStartTime;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const uptime = document.getElementById('streamUptime');
  if (uptime) uptime.textContent = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

async function loadEmotes() {
  try {
    const response = await fetch(`https://7tv.io/v3/users/twitch/${CONFIG.BROADCASTER_ID || '123456'}`);
    if (response.ok) {
      const data = await response.json();
      if (data.emote_set?.emotes) { renderEmotes(data.emote_set.emotes); return; }
    }
    renderFallbackEmotes();
  } catch (error) {
    renderFallbackEmotes();
  }
}

function renderEmotes(emotes) {
  const grid = document.getElementById('emotesGrid');
  if (!grid) return;
  grid.innerHTML = emotes.slice(0, 10).map(emote => `
    <div class="emote-item">
      <img src="https://cdn.7tv.app/emote/${emote.id}/2x.webp" alt="${emote.name}">
      <span>${emote.name}</span>
    </div>
  `).join('');
  observeElements();
}

// ================================
// TOP SUPPORTERS (via API)
// ================================
async function loadTopSupporters() {
  try {
    // Tentar buscar via StreamElements API (pública)
    const response = await fetch(`https://api.streamelements.com/kappa/v2/channels/${CONFIG.CHANNEL_NAME}/leaderboard/alltime`);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        await renderTopSupporters(data.slice(0, 3));
        return;
      }
    }
    
    // Fallback: tentar buscar chatters ativos via Twitch GQL
    await loadTopChattersGQL();
  } catch (error) {
    console.warn('Top supporters API failed, using fallback:', error);
    renderFallbackSupporters();
  }
}

async function loadTopChattersGQL() {
  try {
    const query = `
      query {
        user(login: "${CONFIG.CHANNEL_NAME}") {
          channel {
            chatters {
              broadcasters { login displayName }
              moderators { login displayName }
              vips { login displayName }
              viewers { login displayName }
            }
          }
        }
      }
    `;

    const response = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: { 'Client-ID': CONFIG.CLIENT_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    
    if (data.data?.user?.channel?.chatters) {
      const chatters = data.data.user.channel.chatters;
      const allChatters = [
        ...chatters.moderators || [],
        ...chatters.vips || [],
        ...chatters.viewers || []
      ].slice(0, 3);
      
      if (allChatters.length > 0) {
        await renderTopChatters(allChatters);
        return;
      }
    }
    
    renderFallbackSupporters();
  } catch (error) {
    renderFallbackSupporters();
  }
}

async function renderTopSupporters(supporters) {
  const subMonths = [24, 18, 12];
  
  for (let i = 0; i < Math.min(supporters.length, 3); i++) {
    const supporter = supporters[i];
    const imgEl = document.getElementById(`supporter${i + 1}Img`);
    const nameEl = document.getElementById(`supporter${i + 1}Name`);
    const monthsEl = document.getElementById(`supporter${i + 1}Months`);
    
    const username = supporter.username || supporter.name || `TopFan${i + 1}`;
    
    if (nameEl) nameEl.textContent = username;
    if (monthsEl) {
      if (supporter.months) {
        monthsEl.textContent = `${supporter.months}m`;
      } else if (supporter.amount) {
        monthsEl.textContent = `${formatNumber(supporter.amount)}`;
      } else {
        monthsEl.textContent = `${subMonths[i]}m`;
      }
    }
    
    if (imgEl) await loadUserAvatar(username, imgEl);
  }
}

async function renderTopChatters(chatters) {
  const subMonths = [24, 18, 12];
  
  for (let i = 0; i < Math.min(chatters.length, 3); i++) {
    const chatter = chatters[i];
    const imgEl = document.getElementById(`supporter${i + 1}Img`);
    const nameEl = document.getElementById(`supporter${i + 1}Name`);
    const monthsEl = document.getElementById(`supporter${i + 1}Months`);
    
    const username = chatter.displayName || chatter.login || `TopFan${i + 1}`;
    
    if (nameEl) nameEl.textContent = username;
    if (monthsEl) monthsEl.textContent = `${subMonths[i]}m`;
    
    if (imgEl && chatter.login) {
      await loadUserAvatar(chatter.login, imgEl);
    }
  }
}

async function loadUserAvatar(username, imgElement) {
  if (!username || !imgElement) return;
  
  try {
    const query = `
      query {
        user(login: "${username.toLowerCase().replace(/\s/g, '')}") {
          profileImageURL(width: 150)
        }
      }
    `;

    const response = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: { 'Client-ID': CONFIG.CLIENT_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    
    if (data.data?.user?.profileImageURL) {
      imgElement.src = data.data.user.profileImageURL;
    }
  } catch (error) {
    console.warn('Avatar load failed for:', username);
  }
}

function renderFallbackSupporters() {
  const supporters = [
    { name: 'TopFan1', months: 24 },
    { name: 'TopFan2', months: 18 },
    { name: 'TopFan3', months: 12 }
  ];
  
  supporters.forEach((supporter, i) => {
    const imgEl = document.getElementById(`supporter${i + 1}Img`);
    const nameEl = document.getElementById(`supporter${i + 1}Name`);
    const monthsEl = document.getElementById(`supporter${i + 1}Months`);
    
    if (imgEl) imgEl.src = 'https://static-cdn.jtvnw.net/jtv_user_pictures/default-profile.png';
    if (nameEl) nameEl.textContent = supporter.name;
    if (monthsEl) monthsEl.textContent = `${supporter.months}m`;
  });
}

// ================================
// CHANNEL MODS & VIPs
// ================================
async function loadChannelMods() {
  try {
    const query = `
      query {
        user(login: "${CONFIG.CHANNEL_NAME}") {
          mods(first: 10) {
            edges {
              node {
                login
                displayName
              }
            }
          }
          vips(first: 5) {
            edges {
              node {
                login
                displayName
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: { 'Client-ID': CONFIG.CLIENT_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    
    const mods = data.data?.user?.mods?.edges?.map(e => e.node) || [];
    const vips = data.data?.user?.vips?.edges?.map(e => e.node) || [];
    
    renderTeamGrid(mods, vips);
  } catch (error) {
    console.warn('Mods API failed:', error);
    renderFallbackTeam();
  }
}

function renderTeamGrid(mods, vips) {
  const grid = document.getElementById('teamGrid');
  if (!grid) return;
  
  let html = '';
  
  // Adiciona MODs (máximo 3)
  mods.slice(0, 3).forEach(mod => {
    html += `<div class="team-member"><span class="team-role">⚔️</span><span class="team-name">${mod.displayName || mod.login}</span></div>`;
  });
  
  // Adiciona VIPs (máximo 2)
  vips.slice(0, 2).forEach(vip => {
    html += `<div class="team-member"><span class="team-role">👑</span><span class="team-name">${vip.displayName || vip.login}</span></div>`;
  });
  
  if (html === '') {
    renderFallbackTeam();
    return;
  }
  
  grid.innerHTML = html;
  observeElements();
}

function renderFallbackTeam() {
  const grid = document.getElementById('teamGrid');
  if (!grid) return;
  
  grid.innerHTML = `
    <div class="team-member"><span class="team-role">⚔️</span><span class="team-name">Mod1</span></div>
    <div class="team-member"><span class="team-role">⚔️</span><span class="team-name">Mod2</span></div>
    <div class="team-member"><span class="team-role">👑</span><span class="team-name">VIP1</span></div>
    <div class="team-member"><span class="team-role">💜</span><span class="team-name">Sub1</span></div>
  `;
  observeElements();
}

// ================================
// FALLBACK DATA
// ================================
function loadFallbackData() {
  animateCounter('followerCount', 45200);
  animateCounter('viewCount', 1200000);
  animateCounter('totalStreams', 904);
  document.getElementById('channelAge').textContent = '4+';
  renderFallbackGameStats();
  renderFallbackClips();
  renderFallbackVideos();
  renderFallbackEmotes();
  renderFallbackSupporters();
  renderFallbackTeam();
}

function renderFallbackClips() {
  const grid = document.getElementById('clipsGrid');
  if (!grid) return;
  const clips = [
    { title: 'Jogada insana!', views: '2.4K', duration: '0:30', time: 'há 2 dias' },
    { title: 'Risada épica', views: '1.8K', duration: '0:45', time: 'há 3 dias' },
    { title: 'Momento fofo ♡', views: '3.1K', duration: '1:02', time: 'há 5 dias' },
    { title: 'Play da semana!', views: '5.2K', duration: '0:28', time: 'há 1 semana' }
  ];
  grid.innerHTML = clips.map(clip => `
    <div class="clip-card" onclick="window.open('https://twitch.tv/${CONFIG.CHANNEL_NAME}/clips', '_blank')">
      <div class="clip-thumbnail">
        <img src="https://placehold.co/320x180/9146FF/white?text=Clip" alt="${clip.title}">
        <div class="clip-overlay"><div class="clip-play">▶</div></div>
        <span class="clip-duration">${clip.duration}</span>
        <span class="clip-views">${clip.views}</span>
      </div>
      <div class="clip-info"><h4>${clip.title}</h4><p>${clip.time}</p></div>
    </div>
  `).join('');
  observeElements();
}

function renderFallbackVideos() {
  const grid = document.getElementById('videosGrid');
  if (!grid) return;
  const videos = [
    { title: 'Dota 2 - Ranked', views: '1.2K', duration: '4:32:15', time: 'há 1 dia' },
    { title: 'Jogando com Inscritos', views: '890', duration: '3:45:20', time: 'há 2 dias' },
    { title: 'Especial de Domingo', views: '2.1K', duration: '5:12:45', time: 'há 4 dias' }
  ];
  grid.innerHTML = videos.map(video => `
    <a href="https://twitch.tv/${CONFIG.CHANNEL_NAME}/videos" target="_blank" class="video-card">
      <div class="video-thumbnail">
        <img src="https://placehold.co/320x180/9146FF/white?text=VOD" alt="${video.title}">
        <span class="video-type">VOD</span>
        <span class="video-duration">${video.duration}</span>
      </div>
      <div class="video-info"><h4>${video.title}</h4><div class="video-meta"><span>${video.views} views</span><span>•</span><span>${video.time}</span></div></div>
    </a>
  `).join('');
  observeElements();
}

function renderFallbackEmotes() {
  const grid = document.getElementById('emotesGrid');
  if (!grid) return;
  const emotes = ['💜', '🎮', '✨', '🔥', '😂', '❤️', '🤣', '💀', '🥰', '😍'];
  grid.innerHTML = emotes.map((e, i) => `
    <div class="emote-item">
      <span style="font-size: 1.8rem;">${e}</span>
      <span>Emote ${i + 1}</span>
    </div>
  `).join('');
  observeElements();
}

// ================================
// TV WIDGET
// ================================
function initTVWidget() {
  const tvWidget = document.getElementById('tvWidget');
  const tvHeader = document.getElementById('tvHeader');
  const openTV = document.getElementById('openTV');
  const tvClose = document.getElementById('tvClose');
  const tvMin = document.getElementById('tvMin');
  const tvTabs = document.querySelectorAll('.tv-tab');
  
  openTV?.addEventListener('click', () => {
    tvWidget.classList.add('show');
    tvWidget.classList.remove('minimized');
  });
  
  tvClose?.addEventListener('click', () => tvWidget.classList.remove('show'));
  tvMin?.addEventListener('click', () => tvWidget.classList.toggle('minimized'));
  
  tvTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tvTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tv-panel').forEach(p => p.classList.remove('active'));
      const panelId = 'panel' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
      document.getElementById(panelId)?.classList.add('active');
    });
  });
  
  // Draggable
  let isDragging = false, dragX = 0, dragY = 0;
  
  tvHeader?.addEventListener('mousedown', startDrag);
  tvHeader?.addEventListener('touchstart', startDrag, { passive: false });
  
  function startDrag(e) {
    if (e.target.closest('.tv-controls')) return;
    isDragging = true;
    tvWidget.style.transition = 'none';
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = tvWidget.getBoundingClientRect();
    dragX = clientX - rect.left;
    dragY = clientY - rect.top;
    e.preventDefault();
  }
  
  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag, { passive: false });
  
  function drag(e) {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    let newX = Math.max(0, Math.min(clientX - dragX, window.innerWidth - tvWidget.offsetWidth));
    let newY = Math.max(0, Math.min(clientY - dragY, window.innerHeight - tvWidget.offsetHeight));
    tvWidget.style.left = newX + 'px';
    tvWidget.style.top = newY + 'px';
    tvWidget.style.right = 'auto';
    e.preventDefault();
  }
  
  document.addEventListener('mouseup', () => { isDragging = false; tvWidget.style.transition = ''; });
  document.addEventListener('touchend', () => { isDragging = false; tvWidget.style.transition = ''; });
  
  // Load embeds
  document.getElementById('loadStream')?.addEventListener('click', function() {
    const placeholder = document.getElementById('streamPlaceholder');
    const panel = document.getElementById('panelStream');
    const parent = window.location.hostname || 'localhost';
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.twitch.tv/?channel=${CONFIG.CHANNEL_NAME}&parent=${parent}&muted=false`;
    iframe.allowFullscreen = true;
    placeholder?.remove();
    panel?.appendChild(iframe);
  });
  
  document.getElementById('loadChat')?.addEventListener('click', function() {
    const placeholder = document.getElementById('chatPlaceholder');
    const panel = document.getElementById('panelChat');
    const parent = window.location.hostname || 'localhost';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.twitch.tv/embed/${CONFIG.CHANNEL_NAME}/chat?parent=${parent}&darkpopout`;
    placeholder?.remove();
    panel?.appendChild(iframe);
  });
}

// ================================
// NAVIGATION
// ================================
function initNavigation() {
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const progressBar = document.getElementById('scrollProgress');
  
  function updateNav() {
    const scrollY = window.scrollY;
    if (scrollY > 50) navbar?.classList.add('scrolled');
    else navbar?.classList.remove('scrolled');
    
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = (scrollY / docHeight) * 100 + '%';
    
    let current = '';
    sections.forEach(section => {
      if (scrollY >= section.offsetTop - 100) current = section.getAttribute('id');
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) link.classList.add('active');
    });
  }
  
  window.addEventListener('scroll', updateNav);
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href?.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) lenis?.scrollTo(target);
      }
    });
  });
}

// ================================
// FAB
// ================================
function initFAB() {
  const fabMain = document.getElementById('fabMain');
  const fabOptions = document.getElementById('fabOptions');
  
  fabMain?.addEventListener('click', () => {
    fabMain.classList.toggle('active');
    fabOptions?.classList.toggle('show');
  });
  
  document.querySelectorAll('.fab-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'tv') document.getElementById('tvWidget')?.classList.add('show');
      else if (action === 'top') lenis?.scrollTo(0);
      fabMain?.classList.remove('active');
      fabOptions?.classList.remove('show');
    });
  });
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.fab-container')) {
      fabMain?.classList.remove('active');
      fabOptions?.classList.remove('show');
    }
  });
}

// ================================
// COMMAND PALETTE
// ================================
function initCommandPalette() {
  const palette = document.getElementById('commandPalette');
  const backdrop = document.getElementById('paletteBackdrop');
  const input = document.getElementById('paletteInput');
  const openBtn = document.getElementById('openPalette');
  
  function openPalette() {
    palette?.classList.add('show');
    input?.focus();
  }
  
  function closePalette() {
    palette?.classList.remove('show');
    if (input) input.value = '';
  }
  
  openBtn?.addEventListener('click', openPalette);
  backdrop?.addEventListener('click', closePalette);
  
  document.querySelectorAll('.palette-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      closePalette();
      
      switch (action) {
        case 'home': lenis?.scrollTo('#hero'); break;
        case 'about': lenis?.scrollTo('#about'); break;
        case 'clips': lenis?.scrollTo('#clips'); break;
        case 'schedule': lenis?.scrollTo('#schedule'); break;
        case 'tv': document.getElementById('tvWidget')?.classList.add('show'); break;
        case 'twitch': window.open('https://twitch.tv/hxadinha', '_blank'); break;
        case 'discord': window.open('https://discord.gg/hxadinha', '_blank'); break;
        case 'theme': document.getElementById('themeToggle')?.click(); break;
      }
    });
  });
  
  input?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.palette-item').forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? 'flex' : 'none';
    });
  });
}

// ================================
// KEYBOARD SHORTCUTS
// ================================
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    
    const tvWidget = document.getElementById('tvWidget');
    const palette = document.getElementById('commandPalette');
    
    if (e.key === 'Escape') {
      tvWidget?.classList.remove('show');
      palette?.classList.remove('show');
      document.getElementById('fabMain')?.classList.remove('active');
      document.getElementById('fabOptions')?.classList.remove('show');
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      palette?.classList.toggle('show');
      if (palette?.classList.contains('show')) document.getElementById('paletteInput')?.focus();
    }
    
    if (e.key === 't' || e.key === 'T') {
      tvWidget?.classList.toggle('show');
      if (tvWidget?.classList.contains('show')) tvWidget.classList.remove('minimized');
    }
  });
}

// ================================
// SCHEDULE
// ================================
function initSchedule() {
  const today = new Date().getDay();
  document.querySelectorAll('.schedule-day').forEach(day => {
    if (parseInt(day.dataset.day) === today) day.classList.add('today');
  });
  
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  const countdownEl = document.getElementById('countdown');
  if (!countdownEl) return;
  
  if (isLive) { countdownEl.textContent = '🔴 AO VIVO!'; countdownEl.style.color = '#eb0400'; return; }
  
  const now = new Date();
  const day = now.getDay();
  let daysUntil = 0;
  
  if (day === 0) daysUntil = 1;
  else if (day === 6) daysUntil = 2;
  else if (now.getHours() >= 20) daysUntil = day === 5 ? 3 : 1;
  
  const nextStream = new Date(now);
  nextStream.setDate(now.getDate() + daysUntil);
  nextStream.setHours(20, 0, 0, 0);
  
  const diff = nextStream - now;
  if (diff <= 0) { countdownEl.textContent = 'EM BREVE!'; countdownEl.style.color = '#00c853'; return; }
  
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  
  countdownEl.textContent = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  countdownEl.style.color = '';
}

// ================================
// PARTICLES
// ================================
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      background: rgba(145, 70, 255, ${Math.random() * 0.4 + 0.1});
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: float ${Math.random() * 8 + 8}s linear infinite;
      animation-delay: ${Math.random() * 4}s;
    `;
    container.appendChild(particle);
  }
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float {
      0%, 100% { transform: translate(0, 0); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translate(${Math.random() > 0.5 ? '' : '-'}80px, -150px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ================================
// CONFETTI
// ================================
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#9146FF', '#c8b6ff', '#a78bfa', '#ffffff'] });
  }
}

// ================================
// TOAST
// ================================
function showToast() {
  const toast = document.getElementById('toast');
  toast?.classList.add('show');
  setTimeout(() => toast?.classList.remove('show'), 3500);
}

// ================================
// UTILITIES
// ================================
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

function formatTimeAgo(dateString) {
  const diff = new Date() - new Date(dateString);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  const w = Math.floor(d / 7);
  
  if (w > 0) return `há ${w} sem`;
  if (d > 0) return `há ${d} dia${d > 1 ? 's' : ''}`;
  if (h > 0) return `há ${h}h`;
  if (m > 0) return `há ${m}min`;
  return 'agora';
}

// ================================
// INTERSECTION OBSERVER
// ================================
function observeElements() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.about-card, .clip-card, .video-card, .schedule-day, .emote-item, .command-card, .supporter-card, .team-member, .gamestat-card, .gamestat-skeleton').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.4s ease ${i * 0.03}s, transform 0.4s ease ${i * 0.03}s`;
    observer.observe(el);
  });
}

observeElements();

console.log('%c📺 Ctrl+K = Command Palette | T = Mini TV', 'font-size: 10px; color: #888;');
