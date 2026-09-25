import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  task: mongoose.Types.ObjectId;
  taskTitle: string;
  difficultyFeedback: 'Too Difficult' | 'Just Right' | 'Too Easy';
  helpfulness: 'Yes' | 'Somewhat' | 'No';
  requestedChange: 'Easier' | 'Harder' | 'Shorter' | 'More examples' | 'More explanation';
  comment: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    taskTitle: { type: String, default: '' },
    difficultyFeedback: {
      type: String,
      enum: ['Too Difficult', 'Just Right', 'Too Easy'],
      required: true,
    },
    helpfulness: {
      type: String,
      enum: ['Yes', 'Somewhat', 'No'],
      required: true,
    },
    requestedChange: {
      type: String,
      enum: ['Easier', 'Harder', 'Shorter', 'More examples', 'More explanation'],
      required: true,
    },
    comment: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const FeedbackMongoose = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
import { createModelBridge } from './modelBridge.js';
export const Feedback = createModelBridge('Feedback', FeedbackMongoose);
