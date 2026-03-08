'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/use-telegram';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function NewSessionPage() {
  const router = useRouter();
  const { initData, isReady } = useTelegram();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    if (isReady) {
      api
        .getGroups(initData)
        .then((res) => setGroups(res.data || []))
        .catch(() => {})
        .finally(() => setLoadingGroups(false));
    }
  }, [isReady, initData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !groupId) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        groupId,
      };
      if (description.trim()) payload.description = description.trim();
      if (scheduledAt) payload.scheduledAt = new Date(scheduledAt).toISOString();

      const res = await api.createSession(payload, initData);
      toast.success('Session created');
      router.push(`/sessions/${res.data.id}`);
    } catch (err: any) {
      toast.error('Failed to create session', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              New Session
            </h1>
            <p className="text-xs text-muted-foreground">
              Create a prayer session
            </p>
          </div>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 py-6">
        <div className="space-y-6">
          {/* Title */}
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

          {/* Description */}
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

          {/* Group */}
          <div className="space-y-2">
            <Label
              htmlFor="group"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Telegram Group
            </Label>
            {loadingGroups ? (
              <div className="flex h-12 items-center rounded-lg border border-border/50 bg-secondary/50 px-3 text-sm text-muted-foreground">
                Loading groups...
              </div>
            ) : groups.length === 0 ? (
              <div className="flex h-12 items-center rounded-lg border border-border/50 bg-secondary/50 px-3 text-sm text-muted-foreground">
                No groups available. Add the bot to a group first.
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

          {/* Scheduled Start */}
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

        {/* Submit */}
        <div className="mt-10">
          <Button
            type="submit"
            disabled={!title.trim() || !groupId || isSubmitting}
            className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-5" />
                Create Session
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
