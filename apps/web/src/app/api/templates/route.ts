import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, badRequest, notFound, forbidden } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  const templates = await prisma.template.findMany({
    where: { workspaceId: auth.workspace.id },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      _count: { select: { prayerPoints: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return success(templates);
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  if (auth.user.role === 'viewer') return forbidden();

  const body = await req.json();
  const { name, description, sessionId } = body;

  if (!name) {
    return badRequest('name is required');
  }

  // If creating from a session, copy its points
  if (sessionId) {
    const session = await prisma.prayerSession.findFirst({
      where: { id: sessionId, workspaceId: auth.workspace.id },
      include: { prayerPoints: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!session) return notFound('Session');

    const template = await prisma.template.create({
      data: {
        workspaceId: auth.workspace.id,
        name,
        description: description || session.description,
        createdById: auth.user.id,
        prayerPoints: {
          create: session.prayerPoints.map((point) => ({
            title: point.title,
            body: point.body,
            orderIndex: point.orderIndex,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, displayName: true, username: true } },
        prayerPoints: { orderBy: { orderIndex: 'asc' } },
      },
    });

    return success(template);
  }

  // Create empty template
  const template = await prisma.template.create({
    data: {
      workspaceId: auth.workspace.id,
      name,
      description: description || null,
      createdById: auth.user.id,
    },
    include: {
      createdBy: { select: { id: true, displayName: true, username: true } },
      prayerPoints: { orderBy: { orderIndex: 'asc' } },
    },
  });

  return success(template);
}
