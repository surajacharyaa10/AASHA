import { MongoClient } from 'mongodb';
import { config } from '.';

let client: MongoClient;

const connectDB = async () => {
  try {
    client = new MongoClient(config.databaseUrl, {
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
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export { connectDB, client };