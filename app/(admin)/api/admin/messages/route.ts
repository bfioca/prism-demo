import { NextResponse } from 'next/server';
import { getAllMessages } from '@/lib/db/queries';

export async function GET(request: Request) {
  try {
    // Fetch all messages
    const allMessages = await getAllMessages();

    // Filter out messages with role 'assistant'
    const messages = allMessages
      .filter(msg => msg.role !== 'assistant')
      .map(msg => ({
        ...msg,
        content: typeof msg.content === 'object' ? JSON.stringify(msg.content) : String(msg.content)
      }));

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
