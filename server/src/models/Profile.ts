import mongoose, { Document, Schema } from 'mongoose';

export interface IProfile extends Document {
  user: mongoose.Types.ObjectId;
  learningBio: string;
  preferredWorkHours: string;
  cognitivePacing: string;
  adaptabilityScore: number;
  totalTasksCompleted: number;
  totalMinutesLearned: number;
  streakDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    learningBio: { type: String, default: '' },
    preferredWorkHours: { type: String, default: 'Flexible' },
    cognitivePacing: { type: String, default: 'Balanced' },
    adaptabilityScore: { type: Number, default: 85 },
    totalTasksCompleted: { type: Number, default: 0 },
    totalMinutesLearned: { type: Number, default: 0 },
    streakDays: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const ProfileMongoose = mongoose.model<IProfile>('Profile', ProfileSchema);
import { createModelBridge } from './modelBridge.js';
export const Profile = createModelBridge('Profile', ProfileMongoose);
