/**
 * 创建一个类似Python的defaultdict
 * 当访问不存在的键时，会使用提供的工厂函数创建默认值
 */
export function defaultDict<T>(defaultFactory: () => T): { [key: string]: T } {
  return new Proxy({} as { [key: string]: T }, {
    get: (target, name: string) => {
      if (!(name in target)) {
        target[name] = defaultFactory();
      }
      return target[name];
    }
  });
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 格式化日期
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化时间
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const safeParseLocalStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn(`无法解析 localStorage 键 ${key}，已返回默认值`, error);
    return fallback;
  }
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const persistJsonValue = (key: string, value: unknown) => {
  if (value === undefined || value === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const ensureArrayField = (value: unknown, fieldName: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error(`导入的数据格式不正确: ${fieldName} 应该是数组`);
  }
  return value;
};

/**
 * 导出数据到JSON文件
 * 将localStorage中的所有羽毛球比赛相关数据导出为JSON文件
 */
export const exportData = () => {
  try {
    const matches = safeParseLocalStorage('badminton_matches', []);
    const backupMatches = safeParseLocalStorage('tournamentMatches', []);
    const timeSlots = safeParseLocalStorage('badminton_timeSlots', []);
    const players = safeParseLocalStorage('tournamentPlayers', []);
    const tournamentConfig = safeParseLocalStorage('tournamentConfig', null);
    const tournamentFormations = safeParseLocalStorage('tournamentFormations', []);
    const tournamentSchedule = safeParseLocalStorage('tournamentSchedule', []);

    const dataToExport = {
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      matches,
      timeSlots,
      players,
      tournamentMatches: backupMatches.length > 0 ? backupMatches : matches,
      tournamentSchedule,
      tournamentConfig,
      tournamentFormations,
    };
    
    // 创建一个Blob对象
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    
    // 创建下载链接并触发下载
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `badminton_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true, message: '数据导出成功' };
  } catch (error) {
    console.error('导出数据失败:', error);
    return { success: false, message: '导出数据失败' };
  }
};

/**
 * 从JSON文件导入数据
 * @param file 要导入的JSON文件
 * @returns Promise 包含导入结果
 */
export const importData = (file: File): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
          throw new Error('无法读取文件');
        }
        
        const importedData = JSON.parse(event.target.result as string);
        if (!isPlainObject(importedData)) {
          throw new Error('导入的数据格式不正确: 文件内容应为对象');
        }
        
        const matchesSource = importedData.matches ?? importedData.tournamentMatches;
        if (!matchesSource) {
          throw new Error('导入的数据格式不正确: 缺少比赛数据');
        }
        const matches = ensureArrayField(matchesSource, 'matches');
        
        const timeSlotsSource =
          importedData.timeSlots ??
          Array.from(
            new Set(
              matches
                .map((item: unknown) => {
                  if (typeof item === 'object' && item !== null && 'timeSlot' in item) {
                    return (item as { timeSlot?: unknown }).timeSlot;
                  }
                  return undefined;
                })
                .filter((value: unknown): value is number | string =>
                  typeof value === 'number' || typeof value === 'string'
                )
            )
          ).map((value: number | string) =>
            typeof value === 'number' ? `第${value}时段` : value
          );
        const timeSlots = ensureArrayField(timeSlotsSource, 'timeSlots');
        
        const players = Array.isArray(importedData.players) ? importedData.players : [];
        const tournamentMatches = ensureArrayField(
          importedData.tournamentMatches ?? matches,
          'tournamentMatches'
        );
        const tournamentSchedule = importedData.tournamentSchedule
          ? ensureArrayField(importedData.tournamentSchedule, 'tournamentSchedule')
          : [];
        const tournamentFormations = importedData.tournamentFormations
          ? ensureArrayField(importedData.tournamentFormations, 'tournamentFormations')
          : [];
        
        const tournamentConfig = importedData.tournamentConfig ?? null;
        if (
          tournamentConfig !== null &&
          tournamentConfig !== undefined &&
          !isPlainObject(tournamentConfig)
        ) {
          throw new Error('导入的数据格式不正确: 配置数据应为对象');
        }
        
        persistJsonValue('badminton_matches', matches);
        persistJsonValue('badminton_timeSlots', timeSlots);
        persistJsonValue('tournamentPlayers', players);
        persistJsonValue('tournamentMatches', tournamentMatches);
        persistJsonValue('tournamentSchedule', tournamentSchedule);
        persistJsonValue('tournamentFormations', tournamentFormations);
        persistJsonValue('tournamentConfig', tournamentConfig ?? undefined);
        
        resolve({
          success: true,
          message: `数据导入成功：共${matches.length}场比赛，${timeSlots.length}个时段`,
        });
      } catch (error) {
        console.error('导入数据失败:', error);
        reject({ success: false, message: `导入数据失败: ${error instanceof Error ? error.message : '未知错误'}` });
      }
    };
    
    reader.onerror = () => {
      reject({ success: false, message: '读取文件失败' });
    };
    
    reader.readAsText(file);
  });
}; 
