import { useState, useEffect } from "react";
import { ReactElement } from "react";
import { cn } from "@/lib/utils";

export const Step = ({
  icon,
  title,
  isActive,
  description,
  countdown,
}: {
  icon: ReactElement;
  title: string;
  description?: string;
  countdown?: number;
  isActive: boolean;
}) => {
  const [seconds, setSeconds] = useState(countdown || 0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => {
      setSeconds(countdown || 0);
      clearInterval(interval);
    };
  }, [isActive, countdown]);
  return (
    <div
      className={cn("flex items-center space-x-3", !isActive && "opacity-60")}
    >
      <div className="relative size-8 rounded-full bg-slate-500/50 flex items-center justify-center">
        {icon}
        {isActive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
        )}
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-sm">{title}</span>
        {isActive ? (
          description ? (
            <span className="text-muted-foreground text-xs">{description}</span>
          ) : countdown ? (
            <span className="text-muted-foreground text-xs">
              Estimated time: {seconds >= 0 ? seconds : 0} seconds
            </span>
          ) : null
        ) : null}
      </div>
    </div>
  );
};
