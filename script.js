// TMDB API Key (v3)
const API_KEY = '79a56b2437bf3484d2a4828a818ce9fb';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// Internet Archive (Public Domain movies - 100% legal)
const ARCHIVE_SEARCH = 'https://archive.org/advancedsearch.php';
const ARCHIVE_IMG = 'https://archive.org/services/img/';
const ARCHIVE_EMBED = 'https://archive.org/embed/';

const movieContainer = document.getElementById('movieContainer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeBtn = document.querySelector('.close');
const tabButtons = document.querySelectorAll('.tab-btn');

// Error message එක පෙන්වීම
function showError(msg) {
    movieContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#e94560;padding:20px;">${msg}</p>`;
}

// TMDB fetch + හරි error එක අල්ලගැනීම
async function tmdbFetch(url) {
    const response = await fetch(url);
    if (!response.ok) {
        let msg = response.statusText;
        try {
            const err = await response.json();
            msg = err.status_message || msg;
        } catch (e) { /* ignore */ }
        throw new Error(`TMDB Error ${response.status}: ${msg}`);
    }
    return response.json();
}

// ---------- TMDB Movies ----------
async function loadMovies(category = 'popular') {
    movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Loading...</p>';
    try {
        const data = await tmdbFetch(`${BASE_URL}/movie/${category}?api_key=${API_KEY}&language=si-LK`);
        displayMovies(data.results || []);
    } catch (error) {
        showError('Data could not be retrieved. (' + error.message + ')');
    }
}

// චිත්‍රපට cards පෙන්වීම
function displayMovies(movies) {
    movieContainer.innerHTML = '';
    if (!movies || movies.length === 0) {
        movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;">No results found.</p>';
        return;
    }
    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="${movie.poster_path ? IMG_BASE + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image'}" alt="${movie.title}">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p class="rating">⭐ ${movie.vote_average.toFixed(1)} / 10</p>
            </div>
        `;
        card.addEventListener('click', () => showDetails(movie.id));
        movieContainer.appendChild(card);
    });
}

// චිත්‍රපටයක සම්පූර්ණ විස්තර (Modal එකේ)
async function showDetails(movieId) {
    try {
        const movie = await tmdbFetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=si-LK&append_to_response=credits,videos`);

        const trailer = (movie.videos && movie.videos.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube');
        const trailerHTML = trailer
            ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen style="margin-top:20px;border-radius:10px;"></iframe>`
            : '<p style="margin-top:20px;color:#888;">Trailer not available.</p>';

        const director = (movie.credits && movie.credits.crew || []).find(c => c.job === 'Director');

        // Public Domain copy එකක් තියෙනව ද කියලා බලන්න
        const pd = await findPublicDomainCopy(movie.title);
        const watchHTML = pd ? `
            <button id="watchBtn" style="margin-top:15px;padding:12px 25px;background:#27ae60;color:#fff;border:none;border-radius:25px;cursor:pointer;font-weight:bold;">🎬 Watch Free Here (Public Domain)</button>
            <div id="playerBox" style="display:none;margin-top:15px;">
                <iframe src="${ARCHIVE_EMBED}${pd.identifier}" width="100%" height="420" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe>
            </div>` : '';

        modalBody.innerHTML = `
            <div class="detail-header">
                <img src="${movie.poster_path ? IMG_BASE + movie.poster_path : ''}" alt="${movie.title}">
                <div class="detail-info">
                    <h2>${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : ''})</h2>
                    <p><strong>⭐ Rating:</strong> ${movie.vote_average.toFixed(1)} / 10 (${movie.vote_count} votes)</p>
                    <p><strong>⏱️ Runtime:</strong> ${movie.runtime} min</p>
                    <p><strong>🎭 Genres:</strong> ${(movie.genres || []).map(g => g.name).join(', ')}</p>
                    <p><strong>📝 Overview:</strong> ${movie.overview || 'No overview available.'}</p>
                    <p><strong>🎬 Director:</strong> ${director ? director.name : 'N/A'}</p>
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
        });
    } catch (error) {
        console.error(error);
    }
}

// සෙවීම
async function searchMovies() {
    const query = searchInput.value.trim();
    if (!query) return;
    movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Searching...</p>';
    try {
        const data = await tmdbFetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=si-LK`);
        displayMovies(data.results || []);
    } catch (error) {
        showError('Search failed. (' + error.message + ')');
    }
}

// ---------- Internet Archive (Public Domain Full Movies) ----------
async function loadArchiveMovies() {
    movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Loading free movies...</p>';
    try {
        const q = encodeURIComponent('collection:(feature_films) AND mediatype:(movies)');
        const url = `${ARCHIVE_SEARCH}?q=${q}&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&sort%5B%5D=downloads%20desc&rows=24&page=1&output=json`;
        const res = await fetch(url);
        const data = await res.json();
        const docs = (data.response && data.response.docs) || [];
        movieContainer.innerHTML = '';
        if (!docs.length) {
            movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;">No results found.</p>';
            return;
        }
        docs.forEach(doc => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.innerHTML = `
                <img src="${ARCHIVE_IMG}${doc.identifier}" alt="${doc.title || doc.identifier}">
                <div class="movie-info">
                    <h3>${doc.title || doc.identifier}</h3>
                    <p class="rating">🎁 Free • ${doc.year || 'N/A'}</p>
                </div>
            `;
            card.addEventListener('click', () => playArchiveMovie(doc.identifier, doc.title || doc.identifier));
            movieContainer.appendChild(card);
        });
    } catch (error) {
        showError('Free movies load failed. (' + error.message + ')');
    }
}

// Full movie player එක modal එකේ විවෘත කිරීම
function playArchiveMovie(identifier, title) {
    modalBody.innerHTML = `
        <h2 style="color:#e94560;margin-bottom:15px;">🎬 ${title}</h2>
        <iframe src="${ARCHIVE_EMBED}${identifier}" width="100%" height="420" frameborder="0" allowfullscreen style="border-radius:10px;"></iframe>
        <p style="margin-top:15px;color:#aaa;font-size:0.85rem;">This movie is in the Public Domain and is streamed legally & free via Internet Archive.</p>
    `;
    modal.style.display = 'block';
}

// TMDB title එකට Archive එකේ public domain copy එකක් තියෙනව ද?
async function findPublicDomainCopy(title) {
    try {
        const clean = title.replace(/"/g, '');
        const q = encodeURIComponent(`title:("${clean}") AND mediatype:(movies)`);
        const res = await fetch(`${ARCHIVE_SEARCH}?q=${q}&fl%5B%5D=identifier&fl%5B%5D=title&rows=1&output=json`);
        const data = await res.json();
        const docs = (data.response && data.response.docs) || [];
        return docs.length ? docs[0] : null;
    } catch (e) {
        return null;
    }
}

// ---------- Events ----------
searchBtn.addEventListener('click', searchMovies);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchMovies();
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.category;
        if (cat === 'free') loadArchiveMovies();
        else loadMovies(cat);
    });
});

// ආරම්යේදී
loadMovies('popular');
