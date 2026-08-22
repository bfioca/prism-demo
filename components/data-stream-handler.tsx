'use client';

// Streaming data is consumed by Chat's useChat instance. Keep this component
// as a compatibility shim for the two server-rendered page layouts.
export function DataStreamHandler({ id: _id }: { id: string }) {
  return null;
}
