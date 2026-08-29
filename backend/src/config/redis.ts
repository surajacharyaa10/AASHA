import { Redis } from 'ioredis';
import { config } from '.';

let redisClient: Redis | null = null;

const connectRedis = async () => {
  if (!redisClient) {
    redisClient = new Redis(config.redisUrl);
    redisClient.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
    redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });
  }
  return redisClient;
};

export { connectRedis, redisClient };