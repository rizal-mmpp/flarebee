
'use client';

import { cn } from '@/lib/utils';

interface CustomMenuIconProps {
  isOpen: boolean;
  className?: string;
  lineClassName?: string;
}

export function CustomMenuIcon({ isOpen, className, lineClassName }: CustomMenuIconProps) {
  const baseLine = cn(
    "block h-[3px] w-6 rounded-full bg-foreground transition-all duration-300 ease-in-out origin-center", // Added origin-center
    lineClassName
  );

  return (
    // The parent Button component (SheetTrigger) will provide the overall clickable area and size (e.g. h-10 w-10 from size="icon")
    // This div is just for positioning the lines within that button.
    <div className={cn("flex flex-col justify-between h-5 w-6", className)}> 
      <span
        className={cn(
          baseLine,
          isOpen ? "translate-y-[7.5px] rotate-45" : "" 
        )}
      />
      <span className={cn(baseLine, isOpen ? "!opacity-0" : "")} /> {/* Ensure opacity takes precedence */}
      <span
        className={cn(
          baseLine,
          isOpen ? "-translate-y-[7.5px] -rotate-45" : ""
        )}
      />
    </div>
  );
}
