export function initHeader() {
  setActiveLink();
  initMenuToggle();
  initThemeToggle();
}

const THEME_STORAGE_KEY = 'cinema-theme';

function setActiveLink() {
  const currentPath = window.location.pathname.toLowerCase();
  let page = 'home';

  // .html uzantıları veya farklı path yapılarında tam eşleşme için
  if (currentPath.includes('catalog')) {
    page = 'catalog';
  } else if (currentPath.includes('library')) {
    page = 'library';
  }

  // Tüm active sınıflarını temizle
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  // Eşleşen sayfadaki link(ler)e active sınıfı ekle
  document.querySelectorAll(`[data-page="${page}"]`).forEach(link => {
    link.classList.add('active');
  });
}

function initMenuToggle() {
  const menuBtn = document.getElementById('menuToggle');
  const nav = document.querySelector('.mobile-nav');

  if (!menuBtn || !nav) return;

  // Menü aç/kapat
  menuBtn.addEventListener('click', (event) => {
    event.stopPropagation(); // Tıklamanın document'a yayılmasını engelle
    nav.classList.toggle('open');
    document.body.classList.toggle('nav-open');
  });

  // Dışarı tıklayınca veya menü içindeki bir linke tıklayınca kapatma
  document.addEventListener('click', event => {
    const isClickInsideNav = nav.contains(event.target);
    const isClickOnLink = event.target.closest('.nav-link'); // Linke tıklandıysa
    const isNavOpen = nav.classList.contains('open');

    if (isNavOpen && (!isClickInsideNav || isClickOnLink)) {
      nav.classList.remove('open');
      document.body.classList.remove('nav-open');
    }
  });
}

function initThemeToggle() {
  // Sayfada birden fazla tema değiştirici olabilir (örn: biri mobilde, biri masaüstünde)
  const toggles = document.querySelectorAll('.theme-toggle');
  
  if (toggles.length === 0) return;

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const shouldUseLightTheme = savedTheme === 'light';

  // Sayfa yüklendiğinde varsayılanı ayarla (Tasarıma göre default dark olmalı)
  document.body.classList.toggle('light-theme', shouldUseLightTheme);
  
  toggles.forEach(toggle => {
    toggle.classList.toggle('active', shouldUseLightTheme);

    toggle.addEventListener('click', () => {
      const willUseLightTheme = !document.body.classList.contains('light-theme');

      // Body sınıfını güncelle
      document.body.classList.toggle('light-theme', willUseLightTheme);
      
      // Tüm toggle butonlarının görsel durumunu güncelle
      toggles.forEach(t => t.classList.toggle('active', willUseLightTheme));
      
      // LocalStorage'a kaydet
      localStorage.setItem(THEME_STORAGE_KEY, willUseLightTheme ? 'light' : 'dark');
    });
  });
}