import { NextResponse } from 'next/server';
import { getRecentUsers } from '@/lib/db/queries';

export async function GET() {
  try {
    const users = await getRecentUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching recent users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent users' },
      { status: 500 }
    );
  }
}
