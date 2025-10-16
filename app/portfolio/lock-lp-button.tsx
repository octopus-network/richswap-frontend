import { Button } from "@/components/ui/button";

import { Calendar, Clock, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import moment from "moment";
import { cn } from "@/lib/utils";

import { Exchange } from "@/lib/exchange";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { BITCOIN_BLOCK_TIME_MINUTES } from "@/lib/constants";
import { useLaserEyes } from "@omnisat/lasereyes-react";
import { PopupStatus, useAddPopup } from "@/store/popups";

export default function LockLpButton({ poolAddress }: { poolAddress: string }) {
  const { paymentAddress, signMessage } = useLaserEyes();
  const t = useTranslations("LockLpSelector");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPresetHours, setSelectedPresetHours] = useState<number | null>(
    null
  );
  const [blocks, setBlocks] = useState(0);
  const [isLocking, setIsLocking] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const addPopup = useAddPopup();

  const lockInfo = useMemo(() => {
    if (!selectedDate) {
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
  }, [selectedDate]);

  const presetOptions = [
    { label: t("presets.10Minutes"), hours: 0.1 },
    { label: t("presets.1Day"), hours: 24 },
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

  const onLock = async (): Promise<boolean> => {
    if (!lockInfo || !blocks || !signMessage) {
      return false;
    }

    setIsLocking(true);
    try {
      const message = `${poolAddress}:${blocks}`;
      const signature = await signMessage(message, {
        protocol: "bip322",
      });
      await Exchange.lockLp(paymentAddress, message, signature);
      return true;
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
          {t("lockLp")}
        </Button>
      </PopoverTrigger>
      <PopoverContent onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
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
          <Button
            disabled={!lockInfo || isLocking}
            className="w-full"
            onClick={async () => {
              const locked = await onLock();
              if (locked) {
                setIsPopoverOpen(false);
              }
            }}
          >
            {isLocking && <Loader2 className="size-4 animate-spin" />}
            {t("lockLp")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
