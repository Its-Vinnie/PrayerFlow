'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/use-telegram';
import { api } from '@/lib/api-client';
import { SessionCard } from '@/components/sessions/session-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function SessionsPage() {
  const router = useRouter();
  const { initData, isReady } = useTelegram();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.getSessions(initData);
      setSessions(res.data || []);
    } catch (err: any) {
      toast.error('Failed to load sessions', {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [initData]);

  useEffect(() => {
    if (isReady) {
      fetchSessions();
    }
  }, [isReady, fetchSessions]);

  return (
    <div className="relative min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary">
              Sessions
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Manage your prayer sessions
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/sessions/new')}
            className="border-accent/30 text-accent hover:bg-accent/10 hover:text-accent"
          >
            <Plus className="mr-1 size-3.5" />
            New
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="px-5 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border/50 p-4">
                <Skeleton className="mb-3 h-5 w-3/4" />
                <Skeleton className="mb-2 h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
              <BookOpen className="size-9 text-accent" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              No sessions yet
            </h2>
            <p className="mb-8 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
              Create your first prayer session to start organizing and sending
              prayer points to your groups.
            </p>
            <Button
              onClick={() => router.push('/sessions/new')}
              className="h-11 bg-accent px-6 text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              <Plus className="mr-2 size-4" />
              Create Session
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Live sessions first */}
            {sessions
              .sort((a, b) => {
                const order = ['live', 'paused', 'scheduled', 'draft', 'completed'];
                return order.indexOf(a.status) - order.indexOf(b.status);
              })
              .map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {!loading && sessions.length > 0 && (
        <button
          onClick={() => router.push('/sessions/new')}
          className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/25 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-accent/30 active:scale-95"
        >
          <Plus className="size-6" />
        </button>
      )}
    </div>
  );
}
