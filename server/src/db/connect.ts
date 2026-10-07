import mongoose from 'mongoose';

async function connectToDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to server/.env');
  }
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB (database: ${mongoose.connection.name})`);
}

export { connectToDatabase };
