'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
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
import { Loader2 } from 'lucide-react';

interface PointFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    body?: string;
    sendMode: string;
  }) => Promise<void>;
  initialData?: {
    title: string;
    body?: string;
    sendMode?: string;
  } | null;
  mode?: 'create' | 'edit';
}

export function PointForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'create',
}: PointFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sendMode, setSendMode] = useState('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setBody(initialData.body || '');
      setSendMode(initialData.sendMode || 'manual');
    } else {
      setTitle('');
      setBody('');
      setSendMode('manual');
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim() || undefined,
        sendMode,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>
            {mode === 'edit' ? 'Edit Prayer Point' : 'Add Prayer Point'}
          </SheetTitle>
          <SheetDescription>
            {mode === 'edit'
              ? 'Update this prayer point'
              : 'Add a new prayer point to this session'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4">
          <div className="space-y-2">
            <Label htmlFor="point-title" className="text-xs font-medium text-muted-foreground">
              Title
            </Label>
            <Input
              id="point-title"
              placeholder="e.g., Prayer for healing"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 bg-secondary/50 border-border/50 focus:border-accent"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="point-body" className="text-xs font-medium text-muted-foreground">
              Body / Details (optional)
            </Label>
            <Textarea
              id="point-body"
              placeholder="Additional details or the full prayer text..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="bg-secondary/50 border-border/50 focus:border-accent resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="send-mode" className="text-xs font-medium text-muted-foreground">
              Send Mode
            </Label>
            <Select value={sendMode} onValueChange={(v) => setSendMode(v ?? 'manual')}>
              <SelectTrigger className="h-11 bg-secondary/50 border-border/50">
                <SelectValue placeholder="Select send mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="auto">Auto (timed)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {mode === 'edit' ? 'Updating...' : 'Adding...'}
              </>
            ) : mode === 'edit' ? (
              'Update Point'
            ) : (
              'Add Point'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
