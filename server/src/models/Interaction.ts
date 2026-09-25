import mongoose, { Document, Schema } from 'mongoose';

export interface IInteraction extends Document {
  user: mongoose.Types.ObjectId;
  type: string;
  metadata: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

InteractionSchema.index({ user: 1, timestamp: -1 });

const InteractionMongoose = mongoose.model<IInteraction>('Interaction', InteractionSchema);
import { createModelBridge } from './modelBridge.js';
export const Interaction = createModelBridge('Interaction', InteractionMongoose);
