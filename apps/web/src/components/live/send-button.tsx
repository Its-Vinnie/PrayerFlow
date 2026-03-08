'use client';

import { Send, Loader2 } from 'lucide-react';

interface SendButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

export function SendButton({
  onClick,
  disabled = false,
  loading = false,
  label = 'Send Next',
}: SendButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative flex h-16 w-full items-center justify-center gap-3
        rounded-2xl border border-accent/30
        bg-gradient-to-r from-accent via-accent/90 to-accent
        text-lg font-bold text-accent-foreground
        shadow-lg shadow-accent/20
        transition-all duration-300 ease-out
        active:scale-[0.97]
        disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed
        ${!disabled && !loading ? 'hover:shadow-xl hover:shadow-accent/30 hover:scale-[1.01]' : ''}
      `}
    >
      {/* Pulse glow ring */}
      {!disabled && !loading && (
        <span className="absolute inset-0 rounded-2xl animate-pulse bg-accent/10 blur-sm" />
      )}

      {/* Subtle shimmer overlay */}
      {!disabled && !loading && (
        <span
          className="absolute inset-0 rounded-2xl opacity-30"
          style={{
            background:
              'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)',
            backgroundSize: '250% 100%',
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        />
      )}

      <span className="relative z-10 flex items-center gap-3">
        {loading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Send className="size-5" />
        )}
        <span>{loading ? 'Sending...' : label}</span>
      </span>
    </button>
  );
}
