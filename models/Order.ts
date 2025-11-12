import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrder extends Document {
  classId: Types.ObjectId;
  studentId: Types.ObjectId;
  tutorId: Types.ObjectId;
  amount: number;
  status: 'pending_payment' | 'pending_verification' | 'completed' | 'rejected';
  paymentProofUrl?: string; // URL bukti pembayaran dari Cloudinary
  createdAt: Date;
}

const OrderSchema: Schema = new Schema({
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending_payment', 'pending_verification', 'completed', 'rejected'], 
    default: 'pending_payment' 
  },
  paymentProofUrl: { type: String },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
