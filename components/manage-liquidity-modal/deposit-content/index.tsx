import { useState } from "react";
import { PoolData, PoolInfo, UnspentOutput } from "@/types";

import { DepositForm } from "./deposit-form";
import { DepositReview } from "@/components/deposit-review";
import { motion } from "framer-motion";
import { TabsContent } from "@/components/ui/tabs";

export function DepositContent({
  pool,
  poolData,
  onSuccess,
  setOnReview,
}: {
  pool: PoolInfo;
  poolData: PoolData | undefined;
  setOnReview: (onReview: boolean) => void;
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
        {showReview ? (
          <>
            <DepositReview
              coinA={pool.coinA}
              coinB={pool.coinB}
              poolKey={pool.key}
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
          <DepositForm pool={pool} poolData={poolData} onReview={onReview} />
        )}
      </motion.div>
    </TabsContent>
  );
}
