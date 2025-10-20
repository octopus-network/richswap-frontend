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
import { useLatestBlock } from "@/hooks/use-latest-block";
import { Position } from "@/types";

interface LockLpSelectorProps {
  onLockChange?: (blocks: number, date: Date | null) => void;
  disabled?: boolean;
  className?: string;
  position: Position | undefined | null;
}

export function LockLpSelector({
  onLockChange,
  position,
  className,
  disabled,
}: LockLpSelectorProps) {
  const t = useTranslations("LockLpSelector");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPresetHours, setSelectedPresetHours] = useState<number | null>(
    null
  );
  const { address } = useLaserEyes();
  const { data: latestBlock } = useLatestBlock();

  const isLocked = useMemo(
    () =>
      position
        ? position.lockUntil === 0 ||
          (latestBlock && latestBlock >= position.lockUntil)
          ? false
          : true
        : false,
    [position, latestBlock]
  );

  const remainingLockBlocks = useMemo(() => {
    if (!isLocked || !latestBlock || !position) {
      return 0;
    }

    return Math.max(position.lockUntil - latestBlock, 0);
  }, [isLocked, latestBlock, position]);

  const lockInfo = useMemo(() => {
    if (!selectedDate) {
      return null;
    }

    const now = new Date();
    const extensionMs = selectedDate.getTime() - now.getTime();

    if (extensionMs <= 0) {
      return null;
    }

    const daysDiff = Math.round(extensionMs / (1000 * 60 * 60 * 24));
    const hoursDiff = Math.round(extensionMs / (1000 * 60 * 60));
    const minutesDiff = Math.ceil(extensionMs / (1000 * 60));

    const extensionBlocks = Math.ceil(minutesDiff / BITCOIN_BLOCK_TIME_MINUTES);

    let unlockDate = selectedDate;

    if (remainingLockBlocks > 0) {
      const remainingMs =
        remainingLockBlocks * BITCOIN_BLOCK_TIME_MINUTES * 60 * 1000;
      const currentUnlockDate = new Date(now.getTime() + remainingMs);
      unlockDate = new Date(currentUnlockDate.getTime() + extensionMs);
    }

    return {
      days: daysDiff,
      hours: hoursDiff,
      minutes: minutesDiff,
      blocks: extensionBlocks,
      date: unlockDate,
      totalBlocks: extensionBlocks + remainingLockBlocks,
    };
  }, [selectedDate, remainingLockBlocks]);

  const handleOpenToggle = () => {
    const newOpen = !isOpen;
    setIsOpen(newOpen);

    if (!newOpen) {
      setSelectedDate(null);
      setSelectedPresetHours(null);
      onLockChange?.(0, null);
    } else if (selectedDate && lockInfo) {
      onLockChange?.(lockInfo.totalBlocks, lockInfo.date);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    setSelectedDate(date);

    if (!isOpen) {
      return;
    }

    const now = new Date();
    const timeDiff = date.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return;
    }

    const minutesDiff = Math.ceil(timeDiff / (1000 * 60));
    const extensionBlocks = Math.ceil(minutesDiff / BITCOIN_BLOCK_TIME_MINUTES);
    const totalBlocks = extensionBlocks + remainingLockBlocks;
    const remainingMs =
      remainingLockBlocks * BITCOIN_BLOCK_TIME_MINUTES * 60 * 1000;
    const unlockDate =
      remainingLockBlocks > 0
        ? new Date(now.getTime() + remainingMs + timeDiff)
        : date;

    onLockChange?.(totalBlocks, unlockDate);
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
          variant={isOpen ? "default" : "outline"}
          size="sm"
          onClick={handleOpenToggle}
          disabled={!address || disabled}
          className={cn(
            "flex items-center space-x-2",
            isOpen ? "border-primary" : "border-border"
          )}
        >
          <Lock className={cn("size-4", isOpen && "text-primary-foreground")} />
          <span>{isLocked ? t("extendLock") : t("lockLp")}</span>
        </Button>
      </div>

      {isOpen && (
        <div className="space-y-3 p-3 border rounded-lg bg-secondary/20">
          <Label className="text-sm font-medium flex items-center space-x-2">
            <Calendar className="size-4" />
            <span>{isLocked ? t("extendTime") : t("lockTime")}</span>
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
                <span className="font-medium">
                  {isLocked ? t("extendDuration") : t("lockDuration")}:
                </span>
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
                    {`${
                      isLocked ? "+" : "~"
                    }${lockInfo.blocks.toLocaleString()}`}
                  </span>{" "}
                  {t("blocks")}
                </div>
                <div>
                  <span className="font-medium">
                    ~{moment(lockInfo.date).format("YYYY-MM-DD HH:mm")}
                  </span>{" "}
                  {t("unlock")}
                </div>
              </div>

              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                {t("estimatedNote")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("lockTips")}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
