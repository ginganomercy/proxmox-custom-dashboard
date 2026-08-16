import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCard({ className, children, ...props }: GlassCardProps) {
  return (
    <div className={cn('bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-800 shadow-xl shadow-blue-900/5 dark:shadow-slate-950/50 rounded-3xl p-6 transition-colors', className)} {...props}>
      {children}
    </div>
  );
}
