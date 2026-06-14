import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateNetBalances } from '@/lib/balances';

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const expenses = await prisma.expense.findMany({
      where: { groupId: id },
      include: { splits: { include: { user: true } }, paidBy: true },
      orderBy: { date: 'desc' }
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId: id },
      include: { paidBy: true, paidTo: true }
    });

    const { rawBalances, simplifiedDebts } = calculateNetBalances(expenses, settlements);

    return NextResponse.json({ expenses, settlements, rawBalances, simplifiedDebts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
