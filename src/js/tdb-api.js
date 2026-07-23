import axios from 'axios';

export const tmdbApi = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  // headers kısmındaki o uzun şifreyi (Bearer) SİLDİK!
  
  params: {
    // Şifreyi güvenli bir şekilde .env dosyasından çekiyoruz
    api_key: import.meta.env.VITE_TMDB_KEY, 
    language: 'en-US',
  },
});

// MERKEZİ HATA YÖNETİMİ (AXIOS INTERCEPTOR)
// Bu yapı giden isteklerin yanıtlarını (response) asıl fonksiyonlara gitmeden önce yakalar
tmdbApi.interceptors.response.use(
  response => {
    // İstek başarılıysa veriyi hiç değiştirmeden bir sonraki adıma aktarır
    return response;
  },
  error => {
    // İstek hatalıysa (Örn: 401, 404, 500 veya İnternet Yoksa) burası tetiklenir
    let hataMesaji = 'Beklenmedik bir hata oluştu.';

    if (error.response) {
      // Sunucudan gelen resmi hata mesajını yakalıyoruz (TMDB hata formatı: status_message)
      hataMesaji =
        error.response.data.status_message ||
        `Hata Kodu: ${error.response.status}`;
    } else if (error.request) {
      // İstek atıldı ama cevap alınamadı (Örn: İnternet bağlantısı koptuğunda)
      hataMesaji =
        'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
    } else {
      // İstek kurulurken bir hata meydana geldiyse
      hataMesaji = error.message;
    }

    // TAKIM İÇİN UYARI: Ekrana merkezi olarak hatayı basıyoruz
    // Projenize ileride SweetAlert veya Toast kütüphanesi eklerseniz burayı güncellemeniz yeterlidir
    alert(`🚨 API Hatası: ${hataMesaji}`);

    // Hatanın zincirleme olarak devam etmesi ve çağıran fonksiyonun da haberdar olması için hatayı fırlatıyoruz
    return Promise.reject(error);
  }
);

// Bir hata oluşursa yukarıdaki interceptor otomatik yakalayacak ve alert basacaktır.

export const getTrendingMovies = async () => {
  const response = await tmdbApi.get('/trending/movie/day');
  return response.data.results;
};

export const getTrendingWeek = async () => {
  const response = await tmdbApi.get('/trending/movie/week');
  return response.data.results;
};

export const getNewMovies = async () => {
  const response = await tmdbApi.get('/movie/upcoming', {
    params: { page: 1 }, // Ortak parametreye ek olarak sadece sayfa numarasını gönderiyoruz
  });
  return response.data.results;
};

export const getMovieDetails = async movieId => {
  const response = await tmdbApi.get(`/movie/${movieId}`);
  return response.data; // Detay verisi direkt nesnedir
};

export const getMovieVideos = async movieId => {
  const response = await tmdbApi.get(`/movie/${movieId}/videos`);
  return response.data.results;
};

export const getMovieTypeList = async () => {
  const response = await tmdbApi.get('/genre/movie/list');
  return response.data.genres; // TMDB tür listesini 'genres' içinde yollar
};
