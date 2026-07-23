import axios from "axios";

export const tmdbApi = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: {
    accept: "application/json",
  },
  params: {
    api_key: "7669649456073affc74c69fa6742a1d6",
    language: "en-US",
  },
});

tmdbApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let hataMesaji = "Beklenmedik bir hata oluştu.";

    if (error.response) {
      hataMesaji =
        error.response.data.status_message ||
        `Hata Kodu: ${error.response.status}`;
    } else if (error.request) {
      hataMesaji =
        "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.";
    } else {
      hataMesaji = error.message;
    }

    alert(`🚨 API Hatası: ${hataMesaji}`);

    return Promise.reject(error);
  },
);

export const getTrendingMovies = async () => {
  const response = await tmdbApi.get("/trending/movie/day");
  return response.data.results;
};

export const getTrendingWeek = async () => {
  const response = await tmdbApi.get("/trending/movie/week");
  return response.data.results;
};

export const getNewMovies = async () => {
  const response = await tmdbApi.get("/movie/upcoming", {
    params: { page: 1 },
  });
  return response.data.results;
};

export const getMovieDetails = async (movieId) => {
  const response = await tmdbApi.get(`/movie/${movieId}`);
  return response.data;
};

export const getMovieVideos = async (movieId) => {
  const response = await tmdbApi.get(`/movie/${movieId}/videos`);
  return response.data.results;
};
