import { ColumnDef } from '@tanstack/react-table';
import { Message } from './types';
import { formatDistanceToNow } from 'date-fns';

export const columns = {
  messages: [
    {
      accessorKey: 'userEmail',
      header: 'User',
    },
    {
      accessorKey: 'content',
      header: 'Content',
      cell: ({ row }: { row: any }) => {
        const content = row.getValue('content') as string;
        return content.length > 100 ? content.substring(0, 100) + '...' : content;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: any }) => {
        return formatDistanceToNow(new Date(row.getValue('createdAt')), { addSuffix: true });
      },
    }
  ] as ColumnDef<Message>[],

  users: [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: any }) => {
        return formatDistanceToNow(new Date(row.getValue('createdAt')), { addSuffix: true });
      },
    }
  ] as ColumnDef<{ email: string; createdAt: string; }>[],
};
