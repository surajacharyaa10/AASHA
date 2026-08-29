"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bullMQConnection = exports.sosQueue = void 0;
const bullmq_1 = require("bullmq");
const config_1 = require("../config");
// Parse rediss:// URL for BullMQ (Upstash requires TLS + password)
const redisUrl = new URL(config_1.config.redisUrl);
const bullMQConnection = {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
    password: redisUrl.password || undefined,
    username: redisUrl.username || undefined,
    tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
};
exports.bullMQConnection = bullMQConnection;
// Create SOS queue — singleton, reused across all requests
const sosQueue = new bullmq_1.Queue('sosQueue', {
    connection: bullMQConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});
exports.sosQueue = sosQueue;
