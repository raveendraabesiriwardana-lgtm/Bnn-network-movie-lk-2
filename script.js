// ===== CONFIG =====
const API_KEY = '79a56b2437bf3484d2a4828a818ce9fb';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const ARCHIVE_SEARCH = 'https://archive.org/advancedsearch.php';
const ARCHIVE_IMG = 'https://archive.org/services/img/';
const ARCHIVE_EMBED = 'https://archive.org/embed/';
const ARCHIVE_DOWNLOAD = 'https://archive.org/download/';

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

// ===== Theme (Dark / Light) =====
function applyTheme(t) {
    if (t === 'light') {
        document.body.classList.add('light');
        if (themeToggle) themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('light');
        if (themeToggle) themeToggle.textContent = '🌙';
    }
}
applyTheme(localStorage.getItem('bnn-theme') || 'dark');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const next = document.body.classList.contains('light') ? 'dark' : 'light';
        localStorage.setItem('bnn-theme', next);
        applyTheme(next);
    });
}

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

// ===== Cards =====
function renderCards(items) {
    movieContainer.innerHTML = '';
    if (!items || !items.length) {
        movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;">No results found.</p>';
        return;
    }
    items.forEach(item => {
        const title = item.title || item.name || 'N/A';
        const date = item.release_date || item.first_air_date || '';
        const year = date ? date.split('-')[0] : '—';
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <span class="badge badge-year">${year}</span>
            <span class="badge badge-rating">★ ${(item.vote_average || 0).toFixed(1)}</span>
            <img src="${item.poster_path ? IMG_BASE + item.poster_path : 'https://via.placeholder.com/500x750?text=BNN+MOVIE+LK'}" alt="${title}" loading="lazy">
            <div class="card-title">${title}</div>
        `;
        card.addEventListener('click', () => showDetails(item.id, item.media_type || 'movie'));
        movieContainer.appendChild(card);
    });
}

// ===== Loaders =====
async function loadMovies(category = 'now_playing', title = 'Recently Added') {
    setTitle(title);
    movieContainer.innerHTML = LOADING;
    try {
        const data = await tmdbFetch(`${BASE_URL}/movie/${category}?api_key=${API_KEY}&language=si-LK`);
        renderCards((data.results || []).map(x => ({ ...x, media_type: 'movie' })));
    } catch (e) { showError('Data could not be retrieved. (' + e.message + ')'); }
}

async function loadTV() {
    setTitle('TV Shows');
    movieContainer.innerHTML = LOADING;
    try {
        const data = await tmdbFetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=si-LK`);
        renderCards((data.results || []).map(x => ({ ...x, media_type: 'tv' })));
    } catch (e) { showError('Data could not be retrieved. (' + e.message + ')'); }
}

async function loadByLang(lang, label) {
    setTitle('Language: ' + label);
    movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const data = await tmdbFetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=${lang}&sort_by=popularity.desc&language=si-LK`);
        renderCards((data.results || []).map(x => ({ ...x, media_type: 'movie' })));
    } catch (e) { showError('Data could not be retrieved. (' + e.message + ')'); }
}

async function loadByGenre(id, label) {
    setTitle('Genre: ' + label);
    movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const data = await tmdbFetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${id}&sort_by=popularity.desc&language=si-LK`);
        renderCards((data.results || []).map(x => ({ ...x, media_type: 'movie' })));
    } catch (e) { showError('Data could not be retrieved. (' + e.message + ')'); }
}

