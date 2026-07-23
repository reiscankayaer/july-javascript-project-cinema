import {
  tmdbApi,
  getTrendingMovies,
  getTrendingWeek,
  getNewMovies,
  getMovieDetails,
  getMovieVideos,
} from "./tdb-api.js";

import { createCardHtml } from "./partials/movie-card.js";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";
let genreMap = {};

const loader = document.getElementById("global-loader");
tmdbApi.interceptors.request.use((config) => {
  if (loader) loader.classList.remove("is-hidden");
  return config;
});
tmdbApi.interceptors.response.use(
  (response) => {
    if (loader) loader.classList.add("is-hidden");
    return response;
  },
  (error) => {
    if (loader) loader.classList.add("is-hidden");
    return Promise.reject(error);
  },
);

function getLibrary() {
  return JSON.parse(localStorage.getItem("cinemania_library")) || [];
}
function saveToLibrary(movie) {
  const lib = getLibrary();
  lib.push(movie);
  localStorage.setItem("cinemania_library", JSON.stringify(lib));
}
function removeFromLibrary(movieId) {
  let lib = getLibrary();
  lib = lib.filter((m) => m.id !== movieId);
  localStorage.setItem("cinemania_library", JSON.stringify(lib));
}
function isInLibrary(movieId) {
  return getLibrary().some((m) => m.id === movieId);
}

function generateStars(vote_average) {
  const rating = Math.round((vote_average || 0) / 2);
  let starsHtml = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) starsHtml += "★";
    else starsHtml += '<span class="star-empty">★</span>';
  }
  return starsHtml;
}

document.addEventListener("DOMContentLoaded", async () => {
  await fetchGenreMap();
  initTheme();
  initMobileMenu();
  initTeamModal();
  initScrollUp();
  initModal();

  initHeroSection();
  getWeeklyTrendingMovies();
  getUpcomingMovies();
});

async function fetchGenreMap() {
  try {
    const res = await tmdbApi.get("/genre/movie/list");
    res.data.genres.forEach((g) => {
      genreMap[g.id] = g.name;
    });
  } catch (e) {
    console.error("Türler çekilemedi:", e);
  }
}

function initTheme() {
  const themeToggle = document.getElementById("theme-toggle-checkbox");
  if (!themeToggle) return;
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-theme");
    themeToggle.checked = true;
  }
  themeToggle.addEventListener("change", (e) => {
    if (e.target.checked) {
      document.body.classList.add("light-theme");
      localStorage.setItem("theme", "light");
    } else {
      document.body.classList.remove("light-theme");
      localStorage.setItem("theme", "dark");
    }
  });
}

function initMobileMenu() {
  const openBtn = document.getElementById("mobile-menu-open");
  const closeBtn = document.getElementById("mobile-menu-close");
  const menu = document.getElementById("mobile-menu");
  if (!openBtn || !closeBtn || !menu) return;

  openBtn.addEventListener("click", () => menu.classList.remove("is-hidden"));
  closeBtn.addEventListener("click", () => menu.classList.add("is-hidden"));
  menu.addEventListener("click", (e) => {
    if (e.target === menu) menu.classList.add("is-hidden");
  });
}

function initScrollUp() {
  const btn = document.getElementById("scroll-up-btn");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) btn.classList.remove("is-hidden");
    else btn.classList.add("is-hidden");
  });
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
}

