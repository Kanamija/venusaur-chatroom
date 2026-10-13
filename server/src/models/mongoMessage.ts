import { Schema, model } from 'mongoose';

const messageSchema = new Schema(
  {
    roomId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ roomId: 1, createdAt: -1 });

const Message = model('Message', messageSchema);

type NewMessage = {
  roomId: string;
  userId: string;
  username: string;
  text: string;
};

async function saveMessage(newMessage: NewMessage) {
  const savedMessage = await Message.create(newMessage);
  return savedMessage.toObject();
}

async function getRecentMessages(roomId: string, limit = 50) {
  const newestFirst = await Message.find({ roomId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return newestFirst.reverse();
}

export { Message, saveMessage, getRecentMessages };
