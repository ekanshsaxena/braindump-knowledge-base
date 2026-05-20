import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'BrainDump — Your Personal Knowledge Base',
  description: 'Dump your thoughts, links, and learnings. AI auto-categorizes everything.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t!=='light');})()`,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col">
          {children}
          <ToastProvider />
        </body>
      </html>
    </ClerkProvider>
  );
}
