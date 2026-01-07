/**
 * 性能优化工具函数
 */

/**
 * 防抖函数 - 延迟执行，只执行最后一次
 * @param func 要执行的函数
 * @param wait 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数 - 限制执行频率
 * @param func 要执行的函数
 * @param limit 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 批量执行函数 - 收集一定时间内的调用，然后批量执行
 * @param func 要执行的函数
 * @param wait 等待时间（毫秒）
 * @param maxBatch 最大批量数
 * @returns 批量执行的函数
 */
export function batchExecute<T>(
  func: (items: T[]) => void,
  wait: number,
  maxBatch: number = 10
): (item: T) => void {
  let batch: T[] = [];
  let timeout: NodeJS.Timeout | null = null;

  const executeBatch = () => {
    if (batch.length > 0) {
      func([...batch]);
      batch = [];
    }
    timeout = null;
  };

  return (item: T) => {
    batch.push(item);

    if (batch.length >= maxBatch) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      executeBatch();
    } else {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(executeBatch, wait);
    }
  };
}

/**
 * 请求动画帧节流 - 使用 requestAnimationFrame 限制执行频率
 * @param func 要执行的函数
 * @returns 节流后的函数
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          func(...lastArgs);
        }
        rafId = null;
        lastArgs = null;
      });
    }
  };
}

/**
 * 内存优化 - 清理未使用的资源
 */
export class ResourceCleaner {
  private resources = new Map<string, () => void>();

  register(key: string, cleanup: () => void): void {
    this.resources.set(key, cleanup);
  }

  unregister(key: string): void {
    const cleanup = this.resources.get(key);
    if (cleanup) {
      cleanup();
      this.resources.delete(key);
    }
  }

  clear(): void {
    this.resources.forEach((cleanup) => cleanup());
    this.resources.clear();
  }
}

/**
 * 性能监控
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();

  start(label: string): void {
    this.marks.set(label, performance.now());
  }

  end(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`Performance mark "${label}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(label);
    
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  measure(label: string, func: () => void): void {
    this.start(label);
    func();
    this.end(label);
  }

  async measureAsync(label: string, func: () => Promise<void>): Promise<void> {
    this.start(label);
    await func();
    this.end(label);
  }
}

export const performanceMonitor = new PerformanceMonitor();
