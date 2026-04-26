import Redis from 'ioredis';
import { env } from './env.js';

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // required by BullMQ
      retryStrategy: (times) => Math.min(times * 100, 3000),
    //    tls: {},
    });

    redisClient.on('connect', () => console.log('Redis connected'));
    redisClient.on('error', (err) => console.error('Redis error:', err.message));
  }
  return redisClient;
};

export default getRedisClient;