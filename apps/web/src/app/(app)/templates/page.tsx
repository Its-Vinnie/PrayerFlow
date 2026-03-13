'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/use-telegram';
import { api } from '@/lib/api-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LayoutTemplate,
  ListChecks,
  Copy,
  Loader2,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function TemplatesPage() {
  const router = useRouter();
  const { initData, isReady } = useTelegram();
  const [templates, setTemplates] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet state for "use template"
  const [useSheetOpen, setUseSheetOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tRes, gRes] = await Promise.all([
        api.getTemplates(initData),
        api.getGroups(initData),
      ]);
      setTemplates(tRes.data || []);
      setGroups(gRes.data || []);
    } catch (err: any) {
      toast.error('Failed to load templates', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [initData]);

  useEffect(() => {
    if (isReady) fetchData();
  }, [isReady, fetchData]);

  const handleDeleteTemplate = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    try {
      await api.deleteTemplate(templateId, initData);
      toast.success('Template deleted');
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (err: any) {
      toast.error('Failed to delete', { description: err.message });
    }
  };

  const openUseSheet = (template: any) => {
    setSelectedTemplate(template);
    setSessionTitle(template.name || template.title || '');
    setSelectedGroupId('');
    setUseSheetOpen(true);
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate || !sessionTitle.trim() || !selectedGroupId) return;

    setCreating(true);
    try {
      const res = await api.createFromTemplate(
        selectedTemplate.id,
        { title: sessionTitle.trim(), groupId: selectedGroupId },
        initData
      );
      toast.success('Session created from template');
      setUseSheetOpen(false);
      router.push(`/sessions/${res.data.id}`);
    } catch (err: any) {
      toast.error('Failed to create session', { description: err.message });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="px-5 py-4">
          <h1 className="text-xl font-bold tracking-tight text-primary">
            Templates
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Reusable prayer session templates
          </p>
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
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
              <LayoutTemplate className="size-9 text-accent" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              No templates yet
            </h2>
            <p className="max-w-[260px] text-sm leading-relaxed text-muted-foreground">
              Templates will appear here when they are created. Use templates to
              quickly set up recurring prayer sessions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/80 transition-all duration-200 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 active:scale-[0.98]"
                onClick={() => openUseSheet(template)}
              >
                <CardHeader>
                  <CardTitle className="text-primary">
                    {template.name || template.title}
                  </CardTitle>
                  <CardAction>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </CardAction>
                  {template.description && (
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ListChecks className="size-3" />
                        {template.pointCount || template._count?.prayerPoints || template.points?.length || 0}{' '}
                        points
                      </span>
                      <Badge className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0 text-[10px] font-semibold text-accent">
                        Template
                      </Badge>
                    </div>
                    <button
                      onClick={(e) => handleDeleteTemplate(e, template.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Use Template Sheet */}
      <Sheet open={useSheetOpen} onOpenChange={setUseSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Use Template</SheetTitle>
            <SheetDescription>
              Create a new session from &quot;{selectedTemplate?.name || selectedTemplate?.title}&quot;
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Session Title
              </Label>
              <Input
                placeholder="Session title"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="h-11 bg-secondary/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Telegram Group
              </Label>
              <Select
                value={selectedGroupId}
                onValueChange={(v) => setSelectedGroupId(v ?? '')}
              >
                <SelectTrigger className="h-11 w-full bg-secondary/50 border-border/50">
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
            </div>
          </div>

          <SheetFooter>
            <Button
              onClick={handleUseTemplate}
              disabled={
                !sessionTitle.trim() || !selectedGroupId || creating
              }
              className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Copy className="mr-2 size-4" />
                  Create Session
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
