import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  user: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  duration: number; // minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  whyExplanation: {
    points: string[];
    confidence: number;
    primaryFactor?: string;
  };
  adaptationNotice?: {
    wasAdapted: boolean;
    reason?: string;
    before?: {
      duration: number;
      difficulty: string;
      category?: string;
    };
  };
  order: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'DailyPlan' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    category: { type: String, default: 'General' },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending',
    },
    whyExplanation: {
      points: { type: [String], default: [] },
      confidence: { type: Number, default: 80 },
      primaryFactor: { type: String, default: 'Personalized to your learning style' },
    },
    adaptationNotice: {
      wasAdapted: { type: Boolean, default: false },
      reason: { type: String },
      before: {
        duration: { type: Number },
        difficulty: { type: String },
        category: { type: String },
      },
    },
    order: { type: Number, default: 1 },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const TaskMongoose = mongoose.model<ITask>('Task', TaskSchema);
import { createModelBridge } from './modelBridge.js';
export const Task = createModelBridge('Task', TaskMongoose);
