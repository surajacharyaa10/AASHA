"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopSosWorker = exports.startSosWorker = void 0;
const bullmq_1 = require("bullmq");
const database_1 = require("../config/database");
const sosQueue_1 = require("../queue/sosQueue");
let worker = null;
const startSosWorker = async () => {
    worker = new bullmq_1.Worker('sosQueue', async (job) => {
        console.log(`Processing SOS event job ${job.id} for packet ${job.data.packetId}`);
        try {
            const db = await (0, database_1.connectDB)();
            const sosEventsCollection = db.collection('sos_events');
            const data = job.data;
            // Check if event already exists to prevent duplicate entries
            const existingEvent = await sosEventsCollection.findOne({ packetId: data.packetId });
            if (existingEvent) {
                console.log(`SOS packet ${data.packetId} already exists. Skipping database insert.`);
                return { status: 'skipped', reason: 'duplicate' };
            }
            // Insert new SOS event into MongoDB
            const result = await sosEventsCollection.insertOne({
                packetId: data.packetId,
                originDeviceId: data.originDeviceId,
                latitude: data.latitude,
                longitude: data.longitude,
                battery: data.battery ?? null,
                hopCount: data.hopCount ?? 0,
                status: 'pending',
                reportedAt: new Date(data.reportedAt),
                receivedAt: new Date(),
                assignedTeamId: null,
                resolvedAt: null,
            });
            console.log(`Successfully stored SOS event in database. ID: ${result.insertedId}`);
            return { status: 'inserted', id: result.insertedId };
        }
        catch (err) {
            console.error(`Failed to process SOS job ${job.id}:`, err);
            throw err;
        }
    }, {
        connection: sosQueue_1.bullMQConnection,
        concurrency: 10
    });
    worker.on('completed', (job) => {
        console.log(`SOS job ${job.id} completed successfully`);
    });
    worker.on('failed', (job, err) => {
        console.error(`SOS job ${job?.id} failed with error:`, err);
    });
    console.log('BullMQ SOS Queue worker started');
};
exports.startSosWorker = startSosWorker;
const stopSosWorker = async () => {
    if (worker) {
        await worker.close();
        console.log('BullMQ SOS Queue worker stopped');
    }
};
exports.stopSosWorker = stopSosWorker;
