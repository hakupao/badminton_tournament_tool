import axios from 'axios';
import { Team, Player, Formation, Match, Schedule } from './types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10秒超时
});

// 添加请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url, response.data);
    // 成功响应直接返回
    return response;
  },
  (error) => {
    // 统一错误处理
    console.error('API Error Details:', {
      message: error.message,
      response: error.response,
      request: error.request,
      config: error.config,
    });
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('请求超时，请检查网络连接');
    }
    
    if (!error.response) {
      // 网络错误或CORS问题
      throw new Error('网络错误，请检查后端服务是否正在运行');
    }
    
    if (error.response?.data?.error) {
      // 如果后端返回了具体的错误信息，使用它
      throw new Error(error.response.data.error);
    }
    
    // 根据状态码返回不同的错误信息
    switch (error.response?.status) {
      case 400:
        throw new Error('请求参数错误');
      case 404:
        throw new Error('请求的资源不存在');
      case 500:
        throw new Error('服务器内部错误');
      default:
        throw new Error(`请求失败: ${error.message}`);
    }
  }
);

// 比赛配置管理
export const tournamentApi = {
  saveConfig: (config: any) => api.post<any>('/tournament/config', config),
  getConfig: () => api.get<any>('/tournament/config'),
};

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
  // 赛程数据查看
  getConsecutiveMatches: () => api.get('/data/consecutive-matches'),
  getInactivePlayers: () => api.get('/data/inactive-players'),
  // 比赛结果查看
  getGroupRankings: () => api.get('/data/group-rankings'),
  getPlayerWinRates: () => api.get('/data/player-win-rates'),
  getPairWinRates: () => api.get('/data/pair-win-rates'),
};

// 导出所有API函数
export const {
  getConsecutiveMatches,
  getInactivePlayers,
  getGroupRankings,
  getPlayerWinRates,
  getPairWinRates,
} = dataApi; 