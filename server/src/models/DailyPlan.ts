import mongoose, { Document, Schema } from 'mongoose';

export interface IAdaptationRecord {
  reason: string;
  trigger: string;
  beforeSummary: string;
  afterSummary: string;
  timestamp: Date;
}

export interface IDailyPlan extends Document {
  user: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  focusGoal: string;
  totalDuration: number;
  energyLevel: string;
  preferredStyle: string;
  tasks: mongoose.Types.ObjectId[];
  adaptationHistory: IAdaptationRecord[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DailyPlanSchema = new Schema<IDailyPlan>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    focusGoal: { type: String, required: true },
    totalDuration: { type: Number, default: 60 },
    energyLevel: { type: String, default: 'Medium' },
    preferredStyle: { type: String, default: 'Practical' },
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    adaptationHistory: [
      {
        reason: { type: String, required: true },
        trigger: { type: String, default: 'feedback' },
        beforeSummary: { type: String, required: true },
        afterSummary: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DailyPlanSchema.index({ user: 1, date: 1 });

const DailyPlanMongoose = mongoose.model<IDailyPlan>('DailyPlan', DailyPlanSchema);
import { createModelBridge } from './modelBridge.js';
export const DailyPlan = createModelBridge('DailyPlan', DailyPlanMongoose);
