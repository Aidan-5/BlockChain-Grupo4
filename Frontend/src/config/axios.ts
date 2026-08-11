import axios from 'axios';
import { API_BASE_URL } from './api';

// Cliente axios centralizado: adjunta el JWT (si existe) a cada request y
// maneja globalmente los 401 (token ausente/expirado/inválido) cerrando la
// sesión y redirigiendo a /login. Úsalo en vez de axios directo en cualquier
// llamada nueva o que ahora requiera Authorization por los guards del backend.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
