// ===== CONFIG =====
const API_KEY = '79a56b2437bf3484d2a4828a818ce9fb';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const ARCHIVE_SEARCH = 'https://archive.org/advancedsearch.php';
const ARCHIVE_IMG = 'https://archive.org/services/img/';
const ARCHIVE_EMBED = 'https://archive.org/embed/';
const ARCHIVE_DOWNLOAD = 'https://archive.org/download/';

// ===== නීත්‍යානුකූල Free Platforms =====
const PLATFORMS = [
    { name: 'Internet Archive', desc: 'Public Domain movies, cartoons & TV — මේ site එකේම බලන්න + download', insite: true, url: q => `https://archive.org/search?query=${encodeURIComponent(q)}` },
    { name: 'YouTube', desc: 'Official channels වල free legal full movies', url: q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' full movie')}` },
    { name: 'Tubi', desc: 'Free ad-supported movies & TV (100% legal)', url: q => `https://tubi.tv/search/${encodeURIComponent(q)}` },
    { name: 'Pluto TV', desc: 'Free live TV channels & movies (legal)', url: q => `https://pluto.tv/us/search/${encodeURIComponent(q)}` },
    { name: 'Plex', desc: 'Free movies & shows (legal)', url: q => `https://watch.plex.tv/search?q=${encodeURIComponent(q)}` },
    { name: 'Crunchyroll', desc: 'Anime — free tier එකෙන් නීත්‍යානුකූලව බලන්න', url: q => `https://www.crunchyroll.com/search?q=${encodeURIComponent(q)}` },
    { name: 'RetroCrush', desc: 'Classic anime free (legal)', url: q => `https://www.retrocrush.tv/search?q=${encodeURIComponent(q)}` },
    { name: 'Kanopy', desc: 'Library card එකක් තියෙනවා නම් සම්පූර්ණයෙන්ම free', url: q => `https://www.kanopy.com/search/?query=${encodeURIComponent(q)}` },
    { name: 'Wikimedia Commons', desc: 'CC-licensed films & clips (legal)', url: q => `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(q)}` }
];

// ===== Official Free Game Stores (FREE විතරයි — paid mix වෙන්නේ නැහැ) =====
const GAME_STORES = [
    { name: 'itch.io (Free)', desc: 'Indie developers නොමිලේ බෙදන games දහස් ගණනක්', url: q => q ? `https://itch.io/search?q=${encodeURIComponent(q)}` : 'https://itch.io/games/free' },
    { name: 'Steam (Free to Play)', desc: 'Steam official — FREE games විතරක් filter වෙනවා', url: q => `https://store.steampowered.com/search/?term=${encodeURIComponent(q)}&maxprice=free` },
    { name: 'Epic Games (Free Giveaways)', desc: 'සතියක් පාසා Epic නොමිලේ දෙන games', url: () => 'https://store.epicgames.com/en-US/free-games' },
    { name: 'Game Jolt', desc: 'Free indie games community', url: q => `https://gamejolt.com/search?q=${encodeURIComponent(q)}` },
    { name: 'Internet Archive', desc: 'Retro + freeware games — මේ site එකේම download', insite: true, url: q => `https://archive.org/search?query=${encodeURIComponent(q)}` }
];

// ===== Elements =====
const movieContainer = document.getElementById('movieContainer');
const sectionTitle = document.getElementById('sectionTitle');
const yearsGrid = document.getElementById('yearsGrid');
const genreList = document.getElementById('genreList');
const sideMenu = document.getElementById('sideMenu');
const menuBtn = document.getElementById('menuBtn');
const searchToggle = document.getElementById('searchToggle');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const yearsSection = document.getElementById('yearsSection');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeBtn = document.querySelector('.close');
const themeToggle = document.getElementById('themeToggle');

const LOADING = '<p style="grid-column:1/-1;text-align:center;color:#888;">Loading...</p>';
let currentMode = 'movie';
let currentQuery = '';

function modeLabel(m) {
    const labels = { movie: 'Movies', tv: 'TV Series', anime: 'Anime', gamesplay: 'Games', gamesfree: 'Games', gamesworld: 'Free Games', cartoons: 'Cartoons', free: 'Free Movies', daily: 'Free Additions', today: 'Movies', platforms: 'Platforms', stores: 'Stores' };
    return labels[m] || 'Movies';
}

// ===== Theme =====
function applyTheme(t) {
    if (t === 'light') { document.body.classList.add('light'); themeToggle.textContent = '☀️'; }
    else { document.body.classList.remove('light'); themeToggle.textContent = '🌙'; }
}
applyTheme(localStorage.getItem('bnn-theme') || 'dark');
themeToggle.addEventListener('click', () => {
    const next = document.body.classList.contains('light') ? 'dark' : 'light';
    localStorage.setItem('bnn-theme', next);
    applyTheme(next);
});

