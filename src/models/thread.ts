import mongoose, { Schema, Document } from 'mongoose';

import { Thread as ThreadType } from '../typings/server';

interface ThreadModel extends Document {
  subject: string;
  comment: string;
  num: string;
}

const ThreadSchema = new Schema<ThreadType>({
  subject: String,
  comment: String,
  num: {
    type: String,
    unique: true,
  },
});

export default mongoose.model<ThreadModel>('threads', ThreadSchema);
