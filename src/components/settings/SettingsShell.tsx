'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { Bot, Tag, Palette, User, Folder } from 'lucide-react';
import AITab from './AITab';
import CategoriesTab from './CategoriesTab';
import TagsTab from './TagsTab';
import AppearanceTab from './AppearanceTab';
import AccountTab from './AccountTab';

const tabs = [
  { id: 'ai', label: 'AI & Providers', Icon: Bot },
  { id: 'categories', label: 'Categories', Icon: Folder },
  { id: 'tags', label: 'Tags', Icon: Tag },
  { id: 'appearance', label: 'Appearance', Icon: Palette },
  { id: 'account', label: 'Account', Icon: User },
];

export default function SettingsShell() {
  return (
    <Tabs.Root defaultValue="ai" className="flex flex-col gap-6">
      <Tabs.List
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'var(--surface-raised)' }}
      >
        {tabs.map(({ id, label, Icon }) => (
          <Tabs.Trigger
            key={id}
            value={id}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 data-[state=active]:shadow-sm"
            style={{
              color: 'var(--text-secondary)',
            }}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:block">{label}</span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value="ai"><AITab /></Tabs.Content>
      <Tabs.Content value="categories"><CategoriesTab /></Tabs.Content>
      <Tabs.Content value="tags"><TagsTab /></Tabs.Content>
      <Tabs.Content value="appearance"><AppearanceTab /></Tabs.Content>
      <Tabs.Content value="account"><AccountTab /></Tabs.Content>
    </Tabs.Root>
  );
}
