'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from '@/hooks/use-telegram';
import { api } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  ScrollText,
  Send,
  Clock,
  Users,
  Bot,
  User,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LogsPage() {
  const { initData, isReady } = useTelegram();
  const [logs, setLogs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedSessionId && selectedSessionId !== 'all') {
        params.sessionId = selectedSessionId;
      }

      const [logsRes, sessionsRes] = await Promise.all([
        api.getLogs(params, initData),
        api.getSessions(initData),
      ]);
      setLogs(logsRes.data || []);
      setSessions(sessionsRes.data || []);
    } catch (err: any) {
      toast.error('Failed to load logs', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [initData, selectedSessionId]);

  useEffect(() => {
    if (isReady) fetchData();
  }, [isReady, fetchData]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="px-5 py-4">
          <h1 className="text-xl font-bold tracking-tight text-primary">
            Logs
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            History of sent prayer points
          </p>
        </div>

        {/* Filter */}
        {sessions.length > 0 && (
          <div className="px-5 pb-3">
            <Select value={selectedSessionId} onValueChange={(v) => setSelectedSessionId(v ?? 'all')}>
              <SelectTrigger className="h-9 w-full bg-secondary/50 border-border/50 text-xs">
                <SelectValue placeholder="Filter by session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="px-5 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl border border-border/50 p-3.5">
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="mb-2 h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
              <ScrollText className="size-9 text-accent" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              No logs yet
            </h2>
            <p className="max-w-[260px] text-sm leading-relaxed text-muted-foreground">
              Logs will appear here once prayer points are sent during a live
              session.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-border/50 bg-card/50 p-3.5 transition-colors hover:border-border"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Send className="size-3 shrink-0 text-accent" />
                      <p className="truncate text-sm font-medium text-foreground">
                        {log.pointTitle || log.prayerPoint?.title || 'Prayer Point'}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {log.sessionTitle && (
                        <span className="text-[11px] text-muted-foreground">
                          {log.sessionTitle}
                        </span>
                      )}

                      {(log.groupName || log.group?.name) && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="size-2.5" />
                          {log.groupName || log.group?.name}
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-2.5" />
                        {formatTime(log.sentAt || log.createdAt)}
                      </span>

                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        {log.sentBy === 'scheduler' || log.sentBy === 'auto' ? (
                          <Bot className="size-2.5" />
                        ) : (
                          <User className="size-2.5" />
                        )}
                        {log.sentBy || 'manual'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {log.status === 'failed' ? (
                      <Badge className="rounded-full border border-red-500/20 bg-red-500/15 px-2 py-0 text-[10px] font-semibold text-red-400">
                        Failed
                      </Badge>
                    ) : (
                      <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/15 px-2 py-0 text-[10px] font-semibold text-emerald-400">
                        Sent
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
