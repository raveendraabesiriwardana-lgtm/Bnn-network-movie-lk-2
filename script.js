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
    { name: 'Internet Archive', desc: 'Public Domain movies & TV — මේ site එකේම බලන්න + download', insite: true, url: q => `https://archive.org/search?query=${encodeURIComponent(q)}` },
    { name: 'YouTube', desc: 'Official channels වල free legal full movies', url: q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' full movie')}` },
    { name: 'Tubi', desc: 'Free ad-supported movies & TV (100% legal)', url: q => `https://tubi.tv/search/${encodeURIComponent(q)}` },
    { name: 'Pluto TV', desc: 'Free live TV channels & movies (legal)', url: q => `https://pluto.tv/us/search/${encodeURIComponent(q)}` },
    { name: 'Plex', desc: 'Free movies & shows (legal)', url: q => `https://watch.plex.tv/search?q=${encodeURIComponent(q)}` },
    { name: 'Crunchyroll', desc: 'Anime — free tier එකෙන් නීත්‍යානුකූලව බලන්න', url: q => `https://www.crunchyroll.com/search?q=${encodeURIComponent(q)}` },
    { name: 'RetroCrush', desc: 'Classic anime free (legal)', url: q => `https://www.retrocrush.tv/search?q=${encodeURIComponent(q)}` },
    { name: 'Kanopy', desc: 'Library card එකක් තියෙනවා නම් සම්පූර්ණයෙන්ම free', url: q => `https://www.kanopy.com/search/?query=${encodeURIComponent(q)}` },
    { name: 'Wikimedia Commons', desc: 'CC-licensed films & clips (legal)', url: q => `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(q)}` }
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
    const labels = { movie: 'Movies', tv: 'TV Series', anime: 'Anime', free: 'Free Movies', daily: 'Free Additions', today: 'Movies', platforms: 'Platforms' };
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

// ===== Internet Archive =====
async function archiveSearch(q, sort, rows = 24, year = null) {
    let query = q;
    let sortBy = sort || 'downloads desc';
    if (year) { query += ` AND year:(${year})`; sortBy = 'addeddate desc'; }
    const url = `${ARCHIVE_SEARCH}?q=${encodeURIComponent(query)}&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&fl%5B%5D=addeddate&sort%5B%5D=${encodeURIComponent(sortBy)}&rows=${rows}&page=1&output=json`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.response && data.response.docs) || [];
}

// ===== 🎬 PD Player + EPISODE-LEVEL WATCH & DOWNLOAD =====
async function showPdEpisodes(identifier, boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.innerHTML = '<p style="color:#888;">Loading video files / episodes...</p>';
    try {
        const res = await fetch(`https://archive.org/metadata/${identifier}`);
        const data = await res.json();
        const files = (data.files || []).filter(f => /\.(mp4|mkv|avi|mov|webm|ogv)$/i.test(f.name));
        if (!files.length) { box.innerHTML = `<iframe src="${ARCHIVE_EMBED}${identifier}" width="100%" height="420" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe>`; return; }
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        box.innerHTML = `
            <iframe src="${ARCHIVE_EMBED}${identifier}" width="100%" height="380" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe>
            <p style="margin:12px 0 8px;color:#aaa;font-size:.85rem;">📺 ${files.length} video file(s) — එක එක වෙන වෙනම Watch / Download කරන්න:</p>
            <div class="cartoon-ep-list">
                ${files.map((f, i) => `
                    <div class="cartoon-ep">
                        <span class="cartoon-ep-name">${(i + 1).toString().padStart(2, '0')}. ${f.name}${f.size ? ' (' + formatSize(f.size) + ')' : ''}</span>
                        <div class="cartoon-ep-actions">
                            <a class="ep-btn-small ep-btn-watch" href="${ARCHIVE_EMBED}${identifier}/${encodeURIComponent(f.name)}" target="_blank">▶ Watch</a>
                            <a class="ep-btn-small ep-btn-dl" href="${ARCHIVE_DOWNLOAD}${identifier}/${encodeURIComponent(f.name)}" target="_blank" download>⬇ Download</a>
                        </div>
                    </div>`).join('')}
            </div>`;
    } catch (e) { box.innerHTML = '<p style="color:#888;">Files load failed.</p>'; }
}

