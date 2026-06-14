import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const groups = await prisma.group.findMany({
      where: {
        members: { some: { userId: (session.user as any).id } }
      },
      include: {
        members: { include: { user: true } }
      }
    });
    return NextResponse.json(groups);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, currency, members } = body; // members = [{name, email}]

    // Always include the creator
    const creatorId = (session.user as any).id;
    const allMembers = [...(members || [])];
    
    // Ensure the creator is in the list of members to be added (by ID)
    const groupMemberData: any[] = [{ userId: creatorId }];

    // Upsert the invited members
    for (const member of allMembers) {
      if (!member.email || !member.name) continue;
      
      const user = await prisma.user.upsert({
        where: { email: member.email },
        update: {}, // if exists, do nothing
        create: {
          name: member.name,
          email: member.email,
        }
      });

      // Avoid duplicate creator
      if (user.id !== creatorId) {
        groupMemberData.push({ userId: user.id });
      }
    }

    const group = await prisma.group.create({
      data: {
        name: name,
        currency: currency || 'INR',
        members: {
          create: groupMemberData
        }
      }
    });

    return NextResponse.json(group);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
