// models/Slide.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISlide extends Document {
  title: string;
  subtitle: string;
  image: string; // URL ke gambar
  buttonText: string;
}

const SlideSchema: Schema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  image: { type: String, required: true },
  buttonText: { type: String, required: true },
});

export default mongoose.models.Slide || mongoose.model<ISlide>('Slide', SlideSchema);