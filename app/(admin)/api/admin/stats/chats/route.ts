import { NextResponse } from 'next/server';
import { getChatStats } from '@/lib/db/queries';

export async function GET() {
  try {
    const stats = await getChatStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching chat stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat stats' },
      { status: 500 }
    );
  }
}
