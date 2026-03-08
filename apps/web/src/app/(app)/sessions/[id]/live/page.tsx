'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTelegram } from '@/hooks/use-telegram';
import { api } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendButton } from '@/components/live/send-button';
import { PointCard } from '@/components/prayer-points/point-card';
import {
  ArrowLeft,
  Pause,
  Play,
  CheckCircle2,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Radio,
} from 'lucide-react';
import { toast } from 'sonner';

const REFRESH_INTERVAL = 5000;

export default function LiveDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const { initData, isReady } = useTelegram();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSent, setShowSent] = useState(false);
  const refreshRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await api.getSession(sessionId, initData);
      setSession(res.data);
    } catch (err: any) {
      toast.error('Failed to refresh', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [sessionId, initData]);

  // Initial load and auto-refresh
  useEffect(() => {
    if (!isReady) return;
    fetchSession();

    refreshRef.current = setInterval(fetchSession, REFRESH_INTERVAL);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [isReady, fetchSession]);

  const handleSendNext = async () => {
    setSending(true);
    try {
      await api.sendNext(sessionId, initData);
      toast.success('Prayer point sent');
      await fetchSession();
    } catch (err: any) {
      toast.error('Failed to send', { description: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleSendNow = async (pointId: string) => {
    try {
      await api.sendNow(sessionId, pointId, initData);
      toast.success('Point sent');
      await fetchSession();
    } catch (err: any) {
      toast.error('Failed to send', { description: err.message });
    }
  };

  const handleSkip = async (pointId: string) => {
    try {
      await api.skipPoint(sessionId, pointId, initData);
      toast.success('Point skipped');
      await fetchSession();
    } catch (err: any) {
      toast.error('Failed to skip', { description: err.message });
    }
  };

  const handlePauseResume = async () => {
    try {
      if (session.status === 'live') {
        await api.pauseSession(sessionId, initData);
        toast.success('Session paused');
      } else {
        await api.resumeSession(sessionId, initData);
        toast.success('Session resumed');
      }
      await fetchSession();
    } catch (err: any) {
      toast.error('Action failed', { description: err.message });
    }
  };

  const handleComplete = async () => {
    try {
      await api.completeSession(sessionId, initData);
      toast.success('Session completed');
      router.push(`/sessions/${sessionId}`);
    } catch (err: any) {
      toast.error('Failed to complete', { description: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col bg-background px-5 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="size-9 rounded-xl" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="mb-4 h-16 w-full rounded-2xl" />
        <Skeleton className="mb-4 h-24 w-full rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-muted-foreground">Session not found</p>
      </div>
    );
  }

  const points = session.points || session.prayerPoints || [];
  const pendingPoints = points
    .filter((p: any) => p.status === 'pending')
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const sentPoints = points
    .filter((p: any) => p.status === 'sent')
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const skippedPoints = points.filter((p: any) => p.status === 'skipped');
  const completedCount = sentPoints.length + skippedPoints.length;
  const totalCount = points.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const nextPoint = pendingPoints[0];
  const isSessionActive = session.status === 'live';
  const isPaused = session.status === 'paused';
  const isCompleted = session.status === 'completed';

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Compact Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.push(`/sessions/${sessionId}`)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-primary">
                {session.title}
              </h1>
              <div className="flex items-center gap-1.5">
                {isSessionActive && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                    <Radio className="size-2.5 animate-pulse" />
                    LIVE
                  </span>
                )}
                {isPaused && (
                  <span className="text-[10px] font-semibold text-amber-400">
                    PAUSED
                  </span>
                )}
                {isCompleted && (
                  <span className="text-[10px] font-semibold text-emerald-500">
                    COMPLETED
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {(isSessionActive || isPaused) && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handlePauseResume}
                className="text-muted-foreground hover:text-foreground"
              >
                {isSessionActive ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
              </Button>
            )}
            {(isSessionActive || isPaused) && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleComplete}
                className="text-muted-foreground hover:text-foreground"
              >
                <CheckCircle2 className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Progress</span>
          <span className="text-xs font-bold text-accent">
            {sentPoints.length}/{totalCount} sent
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Current / Next Point Preview */}
      {nextPoint && !isCompleted && (
        <div className="px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Up Next
          </p>
          <div className="rounded-xl border border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
                {nextPoint.order}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {nextPoint.title}
                </p>
                {nextPoint.body && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {nextPoint.body}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEND NEXT Button - THE HERO */}
      {!isCompleted && (
        <div className="px-4 py-3">
          <SendButton
            onClick={handleSendNext}
            loading={sending}
            disabled={pendingPoints.length === 0 || isPaused}
            label={
              pendingPoints.length === 0
                ? 'All Sent'
                : isPaused
                  ? 'Session Paused'
                  : 'Send Next'
            }
          />

          {isPaused && (
            <p className="mt-2 text-center text-xs text-amber-400">
              Resume the session to continue sending
            </p>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="flex flex-col items-center px-4 py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="size-8 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-foreground">Session Complete</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {sentPoints.length} of {totalCount} points were sent
          </p>
        </div>
      )}

      <Separator className="mx-4" />

      {/* Upcoming Points */}
      <div className="flex-1 px-4 py-3">
        {pendingPoints.length > 1 && (
          <div className="mb-3">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Upcoming ({pendingPoints.length - (nextPoint ? 1 : 0)})
            </p>
            <div className="space-y-2">
              {pendingPoints.slice(1).map((point: any) => (
                <PointCard
                  key={point.id}
                  point={point}
                  showActions={isSessionActive}
                  isLive
                  onSendNow={handleSendNow}
                  onSkip={handleSkip}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sent Points - Collapsible */}
        {sentPoints.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowSent(!showSent)}
              className="mb-2.5 flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              <span>Sent ({sentPoints.length})</span>
              {showSent ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
            {showSent && (
              <div className="space-y-2">
                {sentPoints.map((point: any) => (
                  <PointCard
                    key={point.id}
                    point={point}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skipped Points */}
        {skippedPoints.length > 0 && (
          <div className="mt-4">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Skipped ({skippedPoints.length})
            </p>
            <div className="space-y-2">
              {skippedPoints.map((point: any) => (
                <PointCard
                  key={point.id}
                  point={point}
                  showActions={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
