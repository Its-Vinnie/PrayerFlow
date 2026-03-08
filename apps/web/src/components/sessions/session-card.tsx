'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  ListChecks,
  Users,
  ChevronRight,
} from 'lucide-react';

interface SessionCardProps {
  session: {
    id: string;
    title: string;
    description?: string;
    status: string;
    groupName?: string;
    scheduledAt?: string;
    createdAt?: string;
    pointCount?: number;
    sentCount?: number;
  };
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  },
  live: {
    label: 'Live',
    className:
      'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 animate-pulse',
  },
  paused: {
    label: 'Paused',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/15',
  },
};

export function SessionCard({ session }: SessionCardProps) {
  const router = useRouter();
  const status = statusConfig[session.status] || statusConfig.draft;

  const formattedDate = session.scheduledAt
    ? new Date(session.scheduledAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : session.createdAt
      ? new Date(session.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : null;

  return (
    <Card
      className="cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/80 transition-all duration-200 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 active:scale-[0.98]"
      onClick={() => {
        if (session.status === 'live' || session.status === 'paused') {
          router.push(`/sessions/${session.id}/live`);
        } else {
          router.push(`/sessions/${session.id}`);
        }
      }}
    >
      <CardHeader>
        <CardTitle className="text-primary">{session.title}</CardTitle>
        <CardAction>
          <ChevronRight className="size-4 text-muted-foreground" />
        </CardAction>
        {session.description && (
          <CardDescription className="line-clamp-1">
            {session.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            className={`${status.className} rounded-full border px-2.5 py-0.5 text-[11px] font-semibold`}
          >
            {status.label}
          </Badge>

          {session.groupName && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3" />
              {session.groupName}
            </span>
          )}

          {formattedDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              {formattedDate}
            </span>
          )}

          {session.pointCount !== undefined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ListChecks className="size-3" />
              {session.sentCount !== undefined
                ? `${session.sentCount}/${session.pointCount}`
                : session.pointCount}{' '}
              points
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
