import { randomUUID } from 'node:crypto';
import { Redis } from '@upstash/redis';

type ProviderName = 'geoapify' | 'tomtom';
type FailureKind = 'auth' | 'rate-limit' | 'transient';

interface ExpiringValue {
  value: unknown;
  expiresAt: number;
}

interface CircuitState {
  until: number;
}

export interface WindowResult {
  allowed: boolean;
  retryAfter: number;
  count: number;
}

export interface CircuitDecision {
  allowed: boolean;
  retryAfter: number;
  probeToken?: string;
}

export class SearchStoreUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('Shared search store is unavailable', { cause });
    this.name = 'SearchStoreUnavailableError';
  }
}

const WINDOW_SCRIPT = `
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, now - window)
local count = redis.call('ZCARD', KEYS[1])
if count >= limit then
  local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  return {0, count, oldest[2] or now}
end
redis.call('ZADD', KEYS[1], now, ARGV[4])
redis.call('PEXPIRE', KEYS[1], window)
return {1, count + 1, now}
`;

const DELETE_IF_VALUE_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

class SearchStore {
  private redis: Redis | null | undefined;
  private readonly memoryValues = new Map<string, ExpiringValue>();
  private readonly memoryWindows = new Map<string, number[]>();

  private getRedis(): Redis | null {
    if (this.redis !== undefined) return this.redis;

    const url = process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token =
      process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

    if (url && token) {
      this.redis = new Redis({ url, token });
      return this.redis;
    }

    if (process.env.VERCEL) {
      throw new SearchStoreUnavailableError();
    }

    this.redis = null;
    return null;
  }

  private getMemoryValue<T>(key: string): T | null {
    const entry = this.memoryValues.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memoryValues.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = this.getRedis();
      return redis ? await redis.get<T>(key) : this.getMemoryValue<T>(key);
    } catch (error) {
      if (error instanceof SearchStoreUnavailableError) throw error;
      throw new SearchStoreUnavailableError(error);
    }
  }

  async set(key: string, value: unknown, ttlMs: number): Promise<void> {
    try {
      const redis = this.getRedis();
      if (redis) {
        await redis.set(key, value, { px: ttlMs });
        return;
      }
      this.memoryValues.set(key, { value, expiresAt: Date.now() + ttlMs });
    } catch (error) {
      if (error instanceof SearchStoreUnavailableError) throw error;
      throw new SearchStoreUnavailableError(error);
    }
  }

  async delete(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      const redis = this.getRedis();
      if (redis) {
        await redis.del(...keys);
        return;
      }
      keys.forEach((key) => this.memoryValues.delete(key));
    } catch (error) {
      if (error instanceof SearchStoreUnavailableError) throw error;
      throw new SearchStoreUnavailableError(error);
    }
  }

  async takeWindow(key: string, limit: number, windowMs: number): Promise<WindowResult> {
    const now = Date.now();
    try {
      const redis = this.getRedis();
      if (redis) {
        const result = (await redis.eval(WINDOW_SCRIPT, [key], [
          now,
          windowMs,
          limit,
          `${now}:${randomUUID()}`,
        ])) as [number, number, number];
        const allowed = Number(result[0]) === 1;
        const oldest = Number(result[2]);
        return {
          allowed,
          count: Number(result[1]),
          retryAfter: allowed ? 0 : Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
        };
      }

      const entries = (this.memoryWindows.get(key) ?? []).filter(
        (timestamp) => timestamp > now - windowMs
      );
      if (entries.length >= limit) {
        this.memoryWindows.set(key, entries);
        return {
          allowed: false,
          count: entries.length,
          retryAfter: Math.max(1, Math.ceil((entries[0] + windowMs - now) / 1000)),
        };
      }
      entries.push(now);
      this.memoryWindows.set(key, entries);
      return { allowed: true, count: entries.length, retryAfter: 0 };
    } catch (error) {
      if (error instanceof SearchStoreUnavailableError) throw error;
      throw new SearchStoreUnavailableError(error);
    }
  }

  async acquireLock(key: string, ttlMs: number): Promise<string | null> {
    const token = randomUUID();
    try {
      const redis = this.getRedis();
      if (redis) {
        const result = await redis.set(key, token, { nx: true, px: ttlMs });
        return result === 'OK' ? token : null;
      }
      if (this.getMemoryValue(key) !== null) return null;
      this.memoryValues.set(key, { value: token, expiresAt: Date.now() + ttlMs });
      return token;
    } catch (error) {
      if (error instanceof SearchStoreUnavailableError) throw error;
      throw new SearchStoreUnavailableError(error);
    }
  }

  async releaseLock(key: string, token: string): Promise<void> {
    try {
      const redis = this.getRedis();
      if (redis) {
        await redis.eval(DELETE_IF_VALUE_SCRIPT, [key], [token]);
        return;
      }
      if (this.getMemoryValue(key) === token) this.memoryValues.delete(key);
    } catch (error) {
      if (error instanceof SearchStoreUnavailableError) throw error;
      throw new SearchStoreUnavailableError(error);
    }
  }

  async beforeProvider(provider: ProviderName): Promise<CircuitDecision> {
    const stateKey = `geocode:v1:circuit:${provider}:state`;
    const state = await this.get<CircuitState>(stateKey);
    if (!state) return { allowed: true, retryAfter: 0 };

    const now = Date.now();
    if (state.until > now) {
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((state.until - now) / 1000)) };
    }

    const probeKey = `geocode:v1:circuit:${provider}:probe`;
    const probeToken = await this.acquireLock(probeKey, 10_000);
    return probeToken
      ? { allowed: true, retryAfter: 0, probeToken }
      : { allowed: false, retryAfter: 1 };
  }

  async recordProviderSuccess(provider: ProviderName, probeToken?: string): Promise<void> {
    const keys = [
      `geocode:v1:circuit:${provider}:state`,
      `geocode:v1:circuit:${provider}:failures`,
    ];
    await this.delete(...keys);
    if (probeToken) {
      await this.releaseLock(`geocode:v1:circuit:${provider}:probe`, probeToken);
    }
  }

  async recordProviderFailure(
    provider: ProviderName,
    kind: FailureKind,
    retryAfterSeconds = 0,
    probeToken?: string
  ): Promise<void> {
    const stateKey = `geocode:v1:circuit:${provider}:state`;
    let blockMs = 0;

    if (kind === 'auth') blockMs = 10 * 60 * 1000;
    if (kind === 'rate-limit') blockMs = Math.max(60, retryAfterSeconds) * 1000;

    if (kind === 'transient') {
      const failures = await this.takeWindow(
        `geocode:v1:circuit:${provider}:failures`,
        3,
        60_000
      );
      if (!failures.allowed || failures.count >= 3 || probeToken) blockMs = 2 * 60 * 1000;
    }

    if (blockMs > 0) {
      await this.set(stateKey, { until: Date.now() + blockMs }, blockMs + 10 * 60 * 1000);
    }

    if (probeToken) {
      await this.releaseLock(`geocode:v1:circuit:${provider}:probe`, probeToken);
    }
  }

  resetForTests(): void {
    if (process.env.NODE_ENV !== 'test') return;
    this.redis = undefined;
    this.memoryValues.clear();
    this.memoryWindows.clear();
  }
}

export const searchStore = new SearchStore();
