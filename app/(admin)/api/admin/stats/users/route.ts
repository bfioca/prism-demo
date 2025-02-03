import { NextResponse } from 'next/server';
import { getUserStats } from '@/lib/db/queries';

export async function GET() {
  try {
    const stats = await getUserStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
