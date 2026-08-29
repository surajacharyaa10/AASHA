import { Queue } from 'bullmq';
import { config } from '../config';

// Parse rediss:// URL for BullMQ (Upstash requires TLS + password)
const redisUrl = new URL(config.redisUrl);
const bullMQConnection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  username: redisUrl.username || undefined,
  tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
};

// Create SOS queue — singleton, reused across all requests
const sosQueue = new Queue('sosQueue', {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export { sosQueue, bullMQConnection };