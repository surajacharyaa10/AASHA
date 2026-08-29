"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.connectRedis = void 0;
const ioredis_1 = require("ioredis");
const _1 = require(".");
let redisClient = null;
exports.redisClient = redisClient;
const connectRedis = async () => {
    if (!redisClient) {
        exports.redisClient = redisClient = new ioredis_1.Redis(_1.config.redisUrl);
        redisClient.on('error', (error) => {
            console.error('Redis connection error:', error);
        });
        redisClient.on('connect', () => {
            console.log('Connected to Redis');
        });
    }
    return redisClient;
};
exports.connectRedis = connectRedis;
