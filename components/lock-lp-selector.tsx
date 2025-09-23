"use client";

import { useState, useMemo } from "react";
import { Calendar, Clock, Lock } from "lucide-react";
import { Button } from "./ui/button";

import { Label } from "./ui/label";

import { format } from "date-fns";
import { cn } from "@/lib/utils";

const BITCOIN_BLOCK_TIME_MINUTES = 10;

interface LockLpSelectorProps {
  onLockChange?: (blocks: number, date: Date | null) => void;
  disabled?: boolean;
  className?: string;
}

export function LockLpSelector({
  onLockChange,
  disabled = false,
  className,
}: LockLpSelectorProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const lockInfo = useMemo(() => {
    if (!selectedDate || !isLocked) {
      return null;
    }

    const now = new Date();
    const timeDiff = selectedDate.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return null;
    }

    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60));
    const minutesDiff = Math.ceil(timeDiff / (1000 * 60));

    const estimatedBlocks = Math.ceil(minutesDiff / BITCOIN_BLOCK_TIME_MINUTES);

    return {
      days: daysDiff,
      hours: hoursDiff,
      minutes: minutesDiff,
      blocks: estimatedBlocks,
      date: selectedDate,
    };
  }, [selectedDate, isLocked]);

  const handleLockToggle = () => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);

    if (!newLocked) {
      setSelectedDate(null);
      setSelectedPreset(null);
      onLockChange?.(0, null);
    } else if (selectedDate && lockInfo) {
      onLockChange?.(lockInfo.blocks, selectedDate);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    setSelectedDate(date);

    if (isLocked) {
      const now = new Date();
      const timeDiff = date.getTime() - now.getTime();

      if (timeDiff > 0) {
        const minutesDiff = Math.ceil(timeDiff / (1000 * 60));
        const blocks = Math.ceil(minutesDiff / BITCOIN_BLOCK_TIME_MINUTES);
        onLockChange?.(blocks, date);
      }
    }
  };

  const presetOptions = [
    { label: "1 Week", days: 7 },
    { label: "1 Month", days: 30 },
    { label: "3 Months", days: 90 },
    { label: "6 Months", days: 180 },
    { label: "1 Year", days: 365 },
  ];

  const handlePresetSelect = (days: number) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    setSelectedPreset(days);
    handleDateSelect(futureDate);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant={isLocked ? "default" : "outline"}
          size="sm"
          onClick={handleLockToggle}
          disabled={disabled}
          className="flex items-center space-x-2"
        >
          <Lock
            className={cn("size-4", isLocked && "text-primary-foreground")}
          />
          <span>{isLocked ? "LP Locked" : "Lock LP"}</span>
        </Button>

        {isLocked && lockInfo && (
          <div className="text-xs text-muted-foreground">
            ~{lockInfo.blocks.toLocaleString()} blocks
          </div>
        )}
      </div>

      {isLocked && (
        <div className="space-y-3 p-3 border rounded-lg bg-secondary/20">
          <Label className="text-sm font-medium flex items-center space-x-2">
            <Calendar className="size-4" />
            <span>Unlock Date</span>
          </Label>

          <div className="flex flex-wrap gap-2">
            {presetOptions.map((preset) => (
              <Button
                key={preset.days}
                type="button"
                variant="outline"
                size="xs"
                onClick={() => handlePresetSelect(preset.days)}
                disabled={disabled}
                className={cn(
                  "text-xs transition-colors border-border",
                  selectedPreset === preset.days && "border-primary"
                )}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {lockInfo && (
            <div className="space-y-2 p-2 bg-primary/5 rounded-md border">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="size-4 text-primary" />
                <span className="font-medium">Lock Duration:</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">{lockInfo.days}</span> days
                </div>
                <div>
                  <span className="font-medium">{lockInfo.hours}</span> hours
                </div>
                <div>
                  <span className="font-medium">
                    ~{lockInfo.blocks.toLocaleString()}
                  </span>{" "}
                  blocks
                </div>
                <div>
                  <span className="font-medium">
                    {format(lockInfo.date, "MMM dd")}
                  </span>{" "}
                  unlock
                </div>
              </div>

              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                * Estimated based on 10min average block time
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
