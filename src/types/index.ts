export interface UrlMetadata {
  title: string;
  description: string;
  thumbnail: string;
  favicon: string;
  siteName: string;
  url: string;
}

export interface EntryCategory {
  name: string;
  emoji: string;
}

export interface Entry {
  _id: string;
  userId: string;
  content: string;
  type: 'text' | 'url' | 'mixed';
  url?: string;
  urlMetadata?: UrlMetadata;
  categories: EntryCategory[];
  tags: string[];
  title: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  name: string;
  emoji: string;
  count: number;
}

export interface UserCategory {
  name: string;
  emoji: string;
}

export interface AppSettings {
  anthropicApiKey: string;
  geminiApiKey: string;
  priority: 'anthropic' | 'gemini';
  maxTokens: number;
  userCategories: UserCategory[];
  onboardingCompleted: boolean;
}

export interface CategorizeResult {
  categories: EntryCategory[];
  tags: string[];
  title: string;
  summary: string;
}
