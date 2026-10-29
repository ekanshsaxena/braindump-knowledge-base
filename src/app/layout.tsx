import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'BrainDump — Your Second Brain',
  description: 'Dump your thoughts, links, and learnings. AI organizes everything into your second brain.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} antialiased dark`} suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}}catch(e){}})()`,
            }}
          />
        </head>
        <body className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
          {children}
          <ToastProvider />
        </body>
      </html>
    </ClerkProvider>
  );
}
