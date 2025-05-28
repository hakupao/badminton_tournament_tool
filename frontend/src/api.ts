import axios from 'axios';

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

// 健康检查
export const healthApi = {
  check: () => api.get('/health'),
};

// 比赛配置管理（客户端模拟）
export const tournamentApi = {
  saveConfig: (config: any) => Promise.resolve({ data: config }),
  getConfig: () => Promise.resolve({ data: JSON.parse(localStorage.getItem('tournament_config') || '{}') }),
};

// 注释：所有数据处理功能现在都在前端实现
// 以下导出的空对象是为了保持API接口兼容性，实际功能已在前端data-utils.ts中实现
export const dataApi = {
  clearAll: () => Promise.resolve({ data: { status: 'ok' } }),
};

// 导出健康检查函数
export const {
  check: checkHealth
} = healthApi; 