async function initHeroSection() {
  const heroSection = document.getElementById("hero-section");
  if (!heroSection) return;
  try {
    const movies = await getTrendingMovies();
    if (movies.length === 0) return;
    const movie = movies[Math.floor(Math.random() * movies.length)];

    const titleEl = document.getElementById("hero-title");
    const overviewEl = document.getElementById("hero-overview");
    const ratingEl = document.getElementById("hero-rating");

    if (titleEl) titleEl.textContent = movie.title || movie.name;
    if (overviewEl) overviewEl.textContent = movie.overview || "";
    if (ratingEl)
      ratingEl.innerHTML = `<div class="movie-stars" style="font-size:20px; margin-bottom:10px;">${generateStars(movie.vote_average)}</div>`;

    if (movie.backdrop_path) {
      heroSection.style.backgroundImage = `linear-gradient(to right, rgba(10, 10, 10, 0.9) 20%, rgba(10, 10, 10, 0.4) 100%), url('${IMAGE_BASE_URL}${movie.backdrop_path}')`;
    }

    document
      .getElementById("hero-trailer-btn")
      ?.setAttribute("data-id", movie.id);
    document.getElementById("hero-more-btn")?.setAttribute("data-id", movie.id);
    document.getElementById("hero-more-btn")?.classList.remove("is-hidden");
  } catch (e) {
    console.error("Hero verisi çekilemedi:", e);
  }
}

async function getWeeklyTrendingMovies() {
  const gallery = document.getElementById("movie-gallery");
  if (!gallery) return;
  try {
    const movies = await getTrendingWeek();
    gallery.innerHTML = movies
      .slice(0, 3)
      .map((m) => createCardHtml(m, genreMap))
      .join("");
  } catch (e) {
    console.error("Haftalık trendler çekilemedi:", e);
  }
}

async function getUpcomingMovies() {
  const container = document.getElementById("upcoming-content");
  if (!container) return;
  try {
    const movies = await getNewMovies();

    if (movies.length === 0) return;

    const randomMovie = movies[Math.floor(Math.random() * movies.length)];
    const m = await getMovieDetails(randomMovie.id);

    const isSaved = isInLibrary(m.id);
    const btnText = isSaved ? "Remove from my library" : "Add to my library";
    const imageUrl = m.backdrop_path
      ? `https://image.tmdb.org/t/p/original${m.backdrop_path}`
      : "https://via.placeholder.com/800x400";

    container.innerHTML = `
      <img src="${imageUrl}" alt="${m.title}" class="upcoming-poster" style="object-fit: cover;" />
      <div class="upcoming-info">
        <h3 class="upcoming-title">${m.title}</h3>
        <div class="upcoming-stats">
          <p>Release date <span>${m.release_date}</span></p>
          <p>Vote / Votes <span><span class="highlight">${m.vote_average.toFixed(1)}</span> / ${m.vote_count}</span></p>
          <p>Popularity <span>${m.popularity.toFixed(1)}</span></p>
          <p>Genre <span>${m.genres.map((g) => g.name).join(", ")}</span></p>
        </div>
        <p class="upcoming-about-title">ABOUT</p>
        <p class="upcoming-about">${m.overview || "Bu film için özet bulunmuyor."}</p>
        <button class="btn-watch-trailer" id="upcoming-library-btn" style="margin-top:20px;">${btnText}</button>
      </div>
    `;

    const libBtn = document.getElementById("upcoming-library-btn");
    libBtn.addEventListener("click", () => {
      if (isInLibrary(m.id)) {
        removeFromLibrary(m.id);
        libBtn.textContent = "Add to my library";
      } else {
        saveToLibrary(m);
        libBtn.textContent = "Remove from my library";
      }
    });
  } catch (e) {
    console.error("Upcoming filmi çekilemedi:", e);
  }
}