async function loadByYear(y) {
    setTitle('Year: ' + y);
    movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const data = await tmdbFetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=${y}&sort_by=popularity.desc&language=si-LK`);
        renderCards((data.results || []).map(x => ({ ...x, media_type: 'movie' })));
    } catch (e) { showError('Data could not be retrieved. (' + e.message + ')'); }
}

async function searchAll() {
    const q = searchInput.value.trim();
    if (!q) return;
    setTitle(`Search: "${q}"`);
    movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const [m, t] = await Promise.all([
            tmdbFetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(q)}&language=si-LK`),
            tmdbFetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(q)}&language=si-LK`)
        ]);
        renderCards([
            ...(m.results || []).map(x => ({ ...x, media_type: 'movie' })),
            ...(t.results || []).map(x => ({ ...x, media_type: 'tv' }))
        ]);
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
        const trailerHTML = trailer
            ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen style="margin-top:20px;border-radius:10px;"></iframe>`
            : '<p style="margin-top:20px;color:#888;">Trailer not available.</p>';

        const director = type === 'movie'
            ? ((item.credits && item.credits.crew || []).find(c => c.job === 'Director') || {}).name
            : (item.created_by && item.created_by[0] ? item.created_by[0].name : null);

        const runtime = type === 'movie'
            ? (item.runtime ? item.runtime + ' min' : 'N/A')
            : (item.number_of_seasons ? item.number_of_seasons + ' Season(s)' : 'N/A');

        const pd = type === 'movie' ? await findPublicDomainCopy(title) : null;
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
                    <p><strong>⏱️ ${type === 'movie' ? 'Runtime' : 'Seasons'}:</strong> ${runtime}</p>
                    <p><strong>🎭 Genres:</strong> ${(item.genres || []).map(g => g.name).join(', ')}</p>
                    <p><strong>📝 Overview:</strong> ${item.overview || 'No overview available.'}</p>
                    <p><strong>🎬 ${type === 'movie' ? 'Director' : 'Creator'}:</strong> ${director || 'N/A'}</p>
                </div>
            </div>
            ${watchHTML}
            ${trailerHTML}
        `;
        modal.style.display = 'block';

        const wb = document.getElementById('watchBtn');
        if (wb) wb.addEventListener('click', () => {
            document.getElementById('playerBox').style.display = 'block';
            wb.style.display = 'none';
            addDownloadButton(pd.identifier, 'dlBox2');
        });
    } catch (e) { console.error(e); }
}

// ===== Internet Archive (Public Domain) + Download =====
async function loadArchiveMovies() {
    setTitle('🎁 Free Movies (Public Domain)');
    movieContainer.innerHTML = LOADING;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const q = encodeURIComponent('collection:(feature_films) AND mediatype:(movies)');
        const url = `${ARCHIVE_SEARCH}?q=${q}&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&sort%5B%5D=downloads%20desc&rows=24&page=1&output=json`;
        const res = await fetch(url);
        const data = await res.json();
        const docs = (data.response && data.response.docs) || [];
        movieContainer.innerHTML = '';
        if (!docs.length) { movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;">No results found.</p>'; return; }
        docs.forEach(doc => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.innerHTML = `
                <span class="badge badge-year">${doc.year || '—'}</span>
                <span class="badge badge-rating">🎁 FREE</span>
                <img src="${ARCHIVE_IMG}${doc.identifier}" alt="${doc.title || doc.identifier}" loading="lazy">
                <div class="card-title">${doc.title || doc.identifier}</div>
            `;
            card.addEventListener('click', () => playArchiveMovie(doc.identifier, doc.title || doc.identifier));
            movieContainer.appendChild(card);
        });
    } catch (e) { showError('Free movies load failed. (' + e.message + ')'); }
}

function playArchiveMovie(identifier, title) {
    modalBody.innerHTML = `
        <h2 style="color:#e50914;margin-bottom:15px;">🎬 ${title}</h2>
        <iframe src="${ARCHIVE_EMBED}${identifier}" width="100%" height="420" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe>
        <div id="dlBox"></div>
        <p style="margin-top:15px;color:#aaa;font-size:.85rem;">This movie is in the Public Domain — streaming & downloading are 100% legal via Internet Archive.</p>
    `;
    modal.style.display = 'block';
    addDownloadButton(identifier, 'dlBox');
}

async function addDownloadButton(identifier, boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.innerHTML = '<p style="color:#888;font-size:.85rem;margin-top:10px;">Preparing download link...</p>';
    try {
        const res = await fetch(`https://archive.org/metadata/${identifier}`);
        const data = await res.json();
        const files = (data.files || []).filter(f => /\.(mp4|mkv|avi|mov)$/i.test(f.name));
        if (!files.length) { box.innerHTML = '<p style="color:#888;font-size:.85rem;">Download file not available.</p>'; return; }
        const file = files.find(f => /\.mp4$/i.test(f.name)) || files[0];
        const size = file.size ? (file.size / 1048576).toFixed(0) + ' MB' : 'Archive';
        const url = ARCHIVE_DOWNLOAD + identifier + '/' + encodeURIComponent(file.name);
        box.innerHTML = `<a class="dl-btn" href="${url}" target="_blank" download>⬇️ Download Video (${size})</a>`;
    } catch (e) {
        box.innerHTML = '<p style="color:#888;font-size:.85rem;">Download link failed.</p>';
    }
}

async function findPublicDomainCopy(title) {
    try {
        const clean = title.replace(/"/g, '');
        const q = encodeURIComponent(`title:("${clean}") AND mediatype:(movies)`);
        const res = await fetch(`${ARCHIVE_SEARCH}?q=${q}&fl%5B%5D=identifier&fl%5B%5D=title&rows=1&output=json`);
        const data = await res.json();
        const docs = (data.response && data.response.docs) || [];
        return docs.length ? docs[0] : null;
    } catch (e) { return null; }
}

// ===== Init: Genres & Years =====
async function initGenres() {
    try {
        const data = await tmdbFetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`);
        (data.genres || []).forEach(g => {
            const b = document.createElement('button');
            b.className = 'sub-item';
            b.dataset.genre = g.id;
            b.textContent = g.name;
            genreList.appendChild(b);
        });
    } catch (e) { console.error(e); }
}

function initYears() {
    for (let y = 2026; y >= 1970; y--) {
        const b = document.createElement('button');
        b.className = 'year-btn';
        b.textContent = y;
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
    if (t.dataset.action === 'movies') loadMovies('popular', 'All Movies');
    else if (t.dataset.action === 'tv') loadTV();
    else if (t.dataset.action === 'free') loadArchiveMovies();
    else if (t.dataset.action === 'years') { yearsSection.scrollIntoView({ behavior: 'smooth' }); sideMenu.classList.add('hidden'); return; }
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
