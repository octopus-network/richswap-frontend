import { useState } from "react";
import { PoolInfo, UnspentOutput } from "@/types";

import { DepositForm } from "./deposit-form";
import { DepositReview } from "@/components/deposit-review";
import { motion } from "framer-motion";
import { TabsContent } from "@/components/ui/tabs";

export function DepositContent({
  pool,
  onSuccess,
  setOnReview,
}: {
  pool: PoolInfo | undefined;
  setOnReview: (onReview: boolean) => void;
  onSuccess: () => void;
}) {
  const [coinAAmount, setCoinAAmount] = useState("");
  const [coinBAmount, setCoinBAmount] = useState("");
  const [nonce, setNonce] = useState("0");
  const [poolUtxos, setPoolUtxos] = useState<UnspentOutput[]>();
  const [lockBlocks, setLockBlocks] = useState(0);
  const [showReview, setShowReview] = useState(false);

  const onReview = (
    coinAAmount: string,
    coinBAmount: string,
    nonce: string,
    poolUtxos: UnspentOutput[],
    lockBlocks: number
  ) => {
    setCoinAAmount(coinAAmount);
    setCoinBAmount(coinBAmount);
    setNonce(nonce);
    setPoolUtxos(poolUtxos);
    setLockBlocks(lockBlocks);
    setShowReview(true);
    setOnReview(true);
  };

  const onBack = () => {
    setShowReview(false);
    setOnReview(false);
  };

  return (
    <TabsContent value="deposit">
      <motion.div
        initial={{
          transform: "translateX(20px)",
        }}
        animate={{
          transform: "translateX(0)",
        }}
      >
        {showReview && pool ? (
          <>
            <DepositReview
              coinA={pool.coinA}
              coinB={pool.coinB}
              poolAddress={pool.address}
              coinAAmount={coinAAmount}
              coinBAmount={coinBAmount}
              onSuccess={onSuccess}
              nonce={nonce}
              lockBlocks={lockBlocks}
              poolUtxos={poolUtxos}
              onBack={onBack}
              showCancelButton={true}
            />
          </>
        ) : (
          <DepositForm pool={pool} onReview={onReview} />
        )}
      </motion.div>
    </TabsContent>
  );
}
