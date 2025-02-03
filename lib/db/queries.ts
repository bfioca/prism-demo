import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, count, max, min } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { subDays } from 'date-fns';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
} from './schema';
import { BlockKind } from '@/components/block';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    const [newUser] = await db.insert(user)
      .values({ email, password: hash })
      .returning({ id: user.id });
    return newUser;
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await db
      .delete(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function getUserStats() {
  try {
    // Get total users
    const totalUsers = await db.select({ count: count() }).from(user);

    // Get users active today
    const activeToday = await db
      .select({ userId: chat.userId })
      .from(message)
      .leftJoin(chat, eq(message.chatId, chat.id))
      .where(gte(message.createdAt, new Date(new Date().setHours(0, 0, 0, 0))))
      .groupBy(chat.userId);

    // Get users active this week
    const activeThisWeek = await db
      .select({ userId: chat.userId })
      .from(message)
      .leftJoin(chat, eq(message.chatId, chat.id))
      .where(gte(message.createdAt, subDays(new Date(), 7)))
      .groupBy(chat.userId);

    return {
      totalCount: totalUsers[0].count,
      activeToday: activeToday.length,
      activeThisWeek: activeThisWeek.length,
    };
  } catch (error) {
    console.error('Failed to get user stats from database');
    throw error;
  }
}

export async function getChatStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = subDays(today, 7);

    const [totalCount] = await db
      .select({ value: count() })
      .from(chat);

    const [todayCount] = await db
      .select({ value: count() })
      .from(chat)
      .where(gte(chat.createdAt, today));

    const [weekCount] = await db
      .select({ value: count() })
      .from(chat)
      .where(gte(chat.createdAt, weekAgo));

    const [userCount] = await db
      .select({ value: count() })
      .from(user);

    return {
      totalCount: totalCount.value,
      todayCount: todayCount.value,
      weekCount: weekCount.value,
      averagePerUser: userCount.value ? totalCount.value / userCount.value : 0,
    };
  } catch (error) {
    console.error('Failed to get chat stats from database');
    throw error;
  }
}

export async function getMessageStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = subDays(today, 7);

    const [totalCount] = await db
      .select({ value: count() })
      .from(message);

    const [todayCount] = await db
      .select({ value: count() })
      .from(message)
      .where(gte(message.createdAt, today));

    const [weekCount] = await db
      .select({ value: count() })
      .from(message)
      .where(gte(message.createdAt, weekAgo));

    const [userCount] = await db
      .select({ value: count() })
      .from(user);

    return {
      totalCount: totalCount.value,
      todayCount: todayCount.value,
      weekCount: weekCount.value,
      averagePerUser: userCount.value ? totalCount.value / userCount.value : 0,
    };
  } catch (error) {
    console.error('Failed to get message stats from database');
    throw error;
  }
}

export async function getAllMessages() {
  try {
    return await db
      .select({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        chatId: message.chatId,
        role: message.role,
        userEmail: user.email,
      })
      .from(message)
      .leftJoin(chat, eq(message.chatId, chat.id))
      .leftJoin(user, eq(chat.userId, user.id))
      .orderBy(desc(message.createdAt));
  } catch (error) {
    console.error('Failed to get all messages from database');
    throw error;
  }
}

export async function getRecentUsers() {
  try {
    return await db
      .select({
        id: user.id,
        email: user.email,
        createdAt: min(chat.createdAt),
      })
      .from(user)
      .leftJoin(chat, eq(chat.userId, user.id))
      .groupBy(user.id, user.email)
      .orderBy(desc(min(chat.createdAt)));
  } catch (error) {
    console.error('Failed to get recent users from database');
    throw error;
  }
}
