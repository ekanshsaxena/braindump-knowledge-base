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
  insight?: string;
  sourceContent?: string;
  pinned?: boolean;
  archived?: boolean;
  editedAt?: string;
  readingTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  name: string;
  emoji: string;
  count: number;
}

export interface Tag {
  name: string;
  count: number;
}

export interface UserCategory {
  name: string;
  emoji: string;
}

export interface AppSettings {
  geminiApiKey: string;
  maxTokens: number;
  userCategories: UserCategory[];
  onboardingCompleted: boolean;
}

export interface CategorizeResult {
  categories: EntryCategory[];
  tags: string[];
  title: string;
  summary: string;
  insight?: string;
  readingTime?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ id: string; title: string }>;
  timestamp: number;
  streaming?: boolean;
}

export interface FilterState {
  search?: string;
  category?: string;
  tag?: string;
  pinned?: boolean;
  archived?: boolean;
  type?: 'url' | 'text' | 'mixed';
  sort?: 'newest' | 'oldest';
}
