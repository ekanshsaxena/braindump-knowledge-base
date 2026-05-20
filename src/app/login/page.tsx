import { SignIn } from '@clerk/nextjs';
import { Brain } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/40">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">BrainDump</h1>
            <p className="text-sm text-zinc-400 mt-1">Your personal AI-powered knowledge base</p>
          </div>
        </div>

        <SignIn afterSignInUrl="/" afterSignUpUrl="/" />
      </div>
    </div>
  );
}