function initModal() {
  const backdrop = document.getElementById("modal-backdrop");
  const content = document.getElementById("modal-content");
  const closeBtn = document.getElementById("modal-close-btn");
  if (!backdrop || !content) return;

  closeBtn?.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !backdrop.classList.contains("is-hidden"))
      closeModal();
  });

  function closeModal() {
    backdrop.classList.add("is-hidden");
    content.innerHTML = "";
  }

  async function openModal(movieId, type) {
    try {
      const m = await getMovieDetails(movieId);

      if (type === "trailer") {
        const videos = await getMovieVideos(movieId);
        const tr = videos.find(
          (v) => v.site === "YouTube" && v.type === "Trailer",
        );

        if (tr) {
          content.innerHTML = `
            <div style="width:100%; max-width:800px; margin:0 auto; display:flex; flex-direction:column; align-items:center;">
              <h2 style="margin-bottom:20px; color:white;">${m.title} - Official Trailer</h2>
              <iframe width="100%" height="450" src="https://www.youtube.com/embed/${tr.key}" frameborder="0" allowfullscreen style="border-radius:8px;"></iframe>
            </div>`;
        } else {
          content.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:40px; background-color:#111; border-radius:16px; max-width:600px; margin:0 auto; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
              <div style="flex:1; padding-right:20px;">
                <h2 style="font-size:32px; color:white; margin-bottom:15px;">OOPS...</h2>
                <p style="color:#b8b8b8; font-size:18px; line-height:1.4;">We are very sorry!<br>But we couldn't find the trailer.</p>
              </div>
              <div style="font-size:100px;">🍿</div>
            </div>`;
        }
      } else {
        const poster = m.poster_path
          ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
          : "https://via.placeholder.com/250x375";
        const isSaved = isInLibrary(m.id);
        const btnText = isSaved
          ? "Remove from my library"
          : "Add to my library";

        content.innerHTML = `
          <div class="modal-grid">
            <img src="${poster}" alt="${m.title}" class="modal-poster" />
            <div class="modal-info">
              <h2>${m.title}</h2>
              <p><strong>Puan:</strong> <span class="modal-info-stat">${m.vote_average.toFixed(1)}</span> / 10</p>
              <p><strong>Popülarite:</strong> <span class="modal-info-stat">${m.popularity.toFixed(1)}</span></p>
              <p><strong>Tür:</strong> ${m.genres.map((g) => g.name).join(", ")}</p>
              <p style="margin-top:20px;"><strong>Özet:</strong></p>
              <p>${m.overview || "Bu film için özet bulunmuyor."}</p>
              <button class="btn-watch-trailer" id="modal-library-btn" style="margin-top:20px;">${btnText}</button>
            </div>
          </div>
        `;

        const libBtn = document.getElementById("modal-library-btn");
        libBtn.addEventListener("click", () => {
          if (isInLibrary(m.id)) {
            removeFromLibrary(m.id);
            libBtn.textContent = "Add to my library";
          } else {
            saveToLibrary(m);
            libBtn.textContent = "Remove from my library";
          }
        });
      }
      backdrop.classList.remove("is-hidden");
    } catch (e) {
      console.error("Modal verisi çekilemedi", e);
    }
  }

  document.addEventListener("click", (e) => {
    const card = e.target.closest(".movie-card");
    const trBtn = e.target.closest(
      ".btn-watch-trailer:not(#modal-library-btn):not(#hero-more-btn):not(#upcoming-library-btn)",
    );
    const moreBtn = e.target.closest("#hero-more-btn");

    if (card) openModal(Number(card.getAttribute("data-id")), "details");
    else if (trBtn && trBtn.hasAttribute("data-id"))
      openModal(Number(trBtn.getAttribute("data-id")), "trailer");
    else if (moreBtn && moreBtn.hasAttribute("data-id"))
      openModal(Number(moreBtn.getAttribute("data-id")), "details");
  });
}

function initTeamModal() {
  const backdrop = document.getElementById("team-modal-backdrop");
  const openBtn = document.getElementById("team-modal-open");
  const closeBtn = document.getElementById("team-modal-close-btn");
  if (!backdrop || !openBtn) return;

  openBtn.addEventListener("click", () =>
    backdrop.classList.remove("is-hidden"),
  );
  closeBtn?.addEventListener("click", () =>
    backdrop.classList.add("is-hidden"),
  );

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.classList.add("is-hidden");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !backdrop.classList.contains("is-hidden"))
      backdrop.classList.add("is-hidden");
  });
}
