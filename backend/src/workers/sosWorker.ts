import { Worker, Job } from 'bullmq';
import { connectDB } from '../config/database';
import { bullMQConnection } from '../queue/sosQueue';
import { CreateSosInput } from '../schemas/sos.schema';

let worker: Worker | null = null;

export const startSosWorker = async () => {
  worker = new Worker(
    'sosQueue',
    async (job: Job<CreateSosInput>) => {
      console.log(`Processing SOS event job ${job.id} for packet ${job.data.packetId}`);
      try {
        const db = await connectDB();
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
      } catch (err) {
        console.error(`Failed to process SOS job ${job.id}:`, err);
        throw err;
      }
    },
    {
      connection: bullMQConnection,
      concurrency: 10
    }
  );

  worker.on('completed', (job) => {
    console.log(`SOS job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`SOS job ${job?.id} failed with error:`, err);
  });

  console.log('BullMQ SOS Queue worker started');
};

export const stopSosWorker = async () => {
  if (worker) {
    await worker.close();
    console.log('BullMQ SOS Queue worker stopped');
  }
};
