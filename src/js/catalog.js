import { searchMoviesApi, getTrendingMovies } from './tdb-api';

document.addEventListener('DOMContentLoaded', () => {
  // ELEMENTLERİN SEÇİLMESİ
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearBtn');
  const yearSelectWrapper = document.getElementById('yearSelectWrapper');
  const searchForm = document.getElementById('searchForm');
  const yearMenu = document.getElementById('yearMenu');
  const customSelectTrigger = document.querySelector('.custom-select__trigger');
  const customSelectLabel = document.querySelector('.custom-select__label');
  const moviesListBlock = document.querySelector('.catalog-movies-list');

  let activeIndex = 0;
  let options = [];

  // ==========================================================================
  // 🔥 YENİ ENTEGRE EDİLEN BÖLÜM: SAYFA İLK AÇILDIĞINDA TREND FİLMLERİ GETİRME
  // ==========================================================================
  async function sayfaBaslangiciniYukle() {
    try {
      if (moviesListBlock) {
        moviesListBlock.innerHTML =
          '<div class="catalog-loading">Loading trending movies...</div>';
      }

      // API'den günlük trend filmleri çekiyoruz
      const trendFilmler = await getTrendingMovies();

      if (!trendFilmler || trendFilmler.length === 0) {
        moviesListBlock.innerHTML =
          '<div class="catalog-error-message"><p>No trending movies found at the moment.</p></div>';
        return;
      }

      // Gelen trend filmleri 395x574px kartlar halinde ekrana basıyoruz
      filmKartlariniGoster(trendFilmler);
    } catch (error) {
      if (moviesListBlock) {
        moviesListBlock.innerHTML =
          '<div class="catalog-error-message"><p>An error occurred while loading trending movies.</p></div>';
      }
    }
  }

  // Sayfa yüklenir yüklenmez trend filmleri getirmesi için fonksiyonu tetikliyoruz
  sayfaBaslangiciniYukle();

  // ==========================================================================
  // MEVCUT ÇARK VE INPUT MANTIKLARI (KORUNDU)
  // ==========================================================================

  // 1. DİNAMİK YIL OLUŞTURMA (Default Seçenekli)
  function yillariDoldur() {
    const mevcutYil = new Date().getFullYear();
    const baslangicYili = 1900;

    let htmlIcerik =
      '<li class="custom-select__option custom-select__option--default" data-value="">Year</li>';
    for (let yil = mevcutYil; yil >= baslangicYili; yil--) {
      htmlIcerik += `<li class="custom-select__option" data-value="${yil}">${yil}</li>`;
    }
    htmlIcerik += '<li class="custom-select__spacer"></li>';
    yearMenu.innerHTML = htmlIcerik;

    options = Array.from(yearMenu.querySelectorAll('.custom-select__option'));
  }

  yillariDoldur();

  // 2. MERKEZDEKİ ELEMANI HESAPLAMA
  function merkezElemaniniBul() {
    if (options.length === 0) return;

    const menuRect = yearMenu.getBoundingClientRect();
    const menuCenter = menuRect.top + menuRect.height / 2;

    let enYakinEleman = options[0];
    let enKucukMesafe = Infinity;
    let bulunanIndex = 0;

    options.forEach((opt, idx) => {
      const optRect = opt.getBoundingClientRect();
      const optCenter = optRect.top + optRect.height / 2;
      const mesafe = Math.abs(menuCenter - optCenter);

      if (mesafe < enKucukMesafe) {
        enKucukMesafe = mesafe;
        enYakinEleman = opt;
        bulunanIndex = idx;
      }
    });

    options.forEach(opt => opt.classList.remove('is-active'));
    if (enYakinEleman) {
      enYakinEleman.classList.add('is-active');
    }
    activeIndex = bulunanIndex;
  }

  yearMenu.addEventListener('scroll', merkezElemaniniBul);

  // 3. MENÜ AÇMA / KAPAMA MANTIĞI
  customSelectTrigger.addEventListener('click', e => {
    e.stopPropagation();
    const isHidden = yearMenu.classList.toggle('hide');

    if (!isHidden) {
      customSelectTrigger.classList.add('is-open');
      setTimeout(() => {
        merkezdekiElemanaKaydir();
      }, 50);
    } else {
      menuKapat();
    }
  });

  function menuKapat() {
    yearMenu.classList.add('hide');
    customSelectTrigger.classList.remove('is-open');

    if (options[activeIndex]) {
      const secilenYil = options[activeIndex].getAttribute('data-value');
      customSelectLabel.textContent = secilenYil ? secilenYil : 'Year';
    }
  }

  function merkezdekiElemanaKaydir() {
    if (options[activeIndex]) {
      options[activeIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      merkezElemaniniBul();
    }
  }

  yearMenu.addEventListener('click', e => {
    if (e.target.classList.contains('custom-select__option')) {
      const idx = options.indexOf(e.target);
      if (idx !== -1) {
        activeIndex = idx;
        merkezdekiElemanaKaydir();
        setTimeout(menuKapat, 300);
      }
    }
  });

  // 4. OK TUŞLARI İLE GEZİNEBİLME MANTIĞI
  customSelectTrigger.addEventListener('keydown', e => {
    if (yearMenu.classList.contains('hide')) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        customSelectTrigger.click();
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeIndex < options.length - 1) {
        activeIndex++;
        merkezdekiElemanaKaydir();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeIndex > 0) {
        activeIndex--;
        merkezdekiElemanaKaydir();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      menuKapat();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      yearMenu.classList.add('hide');
      customSelectTrigger.classList.remove('is-open');
    }
  });

  document.addEventListener('click', menuKapat);

  // 5. INPUT ALANI GİRİŞ DİNAMİKLERİ
  searchInput.addEventListener('input', e => {
    const value = e.target.value.trim();

    if (value.length > 0) {
      clearBtn.style.display = 'block';
      yearSelectWrapper.classList.add('is-visible');
    } else {
      clearBtn.style.display = 'none';
      yearSelectWrapper.classList.remove('is-visible');
      yearMenu.classList.add('hide');
      customSelectLabel.textContent = 'Year';
      activeIndex = 0;
    }
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    yearSelectWrapper.classList.remove('is-visible');
    yearMenu.classList.add('hide');
    customSelectLabel.textContent = 'Year';
    activeIndex = 0;
    searchInput.focus();
  });

  // 6. FORM SUBMIT VE KULLANICI ARAMA AKIŞI
  searchForm.addEventListener('submit', async e => {
    e.preventDefault();

    const queryValue = searchInput.value.trim();
    const selectedYear =
      customSelectLabel.textContent === 'Year'
        ? ''
        : customSelectLabel.textContent;

    if (!queryValue) {
      moviesListBlock.innerHTML = `
        <div class="catalog-error-message">
          <p>Please enter a movie title to search.</p>
        </div>
      `;
      return;
    }

    try {
      if (moviesListBlock) {
        moviesListBlock.innerHTML =
          '<div class="catalog-loading">Searching movies...</div>';
      }

      // KULLANICI ARAMA YAPTIĞINDA ÇALIŞACAK FONKSİYON
      const aramaSonuclari = await searchMoviesApi(queryValue, selectedYear);

      if (!aramaSonuclari || aramaSonuclari.length === 0) {
        if (moviesListBlock) {
          moviesListBlock.innerHTML = `
            <div class="catalog-error-message">
              <p>OOPS...</p>
              <p>We are very sorry!</p>
              <p>We don’t have any results matching your search.</p>
            </div>
          `;
        }
        return;
      }

      filmKartlariniGoster(aramaSonuclari);
    } catch (error) {
      if (moviesListBlock) {
        moviesListBlock.innerHTML =
          '<div class="catalog-error-message"><p>An error occurred while fetching movies.</p></div>';
      }
    }
  });

  // FILM KARTLARINI OLUŞTURMA FONKSİYONU (395x574px Ghosted Tasarımı)
  function filmKartlariniGoster(filmler) {
    if (!moviesListBlock) return;
    moviesListBlock.innerHTML = '';

    filmler.forEach(film => {
      const kart = document.createElement('div');
      kart.className = 'movie-card';

      const posterUrl = film.poster_path
        ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
        : 'https://placehold.co/400x400?text=No+Image';

      const vizyonYili = film.release_date
        ? film.release_date.split('-')[0]
        : 'Unknown';

      const yildizSayisi = Math.round(film.vote_average / 2);
      const yildizlar = '★'.repeat(yildizSayisi) + '☆'.repeat(5 - yildizSayisi);

      kart.innerHTML = `
        <img class="movie-card__poster" src="${posterUrl}" alt="${film.title}" loading="lazy">
        <div class="movie-card__overlay">
          <h2 class="movie-card__title">${film.title}</h2>
          <div class="movie-card__meta">
            <div class="movie-card__details">Action, Drama | ${vizyonYili}</div>
            <div class="movie-card__stars">${yildizlar}</div>
          </div>
        </div>
      `;

      kart.addEventListener('click', () => {
        console.log(`Seçilen Film ID: ${film.id}`);
      });

      moviesListBlock.appendChild(kart);
    });
  }
});
