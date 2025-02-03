'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { UserStats, ChatStats, MessageStats } from './types';
import { Users, MessageSquare, MessagesSquare } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminDashboard() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [chatStats, setChatStats] = useState<ChatStats | null>(null);
  const [messageStats, setMessageStats] = useState<MessageStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userStatsRes, chatStatsRes, messageStatsRes, recentUsersRes, messagesRes] = await Promise.all([
          fetch('/api/admin/stats/users'),
          fetch('/api/admin/stats/chats'),
          fetch('/api/admin/stats/messages'),
          fetch('/api/admin/recent-users'),
          fetch('/api/admin/messages')
        ]);

        const [userStats, chatStats, messageStats, recentUsers, messages] = await Promise.all([
          userStatsRes.json(),
          chatStatsRes.json(),
          messageStatsRes.json(),
          recentUsersRes.json(),
          messagesRes.json()
        ]);

        setUserStats(userStats);
        setChatStats(chatStats);
        setMessageStats(messageStats);
        setRecentUsers(recentUsers);
        setMessages(messages);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-16 px-4">
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-1">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/" className="transition-opacity hover:opacity-75">
                <Image
                  src="/images/logo-text.svg"
                  alt="Logo"
                  width={120}
                  height={40}
                  className="block dark:hidden"
                  priority
                />
                <Image
                  src="/images/logo-white-text.svg"
                  alt="Logo"
                  width={120}
                  height={40}
                  className="hidden dark:block"
                  priority
                />
              </Link>
            </div>
            <h1 className="text-4xl mb-2 font-bold tracking-tight bg-[linear-gradient(90deg,#7C3AED_0%,#3B82F6_50%,#06B6D4_100%)] bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Stats Overview - Single Row */}
        <div className="flex gap-6 mb-8">
          {/* User Stats Card */}
          <Card className="flex-1 p-6 bg-background/30 backdrop-blur-sm border-border/50 overflow-hidden shadow-lg"
                style={{ boxShadow: '0 6px 25px #7C3AED15' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#7C3AED] bg-opacity-10 rounded-full p-2">
                <Users className="size-5 text-[#7C3AED]" />
              </div>
              <h3 className="text-base font-medium text-foreground/90">Users</h3>
            </div>
            {loading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-medium text-[#7C3AED]">{userStats?.totalCount}</p>
                    <span className="text-sm text-muted-foreground">total</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Today</p>
                    <p className="text-2xl text-foreground/90">{userStats?.activeToday}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Week</p>
                    <p className="text-2xl text-foreground/90">{userStats?.activeThisWeek}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Chat Stats Card */}
          <Card className="flex-1 p-6 bg-background/30 backdrop-blur-sm border-border/50 overflow-hidden shadow-lg"
                style={{ boxShadow: '0 6px 25px #3B82F615' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#3B82F6] bg-opacity-10 rounded-full p-2">
                <MessageSquare className="size-5 text-[#3B82F6]" />
              </div>
              <h3 className="text-base font-medium text-foreground/90">Chats</h3>
            </div>
            {loading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-medium text-[#3B82F6]">{chatStats?.totalCount}</p>
                    <span className="text-sm text-muted-foreground">total</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-2xl text-foreground/90">{chatStats?.todayCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl text-foreground/90">{chatStats?.weekCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg/User</p>
                    <p className="text-2xl text-foreground/90">{chatStats?.averagePerUser?.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Message Stats Card */}
          <Card className="flex-1 p-6 bg-background/30 backdrop-blur-sm border-border/50 overflow-hidden shadow-lg"
                style={{ boxShadow: '0 6px 25px #06B6D415' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#06B6D4] bg-opacity-10 rounded-full p-2">
                <MessagesSquare className="size-5 text-[#06B6D4]" />
              </div>
              <h3 className="text-base font-medium text-foreground/90">Messages</h3>
            </div>
            {loading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-medium text-[#06B6D4]">{messageStats?.totalCount}</p>
                    <span className="text-sm text-muted-foreground">total</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-2xl text-foreground/90">{messageStats?.todayCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl text-foreground/90">{messageStats?.weekCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg/User</p>
                    <p className="text-2xl text-foreground/90">{messageStats?.averagePerUser?.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity - Stacked */}
        <div className="space-y-6">
          {/* Recent Users */}
          <Card className="shadow-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Recent Users</h2>
              <p className="text-sm text-muted-foreground mt-1">Latest user registrations</p>
            </div>
            <div className="p-6">
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <DataTable columns={columns.users} data={recentUsers} />
              )}
            </div>
          </Card>

          {/* Recent Messages */}
          <Card className="shadow-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Recent Messages</h2>
              <p className="text-sm text-muted-foreground mt-1">Latest user interactions</p>
            </div>
            <div className="p-6">
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <DataTable columns={columns.messages} data={messages} />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
