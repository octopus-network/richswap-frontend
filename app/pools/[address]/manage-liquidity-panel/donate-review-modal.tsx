import { BaseModal } from "@/components/base-modal";
import { PoolInfo, UnspentOutput } from "@/types";

import { useState } from "react";
import { DonateReview } from "@/components/donate-review";
import { useTranslations } from "next-intl";

export function DonateReviewModal({
  open,
  setOpen,
  coinAAmount,
  coinBAmount,
  pool,
  nonce,
  poolUtxos,
}: {
  open: boolean;
  coinAAmount: string;
  coinBAmount: string;
  pool: PoolInfo;
  nonce: string;
  poolUtxos: UnspentOutput[];
  setOpen: (open: boolean) => void;
}) {
  const [isSubmiting, setIsSubmiting] = useState(false);
  const t = useTranslations("Pools");

  return (
    <BaseModal
      title={t("youAreDonating")}
      open={open}
      setOpen={(open) => {
        setIsSubmiting(false);
        setOpen(open);
      }}
      className="max-w-md"
      showCloseButton={!isSubmiting}
    >
      <div className="p-5 pt-2">
        <DonateReview
          coinA={pool.coinA}
          coinB={pool.coinB}
          poolAddress={pool.address}
          coinAAmount={coinAAmount}
          coinBAmount={coinBAmount}
          onSuccess={() => setOpen(false)}
          nonce={nonce}
          poolUtxos={poolUtxos}
          onBack={() => setOpen(false)}
        />
      </div>
    </BaseModal>
  );
}
