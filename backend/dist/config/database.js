"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.connectDB = void 0;
const mongodb_1 = require("mongodb");
const _1 = require(".");
let client;
const connectDB = async () => {
    try {
        exports.client = client = new mongodb_1.MongoClient(_1.config.databaseUrl, {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            tls: true,
            tlsAllowInvalidCertificates: true,
        });
        await client.connect();
        // Verify the connection with an actual MongoDB command
        await client.db().command({ ping: 1 });
        console.log('Connected to MongoDB');
        return client.db();
    }
    catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
};
exports.connectDB = connectDB;
