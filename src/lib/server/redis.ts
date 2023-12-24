import Redis, { type RedisOptions } from 'ioredis';
import { env } from '$env/dynamic/private';

export const REDIS_OPTIONS: RedisOptions = {
  host: env.REDIS_HOST || 'localhost',
  port: env.REDIS_PORT ? parseInt(env.REDIS_PORT, 10) : 6379,
  db: env.REDIS_DATABASE ? parseInt(env.REDIS_DATABASE, 10) : 0,
  keyPrefix: env.REDIS_PREFIX || 'yirrevealed:',
  lazyConnect: true
};

export const redis = new Redis(REDIS_OPTIONS);
