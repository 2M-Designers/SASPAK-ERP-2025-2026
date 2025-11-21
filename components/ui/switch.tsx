// components/ui/switch.tsx
"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(36_125_231)] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[rgb(36_125_231_/_30%)] data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-6 w-6 rounded-full bg-white shadow-lg ring-0 transition-all duration-300 data-[state=checked]:translate-x-6 data-[state=checked]:bg-[rgb(36_125_231)] data-[state=checked]:shadow-[0_0_8px_rgb(36_125_231_/_60%)] data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-slate-400 data-[state=unchecked]:shadow-none"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
