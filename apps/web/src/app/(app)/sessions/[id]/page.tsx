'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTelegram } from '@/hooks/use-telegram';
import { api } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PointCard } from '@/components/prayer-points/point-card';
import { PointForm } from '@/components/prayer-points/point-form';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Play,
  Pause,
  CheckCircle2,
  Copy,
  Pencil,
  MoreVertical,
  Plus,
  Radio,
  Calendar,
  Users,
  ListChecks,
  Trash2,
  ClipboardPaste,
  Loader2,
  LayoutTemplate,
} from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  live: { label: 'Live', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 animate-pulse' },
  paused: { label: 'Paused', className: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/15' },
};

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const { initData, isReady } = useTelegram();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pointFormOpen, setPointFormOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [bulkFormOpen, setBulkFormOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [saveTemplateLoading, setSaveTemplateLoading] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await api.getSession(sessionId, initData);
      setSession(res.data);
    } catch (err: any) {
      toast.error('Failed to load session', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [sessionId, initData]);

  useEffect(() => {
    if (isReady) fetchSession();
  }, [isReady, fetchSession]);

  const handleAction = async (action: string) => {
    setActionLoading(true);
    try {
      switch (action) {
        case 'start':
          await api.startSession(sessionId, initData);
          toast.success('Session started');
          router.push(`/sessions/${sessionId}/live`);
          return;
        case 'pause':
          await api.pauseSession(sessionId, initData);
          toast.success('Session paused');
          break;
        case 'resume':
          await api.resumeSession(sessionId, initData);
          toast.success('Session resumed');
          router.push(`/sessions/${sessionId}/live`);
          return;
        case 'complete':
          await api.completeSession(sessionId, initData);
          toast.success('Session completed');
          break;
        case 'duplicate':
          const res = await api.duplicateSession(sessionId, initData);
          toast.success('Session duplicated');
          router.push(`/sessions/${res.data.id}`);
          return;
        case 'delete':
          await api.deleteSession(sessionId, initData);
          toast.success('Session deleted');
          router.push('/sessions');
          return;
      }
      fetchSession();
    } catch (err: any) {
      toast.error(`Failed to ${action}`, { description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPoint = async (data: { title: string; body?: string; sendMode: string }) => {
    try {
      await api.createPoint(sessionId, data, initData);
      toast.success('Point added');
      fetchSession();
    } catch (err: any) {
      toast.error('Failed to add point', { description: err.message });
      throw err;
    }
  };

  const handleEditPoint = async (data: { title: string; body?: string; sendMode: string }) => {
    if (!editingPoint) return;
    try {
      await api.updatePoint(editingPoint.id, data, initData);
      toast.success('Point updated');
      setEditingPoint(null);
      fetchSession();
    } catch (err: any) {
      toast.error('Failed to update point', { description: err.message });
      throw err;
    }
  };

  const handleDeletePoint = async (pointId: string) => {
    try {
      await api.deletePoint(pointId, initData);
      toast.success('Point deleted');
      fetchSession();
    } catch (err: any) {
      toast.error('Failed to delete point', { description: err.message });
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!session) return;
    setSaveTemplateLoading(true);
    try {
      await api.createTemplate(
        { name: session.title, description: session.description, sessionId },
        initData,
      );
      toast.success('Saved as template');
    } catch (err: any) {
      toast.error('Failed to save template', { description: err.message });
    } finally {
      setSaveTemplateLoading(false);
    }
  };

  function parseBulkPrayerPoints(text: string): Array<{ title: string; body: string }> {
    // Split by lines that start with a number (handles "7 Father..." or "7. Father..." patterns)
    const blocks = text.split(/\n(?=\d+[\.\)\s])/).map(b => b.trim()).filter(Boolean);

    if (blocks.length <= 1 && !text.match(/^\d+[\.\)\s]/)) {
      // No numbered pattern found — split by blank lines instead
      return text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map((block, i) => ({
        title: `Prayer Point ${i + 1}`,
        body: block,
      }));
    }

    return blocks.map((block, i) => {
      const numberMatch = block.match(/^(\d+)/);
      const num = numberMatch ? numberMatch[1] : String(i + 1);
      const cleaned = block.replace(/^\d+[\.\)\s]+/, '').trim();
      return {
        title: `Prayer Point ${num}`,
        body: cleaned,
      };
    });
  }

  const parsedBulkPoints = bulkText.trim() ? parseBulkPrayerPoints(bulkText) : [];

  const handleBulkAdd = async () => {
    if (parsedBulkPoints.length === 0) return;
    setBulkSubmitting(true);
    try {
      await api.bulkCreatePoints(sessionId, parsedBulkPoints, initData);
      toast.success(`${parsedBulkPoints.length} prayer points added`);
      setBulkText('');
      setBulkFormOpen(false);
      fetchSession();
    } catch (err: any) {
      toast.error('Failed to add points', { description: err.message });
    } finally {
      setBulkSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh px-5 py-4">
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="size-9 rounded-xl" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="mb-2 h-8 w-3/4" />
        <Skeleton className="mb-4 h-4 w-1/2" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
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

  const status = statusConfig[session.status] || statusConfig.draft;
  const points = session.points || session.prayerPoints || [];

  return (
    <div className="min-h-dvh pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/sessions')}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-primary line-clamp-1">
              {session.title}
            </h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/sessions/${sessionId}/edit`)}>
                <Pencil className="mr-2 size-3.5" />
                Edit Session
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction('duplicate')}>
                <Copy className="mr-2 size-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSaveAsTemplate} disabled={saveTemplateLoading || points.length === 0}>
                <LayoutTemplate className="mr-2 size-3.5" />
                {saveTemplateLoading ? 'Saving...' : 'Save as Template'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => handleAction('delete')}
              >
                <Trash2 className="mr-2 size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Session Meta */}
      <div className="px-5 py-5">
        <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 p-4">
          <div className="flex flex-wrap items-center gap-2.5 text-sm">
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

            {session.scheduledAt && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                {new Date(session.scheduledAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}

            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ListChecks className="size-3" />
              {points.length} points
            </span>
          </div>

          {session.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {session.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {session.status === 'draft' && (
              <Button
                onClick={() => handleAction('start')}
                disabled={actionLoading || points.length === 0}
                className="h-10 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                <Play className="mr-1.5 size-4" />
                Start Session
              </Button>
            )}
            {session.status === 'scheduled' && (
              <Button
                onClick={() => handleAction('start')}
                disabled={actionLoading}
                className="h-10 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                <Play className="mr-1.5 size-4" />
                Start Now
              </Button>
            )}
            {session.status === 'live' && (
              <>
                <Button
                  onClick={() => router.push(`/sessions/${sessionId}/live`)}
                  className="h-10 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                >
                  <Radio className="mr-1.5 size-4" />
                  Open Live Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction('pause')}
                  disabled={actionLoading}
                  className="h-10"
                >
                  <Pause className="mr-1.5 size-4" />
                  Pause
                </Button>
              </>
            )}
            {session.status === 'paused' && (
              <>
                <Button
                  onClick={() => handleAction('resume')}
                  disabled={actionLoading}
                  className="h-10 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                >
                  <Play className="mr-1.5 size-4" />
                  Resume
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction('complete')}
                  disabled={actionLoading}
                  className="h-10"
                >
                  <CheckCircle2 className="mr-1.5 size-4" />
                  Complete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Separator className="mx-5" />

      {/* Prayer Points */}
      <div className="px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Prayer Points
          </h2>
          {session.status !== 'completed' && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBulkFormOpen(true)}
                className="text-accent hover:text-accent hover:bg-accent/10"
              >
                <ClipboardPaste className="mr-1 size-3.5" />
                Bulk Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingPoint(null);
                  setPointFormOpen(true);
                }}
                className="text-accent hover:text-accent hover:bg-accent/10"
              >
                <Plus className="mr-1 size-3.5" />
                Add
              </Button>
            </div>
          )}
        </div>

        {points.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <ListChecks className="size-6 text-muted-foreground" />
            </div>
            <p className="mb-1 text-sm font-medium text-foreground">
              No prayer points yet
            </p>
            <p className="mb-5 text-xs text-muted-foreground">
              Add points to this session to get started
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingPoint(null);
                setPointFormOpen(true);
              }}
              className="border-accent/30 text-accent hover:bg-accent/10"
            >
              <Plus className="mr-1 size-3.5" />
              Add Prayer Point
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {points
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((point: any) => (
                <PointCard
                  key={point.id}
                  point={point}
                  showDragHandle={session.status === 'draft'}
                  showActions={session.status !== 'completed'}
                  onEdit={(p) => {
                    setEditingPoint(p);
                    setPointFormOpen(true);
                  }}
                  onDelete={handleDeletePoint}
                />
              ))}
          </div>
        )}
      </div>

      {/* Point Form Sheet */}
      <PointForm
        open={pointFormOpen}
        onOpenChange={(open) => {
          setPointFormOpen(open);
          if (!open) setEditingPoint(null);
        }}
        onSubmit={editingPoint ? handleEditPoint : handleAddPoint}
        initialData={editingPoint}
        mode={editingPoint ? 'edit' : 'create'}
      />

      {/* Bulk Paste Sheet */}
      <Sheet open={bulkFormOpen} onOpenChange={setBulkFormOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bulk Add Prayer Points</SheetTitle>
            <SheetDescription>
              Paste your numbered prayer points below. Each point should start with a number.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            <Textarea
              placeholder={`Example:\n\n1 Father, I thank You for victory...\n\n2 Father, I praise You for open heavens...\n\n3 Father, I thank You for divine speed...`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={10}
              className="bg-secondary/50 border-border/50 focus:border-accent resize-none text-sm"
            />

            {parsedBulkPoints.length > 0 && (
              <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
                <p className="text-xs font-semibold text-accent">
                  {parsedBulkPoints.length} prayer point{parsedBulkPoints.length !== 1 ? 's' : ''} detected
                </p>
              </div>
            )}
          </div>

          <SheetFooter>
            <Button
              onClick={handleBulkAdd}
              disabled={parsedBulkPoints.length === 0 || bulkSubmitting}
              className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              {bulkSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <ClipboardPaste className="mr-2 size-4" />
                  Add {parsedBulkPoints.length} Points
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
