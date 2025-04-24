import { useState } from "react";
import { PoolInfo, UnspentOutput } from "@/types";

import { DepositForm } from "./deposit-form";
import { DepositReview } from "@/components/deposit-review";

import { TabsContent } from "@/components/ui/tabs";

export function DepositContent({
  pool,
  onSuccess,
}: {
  pool: PoolInfo | undefined;
  onSuccess: () => void;
}) {
  const [coinAAmount, setCoinAAmount] = useState("");
  const [coinBAmount, setCoinBAmount] = useState("");
  const [nonce, setNonce] = useState("0");
  const [poolUtxos, setPoolUtxos] = useState<UnspentOutput[]>();

  const [showReview, setShowReview] = useState(false);

  const onReview = (
    coinAAmount: string,
    coinBAmount: string,
    nonce: string,
    poolUtxos: UnspentOutput[]
  ) => {
    setCoinAAmount(coinAAmount);
    setCoinBAmount(coinBAmount);
    setNonce(nonce);
    setPoolUtxos(poolUtxos);
    setShowReview(true);
  };

  const onBack = () => {
    setShowReview(false);
  };

  return (
    <TabsContent value="deposit">
      <div>
        {showReview && pool ? (
          <>
            <DepositReview
              coinA={pool.coinA}
              coinB={pool.coinB}
              poolAddress={pool.address}
              coinAAmount={coinAAmount}
              coinBAmount={coinBAmount}
              onSuccess={onSuccess}
              showCancelButton
              nonce={nonce}
              poolUtxos={poolUtxos}
              onBack={onBack}
            />
          </>
        ) : (
          <DepositForm pool={pool} onReview={onReview} />
        )}
      </div>
    </TabsContent>
  );
}
