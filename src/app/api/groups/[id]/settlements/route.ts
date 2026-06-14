import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { amount, currency, paidById, paidToId } = body;

    const settlement = await prisma.settlement.create({
      data: {
        groupId: id,
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        date: new Date(),
        paidById,
        paidToId
      }
    });

    return NextResponse.json(settlement);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
