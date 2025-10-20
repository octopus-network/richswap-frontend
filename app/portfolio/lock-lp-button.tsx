import { Button } from "@/components/ui/button";

import { Calendar, Clock, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import moment from "moment";
import { cn } from "@/lib/utils";

import { type Position } from "@/types";
import { Exchange } from "@/lib/exchange";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { BITCOIN_BLOCK_TIME_MINUTES } from "@/lib/constants";
import { useLaserEyes, OKX } from "@omnisat/lasereyes-react";
import { PopupStatus, useAddPopup } from "@/store/popups";
import { useLatestBlock } from "@/hooks/use-latest-block";

export default function LockLpButton({
  poolAddress,
  position,
}: {
  poolAddress: string;
  position: Position;
}) {
  const { paymentAddress, signMessage, provider } = useLaserEyes();
  const t = useTranslations("LockLpSelector");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPresetHours, setSelectedPresetHours] = useState<number | null>(
    null
  );
  const [blocks, setBlocks] = useState(0);
  const [isLocking, setIsLocking] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { data: latestBlock } = useLatestBlock();

  const addPopup = useAddPopup();

  const isLocked = useMemo(
    () =>
      position.lockUntil === 0 ||
      (latestBlock && latestBlock >= position.lockUntil)
        ? false
        : true,
    [position.lockUntil, latestBlock]
  );

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

    if (isLocked && latestBlock) {
      const remainingBlocks = Math.max(position.lockUntil - latestBlock, 0);
      const remainingMs =
        remainingBlocks * BITCOIN_BLOCK_TIME_MINUTES * 60 * 1000;
      const currentUnlockDate = new Date(now.getTime() + remainingMs);
      unlockDate = new Date(currentUnlockDate.getTime() + extensionMs);
    }

    return {
      days: daysDiff,
      hours: hoursDiff,
      minutes: minutesDiff,
      blocks: extensionBlocks,
      date: unlockDate,
    };
  }, [selectedDate, isLocked, latestBlock, position.lockUntil]);

  const presetOptions = [
    { label: t("presets.1Week"), hours: 7 * 24 },
    { label: t("presets.1Month"), hours: 30 * 24 },
    { label: t("presets.3Months"), hours: 90 * 24 },
    { label: t("presets.6Months"), hours: 180 * 24 },
    { label: t("presets.1Year"), hours: 365 * 24 },
  ];

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    setSelectedDate(date);

    const now = new Date();
    const timeDiff = date.getTime() - now.getTime();

    if (timeDiff > 0) {
      const minutesDiff = Math.ceil(timeDiff / (1000 * 60));
      const blocks = Math.ceil(minutesDiff / BITCOIN_BLOCK_TIME_MINUTES);
      setBlocks(blocks);
    }
  };

  const handlePresetSelect = (hours: number) => {
    const futureDate = new Date();
    futureDate.setTime(futureDate.getTime() + hours * 60 * 60 * 1000);
    setSelectedPresetHours(hours);
    handleDateSelect(futureDate);
  };

  const onLock = async () => {
    if (!lockInfo || !blocks || !signMessage || !latestBlock) {
      return false;
    }

    setIsLocking(true);
    try {
      const toLockBlocks =
        blocks + (isLocked ? position.lockUntil - latestBlock : 0);

      const message = `${poolAddress}:${toLockBlocks}`;
      let signature = "";
      if (provider === OKX) {
        signature = await window.okxwallet.bitcoin.signMessage(
          message,
          "bip322-simple"
        );
      } else {
        signature = await signMessage(message, {
          protocol: "bip322",
        });
      }
      await Exchange.lockLp(paymentAddress, message, signature);
      addPopup(t("success"), PopupStatus.SUCCESS, t("lockLpSuccess"));
      setIsPopoverOpen(false);
    } catch (error: any) {
      console.log(error);
      addPopup(
        t("failed"),
        PopupStatus.ERROR,
        error.message ?? "Unknown Error"
      );
      return false;
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          variant="secondary"
          className="border border-transparent hover:border-primary hover:text-primary"
        >
          {isLocked ? t("extend") : t("lockLp")}
        </Button>
      </PopoverTrigger>
      <PopoverContent onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
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
                <div className="flex items-center">
                  <div>
                    <span className="font-medium">
                      {isLocked
                        ? `${lockInfo.days.toLocaleString()}`
                        : lockInfo.days.toLocaleString()}
                    </span>{" "}
                    {t("days")}
                  </div>
                  <div>
                    (
                    <span className="font-medium">
                      {isLocked
                        ? `${lockInfo.hours.toLocaleString()}`
                        : lockInfo.hours.toLocaleString()}
                    </span>{" "}
                    {t("hours")})
                  </div>
                </div>
                <div>
                  <span className="font-medium">
                    {`${
                      isLocked ? "+" : "~"
                    }${lockInfo.blocks.toLocaleString()}`}
                  </span>{" "}
                  {t("blocks")}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">
                    ~{moment(lockInfo.date).format("YYYY-MM-DD HH:mm")}
                  </span>{" "}
                  {t("unlock")}
                </div>
              </div>

              <div className="text-xs hidden sm:block text-muted-foreground mt-2 pt-2 border-t">
                {t("estimatedNote")}
              </div>
              <div className="text-xs hidden sm:block text-muted-foreground">
                {t("lockTips")}
              </div>
            </div>
          )}
          <Button
            disabled={!lockInfo || isLocking}
            className="w-full"
            onClick={onLock}
          >
            {isLocking && <Loader2 className="size-4 animate-spin" />}
            {!isLocked ? t("lockLp") : t("extend")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
