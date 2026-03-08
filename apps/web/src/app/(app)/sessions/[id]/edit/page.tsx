'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTelegram } from '@/hooks/use-telegram';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const { initData, isReady } = useTelegram();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;

    const load = async () => {
      try {
        const [sessionRes, groupsRes] = await Promise.all([
          api.getSession(sessionId, initData),
          api.getGroups(initData),
        ]);
        const s = sessionRes.data;
        setTitle(s.title || '');
        setDescription(s.description || '');
        setGroupId(s.groupId || '');
        if (s.scheduledAt) {
          // Format for datetime-local input
          const dt = new Date(s.scheduledAt);
          const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setScheduledAt(local);
        }
        setGroups(groupsRes.data || []);
      } catch (err: any) {
        toast.error('Failed to load session', { description: err.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isReady, sessionId, initData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !groupId) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        groupId,
        description: description.trim() || null,
      };
      if (scheduledAt) {
        payload.scheduledAt = new Date(scheduledAt).toISOString();
      } else {
        payload.scheduledAt = null;
      }

      await api.updateSession(sessionId, payload, initData);
      toast.success('Session updated');
      router.push(`/sessions/${sessionId}`);
    } catch (err: any) {
      toast.error('Failed to update session', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh px-5 py-4">
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="size-9 rounded-xl" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-primary">
              Edit Session
            </h1>
            <p className="text-xs text-muted-foreground">
              Update session details
            </p>
          </div>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 py-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Session Title
            </Label>
            <Input
              id="title"
              placeholder="e.g., Sunday Morning Prayers"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 bg-secondary/50 border-border/50 text-base focus:border-accent"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Description{' '}
              <span className="font-normal normal-case text-muted-foreground/60">
                (optional)
              </span>
            </Label>
            <Textarea
              id="description"
              placeholder="Brief description of this session..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-secondary/50 border-border/50 text-sm focus:border-accent resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="group"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Telegram Group
            </Label>
            {groups.length === 0 ? (
              <div className="flex h-12 items-center rounded-lg border border-border/50 bg-secondary/50 px-3 text-sm text-muted-foreground">
                No groups available
              </div>
            ) : (
              <Select value={groupId} onValueChange={(v) => setGroupId(v ?? '')} required>
                <SelectTrigger className="h-12 w-full bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name || group.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="scheduledAt"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Scheduled Start{' '}
              <span className="font-normal normal-case text-muted-foreground/60">
                (optional)
              </span>
            </Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="h-12 bg-secondary/50 border-border/50 text-sm focus:border-accent"
            />
          </div>
        </div>

        <div className="mt-10">
          <Button
            type="submit"
            disabled={!title.trim() || !groupId || isSubmitting}
            className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
