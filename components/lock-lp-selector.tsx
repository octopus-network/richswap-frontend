"use client";

import { useState, useMemo } from "react";
import { Calendar, Clock, Lock } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import moment from "moment";
import { cn } from "@/lib/utils";
import { BITCOIN_BLOCK_TIME_MINUTES } from "@/lib/constants";
import { useTranslations } from "next-intl";
import { useLaserEyes } from "@omnisat/lasereyes-react";

interface LockLpSelectorProps {
  onLockChange?: (blocks: number, date: Date | null) => void;
  disabled?: boolean;
  className?: string;
}

export function LockLpSelector({
  onLockChange,

  className,
}: LockLpSelectorProps) {
  const t = useTranslations("LockLpSelector");
  const [isLocked, setIsLocked] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPresetHours, setSelectedPresetHours] = useState<
    number | null
  >(null);
  const { address } = useLaserEyes();
  const lockInfo = useMemo(() => {
    if (!selectedDate || !isLocked) {
      return null;
    }

    const now = new Date();
    const timeDiff = selectedDate.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return null;
    }

    const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));
    const hoursDiff = Math.round(timeDiff / (1000 * 60 * 60));
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
      setSelectedPresetHours(null);
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
    { label: t("presets.10Minutes"), hours: 0.1 },
    { label: t("presets.1Day"), hours: 24 },
    { label: t("presets.1Week"), hours: 7 * 24 },
    { label: t("presets.1Month"), hours: 30 * 24 },
    { label: t("presets.3Months"), hours: 90 * 24 },
    { label: t("presets.6Months"), hours: 180 * 24 },
    { label: t("presets.1Year"), hours: 365 * 24 },
  ];

  const handlePresetSelect = (hours: number) => {
    const futureDate = new Date();
    futureDate.setTime(futureDate.getTime() + hours * 60 * 60 * 1000);
    setSelectedPresetHours(hours);
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
          disabled={!address}
          className={cn(
            "flex items-center space-x-2",
            isLocked ? "border-primary" : "border-border"
          )}
        >
          <Lock
            className={cn("size-4", isLocked && "text-primary-foreground")}
          />
          <span>{isLocked ? t("lpLocked") : t("lockLp")}</span>
        </Button>

        {isLocked && lockInfo && (
          <div className="text-xs text-muted-foreground">
            ~{lockInfo.blocks.toLocaleString()} {t("blocks")}
          </div>
        )}
      </div>

      {isLocked && (
        <div className="space-y-3 p-3 border rounded-lg bg-secondary/20">
          <Label className="text-sm font-medium flex items-center space-x-2">
            <Calendar className="size-4" />
            <span>{t("unlockDate")}</span>
          </Label>

          <div className="flex flex-wrap gap-2">
            {presetOptions.map((preset) => (
              <Button
                key={preset.hours}
                type="button"
                variant="outline"
                size="xs"
                onClick={() => handlePresetSelect(preset.hours)}
                className={cn(
                  "text-xs transition-colors",
                  selectedPresetHours === preset.hours
                    ? "border-primary text-primary"
                    : "border-border"
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
                <span className="font-medium">{t("lockDuration")}:</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">{lockInfo.days}</span>{" "}
                  {t("days")}
                </div>
                <div>
                  <span className="font-medium">{lockInfo.hours}</span>{" "}
                  {t("hours")}
                </div>
                <div>
                  <span className="font-medium">
                    ~{lockInfo.blocks.toLocaleString()}
                  </span>{" "}
                  {t("blocks")}
                </div>
                <div>
                  <span className="font-medium">
                    {moment(lockInfo.date).format("YYYY-MM-DD HH:mm")}
                  </span>{" "}
                  {t("unlock")}
                </div>
              </div>

              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                {t("estimatedNote")}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
