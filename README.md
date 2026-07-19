# Braindump — AI-Powered Knowledge Base

A personal knowledge management app that uses AI to organize, tag, and surface connections between saved content. It acts like your second brain.

## Stack

- **Next.js 16** + TypeScript
- **MongoDB** (Mongoose) for storage
- **Clerk** for authentication
- **Anthropic Claude + Google Gemini** for AI-powered tagging and summarization
- **Open Graph Scraper** for link metadata extraction
- **Framer Motion** for animations
- **Tailwind CSS** with typography plugin

## Features

- Save links, notes, and snippets with automatic metadata extraction
- AI-generated summaries and tags using Claude/Gemini
- Semantic search across your knowledge base
- Clean, animated UI with dark mode support

## Quickstart

```bash
npm install
cp .env.example .env  # Set MONGODB_URI, CLERK keys, AI API keys
npm run dev           # http://localhost:3000
```

## Architecture

```
src/
├── app/api/         # Next.js API routes (entries, settings)
├── lib/             # AI integration, MongoDB connection, metadata extraction
├── models/          # Mongoose schemas (Entry, Settings)
└── types/           # TypeScript interfaces
```
