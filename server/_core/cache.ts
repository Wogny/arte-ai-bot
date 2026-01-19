/**
 * Sistema de Cache Simples (In-Memory para desenvolvimento, expansível para Redis)
 */
class CacheManager {
  private cache: Map<string, { value: any; expires: number }> = new Map();

  /**
   * Define um valor no cache com tempo de expiração (TTL) em segundos
   */
  set(key: string, value: any, ttlSeconds: number = 300) {
    const expires = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expires });
  }

  /**
   * Obtém um valor do cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Remove uma chave do cache
   */
  delete(key: string) {
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    this.cache.clear();
  }
}

export const cache = new CacheManager();

/**
 * Decorator/Wrapper para cachear funções assíncronas
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    console.log(`[CACHE] Hit: ${key}`);
    return cached;
  }

  console.log(`[CACHE] Miss: ${key}`);
  const result = await fn();
  cache.set(key, result, ttlSeconds);
  return result;
}
