export interface CacheModuleOptions {
  provider: 'memory' | 'redis';
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
}