// ===== Helpers =====
function setTitle(t) { sectionTitle.textContent = t; }
function showError(msg) {
    movieContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#e50914;padding:20px;">${msg}</p>`;
}
async function tmdbFetch(url) {
    const response = await fetch(url);
    if (!response.ok) {
        let msg = response.statusText;
        try { const err = await response.json(); msg = err.status_message || msg; } catch (e) {}
        throw new Error(`TMDB Error ${response.status}: ${msg}`);
    }
    return response.json();
}
function guessResolution(n) {
    n = n.toLowerCase();
    if (/4k|2160p|uhd/.test(n)) return '2160p (4K)';
    if (/1080p|fhd/.test(n)) return '1080p (FHD)';
    if (/720p|hd/.test(n)) return '720p (HD)';
    if (/480p|sd/.test(n)) return '480p (SD)';
    if (/360p/.test(n)) return '360p';
    return 'Original';
}
function formatSize(b) {
    if (!b) return '';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
    return (b / 1073741824).toFixed(2) + ' GB';
}

// ===== TMDB Cards =====
function renderCards(items) {
    movieContainer.innerHTML = '';
    if (!items || !items.length) { movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;">No results found.</p>'; return; }
    items.forEach(item => {
        const title = item.title || item.name || 'N/A';
        const date = item.release_date || item.first_air_date || '';
        const year = date ? date.split('-')[0] : '—';
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <span class="badge badge-year">${year}</span>
            <span class="badge badge-rating">★ ${(item.vote_average || 0).toFixed(1)}</span>
            <img src="${item.poster_path ? IMG_BASE + item.poster_path : 'https://via.placeholder.com/500x750?text=MovieAndGameZoneByBNN'}" alt="${title}" loading="lazy">
            <div class="card-title">${title}</div>`;
        card.addEventListener('click', () => showDetails(item.id, item.media_type || 'movie'));
        movieContainer.appendChild(card);
    });
}

// ===== TMDB Loaders =====
async function loadMovies(category = 'now_playing', title = 'Recently Added') {
    currentMode = 'movie'; setTitle(title); movieContainer.innerHTML = LOADING;
    try {
        const data = await tmdbFetch(`${BASE_URL}/movie/${category}?api_key=${API_KEY}&language=si-LK`);
        renderCards((data.results || []).map(x => ({ ...x, media_type: 'movie' })));
    } catch (e) { showError('Data could not be retrieved. (' + e.message + ')'); }
}
async function loadTVSeries() {
    currentMode = 'tv'; setTitle('📺 TV Series (On Air)'); movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const data = await tmdbFetch(`${BASE_URL}/tv/on_the_air?api_key=${API_KEY}&language=si-LK`);
        renderCards((data.results || []).map(x => ({ ...x, media_type: 'tv' })));
    } catch (e) { showError('Data could not be retrieved. (' + e.message + ')'); }
}
async function loadAnime() {
    currentMode = 'anime'; setTitle('🎌 Anime (Latest)'); movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const data = await tmdbFetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=first_air_date.desc&language=si-LK`);
        renderCards((data.results || []).map(x => ({ ...x, media_type: 'tv' })));
    } catch (e) { showError('Data could not be retrieved. (' + e.message + ')'); }
}
async function loadToday() {
    currentMode = 'today'; setTitle("🆕 Today's New Releases (Auto Daily)"); movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const today = new Date().toISOString().split('T')[0];
        const [m, t] = await Promise.all([
            tmdbFetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_date=${today}&language=si-LK`),
            tmdbFetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&first_air_date=${today}&language=si-LK`)
        ]);
        renderCards([...(m.results || []).map(x => ({ ...x, media_type: 'movie' })), ...(t.results || []).map(x => ({ ...x, media_type: 'tv' }))]);
    } catch (e) { showError("Today's releases load failed. (" + e.message + ")"); }
}
async function loadByLang(lang, label) {
    currentMode = 'movie'; setTitle('Language: ' + label); movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const data = await tmdbFetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=${lang}&sort_by=popularity.desc&language=si-LK`);
        renderCards((data.results || []).map(x => ({ ...x, media_type: 'movie' })));
    } catch (e) { showError('Data could not be retrieved. (' + e.message + ')'); }
}
async function loadByGenre(id, label) {
    currentMode = 'movie'; setTitle('Genre: ' + label); movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const data = await tmdbFetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${id}&sort_by=popularity.desc&language=si-LK`);
        renderCards((data.results || []).map(x => ({ ...x, media_type: 'movie' })));
    } catch (e) { showError('Data could not be retrieved. (' + e.message + ')'); }
}

