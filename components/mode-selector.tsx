'use client';

import { startTransition, useState, useOptimistic } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { saveMode } from '@/app/(chat)/actions';
import { useMode } from '@/hooks/use-mode';

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
    description: 'PRISM Worldview mode'
  },
  {
    id: 'committee',
    label: 'PRISM Business',
    description: 'PRISM Business Committee mode'
  }
] as const;

export function ModeSelector({
  className,
}: React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const { mode, setMode, isLoading } = useMode();
  const [optimisticMode, setOptimisticMode] = useOptimistic(mode);

  const selectedModeData = modes.find(m => m.id === optimisticMode);

  if (isLoading) {
    return (
      <Button variant="outline" className="md:px-2 md:h-[34px]">
        Loading...
      </Button>
    );
  }

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
        {modes.map((modeOption) => (
          <DropdownMenuItem
            key={modeOption.id}
            onSelect={() => {
              setOpen(false);
              startTransition(() => {
                setOptimisticMode(modeOption.id);
                saveMode(modeOption.id);
                setMode(modeOption.id);
              });
            }}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={modeOption.id === optimisticMode}
          >
            <div className="flex flex-col gap-1 items-start">
              {modeOption.label}
              {modeOption.description && (
                <div className="text-xs text-muted-foreground">
                  {modeOption.description}
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
