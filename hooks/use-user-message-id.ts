'use client';

import useSWR from 'swr';

export function useUserMessageId() {
  const { data: userMessageIdFromServer, mutate: setUserMessageIdFromServer } =
    useSWR('userMessageIdFromServer', undefined);

  return { userMessageIdFromServer, setUserMessageIdFromServer };
}
