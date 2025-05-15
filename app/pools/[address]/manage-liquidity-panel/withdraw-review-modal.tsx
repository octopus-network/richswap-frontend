import { BaseModal } from "@/components/base-modal";
import { Position, UnspentOutput } from "@/types";

import { useState } from "react";
import { WithdrawReview } from "@/components/withdraw-review";
import { useTranslations } from "next-intl";

export function WithdrawReviewModal({
  open,
  setOpen,
  coinAAmount,
  coinBAmount,
  position,
  nonce,
  poolUtxos,
  sqrtK,
}: {
  open: boolean;
  coinAAmount: string;
  coinBAmount: string;
  position: Position;
  nonce: string;
  poolUtxos: UnspentOutput[];
  setOpen: (open: boolean) => void;
  sqrtK: bigint;
}) {
  const [isSubmiting, setIsSubmiting] = useState(false);
  const t = useTranslations("Pools");

  return (
    <BaseModal
      title={t("youAreWithdrawing")}
      open={open}
      setOpen={(open) => {
        setIsSubmiting(false);
        setOpen(open);
      }}
      className="max-w-md"
      showCloseButton={!isSubmiting}
    >
      <div className="p-5 pt-2">
        <WithdrawReview
          coinA={position?.coinA ?? null}
          coinB={position?.coinB ?? null}
          poolKey={position?.pool.key ?? ""}
          coinAAmount={coinAAmount}
          coinBAmount={coinBAmount}
          nonce={nonce}
          poolUtxos={poolUtxos}
          sqrtK={sqrtK}
          onSuccess={() => setOpen(false)}
          onBack={() => setOpen(false)}
          showCancelButton={false}
        />
      </div>
    </BaseModal>
  );
}
