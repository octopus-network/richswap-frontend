import { BaseModal } from "@/components/base-modal";
import { SwapReview } from "@/components/swap-review";
import { Coin, SwapQuote } from "@/types";
import { useState } from "react";

export function ReviewModal({
  open,
  setOpen,
  coinA,
  coinB,
  coinAAmount,
  coinBAmount,
  swapQuote,
}: {
  open: boolean;
  coinA: Coin | null;
  coinB: Coin | null;
  coinAAmount: string;
  coinBAmount: string;
  swapQuote: SwapQuote | undefined;
  setOpen: (open: boolean) => void;
}) {
  const [isSubmiting, setIsSubmiting] = useState(false);
  return (
    <BaseModal
      title="You're swapping"
      open={open}
      setOpen={(open) => {
        setIsSubmiting(false);
        setOpen(open);
      }}
      className="max-w-md"
      showCloseButton={!isSubmiting}
    >
      <div className="p-5 pt-2">
        <SwapReview
          coinA={coinA}
          coinB={coinB}
          coinAAmount={coinAAmount}
          coinBAmount={coinBAmount}
          setIsSubmiting={setIsSubmiting}
          onSuccess={() => setOpen(false)}
          onBack={() => setOpen(false)}
          swapQuote={swapQuote}
        />
      </div>
    </BaseModal>
  );
}