// ===== 🔧 FIX: Year filter — Games modes වලදී GAMES විතරයි, movies කවදාවත්ම නැහැ =====
async function loadByYear(y) {
    // 🎮 Games modes — මුලින්ම check කරලා return වෙනවා (movies වලට යන්නේ නැහැ)
    if (currentMode === 'gamesworld') { await loadWorldGames(y); return; }
    if (currentMode === 'gamesfree') {
        setTitle(`📅 Year: ${y} — Games`); movieContainer.innerHTML = LOADING;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        try { renderGameCards(await githubGameSearch('', y)); } catch (e) { showError('Year games load failed. (' + e.message + ')'); }
        return;
    }
    if (currentMode === 'gamesplay') {
        setTitle(`📅 Year: ${y} — Games`); movieContainer.innerHTML = LOADING;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        try { renderArchiveCards(await archiveGames(y), '🎮 PLAY', 'game'); } catch (e) { showError('Year games load failed. (' + e.message + ')'); }
        return;
    }
    if (currentMode === 'stores') { loadGameStores(currentQuery); return; }

    // 🎬 Movies / TV / Anime / Free modes
    setTitle(`📅 Year: ${y} — ${modeLabel(currentMode)}`);
    movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        if (currentMode === 'tv') {
            const data = await tmdbFetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&first_air_date_year=${y}&sort_by=popularity.desc&language=si-LK`);
            renderCards((data.results || []).map(x => ({ ...x, media_type: 'tv' })));
        } else if (currentMode === 'anime') {
            const data = await tmdbFetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&first_air_date_year=${y}&sort_by=popularity.desc&language=si-LK`);
            renderCards((data.results || []).map(x => ({ ...x, media_type: 'tv' })));
        } else if (currentMode === 'cartoons') {
            const docs = await archiveSearch(`collection:(animationandcartoons) AND mediatype:(movies) AND year:(${y})`, 'downloads desc');
            renderArchiveCards(docs, '🎨 FREE');
        } else if (currentMode === 'free') {
            const docs = await archiveSearch(`collection:(feature_films) AND mediatype:(movies) AND year:(${y})`, 'downloads desc');
            renderArchiveCards(docs, '🎁 FREE');
        } else if (currentMode === 'daily') {
            const docs = await archiveSearch(`(collection:(feature_films) OR collection:(animationandcartoons)) AND mediatype:(movies) AND year:(${y})`, 'addeddate desc');
            renderArchiveCards(docs, '🆕 NEW');
        } else {
            const data = await tmdbFetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=${y}&sort_by=popularity.desc&language=si-LK`);
            renderCards((data.results || []).map(x => ({ ...x, media_type: 'movie' })));
        }
    } catch (e) { showError('Year load failed. (' + e.message + ')'); }
}

// ===== Search (mode-aware) =====
async function searchAll() {
    const q = searchInput.value.trim();
    if (!q) return;
    currentQuery = q;
    if (currentMode === 'gamesfree' || currentMode === 'gamesplay') { searchOSSGames(q); return; }
    if (currentMode === 'gamesworld') { searchWorldGames(q); return; }
    if (currentMode === 'platforms') { loadPlatforms(q); return; }
    if (currentMode === 'stores') { loadGameStores(q); return; }
    currentMode = 'movie';
    setTitle(`Search: "${q}"`); movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const [m, t] = await Promise.all([
            tmdbFetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(q)}&language=si-LK`),
            tmdbFetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(q)}&language=si-LK`)
        ]);
        renderCards([...(m.results || []).map(x => ({ ...x, media_type: 'movie' })), ...(t.results || []).map(x => ({ ...x, media_type: 'tv' }))]);
    } catch (e) { showError('Search failed. (' + e.message + ')'); }
}

// ===== Details Modal =====
async function showDetails(id, type = 'movie') {
    try {
        const item = await tmdbFetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=si-LK&append_to_response=credits,videos`);
        const title = item.title || item.name;
        const date = item.release_date || item.first_air_date || '';
        const year = date ? date.split('-')[0] : '';
        const trailer = (item.videos && item.videos.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube');
        const trailerHTML = trailer ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen style="margin-top:20px;border-radius:10px;"></iframe>` : '<p style="margin-top:20px;color:#888;">Trailer not available.</p>';
        const director = type === 'movie' ? ((item.credits && item.credits.crew || []).find(c => c.job === 'Director') || {}).name : (item.created_by && item.created_by[0] ? item.created_by[0].name : null);
        const runtime = type === 'movie' ? (item.runtime ? item.runtime + ' min' : 'N/A') : (item.number_of_seasons ? item.number_of_seasons + ' Season(s) • ' + (item.number_of_episodes || '?') + ' Episodes' : 'N/A');
        const officialHTML = item.homepage ? `<a class="official-btn" href="${item.homepage}" target="_blank">🔗 Watch on Official Website</a>` : '';
        const episodesHTML = type === 'tv' ? `
            <div style="margin-top:20px;">
                <h3 style="color:#e50914;margin-bottom:10px;">📺 Episodes</h3>
                <div id="epBrowser" class="ep-browser"></div>
                <div id="epList" class="ep-list"></div>
                <p style="margin-top:10px;color:#888;font-size:.8rem;">Copyright shows වල full episodes host කරන්න බැහැ — "Watch on Official Website" හෝ 🌐 Platforms section එක භාවිතා කරන්න.</p>
            </div>` : '';
        const pd = await findPublicDomainCopy(title);
        const watchHTML = pd ? `
            <button id="watchBtn" style="margin-top:15px;padding:12px 25px;background:#27ae60;color:#fff;border:none;border-radius:25px;cursor:pointer;font-weight:bold;">🎬 Watch / Download Free (Public Domain)</button>
            <div id="playerBox" style="display:none;margin-top:15px;">
                <iframe src="${ARCHIVE_EMBED}${pd.identifier}" width="100%" height="420" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe>
                <div id="dlBox2"></div>
            </div>` : '';
        modalBody.innerHTML = `
            <div class="detail-header">
                <img src="${item.poster_path ? IMG_BASE + item.poster_path : ''}" alt="${title}">
                <div class="detail-info">
                    <h2>${title} (${year})</h2>
                    <p><strong>⭐ Rating:</strong> ${item.vote_average.toFixed(1)} / 10 (${item.vote_count} votes)</p>
                    <p><strong>⏱️ ${type === 'movie' ? 'Runtime' : 'Series'}:</strong> ${runtime}</p>
                    <p><strong>🎭 Genres:</strong> ${(item.genres || []).map(g => g.name).join(', ')}</p>
                    <p><strong>📝 Overview:</strong> ${item.overview || 'No overview available.'}</p>
                    <p><strong>🎬 ${type === 'movie' ? 'Director' : 'Creator'}:</strong> ${director || 'N/A'}</p>
                </div>
            </div>
            ${officialHTML}${watchHTML}${episodesHTML}${trailerHTML}`;
        modal.style.display = 'block';
        const wb = document.getElementById('watchBtn');
        if (wb) wb.addEventListener('click', () => {
            document.getElementById('playerBox').style.display = 'block';
            wb.style.display = 'none';
            addDownloadButton(pd.identifier, 'dlBox2');
        });
        if (type === 'tv') setupEpisodeBrowser(id, item.seasons || []);
    } catch (e) { console.error(e); }
}

function setupEpisodeBrowser(tvId, seasons) {
    const box = document.getElementById('epBrowser');
    if (!box) return;
    const real = seasons.filter(s => s.season_number > 0);
    if (!real.length) { document.getElementById('epList').innerHTML = '<p style="color:#888;">No season info.</p>'; return; }
    box.innerHTML = real.map(s => `<button class="season-btn" data-season="${s.season_number}">${s.name} (${s.episode_count || '?'} ep)</button>`).join('');
    box.querySelectorAll('.season-btn').forEach(b => b.addEventListener('click', () => loadSeason(tvId, b.dataset.season)));
    loadSeason(tvId, real[0].season_number);
}
async function loadSeason(tvId, seasonNum) {
    const list = document.getElementById('epList');
    if (!list) return;
    list.innerHTML = '<p style="color:#888;">Loading episodes...</p>';
    try {
        const data = await tmdbFetch(`${BASE_URL}/tv/${tvId}/season/${seasonNum}?api_key=${API_KEY}&language=si-LK`);
        const eps = data.episodes || [];
        list.innerHTML = eps.length ? eps.map(ep => `
            <div class="ep-item"><span class="ep-num">E${ep.episode_number}</span>
            <div><strong>${ep.name || 'Episode ' + ep.episode_number}</strong>
            <p>${ep.air_date || 'TBA'} • ⭐ ${(ep.vote_average || 0).toFixed(1)}</p>
            <p class="ep-over">${ep.overview || ''}</p></div></div>`).join('') : '<p style="color:#888;">No episode info.</p>';
    } catch (e) { list.innerHTML = '<p style="color:#888;">Episodes load failed.</p>'; }
}

// ===== Internet Archive =====
async function archiveSearch(q, sort, rows = 24) {
    const url = `${ARCHIVE_SEARCH}?q=${encodeURIComponent(q)}&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&fl%5B%5D=addeddate&sort%5B%5D=${encodeURIComponent(sort)}&rows=${rows}&page=1&output=json`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.response && data.response.docs) || [];
}
function renderArchiveCards(docs, badge, mode = 'movie') {
    movieContainer.innerHTML = '';
    if (!docs.length) { movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;">No results found.</p>'; return; }
    docs.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <span class="badge badge-year">${doc.year || '—'}</span>
            <span class="badge badge-rating">${badge}</span>
            <img src="${ARCHIVE_IMG}${doc.identifier}" alt="${doc.title || doc.identifier}" loading="lazy">
            <div class="card-title">${doc.title || doc.identifier}</div>`;
        card.addEventListener('click', () => {
            const t = doc.title || doc.identifier;
            if (mode === 'game') playArchiveGame(doc.identifier, t);
            else playArchiveMovie(doc.identifier, t);
        });
        movieContainer.appendChild(card);
    });
}
async function loadArchiveMovies() {
    currentMode = 'free'; setTitle('🎁 Free Movies (Public Domain)'); movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try { renderArchiveCards(await archiveSearch('collection:(feature_films) AND mediatype:(movies)', 'downloads desc'), '🎁 FREE'); }
    catch (e) { showError('Free movies load failed. (' + e.message + ')'); }
}
async function loadCartoonsPD() {
    currentMode = 'cartoons'; setTitle('🎨 Cartoons & Animation (Free • PD)'); movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try { renderArchiveCards(await archiveSearch('collection:(animationandcartoons) AND mediatype:(movies)', 'downloads desc'), '🎨 FREE'); }
    catch (e) { showError('Cartoons load failed. (' + e.message + ')'); }
}
async function loadDailyNew() {
    currentMode = 'daily'; setTitle('🆕 New Free Additions (Updated Daily)'); movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try { renderArchiveCards(await archiveSearch('(collection:(feature_films) OR collection:(animationandcartoons)) AND mediatype:(movies)', 'addeddate desc'), '🆕 NEW'); }
    catch (e) { showError('Daily new load failed. (' + e.message + ')'); }
}
async function archiveGames(year) {
    const q = `(collection:(internetarcade) OR collection:(consolelivingroom) OR collection:(softwarelibrary_msdos_games)) AND mediatype:(software)` + (year ? ` AND year:(${year})` : '');
    return await archiveSearch(q, 'downloads desc');
}
async function loadGamesPlay() {
    currentMode = 'gamesplay'; setTitle('🎮 Retro Games (Play in Browser)'); movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try { renderArchiveCards(await archiveGames(null), '🎮 PLAY', 'game'); }
    catch (e) { showError('Games load failed. (' + e.message + ')'); }
}
function playArchiveGame(identifier, title) {
    modalBody.innerHTML = `
        <h2 style="color:#e50914;margin-bottom:15px;">🎮 ${title}</h2>
        <iframe src="${ARCHIVE_EMBED}${identifier}" width="100%" height="480" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe>
        <div id="dlBox"></div>
        <p style="margin-top:15px;color:#aaa;font-size:.85rem;">Play in browser — emulated legally via Internet Archive.</p>`;
    modal.style.display = 'block';
    addGameFileDownloads(identifier, 'dlBox');
}
async function addGameFileDownloads(identifier, boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.innerHTML = '<p style="color:#888;font-size:.85rem;margin-top:10px;">Loading files...</p>';
    try {
        const res = await fetch(`https://archive.org/metadata/${identifier}`);
        const data = await res.json();
        const files = (data.files || []).filter(f => /\.(zip|exe|apk|jar|iso|chd|bin|tar|gz|7z)$/i.test(f.name)).slice(0, 6);
        if (!files.length) { box.innerHTML = '<p style="color:#888;font-size:.85rem;">No downloadable files.</p>'; return; }
        box.innerHTML = files.map(f => `<a class="dl-btn" style="display:block;margin:8px 0;text-align:center;" href="${ARCHIVE_DOWNLOAD}${identifier}/${encodeURIComponent(f.name)}" target="_blank" download>⬇️ ${f.name} (${formatSize(f.size)})</a>`).join('');
    } catch (e) { box.innerHTML = '<p style="color:#888;font-size:.85rem;">Files load failed.</p>'; }
}
function playArchiveMovie(identifier, title) {
    modalBody.innerHTML = `
        <h2 style="color:#e50914;margin-bottom:15px;">🎬 ${title}</h2>
        <iframe src="${ARCHIVE_EMBED}${identifier}" width="100%" height="420" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe>
        <div id="dlBox"></div>
        <p style="margin-top:15px;color:#aaa;font-size:.85rem;">Public Domain — streaming & downloading 100% legal via Internet Archive.</p>`;
    modal.style.display = 'block';
    addDownloadButton(identifier, 'dlBox');
}
async function addDownloadButton(identifier, boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.innerHTML = '<p style="color:#888;font-size:.85rem;margin-top:10px;">Loading download options...</p>';
    try {
        const res = await fetch(`https://archive.org/metadata/${identifier}`);
        const data = await res.json();
        const files = (data.files || []).filter(f => /\.(mp4|mkv|avi|mov|webm)$/i.test(f.name));
        if (!files.length) { box.innerHTML = '<p style="color:#888;font-size:.85rem;">No download files available.</p>'; return; }
        const prio = n => { n = n.toLowerCase(); if (/4k|2160p/.test(n)) return 5; if (/1080p|fhd/.test(n)) return 4; if (/720p|hd/.test(n)) return 3; if (/480p|sd/.test(n)) return 2; if (/360p/.test(n)) return 1; return 0; };
        files.sort((a, b) => prio(b.name) - prio(a.name));
        box.innerHTML = `<div class="quality-box"><h4>📽️ Select Quality to Download:</h4><div class="quality-list">` +
            files.map(f => `<a class="quality-option" href="${ARCHIVE_DOWNLOAD}${identifier}/${encodeURIComponent(f.name)}" target="_blank" download>
                <div><span class="quality-name">⬇️ ${guessResolution(f.name)}</span>
                <div style="font-size:.75rem;color:#aaa;margin-top:2px;">${f.name}</div></div>
                <span class="quality-size">${formatSize(f.size)}</span></a>`).join('') + `</div></div>`;
    } catch (e) { box.innerHTML = '<p style="color:#888;font-size:.85rem;">Download options failed.</p>'; }
}
async function findPublicDomainCopy(title) {
    try {
        const docs = await archiveSearch(`title:("${title.replace(/"/g, '')}") AND mediatype:(movies)`, 'downloads desc', 1);
        return docs.length ? docs[0] : null;
    } catch (e) { return null; }
}

