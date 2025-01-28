import { auth } from '@/app/(auth)/auth';
import { getMessageById } from '@/lib/db/queries';
import { Message } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('messageId');

  if (!messageId) {
    return new Response('Message ID is required', { status: 400 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const messages = await getMessageById({ id: messageId });
    const message = messages[0];

    if (!message) {
      return new Response('Message not found', { status: 404 });
    }

    return new Response(JSON.stringify({
      prism_data: message.prism_data
    }), {
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
