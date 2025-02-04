import { Coin } from "@/types";
import { BaseModal } from "../base-modal";
import { CoinIcon } from "../coin-icon";
import { Button } from "../ui/button";
import { AlertTriangle } from "lucide-react";
import { getCoinSymbol } from "@/lib/utils";

export function CoinWarningModal({
  open,
  coin,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  coin: Coin | undefined;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <BaseModal
      open={open}
      setOpen={(open) => !open && onCancel()}
      className="max-w-md"
    >
      <div className="p-4">
        <div className="flex items-center justify-center py-6 flex-col gap-3">
          {coin && <CoinIcon coin={coin} size="xl" />}
          <div className="flex px-2 py-1 rounded-full gap-1 text-orange-500 text-sm">
            <span>Warning</span>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <span className="text-center">
            <em className=" underline font-semibold not-italic">
              {coin ? getCoinSymbol(coin) : ""}
            </em>{" "}
            isn{"'"}t frenquently swapped on RichSwap. Always conduct your own
            research before trading.
          </span>
        </div>
        <div className="grid auto-cols-auto gap-3">
          <Button size="lg" onClick={onConfirm}>
            I understand
          </Button>
          <Button size="lg" onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
