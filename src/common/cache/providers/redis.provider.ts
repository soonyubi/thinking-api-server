import { Injectable } from '@nestjs/common';
import { CacheStore } from '../interfaces/cache.interface';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheStore implements CacheStore {
  private readonly redis: Redis;

  constructor(config: { host: string; port: number; password?: string }) {
    this.redis = new Redis(config);
  }

  async set(key: string, value: string, ttl: number = 300): Promise<void> {
    await this.redis.set(key, value, 'EX', ttl);
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