function playArchiveMovie(identifier, title) {
    modalBody.innerHTML = `
        <h2 style="color:#e50914;margin-bottom:15px;">🎬 ${title}</h2>
        <div id="pdBox"></div>
        <p style="margin-top:15px;color:#aaa;font-size:.85rem;">Public Domain — streaming & downloading 100% legal via Internet Archive.</p>`;
    modal.style.display = 'block';
    showPdEpisodes(identifier, 'pdBox');
}

function renderArchiveCards(docs, badge) {
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
        card.addEventListener('click', () => playArchiveMovie(doc.identifier, doc.title || doc.identifier));
        movieContainer.appendChild(card);
    });
}

async function loadArchiveMovies() {
    currentMode = 'free'; setTitle('🎁 Free Movies (Watch + Download)'); movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try { renderArchiveCards(await archiveSearch('collection:(feature_films) AND mediatype:(movies)'), '🎁 FREE'); }
    catch (e) { showError('Free movies load failed. (' + e.message + ')'); }
}
async function loadDailyNew() {
    currentMode = 'daily'; setTitle('🆕 New Free Additions (Updated Daily)'); movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try { renderArchiveCards(await archiveSearch('collection:(feature_films) AND mediatype:(movies)', 'addeddate desc'), '🆕 NEW'); }
    catch (e) { showError('Daily new load failed. (' + e.message + ')'); }
}
async function findPublicDomainCopy(title) {
    try {
        const docs = await archiveSearch(`title:("${title.replace(/"/g, '')}") AND mediatype:(movies)`);
        return docs.length ? docs[0] : null;
    } catch (e) { return null; }
}

// ===== 🌐 Platforms Hub =====
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
        <a class="official-btn" href="${p.url(query)}" target="_blank">🔎 Search "${query || '...'}" on ${p.name}</a>`;
    modal.style.display = 'block';
    const ib = document.getElementById('inSiteBtn');
    if (ib) ib.addEventListener('click', () => { modal.style.display = 'none'; loadArchiveMovies(); });
}

// ===== Year filter =====
async function loadByYear(y) {
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
        } else if (currentMode === 'free') {
            renderArchiveCards(await archiveSearch('collection:(feature_films) AND mediatype:(movies)', null, 24, y), '🎁 FREE');
        } else if (currentMode === 'daily') {
            renderArchiveCards(await archiveSearch('collection:(feature_films) AND mediatype:(movies)', 'addeddate desc', 24, y), '🆕 NEW');
        } else {
            const data = await tmdbFetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=${y}&sort_by=popularity.desc&language=si-LK`);
            renderCards((data.results || []).map(x => ({ ...x, media_type: 'movie' })));
        }
    } catch (e) { showError('Year load failed. (' + e.message + ')'); }
}

// ===== Search =====
async function searchAll() {
    const q = searchInput.value.trim();
    if (!q) return;
    currentQuery = q;
    if (currentMode === 'platforms') { loadPlatforms(q); return; }
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

// ===== Details Modal (Movies / TV / Anime) =====
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
            </div>` : '';
        const pd = await findPublicDomainCopy(title);
        const watchHTML = pd ? `
            <button id="watchBtn" style="margin-top:15px;padding:12px 25px;background:#27ae60;color:#fff;border:none;border-radius:25px;cursor:pointer;font-weight:bold;">🎬 Watch / Download Here (Free • Legal)</button>
            <div id="playerBox" style="display:none;margin-top:15px;"><div id="pdEpisodes"></div></div>` : '';
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
            ${officialHTML}${watchHTML}${episodesHTML}${trailerHTML}
            ${pd ? '' : '<p style="margin-top:15px;color:#888;font-size:.85rem;">මේ title එකේ free legal copy එකක් Archive එකේ නැහැ — බලන්න 🌐 Platforms section එක හෝ Official Website button එක භාවිතා කරන්න.</p>'}`;
        modal.style.display = 'block';
        const wb = document.getElementById('watchBtn');
        if (wb) wb.addEventListener('click', () => {
            document.getElementById('playerBox').style.display = 'block';
            wb.style.display = 'none';
            showPdEpisodes(pd.identifier, 'pdEpisodes');
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
