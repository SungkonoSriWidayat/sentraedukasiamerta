import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface untuk mendefinisikan tipe data Pesan
export interface IMessage extends Document {
  classId: mongoose.Schema.Types.ObjectId; // Di kelas mana percakapan ini terjadi
  senderId: mongoose.Schema.Types.ObjectId;
  receiverId: mongoose.Schema.Types.ObjectId;
  content: string; // Isi pesan
  timestamp: Date; // Waktu pesan dikirim
}

// Skema untuk model Message
const MessageSchema: Schema<IMessage> = new Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Membuat dan mengekspor model
const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
