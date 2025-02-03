import { NextResponse } from 'next/server';
import { getMessageStats } from '@/lib/db/queries';

export async function GET() {
  try {
    const stats = await getMessageStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching message stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message stats' },
      { status: 500 }
    );
  }
}
