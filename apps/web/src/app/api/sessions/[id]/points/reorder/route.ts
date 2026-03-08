import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, badRequest, notFound, forbidden } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  if (auth.user.role === 'viewer') return forbidden();

  const { id } = await params;

  const session = await prisma.prayerSession.findFirst({
    where: { id, workspaceId: auth.workspace.id },
  });
  if (!session) return notFound('Session');

  const body = await req.json();
  const { pointIds } = body;

  if (!Array.isArray(pointIds) || pointIds.length === 0) {
    return badRequest('pointIds must be a non-empty array');
  }

  // Verify all points belong to this session
  const points = await prisma.prayerPoint.findMany({
    where: { sessionId: id },
    select: { id: true },
  });
  const sessionPointIds = new Set(points.map((p) => p.id));
  for (const pid of pointIds) {
    if (!sessionPointIds.has(pid)) {
      return badRequest(`Point ${pid} does not belong to this session`);
    }
  }

  // Update order indices in a transaction
  await prisma.$transaction(
    pointIds.map((pointId: string, index: number) =>
      prisma.prayerPoint.update({
        where: { id: pointId },
        data: { orderIndex: index },
      })
    )
  );

  const updatedPoints = await prisma.prayerPoint.findMany({
    where: { sessionId: id },
    orderBy: { orderIndex: 'asc' },
  });

  return success(updatedPoints);
}
