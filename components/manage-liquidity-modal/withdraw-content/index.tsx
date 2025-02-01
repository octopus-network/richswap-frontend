import { motion } from "framer-motion";
import { TabsContent } from "@/components/ui/tabs";
import { Position } from "@/types";
import { useState } from "react";
import { UnspentOutput } from "@/types";
import { WithdrawForm } from "./withdraw-form";
import { WithdrawReview } from "@/components/withdraw-review";

export function WithdrawContent({
  position,
  onSuccess,
  setOnReview,
}: {
  setOnReview: (onReview: boolean) => void;
  onSuccess: () => void;
  position: Position | null | undefined;
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
    setOnReview(true);
  };

  const onBack = () => {
    setShowReview(false);
    setOnReview(false);
  };

  return (
    <TabsContent value="withdraw">
      <motion.div
        initial={{
          transform: "translateX(20px)",
        }}
        animate={{
          transform: "translateX(0)",
        }}
      >
        {showReview ? (
          <WithdrawReview
            coinA={position?.coinA ?? null}
            coinB={position?.coinB ?? null}
            poolKey={position?.poolKey ?? ""}
            coinAAmount={coinAAmount}
            coinBAmount={coinBAmount}
            onSuccess={onSuccess}
            showCancelButton
            nonce={nonce}
            poolUtxos={poolUtxos}
            onBack={onBack}
          />
        ) : (
          <WithdrawForm position={position} onReview={onReview} />
        )}
      </motion.div>
    </TabsContent>
  );
}