// ===== GitHub Open-Source Games =====
async function githubGameSearch(q, year) {
    let query = 'topic:game';
    if (year) query += ` created:${year}-01-01..${year}-12-31`;
    if (q) query += ` ${q}`;
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=24`);
    if (!res.ok) throw new Error('GitHub API ' + res.status);
    const data = await res.json();
    return data.items || [];
}
function renderGameCards(items) {
    movieContainer.innerHTML = '';
    if (!items.length) { movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;">No games found.</p>'; return; }
    items.forEach(repo => {
        const year = (repo.created_at || '').split('-')[0] || '—';
        const stars = repo.stargazers_count >= 1000 ? (repo.stargazers_count / 1000).toFixed(1) + 'k' : repo.stargazers_count;
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <span class="badge badge-year">${year}</span>
            <span class="badge badge-rating">★ ${stars}</span>
            <img src="${repo.owner.avatar_url}" alt="${repo.name}" loading="lazy">
            <div class="card-title">${repo.name}</div>`;
        card.addEventListener('click', () => showGameModal(repo));
        movieContainer.appendChild(card);
    });
}
function showGameModal(repo) {
    const q = encodeURIComponent(repo.name);
    modalBody.innerHTML = `
        <div class="detail-header">
            <img src="${repo.owner.avatar_url}" alt="">
            <div class="detail-info">
                <h2>${repo.full_name}</h2>
                <p><strong>⭐ Stars:</strong> ${repo.stargazers_count.toLocaleString()}</p>
                <p><strong>📅 Created:</strong> ${(repo.created_at || '').split('T')[0]}</p>
                <p><strong>🏷️ Topics:</strong> ${(repo.topics || []).slice(0, 8).join(', ') || '—'}</p>
                <p><strong>📝 Description:</strong> ${repo.description || 'No description.'}</p>
            </div>
        </div>
        ${repo.homepage ? `<a class="official-btn" href="${repo.homepage}" target="_blank">🎮 Play / Project Page</a>` : ''}
        <div style="margin-top:12px;"><a class="dl-btn" href="https://api.github.com/repos/${repo.full_name}/zipball" target="_blank" download>⬇️ Download Game (ZIP) — Free & Legal</a></div>
        <h4 style="margin-top:18px;color:#e50914;">🛒 මේ game එක තියෙනවා නම් Official Stores වල direct links:</h4>
        <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;">
            <a class="official-btn" style="background:#1b2838;margin:0;" href="https://store.steampowered.com/search/?term=${q}" target="_blank">🛒 Steam</a>
            <a class="official-btn" style="background:#fa5c5c;margin:0;" href="https://itch.io/search?q=${q}" target="_blank">🛒 itch.io</a>
            <a class="official-btn" style="background:#555;margin:0;" href="https://store.epicgames.com/en-US/search?q=${q}" target="_blank">🛒 Epic</a>
        </div>
        <p style="margin-top:12px;color:#aaa;font-size:.85rem;">Open Source game — free & legal (License: ${repo.license ? repo.license.spdx_id : 'see repo'}). Official stores වල direct links විතරයි — pirated mirrors (FitGirl වගේ) වලට links මම දෙන්නේ නැහැ.</p>`;
    modal.style.display = 'block';
}
async function loadOSSGames(year = null) {
    currentMode = 'gamesfree';
    setTitle(year ? `🎮 Free Open-Source Games (${year})` : '🎮 Free Open-Source Games (Download)');
    movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try { renderGameCards(await githubGameSearch('', year)); }
    catch (e) { showError('Games load failed. (' + e.message + ')'); }
}
async function searchOSSGames(q) {
    currentMode = 'gamesfree';
    setTitle(`🔍 Games Search: "${q}"`);
    movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try { renderGameCards(await githubGameSearch(q, null)); }
    catch (e) { showError('Game search failed. (' + e.message + ')'); }
}

