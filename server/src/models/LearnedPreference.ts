import mongoose, { Document, Schema } from 'mongoose';

export interface ILearnedPreference extends Document {
  user: mongoose.Types.ObjectId;
  key: string;
  category: string;
  value: string;
  confidence: number; // 0 to 100
  evidenceCount: number;
  source: string;
  lastUpdated: Date;
  history: Array<{
    date: Date;
    note: string;
    deltaConfidence: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const LearnedPreferenceSchema = new Schema<ILearnedPreference>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    key: { type: String, required: true },
    category: { type: String, required: true },
    value: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    evidenceCount: { type: Number, default: 1 },
    source: { type: String, required: true },
    lastUpdated: { type: Date, default: Date.now },
    history: [
      {
        date: { type: Date, default: Date.now },
        note: { type: String },
        deltaConfidence: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

LearnedPreferenceSchema.index({ user: 1, key: 1 }, { unique: true });

const LearnedPreferenceMongoose = mongoose.model<ILearnedPreference>(
  'LearnedPreference',
  LearnedPreferenceSchema
);
import { createModelBridge } from './modelBridge.js';
export const LearnedPreference = createModelBridge('LearnedPreference', LearnedPreferenceMongoose);
