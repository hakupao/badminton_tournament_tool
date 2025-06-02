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

/**
 * 导出数据到JSON文件
 * 将localStorage中的所有羽毛球比赛相关数据导出为JSON文件
 */
export const exportData = () => {
  try {
    const dataToExport = {
      matches: JSON.parse(localStorage.getItem('badminton_matches') || '[]'),
      timeSlots: JSON.parse(localStorage.getItem('badminton_timeSlots') || '[]'),
      // 可以根据需要添加其他需要导出的数据
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
        
        // 验证导入的数据
        if (!importedData.matches || !Array.isArray(importedData.matches)) {
          throw new Error('导入的数据格式不正确: 缺少比赛数据');
        }
        
        if (!importedData.timeSlots || !Array.isArray(importedData.timeSlots)) {
          throw new Error('导入的数据格式不正确: 缺少时间段数据');
        }
        
        // 保存导入的数据到localStorage
        localStorage.setItem('badminton_matches', JSON.stringify(importedData.matches));
        localStorage.setItem('badminton_timeSlots', JSON.stringify(importedData.timeSlots));
        
        // 可以在这里添加导入其他数据的逻辑
        
        resolve({ success: true, message: '数据导入成功，请刷新页面以加载新数据' });
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