// ===== 🌍 World Free Games Hub =====
function renderUnifiedGameCards(list) {
    movieContainer.innerHTML = '';
    if (!list.length) { movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;">No games found.</p>'; return; }
    list.forEach(g => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <span class="badge badge-year">${g.year || '—'}</span>
            <span class="badge badge-rating">${g.badge}</span>
            <img src="${g.img}" alt="${g.title}" loading="lazy">
            <div class="card-title">${g.title}</div>`;
        card.addEventListener('click', g.onClick);
        movieContainer.appendChild(card);
    });
}
function mergeGameResults(gh, ia, ghLimit = 12, iaLimit = 12) {
    const list = [];
    if (gh && gh.status === 'fulfilled') gh.value.slice(0, ghLimit).forEach(repo => list.push({
        img: repo.owner.avatar_url, title: repo.name, year: (repo.created_at || '').split('-')[0],
        badge: '★ ' + (repo.stargazers_count >= 1000 ? (repo.stargazers_count / 1000).toFixed(1) + 'k' : repo.stargazers_count),
        onClick: () => showGameModal(repo)
    }));
    if (ia && ia.status === 'fulfilled') ia.value.slice(0, iaLimit).forEach(doc => list.push({
        img: ARCHIVE_IMG + doc.identifier, title: doc.title || doc.identifier, year: doc.year,
        badge: '⬇️ IA', onClick: () => playArchiveGame(doc.identifier, doc.title || doc.identifier)
    }));
    return list;
}
async function loadWorldGames(year = null) {
    currentMode = 'gamesworld';
    setTitle(year ? `🌍 World Free Games (${year})` : '🌍 World Free Games Hub (All-in-One)');
    movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const [gh, ia] = await Promise.allSettled([githubGameSearch('', year), archiveGames(year)]);
    renderUnifiedGameCards(mergeGameResults(gh, ia));
}
async function searchWorldGames(q) {
    currentMode = 'gamesworld';
    setTitle(`🔍 World Games: "${q}"`);
    movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const [gh, ia] = await Promise.allSettled([
        githubGameSearch(q, null),
        archiveSearch(`title:("${q.replace(/"/g, '')}") AND mediatype:(software)`, 'downloads desc')
    ]);
    renderUnifiedGameCards(mergeGameResults(gh, ia));
}

