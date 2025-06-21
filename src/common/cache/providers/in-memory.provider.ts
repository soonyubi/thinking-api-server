import { Injectable } from '@nestjs/common';
import { CacheStore } from '../interfaces/cache.interface';

@Injectable()
export class InMemoryCacheStore implements CacheStore {
  private store: Map<string, { value: string; expiry: Date }> = new Map();

  async set(key: string, value: string, ttl: number = 300): Promise<void> {
    const expiry = new Date();
    expiry.setSeconds(expiry.getSeconds() + ttl);

    this.store.set(key, { value, expiry });
  }

  async get(key: string): Promise<string | null> {
    const data = this.store.get(key);
    if (!data) return null;

    if (new Date() > data.expiry) {
      this.store.delete(key);
      return null;
    }

    return data.value;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
