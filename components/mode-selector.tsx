'use client';

import { startTransition, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

const modes = [
  {
    id: 'chat',
    label: 'Chat',
    description: 'Regular chat mode'
  },
  {
    id: 'prism',
    label: 'PRISM',
    description: 'PRISM mode'
  }
] as const;

export function ModeSelector({
  selectedMode,
  onModeChange,
  className,
}: {
  selectedMode: 'prism' | 'chat';
  onModeChange: (mode: 'prism' | 'chat') => void;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);

  const selectedModeData = modes.find(mode => mode.id === selectedMode);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button variant="outline" className="md:px-2 md:h-[34px]">
          {selectedModeData?.label}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {modes.map((mode) => (
          <DropdownMenuItem
            key={mode.id}
            onSelect={() => {
              setOpen(false);
              startTransition(() => {
                onModeChange(mode.id);
              });
            }}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={mode.id === selectedMode}
          >
            <div className="flex flex-col gap-1 items-start">
              {mode.label}
              {mode.description && (
                <div className="text-xs text-muted-foreground">
                  {mode.description}
                </div>
              )}
            </div>
            <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
              <CheckCircleFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
