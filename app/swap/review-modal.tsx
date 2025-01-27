import { BaseModal } from "@/components/base-modal";
import { SwapReview } from "@/components/swap-review";
import { Coin, UnspentOutput } from "@/types";

export function ReviewModal({
  open,
  setOpen,
  coinA,
  coinB,
  coinAAmount,
  coinBAmount,
  poolKey,
  poolUtxos,
  nonce,
}: {
  open: boolean;
  coinA: Coin | null;
  coinB: Coin | null;
  coinAAmount: string;
  coinBAmount: string;
  poolKey: string;
  nonce: string;
  poolUtxos?: UnspentOutput[];
  setOpen: (open: boolean) => void;
}) {
  return (
    <BaseModal
      title="You're swapping"
      open={open}
      setOpen={setOpen}
      className="max-w-md"
    >
      <div className="p-5 pt-2">
        <SwapReview
          coinA={coinA}
          coinB={coinB}
          coinAAmount={coinAAmount}
          coinBAmount={coinBAmount}
          poolKey={poolKey}
          onSuccess={() => setOpen(false)}
          onBack={() => setOpen(false)}
          nonce={nonce}
          poolUtxos={poolUtxos}
        />
      </div>
    </BaseModal>
  );
}
