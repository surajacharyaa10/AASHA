"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || '',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '8h',
    dashboardOrigin: process.env.DASHBOARD_ORIGIN || 'http://localhost:3000',
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || '',
    queueWorkerConcurrency: parseInt(process.env.QUEUE_WORKER_CONCURRENCY || '10'),
    queueDepthAlertThreshold: parseInt(process.env.QUEUE_DEPTH_ALERT_THRESHOLD || '5000'),
    nearestTeamQueryLimit: parseInt(process.env.NEAREST_TEAM_QUERY_LIMIT || '5'),
    hopLimit: parseInt(process.env.HOP_LIMIT || '10'),
    dedupCacheTtl: parseInt(process.env.DEDUP_CACHE_TTL || '1800'), // 30 minutes in seconds
    relayQuietPeriod: parseInt(process.env.RELAY_QUIET_PERIOD || '300'), // 5 minutes in seconds
    maxPacketRetransmitAttempts: parseInt(process.env.MAX_PACKET_RETRANSMIT_ATTEMPTS || '3')
};
