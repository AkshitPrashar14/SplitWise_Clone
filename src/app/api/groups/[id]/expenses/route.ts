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
    const { description, amount, currency, paidById, splitType, splits } = body;

    // Process splits to ensure all users exist and are in the group
    const processedSplits = [];
    let totalSplitCents = 0;

    for (const s of splits) {
      let finalUserId = s.userId;

      if (!finalUserId && s.name) {
        // Try to find if this user already exists in the group by name (case-insensitive)
        const existingMember = await prisma.groupMember.findFirst({
          where: {
            groupId: id,
            user: { name: { equals: s.name, mode: 'insensitive' } }
          },
          include: { user: true }
        });

        if (existingMember) {
          finalUserId = existingMember.userId;
        } else {
          // Create a new "ghost" user for this name
          const dummyEmail = `${s.name.replace(/\s+/g, '').toLowerCase()}_${Date.now()}@splitwise.local`;
          const newUser = await prisma.user.create({
            data: {
              name: s.name,
              email: dummyEmail
            }
          });
          finalUserId = newUser.id;

          // Add them to the group
          await prisma.groupMember.create({
            data: {
              groupId: id,
              userId: finalUserId
            }
          });
        }
      }

      const splitCents = Math.round(s.amount * 100);
      totalSplitCents += splitCents;

      processedSplits.push({
        userId: finalUserId,
        amount: splitCents,
        percentage: s.percentage,
        share: s.share
      });
    }

    // Fix floating point rounding errors to ensure splits exactly match total amount
    const expectedTotalCents = Math.round(amount * 100);
    if (processedSplits.length > 0 && totalSplitCents !== expectedTotalCents) {
      const difference = expectedTotalCents - totalSplitCents;
      processedSplits[0].amount += difference;
    }

    const expense = await prisma.expense.create({
      data: {
        groupId: id,
        description,
        amount: Math.round(amount * 100), // stored in cents
        currency: currency || 'INR',
        date: new Date(),
        paidById,
        splitType: splitType || 'EQUAL',
        splits: {
          create: processedSplits
        }
      }
    });

    return NextResponse.json(expense);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
