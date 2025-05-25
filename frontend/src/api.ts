import axios from 'axios';
import { Team, Player, Formation, Match, Schedule } from './types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 队伍管理
export const teamApi = {
  getAll: () => api.get<Team[]>('/teams'),
  getOne: (id: string) => api.get<Team>(`/teams/${id}`),
  create: (name: string) => api.post<Team>('/teams', { name }),
  delete: (id: string) => api.delete(`/teams/${id}`),
};

// 队员管理
export const playerApi = {
  getByTeam: (teamId: string) => api.get<Player[]>(`/teams/${teamId}/players`),
  getOne: (id: string) => api.get<Player>(`/players/${id}`),
  create: (data: { teamId: string; name: string; gender: 'M' | 'F'; skillLevel: number }) =>
    api.post<Player>('/players', data),
  update: (id: string, data: Partial<Player>) => api.put(`/players/${id}`, data),
  delete: (id: string) => api.delete(`/players/${id}`),
};

// 阵容管理
export const formationApi = {
  getByTeam: (teamId: string) => api.get<Formation[]>(`/teams/${teamId}/formations`),
  create: (teamId: string, type: 'MD1' | 'MD2' | 'XD1', playerIds: string[]) =>
    api.post<Formation>(`/teams/${teamId}/formations`, { type, playerIds }),
};

// 赛程管理
export const scheduleApi = {
  generate: (courtsCount: number = 4) =>
    api.post('/schedules/generate', { courtsCount }),
  getCurrent: () => api.get<Schedule>('/schedules/current'),
};

// 比赛管理
export const matchApi = {
  getAll: () => api.get<Match[]>('/matches'),
  getOne: (id: string) => api.get<Match>(`/matches/${id}`),
  updateScores: (id: string, scores: Match['scores']) =>
    api.put(`/matches/${id}/scores`, { scores }),
};

// 数据管理
export const dataApi = {
  clearAll: () => api.delete('/data/clear'),
}; 