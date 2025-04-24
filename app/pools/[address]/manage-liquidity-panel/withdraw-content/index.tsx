import { TabsContent } from "@/components/ui/tabs";
import { Position } from "@/types";
import { useState } from "react";
import { UnspentOutput } from "@/types";
import { WithdrawForm } from "./withdraw-form";
import { WithdrawReview } from "@/components/withdraw-review";

export function WithdrawContent({
  position,
  onSuccess,
}: {
  onSuccess: () => void;
  position: Position | null | undefined;
}) {
  const [coinAAmount, setCoinAAmount] = useState("");
  const [coinBAmount, setCoinBAmount] = useState("");

  const [nonce, setNonce] = useState("0");
  const [sqrtK, setSqrtK] = useState<bigint>();
  const [poolUtxos, setPoolUtxos] = useState<UnspentOutput[]>();

  const [showReview, setShowReview] = useState(false);
  const onReview = (
    coinAAmount: string,
    coinBAmount: string,
    nonce: string,
    poolUtxos: UnspentOutput[],
    sqrtK: bigint
  ) => {
    setCoinAAmount(coinAAmount);
    setCoinBAmount(coinBAmount);
    setNonce(nonce);
    setPoolUtxos(poolUtxos);
    setSqrtK(sqrtK);
    setShowReview(true);
  };

  const onBack = () => {
    setShowReview(false);
  };

  return (
    <TabsContent value="withdraw">
      <div>
        {showReview ? (
          <WithdrawReview
            coinA={position?.coinA ?? null}
            coinB={position?.coinB ?? null}
            poolKey={position?.pool.key ?? ""}
            coinAAmount={coinAAmount}
            coinBAmount={coinBAmount}
            onSuccess={onSuccess}
            showCancelButton
            nonce={nonce}
            poolUtxos={poolUtxos}
            onBack={onBack}
            sqrtK={sqrtK}
          />
        ) : (
          <WithdrawForm position={position} onReview={onReview} />
        )}
      </div>
    </TabsContent>
  );
}
