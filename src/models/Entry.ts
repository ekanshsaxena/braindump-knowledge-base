import mongoose, { Schema, Document } from 'mongoose';

const EntryCategorySchema = new Schema(
  { name: String, emoji: String },
  { _id: false }
);

export interface IEntry extends Document {
  userId: string;
  content: string;
  type: 'text' | 'url' | 'mixed';
  url?: string;
  urlMetadata?: {
    title: string;
    description: string;
    thumbnail: string;
    favicon: string;
    siteName: string;
    url: string;
  };
  categories: Array<{ name: string; emoji: string }>;
  tags: string[];
  title: string;
  summary: string;
  insight?: string;
  sourceContent?: string;
  pinned?: boolean;
  archived?: boolean;
  editedAt?: Date;
  readingTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

const EntrySchema = new Schema<IEntry>(
  {
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'url', 'mixed'], required: true },
    url: { type: String },
    urlMetadata: {
      title: String,
      description: String,
      thumbnail: String,
      favicon: String,
      siteName: String,
      url: String,
    },
    categories: [EntryCategorySchema],
    tags: [{ type: String }],
    title: { type: String, default: '' },
    summary: { type: String, default: '' },
    insight: { type: String, default: '' },
    sourceContent: { type: String, default: '' },
    pinned: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    editedAt: { type: Date },
    readingTime: { type: Number, default: 1 },
  },
  { timestamps: true }
);

EntrySchema.index({ content: 'text', tags: 'text', title: 'text', summary: 'text', insight: 'text', 'categories.name': 'text' });
EntrySchema.index({ userId: 1, 'categories.name': 1 });
EntrySchema.index({ userId: 1, pinned: -1, createdAt: -1 });
EntrySchema.index({ userId: 1, archived: 1, createdAt: -1 });
EntrySchema.index({ tags: 1 });

export default mongoose.models.Entry || mongoose.model<IEntry>('Entry', EntrySchema);
