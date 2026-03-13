import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, notFound, forbidden, badRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  const { id } = await params;

  const template = await prisma.template.findFirst({
    where: { id, workspaceId: auth.workspace.id },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      prayerPoints: { orderBy: { orderIndex: 'asc' } },
    },
  });

  if (!template) return notFound('Template');

  return success(template);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  if (auth.user.role === 'viewer') return forbidden();

  const { id } = await params;

  const template = await prisma.template.findFirst({
    where: { id, workspaceId: auth.workspace.id },
  });
  if (!template) return notFound('Template');

  const body = await req.json();
  const { name, description } = body;

  const updated = await prisma.template.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      prayerPoints: { orderBy: { orderIndex: 'asc' } },
    },
  });

  return success(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  if (auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
    return forbidden();
  }

  const { id } = await params;

  const template = await prisma.template.findFirst({
    where: { id, workspaceId: auth.workspace.id },
  });
  if (!template) return notFound('Template');

  await prisma.template.delete({ where: { id } });

  return success({ deleted: true });
}
