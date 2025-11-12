import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface untuk TypeScript
export interface IOrder extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  classId: mongoose.Schema.Types.ObjectId;
  status: 'pending' | 'paid' | 'verified' | 'cancelled';
  paymentProof?: string;
  orderDate: Date;
  price: number;
}

// Skema untuk Mongoose
const OrderSchema: Schema<IOrder> = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // <-- INI KUNCINYA: Menghubungkan ke model 'User'
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class', // <-- INI KUNCINYA: Menghubungkan ke model 'Class'
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'verified', 'cancelled'],
    default: 'pending',
  },
  paymentProof: {
    type: String,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  price: {
    type: Number,
    required: true,
  }
});

// Mencegah Mongoose mengompilasi model yang sama lebih dari sekali
const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
