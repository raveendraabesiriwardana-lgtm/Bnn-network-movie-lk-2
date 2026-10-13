// ⚠️ මෙහි ඔබේ TMDB API Key එක දමන්න
const API_KEY = 'YOUR_API_KEY_HERE';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const IMG_BACKDROP = 'https://image.tmdb.org/t/p/w1280';

const movieContainer = document.getElementById('movieContainer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeBtn = document.querySelector('.close');
const tabButtons = document.querySelectorAll('.tab-btn');

// කාණ්ඩය අනුව movies load කිරීම
async function loadMovies(category = 'popular') {
    movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Loading...</p>';
    try {
        const response = await fetch(`${BASE_URL}/movie/${category}?api_key=${API_KEY}&language=si-LK`);
        const data = await response.json();
        displayMovies(data.results);
    } catch (error) {
        movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#e94560;">දත්ත ලබා ගැනීමට නොහැකි විය.</p>';
        console.error(error);
    }
}

// චිත්‍රපට පෙන්වීම
function displayMovies(movies) {
    movieContainer.innerHTML = '';
    if (movies.length === 0) {
        movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;">ප්‍රතිඵල හමු නොවීය.</p>';
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

// චිත්‍රපටයක සම්පූර්ණ විස්තර පෙන්වීම
async function showDetails(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=si-LK&append_to_response=credits,videos`);
        const movie = await response.json();
        
        const trailer = movie.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        const trailerHTML = trailer 
            ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen style="margin-top:20px;border-radius:10px;"></iframe>` 
            : '<p style="margin-top:20px;color:#888;">Trailer එකක් ලබා ගත නොහැක.</p>';
        
        modalBody.innerHTML = `
            <div class="detail-header">
                <img src="${movie.poster_path ? IMG_BASE + movie.poster_path : ''}" alt="${movie.title}">
                <div class="detail-info">
                    <h2>${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : ''})</h2>
                    <p><strong>⭐ ශ්‍රේණිය:</strong> ${movie.vote_average.toFixed(1)} / 10 (${movie.vote_count} ඡන්ද)</p>
                    <p><strong>⏱️ කාලය:</strong> ${movie.runtime} මිනිත්තු</p>
                    <p><strong>🎭 ප්‍රභේද:</strong> ${movie.genres.map(g => g.name).join(', ')}</p>
                    <p><strong>📝 විස්තරය:</strong> ${movie.overview || 'විස්තරයක් ලබා ගත නොහැක.'}</p>
                    <p><strong>🎬 අධ්‍යක්ෂක:</strong> ${movie.credits.crew.find(c => c.job === 'Director')?.name || 'N/A'}</p>
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
    
    movieContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;">සොයමින්...</p>';
    try {
        const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=si-LK`);
        const data = await response.json();
        displayMovies(data.results);
    } catch (error) {
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
