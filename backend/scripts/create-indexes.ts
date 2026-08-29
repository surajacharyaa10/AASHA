import { connectDB } from '../src/config/database';

async function main() {
  const db = await connectDB();
  const col = db.collection('sos_events');

  // Remove duplicate packetIds — keep the first inserted doc (_id order), delete the rest
  console.log('Cleaning up duplicate packetIds...');
  const pipeline = [
    { $group: { _id: '$packetId', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ];
  const duplicates = await col.aggregate(pipeline).toArray();
  for (const dup of duplicates) {
    const [keep, ...remove] = dup.ids;
    await col.deleteMany({ _id: { $in: remove } });
    console.log(`  packetId=${dup._id}: kept ${keep}, removed ${remove.length} duplicate(s)`);
  }
  if (!duplicates.length) console.log('  No duplicates found.');

  // Create unique index
  const result = await col.createIndex({ packetId: 1 }, { unique: true });
  console.log('Unique index created on sos_events.packetId:', result);
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
