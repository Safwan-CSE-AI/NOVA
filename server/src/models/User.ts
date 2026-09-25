import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  goal: string;
  availableTime: string; // e.g. "30 min", "1 hour", "2 hours", "3 hours", "4+ hours"
  energyLevel: 'Low' | 'Medium' | 'High';
  preferredStyle: 'Practical' | 'Visual' | 'Theoretical' | 'Mixed';
  focusDuration: number; // 15, 25, 45, 60 minutes
  preferredDifficulty: 'Easy' | 'Medium' | 'Hard';
  preferences: string[];
  strengths: string[];
  weaknesses: string[];
  isOnboarded: boolean;
  isDemoUser?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    goal: { type: String, default: 'Master key concepts through personalized learning' },
    availableTime: { type: String, default: '2 hours' },
    energyLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    preferredStyle: { type: String, enum: ['Practical', 'Visual', 'Theoretical', 'Mixed'], default: 'Practical' },
    focusDuration: { type: Number, default: 25 },
    preferredDifficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    preferences: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    isOnboarded: { type: Boolean, default: false },
    isDemoUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserMongoose = mongoose.model<IUser>('User', UserSchema);
import { createModelBridge } from './modelBridge.js';
export const User = createModelBridge('User', UserMongoose);