// ===== 🛒 Official Free Game Stores =====
function loadGameStores(q = '') {
    currentMode = 'stores';
    setTitle(q ? `🛒 Free Game Stores — "${q}"` : '🛒 Official Free Game Stores');
    movieContainer.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    GAME_STORES.forEach(p => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <span class="badge badge-year">LEGAL</span>
            <span class="badge badge-rating">🛒 FREE</span>
            <img src="https://via.placeholder.com/500x750?text=${encodeURIComponent(p.name)}" alt="${p.name}">
            <div class="card-title">${p.name}</div>`;
        card.addEventListener('click', () => showStoreModal(p, q));
        movieContainer.appendChild(card);
    });
}
function showStoreModal(p, q) {
    const query = q || currentQuery || '';
    modalBody.innerHTML = `
        <h2 style="color:#e50914;margin-bottom:12px;">🛒 ${p.name}</h2>
        <p style="margin-bottom:15px;">${p.desc}</p>
        ${p.insite ? `<button class="official-btn" style="background:#27ae60;" id="inSiteBtn">🎮 Browse & Download INSIDE this site</button>` : ''}
        <a class="official-btn" href="${p.url(query)}" target="_blank">🔎 Open ${p.name}${query ? ` — "${query}"` : ''}</a>
        <p style="margin-top:15px;color:#888;font-size:.85rem;">In-site downloads තියෙන්නේ GitHub (open-source) + Internet Archive (freeware/PD) විතරයි. ✅</p>`;
    modal.style.display = 'block';
    const ib = document.getElementById('inSiteBtn');
    if (ib) ib.addEventListener('click', () => { modal.style.display = 'none'; loadWorldGames(); });
}

// ===== 🌐 Free Legal Platforms Hub =====
function loadPlatforms(q = '') {
    currentMode = 'platforms';
    setTitle(q ? `🌐 Free Legal Platforms — "${q}"` : '🌐 Free Legal Streaming Platforms');
    movieContainer.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    PLATFORMS.forEach(p => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <span class="badge badge-year">LEGAL</span>
            <span class="badge badge-rating">🌐 FREE</span>
            <img src="https://via.placeholder.com/500x750?text=${encodeURIComponent(p.name)}" alt="${p.name}">
            <div class="card-title">${p.name}</div>`;
        card.addEventListener('click', () => showPlatformModal(p, q));
        movieContainer.appendChild(card);
    });
}
function showPlatformModal(p, q) {
    const query = q || currentQuery || '';
    modalBody.innerHTML = `
        <h2 style="color:#e50914;margin-bottom:12px;">🌐 ${p.name}</h2>
        <p style="margin-bottom:15px;">${p.desc}</p>
        ${p.insite ? `<button class="official-btn" style="background:#27ae60;" id="inSiteBtn">🎬 Browse & Watch INSIDE this site</button>` : ''}
        <a class="official-btn" href="${p.url(query)}" target="_blank">🔎 Search "${query || '...'}" on ${p.name}</a>
        <p style="margin-top:15px;color:#888;font-size:.85rem;">In-site full watching තියෙන්නේ Internet Archive (Public Domain) විතරයි. ✅</p>`;
    modal.style.display = 'block';
    const ib = document.getElementById('inSiteBtn');
    if (ib) ib.addEventListener('click', () => { modal.style.display = 'none'; loadArchiveMovies(); });
}

