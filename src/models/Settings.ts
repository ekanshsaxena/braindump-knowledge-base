import mongoose, { Schema, Document } from 'mongoose';

const UserCategorySchema = new Schema(
  { name: String, emoji: String },
  { _id: false }
);

export interface ISettings extends Document {
  userId: string;
  anthropicApiKey: string;
  geminiApiKey: string;
  priority: 'anthropic' | 'gemini';
  maxTokens: number;
  userCategories: Array<{ name: string; emoji: string }>;
  onboardingCompleted: boolean;
}

const SettingsSchema = new Schema<ISettings>({
  userId: { type: String, required: true, unique: true, index: true },
  anthropicApiKey: { type: String, default: '' },
  geminiApiKey: { type: String, default: '' },
  priority: { type: String, enum: ['anthropic', 'gemini'], default: 'anthropic' },
  maxTokens: { type: Number, default: 1024 },
  userCategories: [UserCategorySchema],
  onboardingCompleted: { type: Boolean, default: false },
});

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
