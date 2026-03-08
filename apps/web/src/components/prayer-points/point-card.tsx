'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  GripVertical,
  MoreVertical,
  Pencil,
  Trash2,
  Send,
  SkipForward,
} from 'lucide-react';

interface PointCardProps {
  point: {
    id: string;
    title: string;
    body?: string;
    order: number;
    status: string;
    sendMode?: string;
  };
  onEdit?: (point: any) => void;
  onDelete?: (pointId: string) => void;
  onSendNow?: (pointId: string) => void;
  onSkip?: (pointId: string) => void;
  showActions?: boolean;
  showDragHandle?: boolean;
  isLive?: boolean;
}

const pointStatusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  },
  sent: {
    label: 'Sent',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  },
  skipped: {
    label: 'Skipped',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  },
  sending: {
    label: 'Sending',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/20 animate-pulse',
  },
};

export function PointCard({
  point,
  onEdit,
  onDelete,
  onSendNow,
  onSkip,
  showActions = true,
  showDragHandle = false,
  isLive = false,
}: PointCardProps) {
  const status = pointStatusConfig[point.status] || pointStatusConfig.pending;

  return (
    <div
      className={`group flex items-start gap-3 rounded-xl border border-border/50 bg-card/50 p-3.5 transition-all duration-200 hover:border-border ${
        point.status === 'sent' ? 'opacity-60' : ''
      }`}
    >
      {showDragHandle && (
        <div className="mt-0.5 cursor-grab text-muted-foreground/40 active:cursor-grabbing">
          <GripVertical className="size-4" />
        </div>
      )}

      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
        {point.order}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-medium leading-snug ${
              point.status === 'sent'
                ? 'text-muted-foreground line-through'
                : 'text-foreground'
            }`}
          >
            {point.title}
          </p>
        </div>

        {point.body && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {point.body}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <Badge
            className={`${status.className} rounded-full border px-2 py-0 text-[10px] font-semibold`}
          >
            {status.label}
          </Badge>
          {point.sendMode && point.sendMode !== 'manual' && (
            <span className="text-[10px] text-muted-foreground">
              {point.sendMode}
            </span>
          )}
        </div>
      </div>

      {showActions && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              />
            }
          >
            <MoreVertical className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(point)}>
                <Pencil className="mr-2 size-3.5" />
                Edit
              </DropdownMenuItem>
            )}
            {isLive && onSendNow && point.status === 'pending' && (
              <DropdownMenuItem onClick={() => onSendNow(point.id)}>
                <Send className="mr-2 size-3.5" />
                Send Now
              </DropdownMenuItem>
            )}
            {isLive && onSkip && point.status === 'pending' && (
              <DropdownMenuItem onClick={() => onSkip(point.id)}>
                <SkipForward className="mr-2 size-3.5" />
                Skip
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(point.id)}
              >
                <Trash2 className="mr-2 size-3.5" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
