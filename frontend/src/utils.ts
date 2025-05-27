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