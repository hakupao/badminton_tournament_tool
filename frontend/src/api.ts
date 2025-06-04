import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const healthApi = {
  check: () => api.get('/health'),
};

export const playerApi = {
  add: (player: { code: string; name: string }) => api.post('/players', player),
  list: () => api.get('/players'),
};

export const matchApi = {
  add: (match: any) => api.post('/matches', match),
  list: () => api.get('/matches'),
};

export default api;
