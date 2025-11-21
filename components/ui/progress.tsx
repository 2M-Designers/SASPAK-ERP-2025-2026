import React from "react";
import { cn } from "@/lib/utils"; // Make sure you have cn utility

type ProgressProps = {
  value: number; // Progress value (0 - 100)
  max?: number; // Optional max value (default 100)
  color?: "blue" | "green" | "purple" | "orange"; // Optional color themes
  className?: string; // Add className support
  showLabel?: boolean; // Option to show/hide percentage label
};

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  color = "blue",
  className,
  showLabel = true,
}) => {
  const progressPercentage = Math.min(Math.max(value, 0), max); // Ensure valid range

  // Define color themes
  const colorVariants: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <div
      className={cn(
        "relative w-full bg-gray-200 rounded-full overflow-hidden shadow-inner",
        className // Apply custom classes
      )}
    >
      <div
        className={cn(
          "h-full bg-gradient-to-r transition-all duration-500 ease-in-out rounded-full",
          colorVariants[color]
        )}
        style={{ width: `${progressPercentage}%` }}
      ></div>
      {showLabel && (
        <span className='absolute inset-0 flex justify-center items-center text-xs font-semibold text-white'>
          {progressPercentage}%
        </span>
      )}
    </div>
  );
};
