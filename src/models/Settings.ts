import mongoose, { Schema, Document } from 'mongoose';

const UserCategorySchema = new Schema(
  { name: String, emoji: String },
  { _id: false }
);

export interface ISettings extends Document {
  userId: string;
  geminiApiKey: string;
  maxTokens: number;
  userCategories: Array<{ name: string; emoji: string }>;
  onboardingCompleted: boolean;
}

const SettingsSchema = new Schema<ISettings>({
  userId: { type: String, required: true, unique: true, index: true },
  geminiApiKey: { type: String, default: '' },
  maxTokens: { type: Number, default: 1024 },
  userCategories: [UserCategorySchema],
  onboardingCompleted: { type: Boolean, default: false },
});

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
