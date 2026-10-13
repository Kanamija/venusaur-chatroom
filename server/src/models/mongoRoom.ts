import { Schema, model } from 'mongoose';

const roomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

const Room = model('Room', roomSchema);

export { Room };
