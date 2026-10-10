import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase } from '../db/connect.js';
import { Room } from '../models/mongoRoom.js';

const roomNames = ['Venusaur', 'Charizard', 'Pikachu'];

async function seedRooms() {
  await connectToDatabase();

  for (const name of roomNames) {
    const existingRoom = await Room.findOne({ name });

    if (existingRoom) {
      console.log(`Room already exists: ${name}`);
    } else {
      await Room.create({ name });
      console.log(`Created room: ${name}`);
    }
  }
  await mongoose.disconnect();
}

seedRooms().catch((error) => {
  console.error('Failed to seed rooms:', error);
  process.exit(1);
});
