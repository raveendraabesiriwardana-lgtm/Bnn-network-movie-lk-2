// TMDB API Key (v3)
const API_KEY = '79a56b2437bf3484d2a4828a818ce9fb';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

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

// කාණ්ඩය අනුව movies load කිරීම
async function loadMovies(category = 'popular') {
    movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Loading...</p>';
    try {
        const data = await tmdbFetch(`${BASE_URL}/movie/${category}?api_key=${API_KEY}&language=si-LK`);
        displayMovies(data.results || []);
    } catch (error) {
        showError('Data could not be retrieved. (' + error.message + ')');
        console.error(error);
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
            ${trailerHTML}
        `;
        modal.style.display = 'block';
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
        console.error(error);
    }
}

// Events
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
        loadMovies(btn.dataset.category);
    });
});

// ආරම්භයේදී
loadMovies('popular');