// ===== Init =====
async function initGenres() {
    try {
        const data = await tmdbFetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`);
        (data.genres || []).forEach(g => {
            const b = document.createElement('button');
            b.className = 'sub-item'; b.dataset.genre = g.id; b.textContent = g.name;
            genreList.appendChild(b);
        });
    } catch (e) { console.error(e); }
}
function initYears() {
    for (let y = 2026; y >= 1970; y--) {
        const b = document.createElement('button');
        b.className = 'year-btn'; b.textContent = y;
        b.addEventListener('click', () => loadByYear(y));
        yearsGrid.appendChild(b);
    }
}

// ===== Events =====
menuBtn.addEventListener('click', () => sideMenu.classList.toggle('hidden'));
searchToggle.addEventListener('click', () => {
    searchBar.classList.toggle('hidden');
    if (!searchBar.classList.contains('hidden')) searchInput.focus();
});
searchBtn.addEventListener('click', searchAll);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchAll(); });

sideMenu.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    const a = t.dataset.action;
    if (a === 'movies') loadMovies('popular', 'All Movies');
    else if (a === 'tvseries') loadTVSeries();
    else if (a === 'anime') loadAnime();
    else if (a === 'cartoons') loadCartoonsPD();
    else if (a === 'gamesplay') loadGamesPlay();
    else if (a === 'gamesfree') loadOSSGames();
    else if (a === 'gamesworld') loadWorldGames();
    else if (a === 'stores') loadGameStores(currentQuery);
    else if (a === 'platforms') loadPlatforms(currentQuery);
    else if (a === 'today') loadToday();
    else if (a === 'daily') loadDailyNew();
    else if (a === 'free') loadArchiveMovies();
    else if (a === 'years') { yearsSection.scrollIntoView({ behavior: 'smooth' }); sideMenu.classList.add('hidden'); return; }
    else if (t.dataset.lang) loadByLang(t.dataset.lang, t.textContent.trim());
    else if (t.dataset.genre) loadByGenre(t.dataset.genre, t.textContent.trim());
    else return;
    sideMenu.classList.add('hidden');
});

closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

// ===== Start =====
initYears();
initGenres();
loadMovies('now_playing', 'Recently Added');
